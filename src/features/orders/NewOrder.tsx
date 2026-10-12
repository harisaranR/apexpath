import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Order, Relay, Vehicle } from "../../types";
import { vehicleLoad } from "../../lib/routing";
export function NewOrder({
  vehicles,
  orders,
  relays,
  onCreate,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  onCreate: (order: Order) => void;
}) {
  const [error, setError] = useState(""),
    [weight, setWeight] = useState(5);
  function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget),
      lng = Number(data.get("lng")),
      lat = Number(data.get("lat")),
      kg = Number(data.get("weight")),
      vehicleId = String(data.get("vehicle")) || null;
    if (
      !["customer", "destination"].every((key) => String(data.get(key)).trim())
    )
      return setError("Enter a customer and destination.");
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return setError("Enter valid destination coordinates.");
    if (!Number.isFinite(kg) || kg <= 0)
      return setError("Package weight must be greater than zero.");
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (
      vehicle &&
      vehicleLoad(vehicle.id, orders, relays) + kg > vehicle.capacity
    )
      return setError(
        "This vehicle has insufficient capacity. Choose another vehicle or leave unassigned.",
      );
    onCreate({
      id: `AX-${Math.max(1052, ...orders.map((o) => Number(o.id.slice(3)))) + 1}`,
      customer: String(data.get("customer")).trim(),
      destination: String(data.get("destination")).trim(),
      coordinates: [lng, lat],
      weight: kg,
      priority: data.get("priority") === "Express" ? "Express" : "Standard",
      vehicleId,
      status: vehicleId ? "Assigned" : "Unassigned",
    });
  }
  return (
    <form onSubmit={submit}>
      <p className="dialog-description">
        Add a delivery to the Chennai dispatch network.
      </p>
      <div className="form-grid">
        <label>
          Customer
          <input
            required
            name="customer"
            maxLength={60}
            placeholder="Customer or business name"
          />
        </label>
        <label>
          Destination
          <input
            required
            name="destination"
            maxLength={80}
            placeholder="Neighborhood, Chennai"
          />
        </label>
        <label>
          Latitude
          <input
            required
            name="lat"
            type="number"
            step="any"
            min="-90"
            max="90"
            defaultValue="13.045"
          />
        </label>
        <label>
          Longitude
          <input
            required
            name="lng"
            type="number"
            step="any"
            min="-180"
            max="180"
            defaultValue="80.235"
          />
        </label>
        <label>
          Package weight (kg)
          <input
            required
            name="weight"
            type="number"
            step="0.1"
            min="0.1"
            max="3000"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />
        </label>
        <label>
          Priority
          <select name="priority">
            <option>Standard</option>
            <option>Express</option>
          </select>
        </label>
        <label className="span-two">
          Assign vehicle
          <select name="vehicle">
            <option value="">Leave unassigned · optimize later</option>
            {vehicles.map((v) => {
              const available = v.capacity - vehicleLoad(v.id, orders, relays);
              return (
                <option key={v.id} value={v.id} disabled={available < weight}>
                  {v.id} · {v.name} · {available} kg available
                </option>
              );
            })}
          </select>
        </label>
      </div>
      <p className="form-note">
        Capacity includes relay freight carried by the upstream truck.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="primary" type="submit">
        Create order <ArrowRight size={16} />
      </button>
    </form>
  );
}
