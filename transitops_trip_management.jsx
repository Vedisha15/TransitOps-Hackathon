import { useMemo, useState } from "react";
import {
  Plus, X, Route, MapPin, Weight, Gauge, Send, CheckCircle2, XCircle,
  Search, ShieldAlert, Truck, ArrowRight,
} from "lucide-react";

/* ---------- seed data (vehicles / drivers already exist from earlier modules) ---------- */
const VEHICLES = [
  { id: 1, reg: "MH-04-AB-2291", name: "Van-05", capacity: 500, status: "On Trip" },
  { id: 2, reg: "GJ-01-KX-7710", name: "Truck-12", capacity: 2000, status: "Available" },
  { id: 3, reg: "DL-8C-BF-4432", name: "Pickup-03", capacity: 800, status: "In Shop" },
  { id: 4, reg: "KA-05-MN-1189", name: "Trailer-01", capacity: 5000, status: "Available" },
  { id: 5, reg: "RJ-14-PQ-6603", name: "Van-09", capacity: 600, status: "Retired" },
  { id: 6, reg: "UP-32-JD-8871", name: "Truck-07", capacity: 1500, status: "On Trip" },
];

const DRIVERS = [
  { id: 1, name: "Alex Rao", status: "On Trip", licenseExpiry: "2027-03-10" },
  { id: 2, name: "Priya Kapoor", status: "Available", licenseExpiry: "2026-11-01" },
  { id: 3, name: "Karan Singh", status: "Suspended", licenseExpiry: "2026-09-15" },
  { id: 4, name: "Meera Nair", status: "Available", licenseExpiry: "2025-12-01" }, // expired
  { id: 5, name: "Rohit Sharma", status: "On Trip", licenseExpiry: "2027-01-20" },
  { id: 6, name: "Sana Khan", status: "Off Duty", licenseExpiry: "2026-10-05" },
];

const TRIPS_SEED = [
  { id: 1, source: "Mumbai", destination: "Pune", vehicleId: 1, driverId: 1, cargoWeight: 450, plannedDistance: 150, status: "Dispatched", createdAt: "2026-07-08", dispatchedAt: "2026-07-08" },
  { id: 2, source: "Delhi", destination: "Jaipur", vehicleId: 6, driverId: 5, cargoWeight: 1200, plannedDistance: 280, status: "Dispatched", createdAt: "2026-07-09", dispatchedAt: "2026-07-09" },
  { id: 3, source: "Bengaluru", destination: "Chennai", vehicleId: 2, driverId: 2, cargoWeight: 900, plannedDistance: 300, status: "Draft", createdAt: "2026-07-11" },
  { id: 4, source: "Hyderabad", destination: "Nagpur", vehicleId: 4, driverId: 6, cargoWeight: 2200, plannedDistance: 500, status: "Completed", createdAt: "2026-07-01", dispatchedAt: "2026-07-01", completedAt: "2026-07-03", finalOdometer: 48210, fuelConsumed: 62 },
  { id: 5, source: "Ahmedabad", destination: "Surat", vehicleId: 3, driverId: 3, cargoWeight: 300, plannedDistance: 260, status: "Cancelled", createdAt: "2026-06-28" },
];

const EMPTY_FORM = { source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: "", plannedDistance: "" };

function isExpired(dateStr) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}
function driverEligible(driver) {
  return driver.status === "Available" && !isExpired(driver.licenseExpiry);
}

const STATUS_COLOR = {
  Draft: "var(--slate)",
  Dispatched: "var(--amber)",
  Completed: "var(--teal)",
  Cancelled: "var(--danger)",
};

function StatusPill({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--panel-2)", color: STATUS_COLOR[status] }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      {status}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs">
      <span className="uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</span>
      {children}
    </label>
  );
}
const inputClass = "bg-[var(--panel-2)] border border-[var(--line)] rounded-lg px-3 py-2 text-sm text-[var(--text)] outline-none focus-visible:border-[var(--amber)] w-full";

const LIFECYCLE_STEPS = ["Draft", "Dispatched", "Completed"];

