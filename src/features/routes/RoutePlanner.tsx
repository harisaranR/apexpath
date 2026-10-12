import { Route, ArrowRight, Sparkles } from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import type { Sequences } from "../../lib/routing";
import {
  assignedOrders,
  routeDistance,
  routePoints,
  totalDistance,
} from "../../lib/routing";
export type Comparison = {
  baseline: number;
  proposed: number;
  unassigned: number;
  changed: number;
};
export function RoutePlanner({
  vehicles,
  orders,
  relays,
  sequences,
  comparison,
  busy,
  onOptimize,
  onSelect,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  sequences: Sequences;
  comparison: Comparison | null;
  busy: boolean;
  onOptimize: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <section className="panel optimization-summary">
        <div>
          <span className="eyebrow">HOME-BOUND ROUTE PLANNING</span>
          <h2>A better path through the network.</h2>
          <p>
            Capacity-aware dispatch, followed by deterministic nearest-neighbor
            sequencing. Every route ends near the driver's home.
          </p>
          <button className="primary" onClick={onOptimize} disabled={busy}>
            <Sparkles size={15} />
            {busy ? "Calculating routes…" : "Optimize routes"}
          </button>
        </div>
        <div className="comparison">
          <div>
            <span>Baseline</span>
            <strong>
              {(
                comparison?.baseline ??
                totalDistance(vehicles, orders, relays, sequences)
              ).toFixed(1)}
              <small> km</small>
            </strong>
          </div>
          <ArrowRight size={22} />
          <div>
            <span>Proposed</span>
            <strong className="green">
              {comparison ? comparison.proposed.toFixed(1) : "—"}
              <small> km</small>
            </strong>
          </div>
          <p>
            {comparison
              ? `${Math.max(0, comparison.baseline - comparison.proposed).toFixed(1)} km estimated reduction · ${comparison.changed} sequences changed · ${comparison.unassigned} unassigned`
              : "Run optimization to compare route sequences."}
          </p>
          <small>
            Same assigned orders and straight-line distance model for both runs.
          </small>
        </div>
      </section>
      <div className="route-grid">
        {vehicles.map((v) => {
          const stops = assignedOrders(v.id, orders, sequences);
          return (
            <section className="panel route-card" key={v.id}>
              <header>
                <span className={`vehicle-icon ${v.type}`}>
                  <Route size={19} />
                </span>
                <div>
                  <h3>{v.id}</h3>
                  <p>
                    {v.name} ·{" "}
                    {v.type === "truck" ? "Four-wheeler" : "Two-wheeler"}
                  </p>
                </div>
                <button className="table-link" onClick={() => onSelect(v.id)}>
                  Track →
                </button>
              </header>
              <div className="route-stats">
                <span>{stops.length} stops</span>
                <span>
                  ≈{" "}
                  {routeDistance(
                    routePoints(v, orders, relays, sequences),
                  ).toFixed(1)}{" "}
                  km
                </span>
              </div>
              <ol className="stop-list">
                <li>
                  <strong>
                    {relays.some((r) => r.bikeId === v.id)
                      ? "Pickup / relay start"
                      : "Warehouse / current location"}
                  </strong>
                  <small>Route origin</small>
                </li>
                {stops.map((o) => (
                  <li key={o.id}>
                    <strong>{o.destination}</strong>
                    <small>
                      {o.id} · {o.weight} kg
                    </small>
                  </li>
                ))}
                {relays
                  .filter((r) => r.truckId === v.id)
                  .map((r) => (
                    <li key={r.id}>
                      <strong>{r.name}</strong>
                      <small>Relay handover → {r.bikeId}</small>
                    </li>
                  ))}
                <li>
                  <strong>Home endpoint</strong>
                  <small>
                    {v.home[1].toFixed(3)}, {v.home[0].toFixed(3)}
                  </small>
                </li>
              </ol>
            </section>
          );
        })}
      </div>
      <p className="form-note">
        Heuristic planning and schematic connections. No traffic model or
        certified global optimum.
      </p>
    </>
  );
}
