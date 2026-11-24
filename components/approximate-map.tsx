"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
  label: string;
};

// Raio do círculo: mostra a região do bairro sem apontar uma casa.
const AREA_RADIUS_METERS = 700;

export function ApproximateMap({ latitude, longitude, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    async function showMap() {
      const L = await import("leaflet");
      if (cancelled || !element) return;
      map = L.map(element, { scrollWheelZoom: false }).setView([latitude, longitude], 14);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 16,
        minZoom: 11,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.circle([latitude, longitude], {
        radius: AREA_RADIUS_METERS,
        color: "#1d402d",
        weight: 2,
        fillColor: "#e4a030",
        fillOpacity: 0.25,
      }).addTo(map);
    }

    // Só baixa o Leaflet e os blocos do mapa quando o mapa chega perto da tela.
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      void showMap();
    }, { rootMargin: "200px" });
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
  }, [latitude, longitude]);

  return <div ref={containerRef} className="approximate-map" role="img" aria-label={label} />;
}
