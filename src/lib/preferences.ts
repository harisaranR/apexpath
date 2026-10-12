import type { Preferences } from "../types";
export const defaultPreferences: Preferences = {
  workspaceName: "Chennai workspace",
  intervalMs: 2000,
  default3D: false,
  showBuildings: true,
  showTruckRoutes: true,
  showBikeRoutes: true,
};
export function loadPreferences(): Preferences {
  try {
    const value = JSON.parse(
      localStorage.getItem("apexpath:preferences") ?? "{}",
    );
    return {
      workspaceName:
        typeof value.workspaceName === "string" && value.workspaceName.trim()
          ? value.workspaceName.trim().slice(0, 40)
          : defaultPreferences.workspaceName,
      intervalMs: [1000, 2000, 5000].includes(value.intervalMs)
        ? value.intervalMs
        : 2000,
      default3D: value.default3D === true,
      showBuildings: value.showBuildings !== false,
      showTruckRoutes: value.showTruckRoutes !== false,
      showBikeRoutes: value.showBikeRoutes !== false,
    };
  } catch {
    return { ...defaultPreferences };
  }
}
