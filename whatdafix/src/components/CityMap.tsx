"use client"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Next.js Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function CityMap() {
  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={13} className="h-[500px] w-full rounded-lg border">
      {/* CartoDB Dark Matter gives it that hacker/cyberpunk aesthetic */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {/* You will map through your Supabase tickets here later */}
      <Marker position={[12.9716, 77.5946]}>
        <Popup>Cluster Ticket: 3 Potholes Reported</Popup>
      </Marker>
    </MapContainer>
  )
}
