"use client"
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState } from 'react';

// Fix for default Next.js Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAP_NODES = [
  { id: 'delhi', name: 'New Delhi (Ward 12)', lat: 28.6139, lng: 77.2090, issues: 42, slaBreaches: 0, color: '#00D4FF' },
  { id: 'kolkata', name: 'Kolkata (Ward 4)', lat: 22.5726, lng: 88.3639, issues: 15, slaBreaches: 0, color: '#00D4FF' },
  { id: 'mumbai', name: 'Mumbai (Ward 8)', lat: 19.0760, lng: 72.8777, issues: 88, slaBreaches: 1, color: '#FF9F43' },
  { id: 'chennai', name: 'Chennai (Ward 19)', lat: 13.0827, lng: 80.2707, issues: 34, slaBreaches: 0, color: '#00D4FF' },
  { id: 'ward42', name: 'Bengaluru (Ward 42 - HQ)', lat: 12.9716, lng: 77.5946, issues: 142, slaBreaches: 0, color: '#00D4FF', isHQ: true }, 
];

export function AdminMap({ slaBreachSimulated, onHqClick }: { slaBreachSimulated: boolean, onHqClick: () => void }) {
  const getNodeColor = (node: typeof MAP_NODES[0]) => {
    if (node.isHQ && slaBreachSimulated) return '#FF4D5A';
    return node.color;
  };

  return (
    <MapContainer 
      center={[20.5937, 78.9629]} 
      zoom={5} 
      className="absolute inset-0 w-full h-full bg-[#050A0F] z-0"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {MAP_NODES.map((node) => {
        const color = getNodeColor(node);
        const isBreached = node.isHQ && slaBreachSimulated;
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isBreached ? 12 : 8}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
            eventHandlers={{
              click: () => {
                if (node.isHQ) {
                  onHqClick();
                }
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="custom-tooltip">
              <div className="bg-[#0D1922] border border-[#1C303B] p-2 rounded shadow-2xl min-w-[150px]">
                <div className="flex justify-between items-center mb-1 border-b border-[#1C303B] pb-1">
                  <span className="text-[11px] font-bold text-[#E8F3F7]">{node.name}</span>
                  {node.isHQ && <span className="text-[8px] bg-[#00D4FF] text-[#050A0F] px-1.5 py-0.5 rounded font-bold ml-2">HQ</span>}
                </div>
                <div className="text-[10px] font-mono text-[#566B76]">
                  <div>Active Issues: <span className="text-[#E8F3F7]">{node.issues}</span></div>
                  <div>SLA Breaches: <span className={isBreached ? 'text-[#FF4D5A] font-bold' : 'text-[#35D07F]'}>{isBreached ? '3 (CRITICAL)' : node.slaBreaches}</span></div>
                </div>
                {node.isHQ && (
                  <div className="mt-1 text-[9px] text-[#00D4FF] font-mono font-bold animate-pulse text-center">
                    [ CLICK TO INSPECT TICKETS ]
                  </div>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
