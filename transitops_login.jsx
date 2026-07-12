import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, Truck, LogOut, ShieldCheck, Loader2, Clock3 } from "lucide-react";

const ROLES = [
  { id: "fleet_manager", label: "Fleet Manager" },
  { id: "driver", label: "Driver" },
  { id: "safety_officer", label: "Safety Officer" },
  { id: "financial_analyst", label: "Financial Analyst" },
];

const MANIFEST = [
  { reg: "MH-04-AB-2291", status: "On Trip" },
  { reg: "GJ-01-KX-7710", status: "Available" },
  { reg: "DL-8C-BF-4432", status: "In Shop" },
  { reg: "KA-05-MN-1189", status: "On Trip" },
  { reg: "RJ-14-PQ-6603", status: "Available" },
  { reg: "TN-09-ZR-3325", status: "Retired" },
  { reg: "UP-32-JD-8871", status: "On Trip" },
  { reg: "PB-11-VC-5540", status: "Available" },
];

const STATUS_COLOR = {
  Available: "var(--teal)",
  "On Trip": "var(--amber)",
  "In Shop": "var(--muted)",
  Retired: "var(--danger)",
};

function formatClock(date) {
  return date.toLocaleTimeString("en-US", { hour12: false });
}

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function TransitOpsLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(ROLES[0].id);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null); // { email, role, loginTime }
  const [now, setNow] = useState(new Date());
  const emailRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function handleLogin() {
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("That email address doesn't look right.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSession({ email: email.trim(), role, loginTime: new Date() });
    }, 850);
  }

  function handleLogout() {
    setSession(null);
    setPassword("");
    setError("");
    setTimeout(() => emailRef.current?.focus(), 0);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
  }

  const roleLabel = ROLES.find((r) => r.id === session?.role)?.label;

  return (
    <div
      style={{
        "--asphalt": "#10151c",
        "--panel": "#1a212b",
        "--panel-2": "#212a35",
        "--line": "#2b3542",
        "--amber": "#f2a93b",
        "--amber-dim": "#a97a35",
        "--teal": "#3fb8af",
        "--danger": "#e5626a",
        "--text": "#edf0f3",
        "--muted": "#8b95a5",
        fontFamily: "'Inter', sans-serif",
      }}
      className="min-h-screen w-full flex flex-col md:flex-row bg-[var(--asphalt)] text-[var(--text)]"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes truck-move {
          0% { left: -8%; }
          100% { left: 104%; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ticker-track { animation: ticker-scroll 26s linear infinite; }
        .truck-anim { animation: truck-move 7s linear infinite; }
        .fade-up { animation: fade-up 0.4s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track, .truck-anim { animation: none; }
        }
        input::placeholder { color: var(--muted); }
        input:focus, button:focus-visible, select:focus-visible {
          outline: 2px solid var(--amber);
          outline-offset: 2px;
        }
      `}</style>

      {/* LEFT: dispatch hero panel */}
      <div className="relative md:w-[46%] w-full overflow-hidden border-b md:border-b-0 md:border-r border-[var(--line)] flex flex-col justify-between min-h-[220px] md:min-h-screen">
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }} />

        <div className="relative px-8 pt-10 md:pt-14">
          <div className="flex items-center gap-2 text-[var(--amber)]">
            <Truck size={22} strokeWidth={2.2} />
            <span
              className="tracking-[0.18em] text-sm font-semibold uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              TransitOps
            </span>
          </div>
          <h1
            className="mt-6 uppercase leading-[0.92] font-bold"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(2.4rem, 5.2vw, 4.2rem)",
              letterSpacing: "0.01em",
            }}
          >
            Every vehicle.
            <br />
            Every trip.
            <br />
            <span style={{ color: "var(--amber)" }}>One console.</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] text-[var(--muted)] hidden md:block">
            Sign in to dispatch trips, track maintenance, and keep your fleet
            moving on schedule.
          </p>
        </div>

        {/* animated route line */}
        <div className="relative hidden md:block px-8 mt-10">
          <div className="relative h-10">
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed"
              style={{ borderColor: "var(--line)" }}
            />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: "var(--amber)" }} />
            <div className="truck-anim absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[var(--amber)]">
              <Truck size={18} fill="var(--asphalt)" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)] mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <span>ORIGIN</span>
            <span>DESTINATION</span>
          </div>
        </div>

        {/* manifest ticker */}
        <div className="relative mt-8 md:mt-14 border-t border-[var(--line)] bg-[var(--panel)] py-3 overflow-hidden">
          <div className="ticker-track flex w-max gap-8 whitespace-nowrap px-4">
            {[...MANIFEST, ...MANIFEST].map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[v.status] }} />
                <span className="text-[var(--muted)]">{v.reg}</span>
                <span style={{ color: STATUS_COLOR[v.status] }}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: auth panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:py-0">
        {!session ? (
          <div className="w-full max-w-sm fade-up">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold">Log in</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Use your operations account to continue.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--muted)] font-medium">
                  Email
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 focus-within:border-[var(--amber)]">
                  <Mail size={16} className="text-[var(--muted)] shrink-0" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="you@company.com"
                    className="bg-transparent w-full text-sm outline-none"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--muted)] font-medium">
                  Password
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 focus-within:border-[var(--amber)]">
                  <Lock size={16} className="text-[var(--muted)] shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••••"
                    className="bg-transparent w-full text-sm outline-none"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-[var(--muted)] hover:text-[var(--text)] shrink-0"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide text-[var(--muted)] font-medium">
                  Sign in as
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className="text-xs px-2.5 py-2 rounded-lg border transition-colors text-left"
                      style={{
                        borderColor: role === r.id ? "var(--amber)" : "var(--line)",
                        background: role === r.id ? "rgba(242,169,59,0.10)" : "var(--panel)",
                        color: role === r.id ? "var(--amber)" : "var(--muted)",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(229,98,106,0.1)", color: "var(--danger)" }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-2 rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
                style={{ background: "var(--amber)", color: "var(--asphalt)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing in…
                  </>
                ) : (
                  "Log in"
                )}
              </button>

              <p className="text-xs text-center text-[var(--muted)] pt-1">
                Any email and password will do for this demo.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm fade-up">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
              <div className="flex items-center gap-2 text-[var(--teal)]">
                <ShieldCheck size={18} />
                <span className="text-xs uppercase tracking-wide font-semibold">Session active</span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-semibold"
                  style={{ background: "var(--panel-2)", color: "var(--amber)" }}
                >
                  {session.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{session.email}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{roleLabel}</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-[var(--line)] space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span className="flex items-center gap-1.5"><Clock3 size={14} /> Logged in at</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[var(--text)]">
                    {formatClock(session.loginTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--muted)]">
                  <span>Session duration</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }} className="text-[var(--text)]">
                    {formatElapsed(now - session.loginTime)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-6 rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 border border-[var(--line)] hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
            <p className="text-xs text-center text-[var(--muted)] mt-4">
              This session is held in memory for this demo — a production build
              would issue a secure server session or token.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
