import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Truck, Gauge, Wrench, Route, Clock3, Users, Percent,
  ArrowUpRight, ArrowDownRight, RotateCcw, SlidersHorizontal,
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
const rng = mulberry32(2026);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

const VEHICLE_TYPES = ["Truck", "Van", "Pickup", "Trailer"];
const REGIONS = ["North", "South", "East", "West"];
const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"];
const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

const STATUS_COLOR = {
  Available: "var(--teal)",
  "On Trip": "var(--amber)",
  "In Shop": "var(--slate)",
  Retired: "var(--danger)",
};

const VEHICLES = Array.from({ length: 42 }, (_, i) => ({
  id: i,
  reg: `${pick(["MH", "GJ", "DL", "KA", "RJ", "TN", "UP", "PB"])}-${int(1, 14)}-${pick(["AB", "KX", "BF", "MN", "PQ", "ZR", "JD", "VC"])}-${int(1000, 9999)}`,
  type: pick(VEHICLE_TYPES),
  region: pick(REGIONS),
  status: pick(VEHICLE_STATUSES),
}));

const TRIPS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  vehicleType: pick(VEHICLE_TYPES),
  region: pick(REGIONS),
  status: pick(["Draft", "Dispatched", "Completed", "Cancelled"]),
  month: pick(MONTHS),
  fuelCost: int(40, 320),
}));

const MAINTENANCE = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  vehicleType: pick(VEHICLE_TYPES),
  region: pick(REGIONS),
  month: pick(MONTHS),
  cost: int(80, 600),
}));

const DRIVERS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  region: pick(REGIONS),
  status: pick(["Available", "On Trip", "Off Duty", "Suspended"]),
}));

/* ---------- small helpers ---------- */
function Delta({ value }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium"
      style={{ color: up ? "var(--teal)" : "var(--danger)" }}
    >
      <Icon size={13} /> {Math.abs(value)}%
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, suffix, delta }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--panel-2)", color: "var(--amber)" }}>
          <Icon size={16} />
        </div>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div>
        <p
          className="font-bold leading-none"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.1rem" }}
        >
          {value}
          {suffix && <span className="text-lg text-[var(--muted)] ml-1">{suffix}</span>}
        </p>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)] mt-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 flex flex-col min-w-0">
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="flex-1 min-h-[220px]">{children}</div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="uppercase tracking-wide text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--panel-2)] border border-[var(--line)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--text)] outline-none focus-visible:border-[var(--amber)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/* ---------- main component ---------- */
export default function TransitOpsDashboard() {
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [region, setRegion] = useState("All");

  const vehicles = useMemo(
    () => VEHICLES.filter(
      (v) => (type === "All" || v.type === type) &&
             (status === "All" || v.status === status) &&
             (region === "All" || v.region === region)
    ),
    [type, status, region]
  );

  const trips = useMemo(
    () => TRIPS.filter(
      (t) => (type === "All" || t.vehicleType === type) &&
             (region === "All" || t.region === region)
    ),
    [type, region]
  );

  const maintenance = useMemo(
    () => MAINTENANCE.filter(
      (m) => (type === "All" || m.vehicleType === type) &&
             (region === "All" || m.region === region)
    ),
    [type, region]
  );

  const drivers = useMemo(
    () => DRIVERS.filter((d) => region === "All" || d.region === region),
    [region]
  );

  const kpis = useMemo(() => {
    const active = vehicles.filter((v) => v.status !== "Retired").length;
    const available = vehicles.filter((v) => v.status === "Available").length;
    const inShop = vehicles.filter((v) => v.status === "In Shop").length;
    const onTrip = vehicles.filter((v) => v.status === "On Trip").length;
    const activeTrips = trips.filter((t) => t.status === "Dispatched").length;
    const pendingTrips = trips.filter((t) => t.status === "Draft").length;
    const onDuty = drivers.filter((d) => d.status === "Available" || d.status === "On Trip").length;
    const utilization = active > 0 ? Math.round((onTrip / active) * 100) : 0;
    return { active, available, inShop, activeTrips, pendingTrips, onDuty, utilization };
  }, [vehicles, trips, drivers]);

  const vehicleStatusData = useMemo(
    () => VEHICLE_STATUSES.map((s) => ({
      name: s,
      value: vehicles.filter((v) => v.status === s).length,
    })).filter((d) => d.value > 0),
    [vehicles]
  );

  const monthly = useMemo(() => MONTHS.map((m) => {
    const monthTrips = trips.filter((t) => t.month === m);
    const monthMaint = maintenance.filter((x) => x.month === m);
    const fuel = monthTrips.reduce((s, t) => s + t.fuelCost, 0);
    const maint = monthMaint.reduce((s, x) => s + x.cost, 0);
    return { month: m, fuel, maintenance: maint, trips: monthTrips.length, total: fuel + maint };
  }), [trips, maintenance]);

  function resetFilters() {
    setType("All"); setStatus("All"); setRegion("All");
  }

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
      className="min-h-screen w-full bg-[var(--asphalt)] text-[var(--text)] p-5 md:p-8"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        select option { background: var(--panel-2); }
      `}</style>

      {/* header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--panel-2)", color: "var(--amber)" }}>
            <Truck size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              TransitOps
            </p>
            <h1 className="text-xl font-semibold -mt-0.5">Fleet Dashboard</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 bg-[var(--panel)] border border-[var(--line)] rounded-xl px-4 py-3">
          <div className="flex items-center gap-1.5 text-[var(--muted)] mr-1">
            <SlidersHorizontal size={14} />
            <span className="text-xs uppercase tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Filters</span>
          </div>
          <Select label="Vehicle Type" value={type} onChange={setType} options={["All", ...VEHICLE_TYPES]} />
          <Select label="Status" value={status} onChange={setStatus} options={["All", ...VEHICLE_STATUSES]} />
          <Select label="Region" value={region} onChange={setRegion} options={["All", ...REGIONS]} />
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--amber)] px-2.5 py-1.5 rounded-lg border border-[var(--line)] transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        <KpiCard icon={Truck} label="Active Vehicles" value={kpis.active} delta={4} />
        <KpiCard icon={Gauge} label="Available Vehicles" value={kpis.available} delta={-2} />
        <KpiCard icon={Wrench} label="In Maintenance" value={kpis.inShop} delta={6} />
        <KpiCard icon={Route} label="Active Trips" value={kpis.activeTrips} delta={9} />
        <KpiCard icon={Clock3} label="Pending Trips" value={kpis.pendingTrips} delta={-5} />
        <KpiCard icon={Users} label="Drivers On Duty" value={kpis.onDuty} delta={3} />
        <KpiCard icon={Percent} label="Fleet Utilization" value={kpis.utilization} suffix="%" delta={1} />
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Vehicle Status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vehicleStatusData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="var(--panel)"
              >
                {vehicleStatusData.map((d) => (
                  <Cell key={d.name} fill={STATUS_COLOR[d.name]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fuel Cost (₹, by month)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="fuel" stroke="var(--amber)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--amber)" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Trip Count (by month)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="trips" fill="var(--teal)" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Expenses (₹, fuel + maintenance)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={{ stroke: "var(--line)" }} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
              <Bar dataKey="fuel" stackId="exp" fill="var(--amber)" radius={[0, 0, 0, 0]} maxBarSize={34} name="Fuel" />
              <Bar dataKey="maintenance" stackId="exp" fill="var(--slate)" radius={[4, 4, 0, 0]} maxBarSize={34} name="Maintenance" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
