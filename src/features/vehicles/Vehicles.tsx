import { useState } from "react";
import { Search, Truck, Bike, Navigation } from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import type { Sequences } from "../../lib/routing";
import { telemetry } from "../../lib/telemetry";
export function Vehicles({
  vehicles,
  orders,
  relays,
  sequences,
  tick,
  playing,
  onTrack,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  sequences: Sequences;
  tick: number;
  playing: boolean;
  onTrack: (id: string) => void;
}) {
  const [query, setQuery] = useState(""),
    [type, setType] = useState("all");
  const filtered = vehicles.filter(
    (v) =>
      `${v.id} ${v.plate} ${v.name}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (type === "all" || v.type === type),
  );
  return (
    <section className="panel vehicles-panel">
      <header className="panel-heading">
        <div>
          <h3>
            Registered fleet <span className="count">{vehicles.length}</span>
          </h3>
          <p>Vehicle capacity and synthetic device telemetry</p>
        </div>
        <div className="table-tools">
          <label className="search-field">
            <Search size={15} />
            <input
              aria-label="Search vehicles"
              placeholder="Search vehicles…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter vehicle type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All vehicles</option>
            <option value="truck">Four-wheelers</option>
            <option value="bike">Two-wheelers</option>
          </select>
        </div>
      </header>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>VEHICLE</th>
              <th>ASSIGNED PARTNER</th>
              <th>CAPACITY / LOAD</th>
              <th>COORDINATES</th>
              <th>STATUS</th>
              <th>GPS / GSM · SIM</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const t = telemetry(
                v,
                vehicles.indexOf(v),
                orders,
                relays,
                sequences,
                tick,
                playing,
              );
              return (
                <tr key={v.id}>
                  <td>
                    <div className="vehicle-cell">
                      <span className={`vehicle-icon ${v.type}`}>
                        {v.type === "truck" ? (
                          <Truck size={17} />
                        ) : (
                          <Bike size={17} />
                        )}
                      </span>
                      <span>
                        <strong>{v.id}</strong>
                        <small>
                          {v.plate} · {v.type === "truck" ? "4W" : "2W"}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>
                    {v.name}
                    <small>{v.location}</small>
                  </td>
                  <td>
                    <strong>
                      {t.load} / {v.capacity} kg
                    </strong>
                    <div className="capacity-track">
                      <i style={{ width: `${(t.load / v.capacity) * 100}%` }} />
                    </div>
                    <small>{v.capacity - t.load} kg available</small>
                  </td>
                  <td>
                    {t.position[1].toFixed(5)}
                    <small>{t.position[0].toFixed(5)}</small>
                  </td>
                  <td>
                    <span
                      className={`status ${t.status === "Available" ? "delivered" : "assigned"}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {v.gps} · {t.gps}
                    <small
                      className={t.gsm === "Connected" ? "green" : "amber"}
                    >
                      {v.gsm} · {t.gsm}
                    </small>
                  </td>
                  <td>
                    <button
                      className="table-link"
                      onClick={() => onTrack(v.id)}
                    >
                      <Navigation size={12} /> Track
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-state">
            <Truck />
            <strong>No matching vehicles</strong>
            <p>Change the filter or register a vehicle.</p>
          </div>
        )}
      </div>
    </section>
  );
}
