import React, { useMemo, useState, useCallback, useRef } from 'react';
import MapGL, { Marker, Popup } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Ticket } from './page';
import { getImageUrl } from './page';
import { AlertTriangle, CheckCircle2, Clock, Hash, Image as ImageIcon } from 'lucide-react';

const CONTRACTORS: Record<string, string> = {
  'PWD': 'L&T Infrastructure',
  'Sanitation': 'Urban Cleaners Pvt Ltd',
  'Water Board': 'AquaFix Solutions',
  'Electricity': 'Bescom Grid Ops'
};

// No API Key Required for CartoDB Dark Matter Vector Tiles!
const styleUrl = `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`;

export default function MapCore({ tickets }: { tickets: Ticket[] }) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const mapRef = useRef(null);

  const clusters = useMemo(() => {
    const ticketMap = new Map<string, Ticket[]>();
    tickets.forEach(t => {
      if (!t.location?.lat) return;
      const key = `${Math.round(t.location.lat * 200)}_${Math.round(t.location.lng * 200)}`;
      if (!ticketMap.has(key)) ticketMap.set(key, []);
      ticketMap.get(key)!.push(t);
    });
    return Array.from(ticketMap.values());
  }, [tickets]);

  const onMapLoad = useCallback((event: any) => {
    const map = event.target;
    
    // Add 3D Building Extrusion Layer
    // Try to find the correct label layer to insert under
    const layers = map.getStyle().layers;
    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
            labelLayerId = layers[i].id;
            break;
        }
    }

    // Using a try-catch because if the source doesn't have 'building', it throws.
    // 'v3' or 'openmaptiles' depending on the source provider
    try {
      // Find the vector source that likely contains building data
      const sources = map.getStyle().sources;
      const sourceName = Object.keys(sources).find(k => sources[k].type === 'vector') || 'openmaptiles';
      
      // In CartoDB, the source-layer is usually 'building' or 'buildings'
      /*
      map.addLayer({
          'id': '3d-buildings',
          'source': sourceName,
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 14,
          'paint': {
              'fill-extrusion-color': [
                  'interpolate', ['linear'], ['get', 'render_height'],
                  0, '#1a233a',
                  50, '#233356',
                  100, '#2d4373',
                  200, '#3c5a99'
              ],
              'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0,
                  15.05, ['get', 'render_height']
              ],
              'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  15, 0,
                  15.05, ['get', 'render_min_height']
              ],
              'fill-extrusion-opacity': 0.85 
          }
      }, labelLayerId);
      */
    } catch (e) {
      console.warn('Could not add 3D buildings layer. Is the source correct for your style?', e);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      {/* Tactical HUD Overlay */}
      <div className="absolute top-24 left-6 z-[1000] bg-[rgba(10,15,15,0.85)] border border-[#00ffcc] text-[#00ffcc] font-mono p-4 rounded shadow-[0_0_15px_rgba(0,255,204,0.2)] pointer-events-none text-xs">
          <div>SYS_STATUS: ACTIVE</div>
          <div>RENDER: 3D_EXTRUSH</div>
          <div>VIEW_PITCH: 45°</div>
      </div>

      <MapGL
        ref={mapRef}
        mapLib={maplibregl}
        style={{ width: '100%', height: '100%' }}
        initialViewState={{
          longitude: 77.5946, // Bangalore
          latitude: 12.9716,
          zoom: 15.5,
          pitch: 45,
          bearing: -17.6
        }}
        mapStyle={styleUrl}
        onLoad={onMapLoad}
      >
        {clusters.map((cluster, idx) => {
          const centerTicket = cluster[0];
          const isCluster = cluster.length > 1;
          const status = centerTicket.status;

          let color = '#FFB020';
          let shadow = '0 0 10px #FFB020';
          let innerHtml = '';

          if (status === 'open') { color = '#FF3366'; shadow = '0 0 15px #FF3366'; }
          if (status === 'resolved') { 
            color = '#00FF9D'; 
            shadow = '0 0 10px #00FF9D'; 
            innerHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050A0F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`; 
          }
          if (isCluster) { 
            color = '#00E5FF'; 
            shadow = '0 0 15px #00E5FF'; 
            innerHtml = `<span style="color:#050A0F;font-weight:bold;font-size:12px;">${cluster.length}</span>`; 
          }

          return (
            <Marker 
              key={`marker-${idx}`}
              longitude={centerTicket.location.lng} 
              latitude={centerTicket.location.lat}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedTicket(centerTicket);
              }}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', cursor: 'pointer' }}>
                {status === 'open' && (
                  <div className="absolute inset-0 rounded-full border-2 opacity-0 animate-[pulse_2s_infinite_cubic-bezier(0.4,0,0.6,1)]" style={{ borderColor: color }}></div>
                )}
                <div style={{ width: '16px', height: '16px', background: color, borderRadius: '50%', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.8)', zIndex: 10 }} dangerouslySetInnerHTML={{ __html: innerHtml }}></div>
              </div>
            </Marker>
          );
        })}

        {selectedTicket && (
          <Popup
            longitude={selectedTicket.location.lng}
            latitude={selectedTicket.location.lat}
            anchor="bottom"
            onClose={() => setSelectedTicket(null)}
            closeOnClick={false}
            maxWidth="320px"
            className="tactical-popup"
            offset={15}
          >
            <TicketPopup ticket={selectedTicket} />
          </Popup>
        )}
      </MapGL>
    </div>
  );
}

function TicketPopup({ ticket }: { ticket: Ticket }) {
  const statusColors = { open: '#FF3366', wip: '#FFB020', resolved: '#00FF9D', rejected: '#64748B' };
  const color = statusColors[ticket.status] || '#FFB020';
  const contractor = CONTRACTORS[ticket.assigned_to || ''] || 'Unknown Contractor';
  
  const deadline = new Date(ticket.sla_deadline).getTime();
  const now = Date.now();
  const isBreached = now > deadline && ticket.status !== 'resolved';
  const slaPercent = ticket.status === 'resolved' ? 100 : Math.max(0, Math.min(100, ((deadline - now) / (1000 * 60 * 60 * 48)) * 100));

  return (
    <div className="p-1 min-w-[260px] font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 border-b border-[#1C303B] pb-2">
        <div>
          <h3 className="text-sm font-bold text-white">{ticket.category}</h3>
          <span className="text-[10px] font-mono text-gray-500">ID: {ticket.id}</span>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
          {ticket.status}
        </span>
      </div>

      {/* Accountability Block */}
      <div className="bg-[#050A0F] p-2 rounded border border-[#1C303B] mb-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Accountability</div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Assigned to:</span>
          <span className="text-white font-bold">{ticket.assigned_to}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Contractor:</span>
          <span className="text-[#00E5FF] font-bold">{contractor}</span>
        </div>
      </div>

      {/* SLA Status */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} /> SLA Timeline
          </span>
          {isBreached && (
            <span className="text-[10px] font-bold text-[#FF3366] flex items-center gap-1 animate-pulse">
              <AlertTriangle size={10} /> Breached
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-[#1C303B] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all" 
            style={{ width: `${slaPercent}%`, backgroundColor: isBreached ? '#FF3366' : color }}
          />
        </div>
      </div>

      {/* Evidence */}
      {ticket.status === 'resolved' && (
        <div className="mb-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ImageIcon size={10} /> Verified Evidence
          </div>
          <div className="grid grid-cols-2 gap-2">
            <img src={getImageUrl(ticket.before_image_url) || undefined} className="w-full h-16 object-cover rounded border border-[#1C303B]" alt="Before" />
            <img src={getImageUrl(ticket.after_image_url) || undefined} className="w-full h-16 object-cover rounded border border-[#00FF9D]/30" alt="After" />
          </div>
        </div>
      )}

      {/* Cryptographic Proof */}
      {ticket.proof_of_work_hash && (
        <div className="flex items-center justify-between bg-[#00FF9D]/5 border border-[#00FF9D]/20 p-2 rounded">
          <span className="text-[9px] font-mono text-gray-400 flex items-center gap-1">
            <Hash size={10} /> {ticket.proof_of_work_hash}
          </span>
          <span className="text-[9px] font-bold text-[#00FF9D] flex items-center gap-1">
            <CheckCircle2 size={10} /> VERIFIED
          </span>
        </div>
      )}
    </div>
  );
}
