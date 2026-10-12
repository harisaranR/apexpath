import { test } from "node:test";
import assert from "node:assert/strict";
import {
  distance,
  optimize,
  vehicleLoad,
  totalDistance,
  assignedOrders,
  simulatedPosition,
  routePoints,
  reassignOrder,
} from "../src/lib/routing.ts";
import { seedOrders, seedVehicles, relays } from "../src/data/scenario.ts";
import type { Order } from "../src/types.ts";
test("seed scenario counts and relay freight obey capacity", () => {
  assert.equal(seedOrders.length, 12);
  assert.equal(seedVehicles.length, 5);
  assert.equal(relays.length, 2);
  assert.equal(vehicleLoad("AP-T01", seedOrders, relays), 88);
  for (const vehicle of seedVehicles)
    assert.ok(vehicleLoad(vehicle.id, seedOrders, relays) <= vehicle.capacity);
});
test("nearest-neighbor improves the seeded route and is deterministic", () => {
  const result = optimize(seedVehicles, seedOrders, relays);
  assert.deepEqual(result, optimize(seedVehicles, seedOrders, relays));
  assert.ok(
    totalDistance(seedVehicles, result.orders, relays, result.sequences) <
      totalDistance(seedVehicles, seedOrders, relays),
  );
  assert.notDeepEqual(
    assignedOrders("AP-T02", seedOrders).map((o) => o.id),
    result.sequences["AP-T02"],
  );
  assert.deepEqual(seedOrders[0].destination, "Velachery");
});
test("dispatch never overallocates or loses orders and leaves oversized shipments unassigned", () => {
  const incoming: Order[] = Array.from({ length: 25 }, (_, i) => ({
    id: `AX-${2000 + i}`,
    customer: "Test",
    destination: "Chennai",
    coordinates: [80.23, 13.04],
    weight: i === 0 ? 3000 : 35,
    priority: "Express",
    vehicleId: null,
    status: "Unassigned",
  }));
  const result = optimize(seedVehicles, [...seedOrders, ...incoming], relays);
  assert.equal(result.orders.length, 37);
  assert.equal(
    result.orders.find((o) => o.id === "AX-2000")?.status,
    "Unassigned",
  );
  for (const vehicle of seedVehicles)
    assert.ok(
      vehicleLoad(vehicle.id, result.orders, relays) <= vehicle.capacity,
    );
  assert.equal(new Set(result.orders.map((o) => o.id)).size, 37);
});
test("repeat optimization cannot worsen the current sequence", () => {
  const first = optimize(seedVehicles, seedOrders, relays);
  const next = optimize(seedVehicles, first.orders, relays, first.sequences);
  assert.ok(
    totalDistance(seedVehicles, next.orders, relays, next.sequences) <=
      totalDistance(seedVehicles, first.orders, relays, first.sequences),
  );
});
test("reassignment rejects overloaded, relay-linked, and completed orders", () => {
  assert.throws(
    () => reassignOrder(seedOrders, "AX-1042", "AP-B01", seedVehicles, relays),
    /insufficient capacity/,
  );
  assert.throws(
    () => reassignOrder(seedOrders, "AX-1047", "AP-T02", seedVehicles, relays),
    /Relay parcels/,
  );
  assert.throws(
    () => reassignOrder(seedOrders, "AX-1051", "AP-T01", seedVehicles, relays),
    /pending orders/,
  );
  const next = reassignOrder(
    seedOrders,
    "AX-1041",
    "AP-T02",
    seedVehicles,
    relays,
  );
  assert.equal(vehicleLoad("AP-T01", next, relays), 64);
  assert.equal(vehicleLoad("AP-T02", next, relays), 116);
  assert.equal(seedOrders[0].vehicleId, "AP-T01");
});
test("distance is symmetric and telemetry positions move along the route", () => {
  assert.equal(distance([80, 13], [80, 13]), 0);
  assert.ok(
    Math.abs(distance([80, 13], [81, 14]) - distance([81, 14], [80, 13])) <
      1e-8,
  );
  const points = routePoints(seedVehicles[0], seedOrders, relays);
  assert.notDeepEqual(
    simulatedPosition(points, 0, 0),
    simulatedPosition(points, 1, 0),
  );
  assert.deepEqual(points.at(-1), seedVehicles[0].home);
});
