"use client";

import { useEffect, useRef, useState } from "react";
import type { FleetUnit } from "@/lib/data/views";

type MapboxMap = import("mapbox-gl").Map;
type MapboxMarker = import("mapbox-gl").Marker;

export function FleetMap({ token, units, selectedTripId, onSelect }: {
  token: string;
  units: FleetUnit[];
  selectedTripId: string | null;
  onSelect: (tripId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mapboxRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const markersRef = useRef(new Map<string, { marker: MapboxMarker; element: HTMLButtonElement }>());
  const checkpointMarkersRef = useRef<MapboxMarker[]>([]);
  const didFitRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || !containerRef.current) return;
    let cancelled = false;
    let map: MapboxMap | null = null;

    void (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) return;
      mapboxRef.current = mapboxgl;
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [30.2, -22.2],
        zoom: 5.2,
        attributionControl: true,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => {
        if (cancelled || !map) return;
        map.addSource("active-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addLayer({
          id: "active-route-line",
          type: "line",
          source: "active-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#e3262e", "line-width": 5, "line-opacity": 0.88 },
        });
        setLoaded(true);
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      checkpointMarkersRef.current.forEach((marker) => marker.remove());
      checkpointMarkersRef.current = [];
      map?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
      setLoaded(false);
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl || !loaded) return;
    const liveTrips = new Set(units.map((unit) => unit.tripId));

    for (const [tripId, entry] of markersRef.current) {
      if (!liveTrips.has(tripId)) {
        entry.marker.remove();
        markersRef.current.delete(tripId);
      }
    }

    units.forEach((unit) => {
      const existing = markersRef.current.get(unit.tripId);
      if (existing) {
        existing.marker.setLngLat([unit.longitude, unit.latitude]);
        existing.element.classList.toggle("is-selected", unit.tripId === selectedTripId);
        return;
      }

      const element = document.createElement("button");
      element.type = "button";
      element.className = `fleet-vehicle-marker${unit.tripId === selectedTripId ? " is-selected" : ""}`;
      element.setAttribute("aria-label", `${unit.title}, ${unit.registration}`);
      element.title = `${unit.title} · ${unit.registration}`;
      if (unit.imageUrl) {
        const image = document.createElement("img");
        image.src = unit.imageUrl;
        image.alt = "";
        image.draggable = false;
        image.onerror = () => {
          image.remove();
          element.textContent = "🚘";
        };
        element.append(image);
      } else {
        element.textContent = "🚘";
      }
      element.addEventListener("click", () => onSelect(unit.tripId));
      const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
        .setLngLat([unit.longitude, unit.latitude])
        .addTo(map);
      markersRef.current.set(unit.tripId, { marker, element });
    });

    if (!didFitRef.current && units.length) {
      const bounds = units.reduce(
        (result, unit) => result.extend([unit.longitude, unit.latitude]),
        new mapboxgl.LngLatBounds(
          [units[0].longitude, units[0].latitude],
          [units[0].longitude, units[0].latitude],
        ),
      );
      map.fitBounds(bounds, { padding: 72, maxZoom: 8, duration: 0 });
      didFitRef.current = true;
    }
  }, [units, selectedTripId, loaded, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    let cancelled = false;
    const selected = units.find((unit) => unit.tripId === selectedTripId);
    const source = map.getSource("active-route") as import("mapbox-gl").GeoJSONSource | undefined;
    if (!selected || !source) {
      source?.setData({ type: "FeatureCollection", features: [] });
      checkpointMarkersRef.current.forEach((marker) => marker.remove());
      checkpointMarkersRef.current = [];
      return;
    }

    const points = selected.routePoints.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && !(point.latitude === 0 && point.longitude === 0));
    const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(";");
    if (points.length >= 2) {
      void fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=false&access_token=${encodeURIComponent(token)}`)
        .then((response) => response.ok ? response.json() : null)
        .then((data: { routes?: { geometry?: { coordinates?: [number, number][] } }[] } | null) => {
          if (cancelled || !data?.routes?.[0]?.geometry?.coordinates) return;
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: data.routes[0].geometry.coordinates },
          });
        })
        .catch(() => source.setData({ type: "FeatureCollection", features: [] }));
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }

    checkpointMarkersRef.current.forEach((marker) => marker.remove());
    checkpointMarkersRef.current = [];
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled) return;
      points.forEach((point, index) => {
        const element = document.createElement("span");
        const isEndpoint = index === 0 || index === points.length - 1;
        element.className = isEndpoint ? "fleet-route-endpoint" : "fleet-checkpoint-marker";
        element.textContent = isEndpoint ? (index === 0 ? "O" : "D") : String(index);
        const marker = new mapboxgl.Marker({ element, anchor: "center" })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setText(point.label))
          .addTo(map);
        checkpointMarkersRef.current.push(marker);
      });
    });

    return () => { cancelled = true; };
  }, [units, selectedTripId, loaded, token]);

  if (!token) return <div className="grid h-full min-h-96 place-items-center bg-canvas text-sm text-muted">Mapbox access token is not configured.</div>;
  return <div ref={containerRef} className="h-full min-h-96 w-full" />;
}
