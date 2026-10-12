import { Search, ArrowUpRight, Package } from "lucide-react";
import { useState } from "react";
import type { Order, Relay, Vehicle } from "../../types";
import { vehicleLoad } from "../../lib/routing";
export function OrdersTable({
  orders,
  vehicles,
  relays,
  compact = false,
  onSelect,
  onDeliver,
  onAssign,
  busy,
}: {
  orders: Order[];
  vehicles: Vehicle[];
  relays: Relay[];
  compact?: boolean;
  onSelect: (id: string) => void;
  onDeliver: (id: string) => void;
  onAssign: (id: string, vehicleId: string | null) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("All orders");
  const filtered = orders.filter(
    (o) =>
      `${o.id} ${o.customer} ${o.destination}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All orders" || o.status === status),
  );
  const visible = compact ? filtered.slice(-4).reverse() : filtered;
  return (
    <section className="panel orders-panel">
      <header className="panel-heading">
        <div>
          <h3>
            {compact ? "Recent orders" : "Delivery orders"}{" "}
            <span className="count">{orders.length}</span>
          </h3>
          <p>
            {compact
              ? "Latest activity across your network"
              : "Manage dispatch, capacity, and delivery status"}
          </p>
        </div>
        {compact ? (
          <span className="subtle">Chennai network</span>
        ) : (
          <div className="table-tools">
            <label className="search-field">
              <Search size={15} />
              <input
                aria-label="Search orders"
                placeholder="Search orders…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Filter orders"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {["All orders", "Assigned", "Unassigned", "Delivered"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </div>
        )}
      </header>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ORDER / CUSTOMER</th>
              <th>DESTINATION</th>
              <th>VEHICLE</th>
              <th>WEIGHT</th>
              <th>PRIORITY</th>
              <th>STATUS</th>
              {!compact && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.id}</strong>
                  <small>{o.customer}</small>
                </td>
                <td>
                  {o.destination}
                  {o.relayId && <small>Via {o.relayId} relay</small>}
                </td>
                <td>
                  {o.vehicleId ? (
                    <button
                      className="table-link"
                      onClick={() => onSelect(o.vehicleId!)}
                      title={vehicles.find((v) => v.id === o.vehicleId)?.name}
                    >
                      {o.vehicleId}
                      <ArrowUpRight size={12} />
                    </button>
                  ) : (
                    <span className="subtle">Unassigned</span>
                  )}
                  {!compact && o.status !== "Delivered" && !o.relayId && (
                    <select
                      className="assignment-select"
                      aria-label={`Assign ${o.id}`}
                      value={o.vehicleId ?? ""}
                      disabled={busy}
                      onChange={(event) =>
                        onAssign(o.id, event.target.value || null)
                      }
                    >
                      <option value="">Unassigned</option>
                      {vehicles.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={
                            vehicleLoad(v.id, orders, relays) +
                              (o.vehicleId === v.id ? 0 : o.weight) >
                            v.capacity
                          }
                        >
                          {v.id}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td>{o.weight} kg</td>
                <td>
                  <span
                    className={
                      o.priority === "Express" ? "priority-express" : "subtle"
                    }
                  >
                    {o.priority}
                  </span>
                </td>
                <td>
                  <span className={`status ${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                </td>
                {!compact && (
                  <td>
                    {o.status === "Assigned" ? (
                      <button
                        className="table-link"
                        disabled={busy}
                        onClick={() => onDeliver(o.id)}
                      >
                        Mark delivered
                      </button>
                    ) : (
                      <span className="subtle">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty-state">
            <Package size={26} />
            <strong>No matching orders</strong>
            <p>Try another search or add a delivery.</p>
          </div>
        )}
      </div>
    </section>
  );
}
