export type Coordinate = [number, number];
export type Vehicle = {
  id: string;
  name: string;
  type: "truck" | "bike";
  plate: string;
  capacity: number;
  start: Coordinate;
  home: Coordinate;
  gps: string;
  gsm: string;
  phone: string;
  location: string;
};
export type Order = {
  id: string;
  customer: string;
  destination: string;
  coordinates: Coordinate;
  weight: number;
  priority: "Standard" | "Express";
  vehicleId: string | null;
  status: "Assigned" | "Delivered" | "Unassigned";
  relayId?: string;
};
export type Relay = {
  id: string;
  name: string;
  coordinates: Coordinate;
  truckId: string;
  bikeId: string;
};
export type Page =
  | "overview"
  | "partners"
  | "vehicles"
  | "orders"
  | "routes"
  | "tracking"
  | "relays"
  | "analytics"
  | "settings";
export type Preferences = {
  workspaceName: string;
  intervalMs: 1000 | 2000 | 5000;
  default3D: boolean;
  showBuildings: boolean;
  showTruckRoutes: boolean;
  showBikeRoutes: boolean;
};
