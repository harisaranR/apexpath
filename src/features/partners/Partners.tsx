import { useState } from "react";
import {
  Search,
  Users,
  MapPin,
  Phone,
  ArrowUpRight,
  Truck,
  Bike,
} from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import { assignedOrders, vehicleLoad } from "../../lib/routing";
export function Partners({
  vehicles,
  orders,
  relays,
  onTrack,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  onTrack: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = vehicles.filter((v) =>
    `${v.name} ${v.id} ${v.plate}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="panel roster-heading">
        <div>
          <Users size={21} />
          <div>
            <h3>{vehicles.length} delivery partners</h3>
            <p>
              Each partner is linked to one registered vehicle in this demo.
            </p>
          </div>
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            aria-label="Search delivery partners"
            placeholder="Search partners…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>
      <div className="partner-grid">
        {filtered.map((v) => (
          <section className="panel partner-card" key={v.id}>
            <header>
              <span className="partner-avatar">
                {v.name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")}
              </span>
              <div>
                <h3>{v.name}</h3>
                <p>{v.id} · Demo delivery partner</p>
              </div>
              <span className={`vehicle-icon ${v.type}`}>
                {v.type === "truck" ? <Truck size={18} /> : <Bike size={18} />}
              </span>
            </header>
            <div className="partner-meta">
              <span>
                <Phone size={13} /> {v.phone}
              </span>
              <span>
                <MapPin size={13} /> Home: {v.home[1].toFixed(3)},{" "}
                {v.home[0].toFixed(3)}
              </span>
            </div>
            <div className="partner-assignment">
              <span>
                <small>ASSIGNED VEHICLE</small>
                <strong>{v.plate}</strong>
              </span>
              <span>
                <small>DELIVERY WORKLOAD</small>
                <strong>
                  {assignedOrders(v.id, orders).length} stops ·{" "}
                  {vehicleLoad(v.id, orders, relays)} kg
                </strong>
              </span>
            </div>
            <button className="table-link" onClick={() => onTrack(v.id)}>
              View vehicle & tracking <ArrowUpRight size={13} />
            </button>
          </section>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty-state">
          <Users />
          <strong>No partners found</strong>
          <p>Try a different name or vehicle ID.</p>
        </div>
      )}
      <p className="form-note">
        Seeded contact numbers are synthetic. Added partners are kept in
        application state.
      </p>
    </>
  );
}
