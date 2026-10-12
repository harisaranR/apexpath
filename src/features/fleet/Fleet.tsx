import {
  Bike,
  Truck,
  ChevronRight,
  Radio,
  Navigation,
  X,
  Signal,
} from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import {
  assignedOrders,
  routeDistance,
  routePoints,
  vehicleLoad,
} from "../../lib/routing";
import type { Sequences } from "../../lib/routing";
import { telemetry } from "../../lib/telemetry";
export function FleetList({
  vehicles,
  orders,
  relays,
  tick,
  selected,
  onSelect,
  intervalMs = 2000,
  playing = true,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  tick: number;
  selected: string | null;
  onSelect: (id: string) => void;
  intervalMs?: number;
  playing?: boolean;
}) {
  return (
    <section className="panel fleet-panel">
      <header className="panel-heading">
        <div>
          <h3>
            Fleet activity <span className="count">{vehicles.length}</span>
          </h3>
          <p>GPS / GSM simulation</p>
        </div>
        <Radio size={16} className="subtle" />
      </header>
      <div className="fleet-list">
        {vehicles.map((v, i) => {
          const load = vehicleLoad(v.id, orders, relays),
            stops = assignedOrders(v.id, orders).length,
            online = (tick + i * 5) % 23 < 20;
          return (
            <button
              className={`fleet-row ${selected === v.id ? "selected" : ""}`}
              key={v.id}
              onClick={() => onSelect(v.id)}
            >
              <span className={`vehicle-icon ${v.type}`}>
                {v.type === "truck" ? <Truck size={19} /> : <Bike size={19} />}
              </span>
              <div className="fleet-row-body">
                <div>
                  <strong>{v.id}</strong>
                  <span className={`connection ${online ? "" : "lost"}`}>
                    {online ? "Connected" : "Reconnecting"}
                  </span>
                </div>
                <p>
                  {v.name} <span>·</span> {stops} stops
                </p>
                <div className="capacity-track">
                  <i style={{ width: `${(load / v.capacity) * 100}%` }} />
                </div>
                <small>
                  {load} / {v.capacity} kg
                </small>
              </div>
              <ChevronRight size={13} />
            </button>
          );
        })}
      </div>
      <footer className="fleet-footer">
        <span className="status-dot" />{" "}
        {playing ? `Updates every ${intervalMs / 1000}s` : "Simulation paused"}{" "}
        <span>SIM</span>
      </footer>
    </section>
  );
}
export function VehicleDetail({
  vehicle,
  vehicles,
  orders,
  relays,
  sequences,
  tick,
  onClose,
}: {
  vehicle: Vehicle;
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  sequences: Sequences;
  tick: number;
  onClose: () => void;
}) {
  const stops = assignedOrders(vehicle.id, orders, sequences),
    points = routePoints(vehicle, orders, relays, sequences),
    pos = telemetry(
      vehicle,
      vehicles.indexOf(vehicle),
      orders,
      relays,
      sequences,
      tick,
      true,
    ).position;
  const online = (tick + vehicles.indexOf(vehicle) * 5) % 23 < 20;
  return (
    <section className="panel detail-panel">
      <header className="panel-heading">
        <div>
          <span className="eyebrow">VEHICLE DETAIL</span>
          <h3>
            {vehicle.id}{" "}
            <span className="count">
              {vehicle.type === "truck" ? "4W" : "2W"}
            </span>
          </h3>
        </div>
        <button
          className="quiet"
          aria-label="Close vehicle detail"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>
      <div className="detail-body">
        <h2>{vehicle.name}</h2>
        <p>{vehicle.plate}</p>
        <dl>
          <div>
            <dt>Capacity</dt>
            <dd>
              {vehicleLoad(vehicle.id, orders, relays)} / {vehicle.capacity} kg
            </dd>
          </div>
          <div>
            <dt>Approx. route</dt>
            <dd>{routeDistance(points).toFixed(1)} km</dd>
          </div>
          <div>
            <dt>GPS module</dt>
            <dd>{vehicle.gps}</dd>
          </div>
          <div>
            <dt>GSM module</dt>
            <dd>{vehicle.gsm}</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd className={online ? "green" : "amber"}>
              <Signal size={12} />
              {online ? "Connected" : "Reconnecting"}
            </dd>
          </div>
          <div>
            <dt>Simulated position</dt>
            <dd>
              {pos[1].toFixed(5)}, {pos[0].toFixed(5)}
            </dd>
          </div>
          <div>
            <dt>Home endpoint</dt>
            <dd>
              {vehicle.home[1].toFixed(3)}, {vehicle.home[0].toFixed(3)}
            </dd>
          </div>
        </dl>
        <h4>
          <Navigation size={13} /> Delivery sequence
        </h4>
        <ol className="stop-list">
          {stops.map((o) => (
            <li key={o.id}>
              <strong>{o.destination}</strong>
              <small>
                {o.id} · {o.weight} kg
              </small>
            </li>
          ))}
        </ol>
        {!stops.length && <p className="subtle">No pending deliveries.</p>}
        <p className="form-note">
          Synthetic telemetry. Distances use straight-line estimates.
        </p>
      </div>
    </section>
  );
}
