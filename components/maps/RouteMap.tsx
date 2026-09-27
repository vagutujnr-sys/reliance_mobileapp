"use client";

import { useEffect, useRef } from "react";
import type { MapPoint } from "@/lib/data/views";

export function RouteMap({ token, route, position, className }: { token: string; route: MapPoint[]; position?: MapPoint | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const signature = JSON.stringify({ route, position });

  useEffect(() => {
    if (!token || !ref.current) return;
    let map: import("mapbox-gl").Map | null = null;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !ref.current) return;
      mapboxgl.accessToken = token;
      const first = position ?? route[0];
      map = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [first?.longitude ?? 30.04, first?.latitude ?? -22.3],
        zoom: 5.5,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.on("load", () => {
        if (!map) return;
        const coordinates = route.map((point) => [point.longitude, point.latitude] as [number, number]);
        if (coordinates.length > 1) {
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } },
          });
          map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#2f6fed", "line-width": 4 } });
        }
        route.forEach((point) => {
          const marker = new mapboxgl.Marker({ color: "#111113", scale: 0.7 }).setLngLat([point.longitude, point.latitude]);
          if (point.label) marker.setPopup(new mapboxgl.Popup({ offset: 16 }).setText(point.label));
          marker.addTo(map!);
        });
        if (position) {
          new mapboxgl.Marker({ color: "#ff2d2d" }).setLngLat([position.longitude, position.latitude]).addTo(map!);
        }
        if (coordinates.length) {
          const bounds = coordinates.reduce((box, coord) => box.extend(coord), new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
          if (position) bounds.extend([position.longitude, position.latitude]);
          map.fitBounds(bounds, { padding: 48, maxZoom: 8 });
        }
      });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [token, signature, position, route]);

  if (!token) {
    return <div className={`grid place-items-center bg-canvas p-6 text-center text-sm text-muted ${className ?? "h-72"}`}>Mapbox token is not configured.</div>;
  }
  return <div ref={ref} className={className ?? "h-72 w-full"} />;
}
