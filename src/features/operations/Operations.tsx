import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Package,
  Route,
  ArrowLeftRight,
  MapPin,
  Plus,
  Sparkles,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  Users,
  Navigation,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  Radio,
} from "lucide-react";
import { Brand } from "../../components/Brand";
import { Modal } from "../../components/Modal";
import { Access } from "../access/Access";
import { NewOrder } from "../orders/NewOrder";
import { OrdersTable } from "../orders/OrdersTable";
import { OperationsMap } from "../map/OperationsMap";
import { FleetList, VehicleDetail } from "../fleet/Fleet";
import { RelayPanel } from "../relays/RelayPanel";
import { RoutePlanner } from "../routes/RoutePlanner";
import { Partners } from "../partners/Partners";
import { Vehicles } from "../vehicles/Vehicles";
import { Analytics } from "../analytics/Analytics";
import { Settings } from "../settings/Settings";
import { loadPreferences } from "../../lib/preferences";
import type { Comparison } from "../routes/RoutePlanner";
import { relays, seedOrders, seedVehicles } from "../../data/scenario";
import {
  assignedOrders,
  optimize,
  totalDistance,
  vehicleLoad,
  reassignOrder,
} from "../../lib/routing";
import type { Sequences } from "../../lib/routing";
import type { Order, Page, Vehicle } from "../../types";
const navigation: { id: Page; label: string; icon: typeof Truck }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "partners", label: "Delivery Partners", icon: Users },
  { id: "vehicles", label: "Vehicles", icon: Truck },
  { id: "orders", label: "Orders", icon: Package },
  { id: "routes", label: "Route Planner", icon: Route },
  { id: "tracking", label: "Live Tracking", icon: Navigation },
  { id: "relays", label: "Relay Handovers", icon: ArrowLeftRight },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];
