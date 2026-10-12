import type { Coordinate, Order, Relay, Vehicle } from "../types";
export type Sequences = Record<string, string[]>;
export function reassignOrder(
  orders: Order[],
  id: string,
  vehicleId: string | null,
  vehicles: Vehicle[],
  relays: Relay[],
) {
  const order = orders.find((o) => o.id === id);
  if (!order || order.status === "Delivered")
    throw new Error("Only pending orders can be reassigned.");
  if (order.relayId)
    throw new Error("Relay parcels remain with their connected courier.");
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (vehicleId && !vehicle) throw new Error("Choose a valid vehicle.");
  const next = orders.map((o) =>
    o.id === id
      ? {
          ...o,
          vehicleId,
          status: vehicleId ? ("Assigned" as const) : ("Unassigned" as const),
        }
      : o,
  );
  if (vehicle && vehicleLoad(vehicle.id, next, relays) > vehicle.capacity)
    throw new Error("This vehicle has insufficient capacity.");
  return next;
}
export function distance(a: Coordinate, b: Coordinate) {
  const radians = Math.PI / 180;
  const s =
    Math.sin(((b[1] - a[1]) * radians) / 2) ** 2 +
    Math.cos(a[1] * radians) *
      Math.cos(b[1] * radians) *
      Math.sin(((b[0] - a[0]) * radians) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, s)));
}
export function vehicleLoad(id: string, orders: Order[], relays: Relay[]) {
  return orders
    .filter(
      (o) =>
        o.status !== "Delivered" &&
        (o.vehicleId === id ||
          relays.some((r) => r.truckId === id && o.relayId === r.id)),
    )
    .reduce((total, o) => total + o.weight, 0);
}
export function assignedOrders(
  id: string,
  orders: Order[],
  sequences: Sequences = {},
) {
  const result = orders.filter(
    (o) => o.vehicleId === id && o.status !== "Delivered",
  );
  const sequence = sequences[id];
  return sequence
    ? result.sort(
        (a, b) =>
          (sequence.indexOf(a.id) < 0 ? 999 : sequence.indexOf(a.id)) -
          (sequence.indexOf(b.id) < 0 ? 999 : sequence.indexOf(b.id)),
      )
    : result;
}
export function routePoints(
  vehicle: Vehicle,
  orders: Order[],
  relays: Relay[],
  sequences: Sequences = {},
): Coordinate[] {
  const stops = assignedOrders(vehicle.id, orders, sequences);
  const handovers = relays
    .filter(
      (r) =>
        r.truckId === vehicle.id &&
        orders.some((o) => o.relayId === r.id && o.status !== "Delivered"),
    )
    .map((r) => r.coordinates);
  return [
    vehicle.start,
    ...stops.map((o) => o.coordinates),
    ...handovers,
    vehicle.home,
  ];
}
export function routeDistance(points: Coordinate[]) {
  return points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);
}
export function totalDistance(
  vehicles: Vehicle[],
  orders: Order[],
  relays: Relay[],
  sequences: Sequences = {},
) {
  return vehicles
    .filter(
      (v) =>
        assignedOrders(v.id, orders).length ||
        relays.some(
          (r) =>
            r.truckId === v.id &&
            orders.some((o) => o.relayId === r.id && o.status !== "Delivered"),
        ),
    )
    .reduce(
      (sum, v) =>
        sum + routeDistance(routePoints(v, orders, relays, sequences)),
      0,
    );
}
export function optimize(
  vehicles: Vehicle[],
  original: Order[],
  relays: Relay[],
  current: Sequences = {},
) {
  const orders = original.map((o) => ({ ...o }));
  // Keep relay shipments with their connected couriers. Dispatch unassigned work
  // to the nearest available start point, subject to every vehicle's capacity.
  for (const order of orders
    .filter((o) => o.status === "Unassigned")
    .sort(
      (a, b) =>
        Number(b.priority === "Express") - Number(a.priority === "Express") ||
        a.id.localeCompare(b.id),
    )) {
    const candidate = vehicles
      .filter(
        (v) => vehicleLoad(v.id, orders, relays) + order.weight <= v.capacity,
      )
      .sort(
        (a, b) =>
          distance(a.start, order.coordinates) -
            distance(b.start, order.coordinates) || a.id.localeCompare(b.id),
      )[0];
    if (candidate) {
      order.vehicleId = candidate.id;
      order.status = "Assigned";
    }
  }
  const sequences: Sequences = {};
  for (const vehicle of vehicles) {
    const remaining = assignedOrders(vehicle.id, orders, current);
    const baseline = remaining.map((o) => o.id);
    const nearest: string[] = [];
    let position = vehicle.start;
    while (remaining.length) {
      remaining.sort(
        (a, b) =>
          distance(position, a.coordinates) -
            distance(position, b.coordinates) || a.id.localeCompare(b.id),
      );
      const next = remaining.shift()!;
      nearest.push(next.id);
      position = next.coordinates;
    }
    const proposed = { [vehicle.id]: nearest };
    // A greedy heuristic can worsen a home-bound route; keep the better path.
    sequences[vehicle.id] =
      routeDistance(routePoints(vehicle, orders, relays, proposed)) <=
      routeDistance(routePoints(vehicle, orders, relays, current))
        ? nearest
        : baseline;
  }
  return { orders, sequences };
}
export function simulatedPosition(
  points: Coordinate[],
  tick: number,
  offset: number,
): Coordinate {
  if (points.length < 2) return points[0];
  const progress = (((tick + offset) % 100) / 100) * (points.length - 1);
  const i = Math.min(Math.floor(progress), points.length - 2),
    fraction = progress - i;
  return [
    points[i][0] + (points[i + 1][0] - points[i][0]) * fraction,
    points[i][1] + (points[i + 1][1] - points[i][1]) * fraction,
  ];
}
