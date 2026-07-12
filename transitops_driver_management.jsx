import { useMemo, useState } from "react";
import {
  UserPlus, Pencil, Ban, ShieldCheck, ShieldAlert, Search,
  X, Phone, IdCard, CalendarClock, Gauge, RotateCcw, Users2,
} from "lucide-react";

/* ---------- deterministic mock data ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(77);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

const LICENSE_CATEGORIES = ["LMV", "HMV", "Transport", "MCWG"];
const STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"];
const FIRST = ["Arjun", "Rohit", "Vikram", "Alex", "Sunita", "Priya", "Karan", "Deepak", "Meera", "Farhan", "Sana", "Neha"];
const LAST = ["Rao", "Sharma", "Mehta", "Nair", "Kapoor", "Singh", "Iyer", "Khan", "Verma"];

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEED_DRIVERS = Array.from({ length: 11 }, (_, i) => {
  const status = i < 8 ? pick(["Available", "On Trip", "Off Duty"]) : "Suspended";
  const expiryDays = i % 4 === 0 ? int(-90, -3) : int(20, 500); // sprinkle some expired licenses
  return {
    id: i + 1,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    licenseNumber: `${pick(["MH", "DL", "KA", "GJ"])}${int(10, 99)} ${int(2015, 2023)}${int(1000000, 9999999)}`,
    licenseCategory: pick(LICENSE_CATEGORIES),
    licenseExpiry: isoOffset(expiryDays),
    contact: `+91 ${int(70000, 99999)} ${int(10000, 99999)}`,
    safetyScore: int(45, 99),
    status,
  };
});

const EMPTY_FORM = {
  name: "", licenseNumber: "", licenseCategory: "LMV",
  licenseExpiry: "", contact: "", safetyScore: 80, status: "Available",
};

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function eligibility(driver) {
  if (driver.status === "Suspended") return { ok: false, reason: "Suspended" };
  if (isExpired(driver.licenseExpiry)) return { ok: false, reason: "License expired" };
  return { ok: true, reason: null };
}

function scoreColor(score) {
  if (score >= 80) return "var(--teal)";
  if (score >= 50) return "var(--amber)";
  return "var(--danger)";
}

const STATUS_COLOR = {
  Available: "var(--teal)",
  "On Trip": "var(--amber)",
  "Off Duty": "var(--slate)",
  Suspended: "var(--danger)",
};

/* ---------- small pieces ---------- */
function StatusPill({ status }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "var(--panel-2)", color: STATUS_COLOR[status] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      {status}
    </span>
  );
}