const titles: Record<Page, string> = {
  overview: "Operations overview",
  partners: "Delivery partners",
  vehicles: "Vehicle registry",
  tracking: "Live tracking",
  orders: "Order management",
  routes: "Route planning",
  relays: "Relay handovers",
  analytics: "Operations analytics",
  settings: "Workspace settings",
};
export function Operations({ partners }: { partners: Vehicle[] }) {
  const [page, setPage] = useState<Page>("overview"),
    [vehicles, setVehicles] = useState(() => [...seedVehicles, ...partners]),
    [orders, setOrders] = useState<Order[]>(seedOrders),
    [sequences, setSequences] = useState<Sequences>({}),
    [tick, setTick] = useState(0),
    [playing, setPlaying] = useState(true),
    [selected, setSelected] = useState<string | null>(null),
    [modal, setModal] = useState<"order" | "partner" | "vehicle" | null>(null),
    [completed, setCompleted] = useState<string[]>([]),
    [comparison, setComparison] = useState<Comparison | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [mobileNav, setMobileNav] = useState(false),
    [preferences, setPreferences] = useState(loadPreferences);
  const optimizationTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setTick((t) => t + 1),
      preferences.intervalMs,
    );
    return () => clearInterval(timer);
  }, [playing, preferences.intervalMs]);
  useEffect(() => () => clearTimeout(optimizationTimer.current), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  function runOptimize() {
    if (busy) return;
    setBusy(true);
    optimizationTimer.current = window.setTimeout(() => {
      const result = optimize(vehicles, orders, relays, sequences);
      const baseline = totalDistance(
          vehicles,
          result.orders,
          relays,
          sequences,
        ),
        proposed = totalDistance(
          vehicles,
          result.orders,
          relays,
          result.sequences,
        );
      const changed = vehicles.filter(
        (v) =>
          assignedOrders(v.id, result.orders, sequences)
            .map((o) => o.id)
            .join() !==
          assignedOrders(v.id, result.orders, result.sequences)
            .map((o) => o.id)
            .join(),
      ).length;
      setOrders(result.orders);
      setSequences(result.sequences);
      setComparison({
        baseline,
        proposed,
        changed,
        unassigned: result.orders.filter((o) => o.status === "Unassigned")
          .length,
      });
      setBusy(false);
      setNotice(
        `Routes recomputed · ${changed} sequences changed · ${(baseline - proposed).toFixed(1)} km estimated reduction`,
      );
    }, 550);
  }
  function selectVehicle(id: string) {
    setSelected(id);
    setPage("tracking");
  }
  const delivered = orders.filter((o) => o.status === "Delivered").length,
    assigned = orders.filter((o) => o.status === "Assigned").length,
    unassigned = orders.filter((o) => o.status === "Unassigned").length,
    active = vehicles.filter(
      (v) => vehicleLoad(v.id, orders, relays) > 0,
    ).length,
    totalCapacity = vehicles.reduce((s, v) => s + v.capacity, 0),
    totalLoad = vehicles.reduce(
      (s, v) => s + vehicleLoad(v.id, orders, relays),
      0,
    ),
    vehicle = vehicles.find((v) => v.id === selected);
  const map = (
    <OperationsMap
      vehicles={vehicles}
      orders={orders}
      relays={relays}
      sequences={sequences}
      tick={tick}
      selected={selected}
      onSelect={setSelected}
      preferences={preferences}
      onToggleRoute={(type) =>
        setPreferences((current) => ({
          ...current,
          [type === "truck" ? "showTruckRoutes" : "showBikeRoutes"]:
            !current[type === "truck" ? "showTruckRoutes" : "showBikeRoutes"],
        }))
      }
    />
  );
  const fleet = (
    <FleetList
      vehicles={vehicles}
      orders={orders}
      relays={relays}
      tick={tick}
      selected={selected}
      onSelect={setSelected}
      intervalMs={preferences.intervalMs}
      playing={playing}
    />
  );
  const relay = (
    <RelayPanel
      relays={relays}
      orders={orders}
      completed={completed}
      onComplete={(id) => {
        setCompleted((c) => [...c, id]);
        setNotice(`${id} · Demo handover recorded`);
      }}
      compact={page === "overview"}
    />
  );
  const table = (
    <OrdersTable
      orders={orders}
      vehicles={vehicles}
      compact={page === "overview"}
      relays={relays}
      busy={busy}
      onSelect={selectVehicle}
      onAssign={(id, vehicleId) => {
        if (busy) return;
        try {
          setOrders(reassignOrder(orders, id, vehicleId, vehicles, relays));
          setComparison(null);
          setNotice(
            `${id} · ${vehicleId ? `Assigned to ${vehicleId}` : "Unassigned"}`,
          );
        } catch (error) {
          setNotice(
            error instanceof Error
              ? error.message
              : "Could not reassign this order.",
          );
        }
      }}
      onDeliver={(id) => {
        if (busy) return;
        const order = orders.find((o) => o.id === id);
        if (order?.relayId && !completed.includes(order.relayId)) {
          setNotice(
            `Complete ${order.relayId} handover before delivering this relay parcel.`,
          );
          return;
        }
        setOrders((current) =>
          current.map((o) => (o.id === id ? { ...o, status: "Delivered" } : o)),
        );
        setComparison(null);
        setNotice(`${id} · Delivery completed in demo`);
      }}
    />
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <Brand />
        <div className="workspace-switch">
          <span className="workspace-avatar">C</span>
          <div>
            <strong>{preferences.workspaceName}</strong>
            <small>Demo operations</small>
          </div>
          <span className="status-dot" />
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                setMobileNav(false);
              }}
            >
              <item.icon size={17} />
              {item.label}
              {item.id === "orders" && <span>{orders.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-network">
          <Radio size={18} />
          <strong>A connected last mile.</strong>
          <p>
            From warehouse to handover.
            <br />
            From handover to home.
          </p>
          <span>CHENNAI · INDIA</span>
        </div>
        <footer>
          <span className="operator-avatar">OP</span>
          <div>
            <strong>Demo operator</strong>
            <small>Local session</small>
          </div>
          <span className="badge">DEMO</span>
        </footer>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu quiet"
              aria-label="Toggle navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={18} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="location-label">
              <MapPin size={13} /> Chennai, IN
            </span>
            <span className="simulation-label">
              <span className="status-dot" /> DEMO SESSION
            </span>
            <span className="operator-avatar">OP</span>
          </div>
        </header>
        <main className={`operations-content page-${page}`}>
          <div className="page-header">
            <div>
              <span className="eyebrow">YOUR LAST MILE, IN FOCUS</span>
              <h1>{titles[page]}</h1>
              <p>Every vehicle. Every handover. One connected network.</p>
            </div>
            <div className="page-actions">
              <button
                disabled={busy}
                onClick={() =>
                  setModal(page === "vehicles" ? "vehicle" : "partner")
                }
              >
                <Plus size={14} />{" "}
                {page === "vehicles" ? "Register vehicle" : "Add partner"}
              </button>
              {page === "overview" && (
                <button disabled={busy} onClick={runOptimize}>
                  <Sparkles size={14} />
                  {busy ? "Calculating…" : "Optimize routes"}
                </button>
              )}
              <button
                className="primary"
                disabled={busy}
                onClick={() => setModal("order")}
              >
                <Plus size={15} /> New order
              </button>
            </div>
          </div>
          <div className="simulation-bar">
            <span>
              <Radio size={13} />
              <strong>Chennai dispatch simulation</strong>
              <span className="subtle">
                {" "}
                · GPS / GSM every {preferences.intervalMs / 1000}s · {totalLoad}{" "}
                / {totalCapacity} kg allocated
              </span>
            </span>
            <button className="quiet" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause size={12} /> : <Play size={12} />}{" "}
              {playing ? "Pause" : "Resume"} simulation
            </button>
          </div>
          {page === "overview" && (
            <>
              <div className="metrics">
                <Metric
                  label="TOTAL ORDERS"
                  value={String(orders.length).padStart(2, "0")}
                  description={`${assigned} assigned · ${unassigned} unassigned`}
                  icon={Package}
                />
                <Metric
                  label="ACTIVE VEHICLES"
                  value={`${active}`}
                  description={`${vehicles.filter((v) => v.type === "truck").length} four-wheelers · ${vehicles.filter((v) => v.type === "bike").length} two-wheelers`}
                  icon={Truck}
                />
                <Metric
                  label="DELIVERIES COMPLETED"
                  value={String(delivered).padStart(2, "0")}
                  description={`${orders.length ? Math.round((delivered / orders.length) * 100) : 0}% of current orders`}
                  icon={CheckCircle2}
                  color="green"
                />
                <Metric
                  label="ORDERS IN TRANSIT"
                  value={String(assigned).padStart(2, "0")}
                  description="Assigned in this demo"
                  icon={Navigation}
                />
                <Metric
                  label="PENDING DELIVERIES"
                  value={String(unassigned).padStart(2, "0")}
                  description="Awaiting vehicle assignment"
                  icon={Clock}
                  color="amber"
                />
              </div>
              <div className="overview-grid">
                <div className="overview-map">{map}</div>
                <div className="overview-status">
                  <div className="overview-fleet">
                    {vehicle ? (
                      <VehicleDetail
                        vehicle={vehicle}
                        vehicles={vehicles}
                        orders={orders}
                        relays={relays}
                        sequences={sequences}
                        tick={tick}
                        onClose={() => setSelected(null)}
                      />
                    ) : (
                      fleet
                    )}
                  </div>
                  <div className="overview-relay">{relay}</div>
                </div>
              </div>
              {table}
            </>
          )}
          {page === "tracking" && (
            <div className="tracking-grid">
              {map}
              <div className="tracking-side">
                {vehicle ? (
                  <VehicleDetail
                    vehicle={vehicle}
                    vehicles={vehicles}
                    orders={orders}
                    relays={relays}
                    sequences={sequences}
                    tick={tick}
                    onClose={() => setSelected(null)}
                  />
                ) : (
                  fleet
                )}
              </div>
            </div>
          )}
          {page === "orders" && table}
          {page === "partners" && (
            <Partners
              vehicles={vehicles}
              orders={orders}
              relays={relays}
              onTrack={selectVehicle}
            />
          )}
          {page === "vehicles" && (
            <Vehicles
              vehicles={vehicles}
              orders={orders}
              relays={relays}
              sequences={sequences}
              tick={tick}
              playing={playing}
              onTrack={selectVehicle}
            />
          )}
          {page === "analytics" && (
            <Analytics
              vehicles={vehicles}
              orders={orders}
              relays={relays}
              sequences={sequences}
              completed={completed}
              comparison={comparison}
            />
          )}
          {page === "settings" && (
            <Settings
              preferences={preferences}
              onSave={(value) => {
                setPreferences(value);
                try {
                  localStorage.setItem(
                    "apexpath:preferences",
                    JSON.stringify(value),
                  );
                  setNotice("Preferences saved and applied.");
                } catch {
                  setNotice(
                    "Preferences applied for this session. Browser storage is unavailable.",
                  );
                }
              }}
            />
          )}
          {page === "routes" && (
            <RoutePlanner
              vehicles={vehicles}
              orders={orders}
              relays={relays}
              sequences={sequences}
              comparison={comparison}
              busy={busy}
              onOptimize={runOptimize}
              onSelect={selectVehicle}
            />
          )}{" "}
          {page === "relays" && (
            <div className="relay-page">
              {relay}
              {map}
            </div>
          )}
          <footer className="content-footer">
            <span>
              APEXPATH <span> / </span> Collaborative last-mile operations
            </span>
            <span>Local demo · Schematic routing · Synthetic telemetry</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          {notice}
        </div>
      )}
      {modal && (
        <Modal
          title={
            modal === "order"
              ? "Create a delivery order"
              : modal === "vehicle"
                ? "Register a vehicle & partner"
                : "Register a delivery partner"
          }
          onClose={() => setModal(null)}
        >
          {modal === "order" ? (
            <NewOrder
              vehicles={vehicles}
              orders={orders}
              relays={relays}
              onCreate={(order) => {
                setOrders((o) => [...o, order]);
                setComparison(null);
                setModal(null);
                setNotice(
                  `${order.id} created · ${order.status.toLowerCase()}`,
                );
              }}
            />
          ) : (
            <Access
              embedded
              submitLabel={
                modal === "vehicle" ? "Register vehicle" : "Register partner"
              }
              onEnter={() => setModal(null)}
              onRegister={(v) => {
                if (vehicles.some((existing) => existing.plate === v.plate)) {
                  setNotice("A vehicle with this registration already exists.");
                  return false;
                }
                setVehicles((current) => [...current, v]);
                setComparison(null);
                setNotice(`${v.id} · Partner added to fleet`);
              }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  description,
  icon: Icon,
  color = "blue",
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Truck;
  color?: string;
}) {
  return (
    <section className="panel metric">
      <div>
        <span>{label}</span>
        <Icon size={17} className={color} />
      </div>
      <strong>{value}</strong>
      <p>{description}</p>
    </section>
  );
}
