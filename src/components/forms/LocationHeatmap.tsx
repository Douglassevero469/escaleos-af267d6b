import { useEffect, useRef, useMemo } from "react";
import "leaflet/dist/leaflet.css";

interface LocationPoint {
  lat: number;
  lng: number;
  count: number;
  label: string;
}

interface Props {
  points: LocationPoint[];
}

export default function LocationHeatmap({ points }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const validPoints = useMemo(() => points.filter(p => p.lat && p.lng), [points]);

  useEffect(() => {
    if (!mapRef.current || validPoints.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
      }).addTo(map);

      const maxCount = Math.max(...validPoints.map(p => p.count), 1);

      validPoints.forEach(p => {
        const intensity = Math.max(0.3, p.count / maxCount);
        const radius = Math.max(12, Math.min(40, 12 + (p.count / maxCount) * 28));

        const color = `hsl(220, 90%, ${Math.round(70 - intensity * 40)}%)`;
        const fillColor = `hsl(220, 90%, ${Math.round(70 - intensity * 30)}%)`;

        L.circleMarker([p.lat, p.lng], {
          radius,
          fillColor,
          color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.4 + intensity * 0.3,
        })
          .bindPopup(
            `<div style="text-align:center;font-family:system-ui;"><strong>${p.label}</strong><br/><span style="font-size:18px;font-weight:700;color:hsl(220,90%,40%)">${p.count}</span><br/><span style="font-size:11px;color:#666">respostas</span></div>`,
            { className: "custom-popup" }
          )
          .addTo(map);
      });

      // Fit bounds
      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 6);
      } else {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 8 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [validPoints]);

  if (validPoints.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
        Sem dados de localização disponíveis
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-[300px] w-full rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
}
