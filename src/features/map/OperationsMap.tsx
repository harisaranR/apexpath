import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, LocateFixed, RotateCw, Signal, WifiOff } from "lucide-react";
import type { Order, Preferences, Relay, Vehicle } from "../../types";
import type { Sequences } from "../../lib/routing";
import { routePoints } from "../../lib/routing";
import { telemetry } from "../../lib/telemetry";
import { warehouse } from "../../data/scenario";
const styleUrl = "https://tiles.openfreemap.org/styles/dark";
maplibregl.setWorkerUrl(workerUrl);
const blankStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#141f2b" },
    },
  ],
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export function OperationsMap({
  vehicles,
  orders,
  relays,
  sequences,
  tick,
  selected,
  onSelect,
  preferences,
  onToggleRoute,
}: {
  vehicles: Vehicle[];
  orders: Order[];
  relays: Relay[];
  sequences: Sequences;
  tick: number;
  selected: string | null;
  onSelect: (id: string) => void;
  preferences: Preferences;
  onToggleRoute: (type: "truck" | "bike") => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    mapRef = useRef<maplibregl.Map | null>(null),
    vehicleMarkers = useRef<Record<string, maplibregl.Marker>>({}),
    selectRef = useRef(onSelect),
    initialPreferences = useRef(preferences);
  const [ready, setReady] = useState(0),
    [status, setStatus] = useState<
      "loading" | "ready" | "offline" | "unsupported"
    >("loading"),
    [is3D, setIs3D] = useState(preferences.default3D);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current!,
        style: styleUrl,
        center: [80.2707, 13.0827],
        zoom: initialPreferences.current.default3D ? 14.5 : 10.2,
        pitch: initialPreferences.current.default3D ? 58 : 0,
        maxPitch: 70,
        attributionControl: { compact: true },
      });
    } catch {
      queueMicrotask(() => setStatus("unsupported"));
      return;
    }
    mapRef.current = map;
    map.on("moveend", () => setIs3D(map.getPitch() > 0));
    // A missing upstream forest sprite should not prevent map rendering.
    map.setMissingStyleImageResolver((id) => {
      if (id === "wood-pattern" && !map.hasImage(id)) {
        map.addImage(id, {
          width: 2,
          height: 2,
          data: new Uint8Array([
            22, 37, 32, 255, 26, 42, 36, 255, 26, 42, 36, 255, 22, 37, 32, 255,
          ]),
        });
      }
    });
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right",
    );
    const timer = window.setTimeout(() => {
      if (!map.isStyleLoaded()) {
        map.setStyle(blankStyle);
        setStatus("offline");
      }
    }, 12000);
    map.on("error", () => setStatus("offline"));
    map.on("style.load", () => {
      clearTimeout(timer);
      if (!map.getSource("apex-routes"))
        map.addSource("apex-routes", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      if (!map.getLayer("apex-routes"))
        map.addLayer({
          id: "apex-routes",
          type: "line",
          source: "apex-routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 3,
            "line-opacity": 0.85,
            "line-dasharray": [2, 1],
          },
        });
      if (map.getSource("openmaptiles") && !map.getLayer("apex-buildings"))
        map.addLayer(
          {
            id: "apex-buildings",
            type: "fill-extrusion",
            source: "openmaptiles",
            "source-layer": "building",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#354459",
              "fill-extrusion-height": [
                "coalesce",
                ["get", "render_height"],
                8,
              ],
              "fill-extrusion-base": [
                "coalesce",
                ["get", "render_min_height"],
                0,
              ],
              "fill-extrusion-opacity": 0.7,
            },
          },
          "apex-routes",
        );
      setStatus(map.getSource("openmaptiles") ? "ready" : "offline");
      setReady((n) => n + 1);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current!);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const source = map.getSource("apex-routes") as
      maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: vehicles
        .filter((v) =>
          v.type === "truck"
            ? preferences.showTruckRoutes
            : preferences.showBikeRoutes,
        )
        .map((v) => ({
          type: "Feature",
          properties: { color: v.type === "truck" ? "#65b4f3" : "#eab676" },
          geometry: {
            type: "LineString",
            coordinates: routePoints(v, orders, relays, sequences),
          },
        })),
    });
  }, [
    vehicles,
    orders,
    relays,
    sequences,
    ready,
    preferences.showTruckRoutes,
    preferences.showBikeRoutes,
  ]);
  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer("apex-buildings"))
      map.setLayoutProperty(
        "apex-buildings",
        "visibility",
        preferences.showBuildings ? "visible" : "none",
      );
  }, [ready, preferences.showBuildings]);
  useEffect(() => {
    if (!ready) return;
    mapRef.current?.easeTo({
      pitch: preferences.default3D ? 58 : 0,
      zoom: preferences.default3D ? 14.5 : 10.2,
      duration: reduced() ? 0 : 500,
    });
  }, [ready, preferences.default3D]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: maplibregl.Marker[] = [];
    function marker(
      coordinates: [number, number],
      label: string,
      kind: string,
      text: string,
      click?: () => void,
    ) {
      const el = document.createElement("button");
      el.className = `map-marker ${kind}`;
      el.textContent = text;
      el.title = label;
      el.setAttribute("aria-label", label);
      const content = document.createElement("div");
      content.className = "marker-popup";
      content.textContent = label;
      const m = new maplibregl.Marker({ element: el })
        .setLngLat(coordinates)
        .setPopup(
          new maplibregl.Popup({
            offset: 20,
            closeButton: false,
          }).setDOMContent(content),
        )
        .addTo(map!);
      if (click) el.addEventListener("click", click);
      markers.push(m);
      return m;
    }
    marker(warehouse.coordinates, warehouse.name, "warehouse-marker", "H");
    relays.forEach((r) =>
      marker(r.coordinates, `${r.id} · ${r.name}`, "relay-marker", "⇄"),
    );
    orders.forEach((o) =>
      marker(
        o.coordinates,
        `${o.id} · ${o.destination} · ${o.weight} kg`,
        o.status === "Delivered" ? "delivered-marker" : "delivery-marker",
        o.status === "Delivered" ? "✓" : "",
        o.vehicleId ? () => selectRef.current(o.vehicleId!) : undefined,
      ),
    );
    vehicles.forEach((v) => {
      vehicleMarkers.current[v.id] = marker(
        v.start,
        `${v.id} · ${v.name} · Simulated GPS`,
        `${v.type}-marker`,
        v.type === "truck" ? "T" : "B",
        () => selectRef.current(v.id),
      );
    });
    return () => {
      markers.forEach((m) => m.remove());
      vehicleMarkers.current = {};
    };
  }, [ready, vehicles, orders, relays]);
  useEffect(() => {
    vehicles.forEach((v, i) => {
      const m = vehicleMarkers.current[v.id];
      m?.setLngLat(
        telemetry(v, i, orders, relays, sequences, tick, true).position,
      );
      m?.getElement().classList.toggle("selected", selected === v.id);
    });
  }, [tick, vehicles, orders, relays, sequences, selected, ready]);
  useEffect(() => {
    const marker = selected ? vehicleMarkers.current[selected] : null;
    if (marker)
      mapRef.current?.easeTo({
        center: marker.getLngLat(),
        zoom: 13.2,
        duration: reduced() ? 0 : 650,
      });
  }, [selected, ready]); // camera follows selection, not every telemetry tick
  function toggle3D() {
    const value = !is3D;
    setIs3D(value);
    mapRef.current?.easeTo({
      pitch: value ? 58 : 0,
      bearing: value ? -18 : 0,
      zoom: value ? 14.5 : 10.2,
      duration: reduced() ? 0 : 800,
    });
  }
  return (
    <section className="panel map-panel">
      <header className="panel-heading">
        <div>
          <h3>
            Network overview{" "}
            <span className="live-label">
              <Signal size={12} /> SIMULATED
            </span>
          </h3>
          <p>
            Chennai, Tamil Nadu <span className="divider">/</span> Mixed-fleet
            dispatch
          </p>
        </div>
        <div className="map-actions">
          <button
            className="route-filter truck-filter"
            aria-label="Four-wheeler routes"
            aria-pressed={preferences.showTruckRoutes}
            onClick={() => onToggleRoute("truck")}
          >
            4W routes
          </button>
          <button
            className="route-filter bike-filter"
            aria-label="Two-wheeler routes"
            aria-pressed={preferences.showBikeRoutes}
            onClick={() => onToggleRoute("bike")}
          >
            2W routes
          </button>
          <button
            aria-label="Recenter map"
            title="Recenter map"
            onClick={() =>
              mapRef.current?.easeTo({
                center: [80.2707, 13.0827],
                zoom: preferences.default3D ? 14.5 : 10.2,
                pitch: preferences.default3D ? 58 : 0,
                bearing: 0,
                duration: reduced() ? 0 : 600,
              })
            }
          >
            <LocateFixed size={15} />
          </button>
          <button
            onClick={toggle3D}
            disabled={status === "unsupported"}
            aria-pressed={is3D}
          >
            <Layers size={14} />
            {is3D ? "2D view" : "3D view"}
          </button>
        </div>
      </header>
      <div className="map-workspace">
        <div ref={container} className="map-canvas" />
        {status === "loading" && (
          <div className="map-notice">Loading OpenFreeMap tiles…</div>
        )}
        {status === "offline" && (
          <div className="map-notice">
            <WifiOff size={14} /> Map tiles unavailable. Schematic routes remain
            interactive.
            <button
              onClick={() => {
                setStatus("loading");
                mapRef.current?.setStyle(styleUrl);
              }}
            >
              Retry tiles
            </button>
          </div>
        )}
        {status === "unsupported" && (
          <div className="map-unavailable">
            <WifiOff />
            <h3>Map requires WebGL</h3>
            <p>Fleet, orders, and route planning remain available.</p>
            {vehicles.map((v) => (
              <button key={v.id} onClick={() => onSelect(v.id)}>
                {v.id} · {v.name}
              </button>
            ))}
          </div>
        )}
        <div className="map-location">
          <span className="status-dot" /> CHENNAI NETWORK{" "}
          <small>13.0827° N · 80.2707° E</small>
        </div>
        <div className="camera-controls">
          <button
            aria-label="Rotate map bearing"
            title="Rotate bearing 30°"
            onClick={() => {
              const m = mapRef.current;
              m?.easeTo({
                bearing: m.getBearing() + 30,
                duration: reduced() ? 0 : 300,
              });
            }}
          >
            <RotateCw size={14} />
          </button>
          <button
            aria-label="Increase camera pitch"
            title="Cycle camera pitch"
            onClick={() => {
              const m = mapRef.current;
              if (m) {
                const pitch = (m.getPitch() + 15) % 75;
                m.easeTo({ pitch, duration: reduced() ? 0 : 300 });
                setIs3D(pitch > 0);
              }
            }}
          >
            Tilt
          </button>
        </div>
        <div className="map-legend">
          <span className={preferences.showTruckRoutes ? "" : "route-hidden"}>
            <i className="truck-line" />
            Four-wheeler
          </span>
          <span className={preferences.showBikeRoutes ? "" : "route-hidden"}>
            <i className="bike-line" />
            Two-wheeler
          </span>
          <span>
            <b>⇄</b>Relay point
          </span>
          <small>Schematic connections · not road navigation</small>
        </div>
      </div>
    </section>
  );
}
