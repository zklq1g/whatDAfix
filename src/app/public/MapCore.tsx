import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Ticket } from './page'; // Adjust path if needed
import { getImageUrl } from './page';
import { AlertTriangle, CheckCircle2, Clock, Hash, Image as ImageIcon } from 'lucide-react';
import React from 'react';

const CONTRACTORS: Record<string, string> = {
  'PWD': 'L&T Infrastructure',
  'Sanitation': 'Urban Cleaners Pvt Ltd',
  'Water Board': 'AquaFix Solutions',
  'Electricity': 'Bescom Grid Ops'
};

// Custom Pin Icons
const createIcon = (status: string, isCluster = false, count = 0) => {
  let color = '#FFB020'; // WIP
  let shadow = '0 0 10px #FFB020';
  let innerHtml = '';

  if (status === 'open') { color = '#FF3366'; shadow = '0 0 15px #FF3366'; }
  if (status === 'resolved') { color = '#00FF9D'; shadow = '0 0 10px #00FF9D'; innerHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#050A0F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`; }
  if (isCluster) { color = '#00E5FF'; shadow = '0 0 15px #00E5FF'; innerHtml = `<span style="color:#050A0F;font-weight:bold;font-size:12px;">${count}</span>`; }

  const pulseClass = status === 'open' ? 'pulse-ring' : '';

  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:24px; height:24px;">
        <div class="${pulseClass}" style="position:absolute; inset:0; border-radius:50%; border:2px solid ${color}; opacity:0;"></div>
        <div style="width:16px; height:16px; background:${color}; border-radius:50%; box-shadow:${shadow}; display:flex; align-items:center; justify-content:center; border:2px solid rgba(255,255,255,0.8); z-index:10;">
          ${innerHtml}
        </div>
      </div>
      <style>
        .pulse-ring { animation: pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1); }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
        .custom-pin { background: transparent !important; border: none !important; }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

export default function MapCore({ tickets }: { tickets: Ticket[] }) {
  // Simple clustering logic
  const clusters = React.useMemo(() => {
    const map = new Map<string, Ticket[]>();
    tickets.forEach(t => {
      if (!t.location?.lat) return;
      // Grid clustering
      const key = `${Math.round(t.location.lat * 200)}_${Math.round(t.location.lng * 200)}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.values());
  }, [tickets]);

  return (
    <MapContainer 
      center={[12.9716, 77.5946]} 
      zoom={13} 
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-dark-filter"
      />

      {clusters.map((cluster, idx) => {
        const centerTicket = cluster[0];
        const pos: [number, number] = [centerTicket.location.lat, centerTicket.location.lng];
        const isCluster = cluster.length > 1;

        if (isCluster) {
          return (
            <Marker key={`cluster-${idx}`} position={pos} icon={createIcon('cluster', true, cluster.length)}>
              <Popup maxWidth={250}>
                <div className="p-1">
                  <h3 className="text-xs font-bold text-[#00E5FF] mb-2 uppercase tracking-wider">Multiple Issues ({cluster.length})</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {cluster.map(t => (
                      <div key={t.id} className="text-[10px] flex justify-between border-b border-[#1C303B] pb-1">
                        <span className="text-gray-300">{t.category}</span>
                        <span className={`font-mono font-bold ${t.status === 'open' ? 'text-[#FF3366]' : t.status === 'resolved' ? 'text-[#00FF9D]' : 'text-[#FFB020]'}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        // Single Ticket Pin
        return (
          <Marker key={centerTicket.id} position={pos} icon={createIcon(centerTicket.status)}>
            <Popup maxWidth={320}>
              <TicketPopup ticket={centerTicket} />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

function TicketPopup({ ticket }: { ticket: Ticket }) {
  const statusColors = { open: '#FF3366', wip: '#FFB020', resolved: '#00FF9D', rejected: '#64748B' };
  const color = statusColors[ticket.status] || '#FFB020';
  const contractor = CONTRACTORS[ticket.assigned_to || ''] || 'Unknown Contractor';
  
  // Mock SLA calculation
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
