const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your-secret-key-change-in-production';
const TOKEN_EXPIRY_SECONDS = 120; // QR expires in 2 minutes

// In-memory store (use Redis in production)
// Structure: { [token]: { status: 'pending'|'approved'|'expired', userId: null|string, createdAt: Date } }
const qrTokens = new Map();

// Cleanup expired tokens every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of qrTokens.entries()) {
    const age = (now - data.createdAt) / 1000;
    if (age > TOKEN_EXPIRY_SECONDS) {
      qrTokens.set(token, { ...data, status: 'expired' });
    }
  }
}, 30_000);

// ---------- STEP 1: Browser requests a QR code ----------
app.get('/api/qr/generate', async (req, res) => {
  const token = uuidv4();
  const expiresAt = Date.now() + TOKEN_EXPIRY_SECONDS * 1000;

  qrTokens.set(token, {
    status: 'pending',
    userId: null,
    createdAt: Date.now(),
    expiresAt,
  });

  // The QR encodes a deep-link that your mobile app would open
  // In a real app this would be: myapp://auth?token=...
  const qrPayload = `http://localhost:3000/mobile-approve?token=${token}`;
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 256, margin: 2 });

  res.json({
    token,
    qrDataUrl,
    expiresAt,
    expiresInSeconds: TOKEN_EXPIRY_SECONDS,
  });
});

// ---------- STEP 2: Browser polls waiting for approval ----------
app.get('/api/qr/poll/:token', (req, res) => {
  const { token } = req.params;
  const data = qrTokens.get(token);

  if (!data) {
    return res.status(404).json({ error: 'Token not found' });
  }

  // Check expiry
  if (Date.now() > data.expiresAt) {
    qrTokens.set(token, { ...data, status: 'expired' });
    return res.json({ status: 'expired' });
  }

  if (data.status === 'approved') {
    // Issue a JWT session for the browser
    const sessionToken = jwt.sign(
      { userId: data.userId, loginMethod: 'qr' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Clean up used token
    qrTokens.delete(token);
    return res.json({ status: 'approved', sessionToken });
  }

  res.json({ status: data.status });
});

// ---------- STEP 3: Mobile app approves the token ----------
// In production this endpoint requires the mobile user to be authenticated
// (e.g. send their own JWT in Authorization header)
app.post('/api/qr/approve', (req, res) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ error: 'token and userId are required' });
  }

  const data = qrTokens.get(token);

  if (!data) {
    return res.status(404).json({ error: 'Token not found' });
  }
  if (data.status === 'expired' || Date.now() > data.expiresAt) {
    return res.status(410).json({ error: 'Token has expired' });
  }
  if (data.status === 'approved') {
    return res.status(409).json({ error: 'Token already used' });
  }

  // Mark as approved — browser's next poll will get the session
  qrTokens.set(token, { ...data, status: 'approved', userId });

  res.json({ success: true, message: 'Login approved. Browser will be logged in shortly.' });
});

// ---------- Protected route example ----------
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json({ userId: payload.userId, loginMethod: payload.loginMethod });
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ QR Login server running at http://localhost:${PORT}`);
  console.log(`   POST /api/qr/generate  — get a QR code`);
  console.log(`   GET  /api/qr/poll/:token — browser polls status`);
  console.log(`   POST /api/qr/approve   — mobile approves login`);
});