'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibre, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Ticket } from './page';
import { getImageUrl } from './page';
import { AlertTriangle, CheckCircle2, Clock, Hash, Image as ImageIcon } from 'lucide-react';
import { createRoot } from 'react-dom/client';

const CONTRACTORS: Record<string, string> = {
  'PWD': 'L&T Infrastructure',
  'Sanitation': 'Urban Cleaners Pvt Ltd',
  'Water Board': 'AquaFix Solutions',
  'Electricity': 'Bescom Grid Ops'
};

const STATUS_COLORS: Record<string, string> = {
  open: '#FF3366',
  wip: '#FFB020',
  resolved: '#00FF9D',
  rejected: '#64748B',
  cluster: '#00E5FF',
};

export default function MapCore({ tickets }: { tickets: Ticket[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<typeof MapLibre> | null>(null);
  const markersRef = useRef<InstanceType<typeof Marker>[]>([]);

  // Cluster tickets by proximity
  const clusters = React.useMemo(() => {
    const ticketMap = new Map<string, Ticket[]>();
    tickets.forEach(t => {
      if (!t.location?.lat) return;
      const key = `${Math.round(t.location.lat * 200)}_${Math.round(t.location.lng * 200)}`;
      if (!ticketMap.has(key)) ticketMap.set(key, []);
      ticketMap.get(key)!.push(t);
    });
    return Array.from(ticketMap.values());
  }, [tickets]);

  // Initialize map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const styleUrl = MAPTILER_KEY
      ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`
      : 'https://tiles.openfreemap.org/styles/dark';

    const map = new MapLibre({
      container: mapContainer.current,
      style: styleUrl,
      center: [77.5946, 12.9716],
      zoom: 14,
      pitch: 45,
      bearing: -17.6,
    });

    map.on('load', () => {
      // Add 3D buildings
      try {
        const layers = map.getStyle().layers;
        let labelLayerId: string | undefined;
        for (const layer of layers) {
          if (layer.type === 'symbol' && (layer.layout as any)?.['text-field']) {
            labelLayerId = layer.id;
            break;
          }
        }

        const sources = map.getStyle().sources;
        const sourceName = Object.keys(sources).find(k => (sources[k] as any).type === 'vector') || 'openmaptiles';

        map.addLayer({
          id: '3d-buildings',
          source: sourceName,
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'render_height'],
              0, '#1a233a', 50, '#233356', 100, '#2d4373', 200, '#3c5a99'
            ] as any,
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              15, 0, 15.05, ['get', 'render_height']
            ] as any,
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              15, 0, 15.05, ['get', 'render_min_height']
            ] as any,
            'fill-extrusion-opacity': 0.85,
          }
        }, labelLayerId);
      } catch (e) {
        console.warn('3D buildings failed:', e);
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Add/update markers when clusters change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const addMarkers = () => {
      clusters.forEach((cluster) => {
        const centerTicket = cluster[0];
        const isCluster = cluster.length > 1;
        const status = isCluster ? 'cluster' : centerTicket.status;
        const color = STATUS_COLORS[status] || '#FFB020';

        // Create marker element
        const el = document.createElement('div');
        el.style.cssText = `
          position: relative; display: flex; align-items: center;
          justify-content: center; width: 24px; height: 24px; cursor: pointer;
        `;

        const inner = document.createElement('div');
        inner.style.cssText = `
          width: 16px; height: 16px; background: ${color}; border-radius: 50%;
          box-shadow: 0 0 12px ${color}; display: flex; align-items: center;
          justify-content: center; border: 2px solid rgba(255,255,255,0.8); z-index: 10;
        `;

        if (status === 'resolved') {
          inner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#050A0F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (isCluster) {
          inner.innerHTML = `<span style="color:#050A0F;font-weight:bold;font-size:10px;">${cluster.length}</span>`;
        }

        if (status === 'open') {
          const pulse = document.createElement('div');
          pulse.style.cssText = `
            position: absolute; inset: 0; border-radius: 50%;
            border: 2px solid ${color}; animation: pulse-ring 2s infinite;
          `;
          el.appendChild(pulse);
        }

        el.appendChild(inner);

        const popup = new Popup({
          maxWidth: '320px',
          closeButton: true,
          className: 'tactical-maplibre-popup'
        });

        // Render React popup into a container
        const popupContainer = document.createElement('div');
        if (isCluster) {
          popupContainer.innerHTML = `
            <div style="padding:8px;font-family:sans-serif">
              <div style="font-size:11px;font-weight:bold;color:#00E5FF;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">
                Multiple Issues (${cluster.length})
              </div>
              ${cluster.map(t => `
                <div style="display:flex;justify-content:space-between;font-size:10px;border-bottom:1px solid #1C303B;padding:4px 0;color:#ccc">
                  <span>${t.category}</span>
                  <span style="font-weight:bold;color:${STATUS_COLORS[t.status] || '#FFB020'}">${t.status.toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          const ticket = centerTicket;
          const contractor = CONTRACTORS[ticket.assigned_to || ''] || 'Unknown Contractor';
          const deadline = new Date(ticket.sla_deadline).getTime();
          const now = Date.now();
          const isBreached = now > deadline && ticket.status !== 'resolved';
          const slaPercent = ticket.status === 'resolved' ? 100 : Math.max(0, Math.min(100, ((deadline - now) / (1000 * 60 * 60 * 48)) * 100));
          const tColor = STATUS_COLORS[ticket.status] || '#FFB020';

          popupContainer.innerHTML = `
            <div style="min-width:260px;font-family:sans-serif;padding:4px">
              <div style="display:flex;justify-content:space-between;border-bottom:1px solid #1C303B;padding-bottom:8px;margin-bottom:8px">
                <div>
                  <div style="font-size:13px;font-weight:bold;color:#fff">${ticket.category}</div>
                  <div style="font-size:10px;color:#555;font-family:monospace">ID: ${ticket.id}</div>
                </div>
                <span style="font-size:10px;font-weight:bold;text-transform:uppercase;padding:2px 8px;border-radius:4px;background:${tColor}20;color:${tColor};align-self:flex-start">${ticket.status}</span>
              </div>

              <div style="background:#050A0F;padding:8px;border-radius:4px;border:1px solid #1C303B;margin-bottom:8px">
                <div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Accountability</div>
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
                  <span style="color:#aaa">Assigned to:</span>
                  <span style="color:#fff;font-weight:bold">${ticket.assigned_to || 'N/A'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px">
                  <span style="color:#aaa">Contractor:</span>
                  <span style="color:#00E5FF;font-weight:bold">${contractor}</span>
                </div>
              </div>

              <div style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px">SLA Timeline</span>
                  ${isBreached ? `<span style="font-size:9px;color:#FF3366;font-weight:bold">⚠ BREACHED</span>` : ''}
                </div>
                <div style="width:100%;height:4px;background:#1C303B;border-radius:2px;overflow:hidden">
                  <div style="width:${slaPercent}%;height:100%;background:${isBreached ? '#FF3366' : tColor};border-radius:2px"></div>
                </div>
              </div>

              ${ticket.proof_of_work_hash ? `
                <div style="display:flex;justify-content:space-between;background:rgba(0,255,157,0.05);border:1px solid rgba(0,255,157,0.2);padding:6px 8px;border-radius:4px">
                  <span style="font-size:9px;font-family:monospace;color:#666"># ${ticket.proof_of_work_hash}</span>
                  <span style="font-size:9px;font-weight:bold;color:#00FF9D">✓ VERIFIED</span>
                </div>
              ` : ''}
            </div>
          `;
        }

        popup.setDOMContent(popupContainer);

        const marker = new Marker({ element: el })
          .setLngLat([centerTicket.location.lng, centerTicket.location.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    // If map is already loaded, add markers now; otherwise wait
    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once('load', addMarkers);
    }
  }, [clusters]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Pulse ring keyframe */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .tactical-maplibre-popup .maplibregl-popup-content {
          background: rgba(13, 25, 34, 0.97) !important;
          border: 1px solid #1C303B !important;
          border-radius: 8px !important;
          padding: 12px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
        }
        .tactical-maplibre-popup .maplibregl-popup-tip {
          border-top-color: rgba(13, 25, 34, 0.97) !important;
        }
        .tactical-maplibre-popup .maplibregl-popup-close-button {
          color: #64748B !important;
          font-size: 18px !important;
        }
        .tactical-maplibre-popup .maplibregl-popup-close-button:hover {
          color: #FF3366 !important;
          background: transparent !important;
        }
      `}</style>

      {/* Tactical HUD */}
      <div className="absolute top-24 left-6 z-[1000] bg-[rgba(10,15,15,0.85)] border border-[#00ffcc] text-[#00ffcc] font-mono p-4 rounded shadow-[0_0_15px_rgba(0,255,204,0.2)] pointer-events-none text-xs">
        <div>SYS_STATUS: ACTIVE</div>
        <div>RENDER: 3D_EXTRUDE</div>
        <div>VIEW_PITCH: 45°</div>
      </div>

      {/* Map container — raw div, MapLibre takes over */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