function LifecycleDiagram() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {LIFECYCLE_STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--panel-2)", color: STATUS_COLOR[s] }}>{s}</span>
            {i < LIFECYCLE_STEPS.length - 1 && <ArrowRight size={14} className="text-[var(--muted)]" />}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-[var(--line)]">
        <span className="text-xs text-[var(--muted)]">or, from Draft/Dispatched</span>
        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "var(--panel-2)", color: STATUS_COLOR.Cancelled }}>Cancelled</span>
      </div>
    </div>
  );
}

export default function TripManagement() {
  const [vehicles, setVehicles] = useState(VEHICLES);
  const [drivers, setDrivers] = useState(DRIVERS);
  const [trips, setTrips] = useState(TRIPS_SEED);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [completing, setCompleting] = useState(null); // trip id
  const [completeForm, setCompleteForm] = useState({ finalOdometer: "", fuelConsumed: "" });
  const [cancelling, setCancelling] = useState(null); // trip id
  const [dispatchError, setDispatchError] = useState({}); // { tripId: message }

  const vehicleById = (id) => vehicles.find((v) => v.id === Number(id));
  const driverById = (id) => drivers.find((d) => d.id === Number(id));

  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "Available"), [vehicles]);
  const eligibleDrivers = useMemo(() => drivers.filter(driverEligible), [drivers]);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter((t) => {
      const v = vehicleById(t.vehicleId);
      const d = driverById(t.driverId);
      const matchesQuery = !q ||
        t.source.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        v?.reg.toLowerCase().includes(q) ||
        d?.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [trips, search, statusFilter, vehicles, drivers]);

  const counts = useMemo(() => ({
    draft: trips.filter((t) => t.status === "Draft").length,
    dispatched: trips.filter((t) => t.status === "Dispatched").length,
    completed: trips.filter((t) => t.status === "Completed").length,
    cancelled: trips.filter((t) => t.status === "Cancelled").length,
  }), [trips]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setDrawerOpen(true);
  }

  function saveTrip() {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = form;
    if (!source.trim() || !destination.trim() || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      setFormError("Fill in every field before creating the trip.");
      return;
    }
    const vehicle = vehicleById(vehicleId);
    const weight = Number(cargoWeight);
    if (Number.isNaN(weight) || weight <= 0) {
      setFormError("Cargo weight must be a positive number.");
      return;
    }
    if (weight > vehicle.capacity) {
      setFormError(`Cargo weight (${weight} kg) exceeds ${vehicle.name}'s capacity of ${vehicle.capacity} kg.`);
      return;
    }
    const distance = Number(plannedDistance);
    if (Number.isNaN(distance) || distance <= 0) {
      setFormError("Planned distance must be a positive number.");
      return;
    }
    const nextId = Math.max(0, ...trips.map((t) => t.id)) + 1;
    setTrips((prev) => [{
      id: nextId, source: source.trim(), destination: destination.trim(),
      vehicleId: Number(vehicleId), driverId: Number(driverId),
      cargoWeight: weight, plannedDistance: distance,
      status: "Draft", createdAt: new Date().toISOString().slice(0, 10),
    }, ...prev]);
    setDrawerOpen(false);
  }

  function dispatchTrip(tripId) {
    const trip = trips.find((t) => t.id === tripId);
    const vehicle = vehicleById(trip.vehicleId);
    const driver = driverById(trip.driverId);
    if (vehicle.status !== "Available") {
      setDispatchError((e) => ({ ...e, [tripId]: `${vehicle.name} is no longer available — it may already be on another trip.` }));
      return;
    }
    if (!driverEligible(driver)) {
      setDispatchError((e) => ({ ...e, [tripId]: `${driver.name} is no longer eligible — check status or license expiry.` }));
      return;
    }
    setDispatchError((e) => { const n = { ...e }; delete n[tripId]; return n; });
    setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? { ...v, status: "On Trip" } : v)));
    setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, status: "On Trip" } : d)));
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, status: "Dispatched", dispatchedAt: new Date().toISOString().slice(0, 10) } : t)));
  }

  function confirmComplete() {
    const trip = trips.find((t) => t.id === completing);
    setVehicles((prev) => prev.map((v) => (v.id === trip.vehicleId ? { ...v, status: v.status === "Retired" ? v.status : "Available" } : v)));
    setDrivers((prev) => prev.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d)));
    setTrips((prev) => prev.map((t) => (t.id === completing ? {
      ...t, status: "Completed", completedAt: new Date().toISOString().slice(0, 10),
      finalOdometer: completeForm.finalOdometer ? Number(completeForm.finalOdometer) : undefined,
      fuelConsumed: completeForm.fuelConsumed ? Number(completeForm.fuelConsumed) : undefined,
    } : t)));
    setCompleting(null);
    setCompleteForm({ finalOdometer: "", fuelConsumed: "" });
  }

  function confirmCancel() {
    const trip = trips.find((t) => t.id === cancelling);
    if (trip.status === "Dispatched") {
      setVehicles((prev) => prev.map((v) => (v.id === trip.vehicleId ? { ...v, status: "Available" } : v)));
      setDrivers((prev) => prev.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d)));
    }
    setTrips((prev) => prev.map((t) => (t.id === cancelling ? { ...t, status: "Cancelled", cancelledAt: new Date().toISOString().slice(0, 10) } : t)));
    setCancelling(null);
  }

  const selectedVehicle = form.vehicleId ? vehicleById(form.vehicleId) : null;

  return (
    <div
      style={{
        "--asphalt": "#10151c", "--panel": "#1a212b", "--panel-2": "#212a35",
        "--line": "#2b3542", "--amber": "#f2a93b", "--teal": "#3fb8af",
        "--slate": "#7d8ba0", "--danger": "#e5626a", "--text": "#edf0f3", "--muted": "#8b95a5",
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
            <Route size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>TransitOps</p>
            <h1 className="text-xl font-semibold -mt-0.5">Trip Management</h1>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 font-semibold text-sm" style={{ background: "var(--amber)", color: "var(--asphalt)" }}>
          <Plus size={16} /> Create trip
        </button>
      </div>

      <LifecycleDiagram />

      {/* summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[["Draft", counts.draft, "slate"], ["Dispatched", counts.dispatched, "amber"], ["Completed", counts.completed, "teal"], ["Cancelled", counts.cancelled, "danger"]].map(([label, val, color]) => (
          <div key={label} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: `var(--${color})` }}>{val}</p>
          </div>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 bg-[var(--panel)] border border-[var(--line)] rounded-lg px-3 py-2">
          <Search size={15} className="text-[var(--muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by source, destination, vehicle, or driver" className="bg-transparent text-sm outline-none w-full placeholder:text-[var(--muted)]" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--panel)] border border-[var(--line)] rounded-lg px-3 py-2 text-sm outline-none focus-visible:border-[var(--amber)]">
          {["All", "Draft", "Dispatched", "Completed", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* trip list */}
      <div className="flex flex-col gap-3">
        {filteredTrips.map((t) => {
          const vehicle = vehicleById(t.vehicleId);
          const driver = driverById(t.driverId);
          return (
            <div key={t.id} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin size={14} className="text-[var(--muted)]" /> {t.source}
                  <ArrowRight size={13} className="text-[var(--muted)]" />
                  {t.destination}
                </div>
                <StatusPill status={t.status} />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><Truck size={13} /> {vehicle?.name} <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>({vehicle?.reg})</span></span>
                <span>Driver: {driver?.name}</span>
                <span className="flex items-center gap-1.5"><Weight size={13} /> {t.cargoWeight} kg / {vehicle?.capacity} kg cap.</span>
                <span className="flex items-center gap-1.5"><Gauge size={13} /> {t.plannedDistance} km planned</span>
                {t.status === "Completed" && t.finalOdometer && <span>Final odometer: {t.finalOdometer} · Fuel used: {t.fuelConsumed ?? "—"} L</span>}
              </div>

              {dispatchError[t.id] && (
                <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 mt-3" style={{ background: "rgba(229,98,106,0.1)", color: "var(--danger)" }}>
                  <ShieldAlert size={13} /> {dispatchError[t.id]}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {t.status === "Draft" && (
                  <button onClick={() => dispatchTrip(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--amber)", color: "var(--asphalt)" }}>
                    <Send size={13} /> Dispatch
                  </button>
                )}
                {t.status === "Dispatched" && (
                  <button onClick={() => { setCompleting(t.id); setCompleteForm({ finalOdometer: "", fuelConsumed: "" }); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--teal)", color: "var(--asphalt)" }}>
                    <CheckCircle2 size={13} /> Complete
                  </button>
                )}
                {(t.status === "Draft" || t.status === "Dispatched") && (
                  <button onClick={() => setCancelling(t.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--line)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--muted)]">
                    <XCircle size={13} /> Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredTrips.length === 0 && (
          <p className="text-center text-[var(--muted)] text-sm py-10">No trips match this search and filter combination.</p>
        )}
      </div>

      {/* create trip drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div className="overlay-anim absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-anim relative w-full max-w-sm h-full bg-[var(--panel)] border-l border-[var(--line)] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Create trip</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Source">
                  <input className={inputClass} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Mumbai" />
                </Field>
                <Field label="Destination">
                  <input className={inputClass} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Pune" />
                </Field>
              </div>

              <Field label="Vehicle">
                <select className={inputClass} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select an available vehicle</option>
                  {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.reg} · cap. {v.capacity} kg</option>)}
                </select>
              </Field>

              <Field label="Driver">
                <select className={inputClass} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">Select an eligible driver</option>
                  {eligibleDrivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cargo weight (kg)">
                  <input type="number" className={inputClass} value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} placeholder="450" />
                </Field>
                <Field label="Planned distance (km)">
                  <input type="number" className={inputClass} value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} placeholder="150" />
                </Field>
              </div>

              {selectedVehicle && (
                <p className="text-xs text-[var(--muted)]">Max load for {selectedVehicle.name}: {selectedVehicle.capacity} kg</p>
              )}

              {formError && (
                <div className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(229,98,106,0.1)", color: "var(--danger)" }}>{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setDrawerOpen(false)} className="flex-1 py-2.5 rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--muted)]">Cancel</button>
                <button onClick={saveTrip} className="flex-1 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "var(--amber)", color: "var(--asphalt)" }}>Create trip</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* complete trip modal */}
      {completing !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="overlay-anim absolute inset-0 bg-black/60" onClick={() => setCompleting(null)} />
          <div className="relative w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3" style={{ color: "var(--teal)" }}>
              <CheckCircle2 size={18} /><h3 className="font-semibold">Complete trip</h3>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">This marks the trip complete and returns the vehicle and driver to Available.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Final odometer (optional)">
                <input type="number" className={inputClass} value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} />
              </Field>
              <Field label="Fuel consumed, L (optional)">
                <input type="number" className={inputClass} value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCompleting(null)} className="flex-1 py-2 rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--muted)]">Cancel</button>
              <button onClick={confirmComplete} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--teal)", color: "var(--asphalt)" }}>Mark complete</button>
            </div>
          </div>
        </div>
      )}

      {/* cancel trip confirm */}
      {cancelling !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="overlay-anim absolute inset-0 bg-black/60" onClick={() => setCancelling(null)} />
          <div className="relative w-full max-w-sm bg-[var(--panel)] border border-[var(--line)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2" style={{ color: "var(--danger)" }}>
              <XCircle size={18} /><h3 className="font-semibold">Cancel trip</h3>
            </div>
            <p className="text-sm text-[var(--muted)]">
              This will cancel the trip{trips.find((t) => t.id === cancelling)?.status === "Dispatched" ? " and return its vehicle and driver to Available" : ""}. This can't be undone.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCancelling(null)} className="flex-1 py-2 rounded-lg border border-[var(--line)] text-sm font-medium text-[var(--muted)]">Keep trip</button>
              <button onClick={confirmCancel} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--danger)", color: "var(--asphalt)" }}>Cancel trip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
