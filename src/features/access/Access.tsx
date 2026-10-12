import { useState } from "react";
import {
  ArrowRight,
  Check,
  Truck,
  Bike,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "../../components/Brand";
import type { Vehicle, Coordinate } from "../../types";
function coordinates(value: FormDataEntryValue | null): Coordinate | null {
  const values = String(value).split(",");
  if (values.some((part) => !part.trim())) return null;
  const parts = values.map(Number);
  return parts.length === 2 &&
    parts.every(Number.isFinite) &&
    Math.abs(parts[0]) <= 90 &&
    Math.abs(parts[1]) <= 180
    ? [parts[1], parts[0]]
    : null;
}
export function Access({
  onEnter,
  onRegister,
  embedded = false,
  submitLabel = "Register partner",
}: {
  onEnter: () => void;
  onRegister: (vehicle: Vehicle) => void | boolean;
  embedded?: boolean;
  submitLabel?: string;
}) {
  const [register, setRegister] = useState(embedded);
  const [error, setError] = useState("");
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      ["name", "plate", "gps", "gsm"].some(
        (key) => !String(data.get(key)).trim(),
      )
    )
      return setError(
        "Enter a driver name, registration number, and both device IDs.",
      );
    const start = coordinates(data.get("current")),
      home = coordinates(data.get("home"));
    if (!start || !home)
      return setError(
        "Enter valid latitude, longitude pairs for both locations.",
      );
    const phone = String(data.get("phone")).replace(/[\s+()-]/g, "");
    if (!/^\d{10,15}$/.test(phone))
      return setError("Enter a valid phone number with 10–15 digits.");
    const type = data.get("type") === "bike" ? "bike" : "truck",
      capacity = Number(data.get("capacity"));
    if (
      !Number.isFinite(capacity) ||
      capacity <= 0 ||
      capacity > (type === "bike" ? 40 : 3000)
    )
      return setError(
        `Capacity must be 0.1–${type === "bike" ? 40 : 3000} kg for this vehicle.`,
      );
    const accepted = onRegister({
      id: `AP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      name: String(data.get("name")).trim(),
      phone,
      type,
      plate: String(data.get("plate")).trim().toUpperCase(),
      start,
      home,
      capacity,
      gps: String(data.get("gps")).trim(),
      gsm: String(data.get("gsm")).trim(),
      location: "Registered location",
    });
    if (accepted === false)
      return setError("A vehicle with this registration already exists.");
    onEnter();
  }
  const form = (
    <form className="partner-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Driver name
          <input name="name" required maxLength={60} placeholder="Full name" />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            required
            type="tel"
            placeholder="+91 98765 43210"
          />
        </label>
        <label>
          Current location <small>latitude, longitude</small>
          <input name="current" required placeholder="13.0827, 80.2707" />
        </label>
        <label>
          Home location <small>latitude, longitude</small>
          <input name="home" required placeholder="13.0400, 80.2200" />
        </label>
        <label>
          Vehicle type
          <select name="type">
            <option value="bike">Two-wheeler</option>
            <option value="truck">Four-wheeler</option>
          </select>
        </label>
        <label>
          Registration number
          <input
            name="plate"
            required
            maxLength={20}
            placeholder="TN 01 AB 1234"
          />
        </label>
        <label>
          Vehicle capacity <small>kg</small>
          <input
            name="capacity"
            required
            type="number"
            min="0.1"
            max="3000"
            step="0.1"
            placeholder="20"
          />
        </label>
        <label>
          GPS module ID
          <input name="gps" required maxLength={40} placeholder="GPS-001" />
        </label>
        <label>
          GSM module ID
          <input name="gsm" required maxLength={40} placeholder="GSM-001" />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="form-note">
        <ShieldCheck size={15} /> Saved in this demo session. Device IDs are
        simulated.
      </p>
      <button className="primary" type="submit">
        {submitLabel} <ArrowRight size={16} />
      </button>
    </form>
  );
  if (embedded) return form;
  return (
    <main className="access">
      <section className="access-story">
        <Brand />
        <div className="access-copy">
          <span className="eyebrow">THE NEXT MILE STARTS HERE</span>
          <h1>
            One network.
            <br />
            Every doorstep.
          </h1>
          <p>
            Connect your fleet, coordinate handovers, and make every kilometer
            count.
          </p>
          <div className="network-visual">
            <div>
              <Truck />
              <span>Consolidate</span>
            </div>
            <i />
            <div>
              <MapPin />
              <span>Connect</span>
            </div>
            <i />
            <div>
              <Bike />
              <span>Deliver</span>
            </div>
          </div>
          <div className="story-facts">
            <span>
              <Check size={15} /> Mixed-fleet coordination
            </span>
            <span>
              <Check size={15} /> Smarter home-bound routes
            </span>
            <span>
              <Check size={15} /> One operations workspace
            </span>
          </div>
        </div>
        <footer>
          CHENNAI DEMO NETWORK <span>13.0827° N · 80.2707° E</span>
        </footer>
      </section>
      <section className="access-panel">
        <span className="badge">INTERACTIVE PROTOTYPE</span>
        <h2>{register ? "Join the network" : "Your next mile, connected."}</h2>
        <p>
          {register
            ? "Add a delivery partner to your demo fleet."
            : "Step into a working Chennai dispatch scenario. No account needed."}
        </p>
        <div className="access-tabs">
          <button
            className={!register ? "active" : ""}
            onClick={() => setRegister(false)}
          >
            Explore demo
          </button>
          <button
            className={register ? "active" : ""}
            onClick={() => setRegister(true)}
          >
            Register partner
          </button>
        </div>
        {register ? (
          form
        ) : (
          <>
            <div className="demo-preview">
              <span className="demo-pin">
                <MapPin />
              </span>
              <div>
                <strong>Chennai operations</strong>
                <p>1 warehouse · 5 vehicles · 12 orders</p>
              </div>
              <span className="status-dot" />
            </div>
            <button className="primary wide" onClick={onEnter}>
              Continue as Demo <ArrowRight size={17} />
            </button>
            <p className="form-note">
              Seeded data · Simulated GPS / GSM · No API keys
            </p>
          </>
        )}{" "}
        {register && (
          <button className="quiet" onClick={onEnter}>
            Skip registration and explore demo →
          </button>
        )}
        <div className="access-bottom">
          Designed for the way deliveries actually move.
        </div>
      </section>
    </main>
  );
}
