"use client";

import { useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { businessConfig } from "@/config/business";
import { siteConfig } from "@/config/site";
import { useCheckoutStore } from "@/store/checkout-store";

/**
 * Turbopack resuelve estos imports como string; Webpack (y los tipos de
 * Next para imágenes) los tipa como StaticImageData con un campo `.src`.
 * Este helper soporta ambos casos sin depender del bundler.
 */
function resolveImageSrc(image: string | { src: string }): string {
  return typeof image === "string" ? image : image.src;
}

/**
 * Los íconos default de Leaflet apuntan a rutas relativas que Turbopack/Webpack
 * no resuelven solos. Se reemplazan una única vez por los assets ya incluidos
 * en el propio paquete `leaflet` (sin depender de ningún CDN externo).
 */
const markerIconInstance = L.icon({
  iconUrl: resolveImageSrc(markerIcon),
  iconRetinaUrl: resolveImageSrc(markerIcon2x),
  shadowUrl: resolveImageSrc(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      ref={markerRef}
      draggable
      icon={markerIconInstance}
      position={position}
      eventHandlers={{
        dragend: () => {
          const latLng = markerRef.current?.getLatLng();
          if (latLng) onMove(latLng.lat, latLng.lng);
        },
      }}
    />
  );
}

/**
 * Implementación real del mapa. Vive en un módulo separado de
 * LocationPicker.tsx a propósito: `import "leaflet"` toca `window` en el
 * momento de evaluar el módulo (no solo al renderizar), así que este archivo
 * solo puede llegar al bundle del cliente a través de un import() dinámico
 * con ssr:false — un import estático normal lo ejecutaría también en el
 * servidor y rompería el render (ver LocationPicker.tsx).
 */
export function LeafletMap() {
  const t = siteConfig.checkoutPage.shippingInformation;
  const latitude = useCheckoutStore((state) => state.values.latitude);
  const longitude = useCheckoutStore((state) => state.values.longitude);
  const setLocation = useCheckoutStore((state) => state.setLocation);

  const position: [number, number] = [
    latitude ?? businessConfig.map.defaultCenter.lat,
    longitude ?? businessConfig.map.defaultCenter.lng,
  ];
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="h-64 w-full overflow-hidden rounded-xl border border-border sm:h-80">
        <MapContainer
          center={position}
          zoom={businessConfig.map.defaultZoom}
          scrollWheelZoom={false}
          className="size-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={position} onMove={setLocation} />
        </MapContainer>
      </div>

      {hasLocation ? (
        <p className="text-sm text-foreground">
          <span className="font-medium">{t.locationConfirmedLabel}</span>{" "}
          <span className="text-muted-foreground">
            ({t.latitudeShortLabel}: {latitude.toFixed(6)}, {t.longitudeShortLabel}:{" "}
            {longitude.toFixed(6)})
          </span>
        </p>
      ) : null}
    </div>
  );
}
