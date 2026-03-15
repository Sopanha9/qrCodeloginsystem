import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:4000";
const POLL_INTERVAL_MS = 2000;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0c0c0f;
    color: #e8e6df;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app {
    width: 100%;
    max-width: 460px;
    padding: 2rem 1rem;
  }

  .card {
    background: #16161a;
    border: 1px solid #2a2a30;
    border-radius: 16px;
    padding: 2.5rem 2rem;
    position: relative;
    overflow: hidden;
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #4f46e5 40%, #7c3aed 60%, transparent);
    opacity: 0.6;
  }

  .title {
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: #f0ede6;
    margin-bottom: 0.35rem;
  }

  .subtitle {
    font-size: 0.82rem;
    color: #6b6b78;
    margin-bottom: 2rem;
    font-weight: 300;
  }

  .qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .qr-frame {
    position: relative;
    width: 220px;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr-frame img {
    width: 200px;
    height: 200px;
    display: block;
  }

  .qr-frame.expired::after {
    content: 'Expired';
    position: absolute;
    inset: 0;
    background: rgba(12, 12, 15, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 500;
    color: #ff6b6b;
    backdrop-filter: blur(4px);
  }

  .qr-skeleton {
    width: 200px;
    height: 200px;
    background: linear-gradient(90deg, #1e1e24 25%, #252530 50%, #1e1e24 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 4px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .timer-bar-wrap {
    width: 220px;
    height: 3px;
    background: #2a2a30;
    border-radius: 99px;
    overflow: hidden;
  }

  .timer-bar {
    height: 100%;
    border-radius: 99px;
    background: #4f46e5;
    transition: width 1s linear, background 0.5s;
  }

  .timer-bar.warn { background: #d97706; }
  .timer-bar.danger { background: #dc2626; }

  .timer-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: #6b6b78;
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    padding: 4px 10px;
    border-radius: 99px;
    font-weight: 500;
  }

  .status.pending { background: #1e1e24; color: #8b8b9a; border: 1px solid #2a2a30; }
  .status.scanning { background: #1c1f3a; color: #818cf8; border: 1px solid #312e81; }
  .status.approved { background: #0f2d1f; color: #34d399; border: 1px solid #065f46; }
  .status.expired { background: #2d1515; color: #f87171; border: 1px solid #7f1d1d; }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .dot.pulse { animation: pulse 1.2s ease-in-out infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 8px;
    border: 1px solid #2a2a30;
    background: #1e1e24;
    color: #e8e6df;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }

  .btn:hover { background: #252530; border-color: #4f46e5; }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 2rem 0 1.5rem;
    color: #3a3a44;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #2a2a30;
  }

  .mobile-sim {
    background: #0e0e12;
    border: 1px solid #2a2a30;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .mobile-sim h3 {
    font-size: 0.78rem;
    color: #6b6b78;
    font-weight: 400;
    margin-bottom: 1rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .token-display {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    color: #4f46e5;
    background: #12121a;
    border: 1px solid #1e1e2e;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 10px;
    word-break: break-all;
  }

  .user-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }

  .user-row input {
    flex: 1;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    background: #12121a;
    border: 1px solid #2a2a30;
    border-radius: 8px;
    padding: 7px 10px;
    color: #e8e6df;
    outline: none;
    transition: border-color 0.15s;
  }

  .user-row input:focus { border-color: #4f46e5; }
  .user-row input::placeholder { color: #3a3a44; }

  .btn-approve {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 7px 14px;
    border-radius: 8px;
    border: none;
    background: #4f46e5;
    color: #fff;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    white-space: nowrap;
  }

  .btn-approve:hover { background: #4338ca; }
  .btn-approve:disabled { opacity: 0.4; cursor: not-allowed; }

  .approve-msg {
    font-size: 0.75rem;
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 4px;
  }

  .approve-msg.ok { background: #0f2d1f; color: #34d399; }
  .approve-msg.err { background: #2d1515; color: #f87171; }

  .logged-in {
    text-align: center;
    padding: 1.5rem 0 0.5rem;
  }

  .checkmark {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    display: block;
  }

  .logged-in h2 { font-size: 1.1rem; font-weight: 500; margin-bottom: 0.4rem; }
  .logged-in p { font-size: 0.82rem; color: #6b6b78; margin-bottom: 1.5rem; }

  .session-box {
    background: #0e0e12;
    border: 1px solid #1e1e2e;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    color: #34d399;
    word-break: break-all;
    text-align: left;
    margin-bottom: 1.25rem;
  }

  .session-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.7rem;
    color: #6b6b78;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
`;

function App() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("idle");
  const [sessionToken, setSessionToken] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [userId, setUserId] = useState("alice");
  const [approveMsg, setApproveMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const stopPolling = useCallback(() => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);

  const generateQR = useCallback(async () => {
    stopPolling();
    setLoading(true);
    setApproveMsg(null);
    setSessionToken(null);

    try {
      const res = await fetch(`${API}/api/qr/generate`);
      const data = await res.json();
      setQr(data);
      setStatus("pending");
      setSecondsLeft(data.expiresInSeconds);

      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API}/api/qr/poll/${data.token}`);
          const pollData = await pollRes.json();

          if (pollData.status === "approved") {
            stopPolling();
            setStatus("approved");
            setSessionToken(pollData.sessionToken);
          } else if (pollData.status === "expired") {
            stopPolling();
            setStatus("expired");
          }
        } catch {
          // Keep polling through transient network failures.
        }
      }, POLL_INTERVAL_MS);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [stopPolling]);

  useEffect(() => {
    generateQR();
    return stopPolling;
  }, [generateQR, stopPolling]);

  useEffect(() => {
    if (secondsLeft === 0 && status === "pending") {
      setStatus("expired");
      stopPolling();
    }
  }, [secondsLeft, status, stopPolling]);

  const handleApprove = async () => {
    if (!qr || !userId.trim()) return;
    setApproveMsg(null);
    try {
      const res = await fetch(`${API}/api/qr/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: qr.token, userId: userId.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setApproveMsg({
          type: "ok",
          text: "Approved. Browser will log in on next poll.",
        });
      } else {
        setApproveMsg({ type: "err", text: data.error || "Failed" });
      }
    } catch {
      setApproveMsg({ type: "err", text: "Cannot reach server" });
    }
  };

  const timerPct = qr ? (secondsLeft / qr.expiresInSeconds) * 100 : 100;
  const timerClass = timerPct > 40 ? "" : timerPct > 15 ? "warn" : "danger";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="card">
          <p className="title">QR Code Login</p>
          <p className="subtitle">Scan with your mobile app to authenticate</p>

          {status !== "approved" ? (
            <div className="qr-wrap">
              <div
                className={`qr-frame ${status === "expired" ? "expired" : ""}`}
              >
                {loading || !qr ? (
                  <div className="qr-skeleton" />
                ) : (
                  <img src={qr.qrDataUrl} alt="QR code" />
                )}
              </div>

              {qr && status === "pending" && (
                <>
                  <div className="timer-bar-wrap">
                    <div
                      className={`timer-bar ${timerClass}`}
                      style={{ width: `${timerPct}%` }}
                    />
                  </div>
                  <span className="timer-text">Expires in {secondsLeft}s</span>
                </>
              )}

              {status === "pending" && (
                <span className="status pending">
                  <span className="dot pulse" />
                  Waiting for scan
                </span>
              )}

              {status === "expired" && (
                <span className="status expired">
                  <span className="dot" />
                  Expired
                </span>
              )}

              {status === "expired" && (
                <button className="btn" onClick={generateQR}>
                  Generate new QR
                </button>
              )}
            </div>
          ) : (
            <div className="logged-in">
              <span className="checkmark">OK</span>
              <h2>Logged in successfully</h2>
              <p>Session established via QR code</p>
              <div className="session-label">JWT session token</div>
              <div className="session-box">{sessionToken}</div>
              <button className="btn" onClick={generateQR}>
                Log out / new session
              </button>
            </div>
          )}

          {status === "pending" && qr && (
            <>
              <div className="divider">Mobile app simulator</div>
              <div className="mobile-sim">
                <h3>Simulates your phone scanning the QR</h3>
                <div className="token-display">token: {qr.token}</div>
                <div className="user-row">
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="User ID (e.g. alice)"
                  />
                  <button
                    className="btn-approve"
                    onClick={handleApprove}
                    disabled={!userId.trim()}
                  >
                    Approve
                  </button>
                </div>
                {approveMsg && (
                  <div className={`approve-msg ${approveMsg.type}`}>
                    {approveMsg.text}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
