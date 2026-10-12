import type { Order, Relay, Vehicle } from "../types";
import { routePoints, simulatedPosition, vehicleLoad } from "./routing";
import type { Sequences } from "./routing";
export function telemetry(
  vehicle: Vehicle,
  index: number,
  orders: Order[],
  relays: Relay[],
  sequences: Sequences,
  tick: number,
  playing: boolean,
) {
  const load = vehicleLoad(vehicle.id, orders, relays);
  return {
    position:
      load > 0
        ? simulatedPosition(
            routePoints(vehicle, orders, relays, sequences),
            tick,
            index * 13,
          )
        : vehicle.home,
    status: load > 0 ? "In transit" : "Available",
    gps: playing ? "Simulating" : "Paused",
    gsm: (tick + index * 5) % 23 < 20 ? "Connected" : "Reconnecting",
    load,
  };
}
