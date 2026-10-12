import { Package, Truck, CheckCircle2, Route } from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import type { Sequences } from "../../lib/routing";
import type { Comparison } from "../routes/RoutePlanner";
import { totalDistance, vehicleLoad } from "../../lib/routing";
export function Analytics({
  vehicles,
  orders,
  relays,
  sequences,
  completed,
  comparison,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  sequences: Sequences;
  completed: string[];
  comparison: Comparison | null;
}) {
  const delivered = orders.filter((o) => o.status === "Delivered").length,
    assigned = orders.filter((o) => o.status === "Assigned").length,
    pending = orders.filter((o) => o.status === "Unassigned").length,
    total = orders.length,
    capacity = vehicles.reduce((sum, v) => sum + v.capacity, 0),
    load = vehicles.reduce(
      (sum, v) => sum + vehicleLoad(v.id, orders, relays),
      0,
    );
  const statuses = [
    { label: "Completed", value: delivered, color: "var(--green)" },
    { label: "Assigned / in transit", value: assigned, color: "var(--blue)" },
    { label: "Awaiting assignment", value: pending, color: "var(--amber)" },
  ];
  return (
    <>
      <div className="analytics-metrics">
        {[
          {
            label: "Completion rate",
            value: `${total ? Math.round((delivered / total) * 100) : 0}%`,
            detail: `${delivered} of ${total} orders`,
            icon: CheckCircle2,
          },
          {
            label: "Fleet allocation",
            value: `${capacity ? Math.round((load / capacity) * 100) : 0}%`,
            detail: `${load} / ${capacity} kg across route legs`,
            icon: Truck,
          },
          {
            label: "Planned distance",
            value: `${totalDistance(vehicles, orders, relays, sequences).toFixed(1)} km`,
            detail: "Approximate straight-line estimate",
            icon: Route,
          },
          {
            label: "Relay transfers",
            value: `${completed.length} / ${relays.length}`,
            detail: "Handovers recorded in this session",
            icon: Package,
          },
        ].map((m) => (
          <section className="panel analytics-metric" key={m.label}>
            <m.icon size={19} />
            <span>{m.label}</span>
            <strong>{m.value}</strong>
            <p>{m.detail}</p>
          </section>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel">
          <header className="panel-heading">
            <div>
              <h3>Delivery progress</h3>
              <p>Current scenario · derived from order status</p>
            </div>
            <span className="count">{total} orders</span>
          </header>
          <div className="chart-body">
            <div
              className="stacked-status"
              role="img"
              aria-label={`${delivered} completed, ${assigned} assigned, ${pending} pending`}
            >
              {statuses.map((s) => (
                <i
                  key={s.label}
                  style={{
                    width: `${total ? (s.value / total) * 100 : 0}%`,
                    background: s.color,
                  }}
                />
              ))}
            </div>
            {statuses.map((s) => (
              <div className="chart-row" key={s.label}>
                <span>
                  <i style={{ background: s.color }} />
                  {s.label}
                </span>
                <strong>{s.value}</strong>
                <small>
                  {total ? Math.round((s.value / total) * 100) : 0}%
                </small>
              </div>
            ))}
            <div className="priority-summary">
              <span>
                Express{" "}
                <strong>
                  {orders.filter((o) => o.priority === "Express").length}
                </strong>
              </span>
              <span>
                Standard{" "}
                <strong>
                  {orders.filter((o) => o.priority === "Standard").length}
                </strong>
              </span>
            </div>
          </div>
        </section>
        <section className="panel">
          <header className="panel-heading">
            <div>
              <h3>Capacity by vehicle</h3>
              <p>Includes upstream relay freight allocations</p>
            </div>
          </header>
          <div className="chart-body">
            {vehicles.map((v) => {
              const assignedLoad = vehicleLoad(v.id, orders, relays);
              return (
                <div className="vehicle-capacity-chart" key={v.id}>
                  <div>
                    <strong>{v.id}</strong>
                    <span>
                      {assignedLoad} / {v.capacity} kg
                    </span>
                  </div>
                  <div className="chart-track">
                    <i
                      style={{
                        width: `${(assignedLoad / v.capacity) * 100}%`,
                        background:
                          v.type === "truck" ? "var(--blue)" : "var(--amber)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel analytics-route">
          <header className="panel-heading">
            <div>
              <h3>Route recalculation impact</h3>
              <p>Same assigned workload and distance model</p>
            </div>
          </header>
          {comparison ? (
            <div className="impact-numbers">
              <div>
                <span>Baseline</span>
                <strong>{comparison.baseline.toFixed(1)} km</strong>
              </div>
              <div>
                <span>Proposed</span>
                <strong>{comparison.proposed.toFixed(1)} km</strong>
              </div>
              <div>
                <span>Estimated reduction</span>
                <strong className="green">
                  {Math.max(
                    0,
                    comparison.baseline - comparison.proposed,
                  ).toFixed(1)}{" "}
                  km
                </strong>
              </div>
              <div>
                <span>Sequences changed</span>
                <strong>{comparison.changed}</strong>
              </div>
            </div>
          ) : (
            <div className="analytics-empty">
              <Route size={25} />
              <div>
                <strong>No comparison yet</strong>
                <p>
                  Run Optimize routes in Route Planner to measure sequence
                  changes.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
      <p className="form-note">
        Session analytics only. No historical data, live traffic, fuel
        prediction, or measured operational savings.
      </p>
    </>
  );
}