function EligibilityBadge({ driver }) {
  const e = eligibility(driver);
  const Icon = e.ok ? ShieldCheck : ShieldAlert;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: e.ok ? "var(--teal)" : "var(--danger)" }}
      title={e.ok ? "Eligible for trip assignment" : `Not eligible — ${e.reason}`}
    >
      <Icon size={13} /> {e.ok ? "Eligible" : e.reason}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs">
      <span className="uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass = "bg-[var(--panel-2)] border border-[var(--line)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:border-[var(--amber)] w-full";

/* ---------- main component ---------- */
export default function DriverManagement() {
  const [drivers, setDrivers] = useState(SEED_DRIVERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [drawer, setDrawer] = useState(null); // null | { mode: 'add'|'edit', id? }
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [confirmSuspend, setConfirmSuspend] = useState(null); // driver id

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      const matchesQuery = !q || d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || d.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError("");
    setDrawer({ mode: "add" });
  }

  function openEdit(driver) {
    setForm({ ...driver });
    setFormError("");
    setDrawer({ mode: "edit", id: driver.id });
  }

  function closeDrawer() {
    setDrawer(null);
    setFormError("");
  }

  function saveForm() {
    if (!form.name.trim() || !form.licenseNumber.trim() || !form.licenseExpiry || !form.contact.trim()) {
      setFormError("Fill in name, license number, expiry date, and contact number before saving.");
      return;
    }
    const score = Number(form.safetyScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setFormError("Safety score must be a number between 0 and 100.");
      return;
    }
    if (drawer.mode === "add") {
      const nextId = Math.max(0, ...drivers.map((d) => d.id)) + 1;
      setDrivers((prev) => [{ ...form, safetyScore: score, id: nextId }, ...prev]);
    } else {
      setDrivers((prev) => prev.map((d) => (d.id === drawer.id ? { ...form, safetyScore: score, id: d.id } : d)));
    }
    closeDrawer();
  }

  function suspendDriver(id) {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, status: "Suspended" } : d)));
    setConfirmSuspend(null);
  }

  function reinstateDriver(id) {
    setDrivers((prev) => prev.map((d) => {
      if (d.id !== id) return d;
      if (isExpired(d.licenseExpiry)) return d; // blocked, license must be renewed first
      return { ...d, status: "Available" };
    }));
  }

  const counts = useMemo(() => ({
    total: drivers.length,
    eligible: drivers.filter((d) => eligibility(d).ok).length,
    suspended: drivers.filter((d) => d.status === "Suspended").length,
    expired: drivers.filter((d) => isExpired(d.licenseExpiry)).length,
  }), [drivers]);

  return (
    <div
      style={{
        "--asphalt": "#10151c",
        "--panel": "#1a212b",
        "--panel-2": "#212a35",
        "--line": "#2b3542",
        "--amber": "#f2a93b",
        "--teal": "#3fb8af",
        "--slate": "#7d8ba0",
        "--danger": "#e5626a",
        "--text": "#edf0f3",
        "--muted": "#8b95a5",
        fontFamily: "'Inter', sans-serif",
      }}
      className="min-h-screen w-full bg-[var(--asphalt)] text-[var(--text)] p-5 md:p-8 relative"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        select option { background: var(--panel-2); }
        @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .drawer-anim { animation: slide-in 0.25s ease both; }
        .overlay-anim { animation: fade-in 0.2s ease both; }
        @media (prefers-reduced-motion: reduce) { .drawer-anim, .overlay-anim { animation: none; } }
      `}</style>

      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--panel-2)", color: "var(--amber)" }}>
            <Users2 size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              TransitOps
            </p>
            <h1 className="text-xl font-semibold -mt-0.5">Driver Management</h1>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 font-semibold text-sm"
          style={{ background: "var(--amber)", color: "var(--asphalt)" }}
        >
          <UserPlus size={16} /> Add driver
        </button>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Total drivers</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{counts.total}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Trip eligible</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "var(--teal)" }}>{counts.eligible}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Suspended</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "var(--danger)" }}>{counts.suspended}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Expired licenses</p>
          <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "var(--amber)" }}>{counts.expired}</p>
        </div>
      </div>

      {/* search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg px-3 py-2">
          <Search size={15} className="text-[var(--muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or license number"
            className="bg-transparent text-sm outline-none w-full placeholder:text-[var(--muted)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--panel)] border border-[var(--line)] rounded-lg px-3 py-2 text-sm outline-none focus-visible:border-[var(--amber)]"
        >
          {["All", ...STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* table (desktop) */}
      <div className="hidden md:block rounded-xl border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--muted)] border-b border-[var(--line)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">License</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Expiry</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Safety score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Eligibility</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{d.licenseNumber}</td>
                <td className="px-4 py-3">{d.licenseCategory}</td>
                <td className="px-4 py-3" style={{ color: isExpired(d.licenseExpiry) ? "var(--danger)" : "var(--text)" }}>
                  {d.licenseExpiry}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{d.contact}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[var(--panel-2)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.safetyScore}%`, background: scoreColor(d.safetyScore) }} />
                    </div>
                    <span className="text-xs text-[var(--muted)]">{d.safetyScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                <td className="px-4 py-3"><EligibilityBadge driver={d} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--amber)] hover:text-[var(--amber)] text-[var(--muted)]" aria-label={`Edit ${d.name}`}>
                      <Pencil size={14} />
                    </button>
                    {d.status === "Suspended" ? (
                      <button
                        onClick={() => reinstateDriver(d.id)}
                        disabled={isExpired(d.licenseExpiry)}
                        title={isExpired(d.licenseExpiry) ? "Renew license before reinstating" : "Reinstate driver"}
                        className="p-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--teal)] hover:text-[var(--teal)] text-[var(--muted)] disabled:opacity-40 disabled:hover:border-[var(--line)] disabled:hover:text-[var(--muted)]"
                        aria-label={`Reinstate ${d.name}`}
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmSuspend(d.id)}
                        className="p-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--muted)]"
                        aria-label={`Suspend ${d.name}`}
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[var(--muted)] text-sm">
                  No drivers match this search and filter combination.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* cards (mobile) */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((d) => (
          <div key={d.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{d.licenseNumber} · {d.licenseCategory}</p>
              </div>
              <StatusPill status={d.status} />
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">
              <div className="flex items-center gap-1.5"><CalendarClock size={13} />
                <span style={{ color: isExpired(d.licenseExpiry) ? "var(--danger)" : "var(--muted)" }}>Expires {d.licenseExpiry}</span>
              </div>
              <div className="flex items-center gap-1.5"><Phone size={13} /> {d.contact}</div>
              <div className="flex items-center gap-1.5"><Gauge size={13} /> Safety score {d.safetyScore}</div>
              <EligibilityBadge driver={d} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => openEdit(d)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--line)] text-xs font-medium">
                <Pencil size={13} /> Edit
              </button>
              {d.status === "Suspended" ? (
                <button
                  onClick={() => reinstateDriver(d.id)}
                  disabled={isExpired(d.licenseExpiry)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--line)] text-xs font-medium disabled:opacity-40"
                  style={{ color: "var(--teal)" }}
                >
                  <RotateCcw size={13} /> Reinstate
                </button>
              ) : (
                <button
                  onClick={() => setConfirmSuspend(d.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--line)] text-xs font-medium"
                  style={{ color: "var(--danger)" }}
                >
                  <Ban size={13} /> Suspend
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[var(--muted)] text-sm py-10">No drivers match this search and filter combination.</p>
        )}
      </div>

      {/* add/edit drawer */}
      {drawer && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div className="overlay-anim absolute inset-0 bg-black/60" onClick={closeDrawer} />
          <div className="drawer-anim relative w-full max-w-sm h-full bg-[var(--panel)] border-l border-[var(--line)] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">{drawer.mode === "add" ? "Add driver" : "Edit driver"}</h2>
              <button onClick={closeDrawer} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
              </Field>
              <Field label="License number">
                <div className="relative">
                  <IdCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input className={inputClass + " pl-8"} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="DL14 20231234567" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="License category">
                  <select className={inputClass} value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                    {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="License expiry">
                  <input type="date" className={inputClass} value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
                </Field>
              </div>
              <Field label="Contact number">
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input className={inputClass + " pl-8"} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Safety score (0–100)">
                  <input type="number" min={0} max={100} className={inputClass} value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
                </Field>
                <Field label="Status">
                  <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>

              {form.licenseExpiry && isExpired(form.licenseExpiry) && (
                <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(229,98,106,0.1)", color: "var(--danger)" }}>
                  <ShieldAlert size={14} /> This license has expired — the driver won't be eligible for trip assignment.
                </div>
              )}

              {formError && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(229,98,106,0.1)", color: "var(--danger)" }}>
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={closeDrawer} className="flex-1 py-2.5 rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--muted)]">
                  Cancel
                </button>
                <button
                  onClick={saveForm}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: "var(--amber)", color: "var(--asphalt)" }}
                >
                  {drawer.mode === "add" ? "Add driver" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* suspend confirmation */}
      {confirmSuspend !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="overlay-anim absolute inset-0 bg-black/60" onClick={() => setConfirmSuspend(null)} />
          <div className="relative w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--danger)" }}>
              <Ban size={18} />
              <h3 className="font-semibold">Suspend driver</h3>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Suspending {drivers.find((d) => d.id === confirmSuspend)?.name} will immediately make them ineligible for trip assignment. This can be reversed later.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConfirmSuspend(null)} className="flex-1 py-2 rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--muted)]">
                Cancel
              </button>
              <button
                onClick={() => suspendDriver(confirmSuspend)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--danger)", color: "var(--asphalt)" }}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
