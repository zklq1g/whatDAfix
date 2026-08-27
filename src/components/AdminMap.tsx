"use client"
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Next.js Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Rich ward-level operational data — each node represents a real municipal ward
const MAP_NODES = [
  {
    id: 'delhi',
    wardName: 'Ward 12 — Karol Bagh',
    city: 'New Delhi',
    lat: 28.6516, lng: 77.1904,
    activeIssues: 42,
    resolvedThisWeek: 29,
    slaBreaches: 0,
    topCategory: 'Drainage Overflow',
    avgClosureHrs: 38,
    contractor: 'NorthDel Infra Pvt. Ltd',
    trustScore: 94,
    workerCount: 11,
    color: '#00D4FF',
    isHQ: false,
  },
  {
    id: 'kolkata',
    wardName: 'Ward 4 — Shyambazar',
    city: 'Kolkata',
    lat: 22.5958, lng: 88.3793,
    activeIssues: 15,
    resolvedThisWeek: 18,
    slaBreaches: 0,
    topCategory: 'Streetlight Failure',
    avgClosureHrs: 29,
    contractor: 'EastBridge Solutions',
    trustScore: 97,
    workerCount: 6,
    color: '#00D4FF',
    isHQ: false,
  },
  {
    id: 'mumbai',
    wardName: 'Ward 8 — Dharavi',
    city: 'Mumbai',
    lat: 19.0390, lng: 72.8527,
    activeIssues: 88,
    resolvedThisWeek: 41,
    slaBreaches: 3,
    topCategory: 'Open Manhole / Road Hazard',
    avgClosureHrs: 71,
    contractor: 'WestCoast Civic Corp',
    trustScore: 61,
    workerCount: 17,
    color: '#FF9F43',
    isHQ: false,
  },
  {
    id: 'chennai',
    wardName: 'Ward 19 — T. Nagar',
    city: 'Chennai',
    lat: 13.0418, lng: 80.2341,
    activeIssues: 34,
    resolvedThisWeek: 27,
    slaBreaches: 0,
    topCategory: 'Garbage Accumulation',
    avgClosureHrs: 44,
    contractor: 'SouthMet Services',
    trustScore: 89,
    workerCount: 9,
    color: '#00D4FF',
    isHQ: false,
  },
  {
    id: 'hyderabad',
    wardName: 'Ward 31 — Banjara Hills',
    city: 'Hyderabad',
    lat: 17.4153, lng: 78.4456,
    activeIssues: 57,
    resolvedThisWeek: 44,
    slaBreaches: 1,
    topCategory: 'Pothole / Road Damage',
    avgClosureHrs: 52,
    contractor: 'DeccanBuild Contractors',
    trustScore: 78,
    workerCount: 14,
    color: '#FF9F43',
    isHQ: false,
  },
  {
    id: 'pune',
    wardName: 'Ward 7 — Shivajinagar',
    city: 'Pune',
    lat: 18.5204, lng: 73.8567,
    activeIssues: 29,
    resolvedThisWeek: 25,
    slaBreaches: 0,
    topCategory: 'Water Pipeline Leak',
    avgClosureHrs: 33,
    contractor: 'PuneCore Works Ltd',
    trustScore: 92,
    workerCount: 8,
    color: '#00D4FF',
    isHQ: false,
  },
  {
    id: 'ward42',
    wardName: 'Ward 42 — Koramangala',
    city: 'Bengaluru',
    lat: 12.9352, lng: 77.6245,
    activeIssues: 142,
    resolvedThisWeek: 98,
    slaBreaches: 2,
    topCategory: 'Road Collapse / Sinkhole',
    avgClosureHrs: 61,
    contractor: 'BangaloreCivic Tech',
    trustScore: 73,
    workerCount: 31,
    color: '#00D4FF',
    isHQ: true,
  },
];

function TrustBar({ score }: { score: number }) {
  const color = score >= 90 ? '#35D07F' : score >= 70 ? '#FF9F43' : '#FF4D5A';
  return (
    <div style={{ width: '100%', height: 4, background: '#1C303B', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

export function AdminMap({ slaBreachSimulated, onHqClick }: { slaBreachSimulated: boolean, onHqClick: () => void }) {
  const getNodeColor = (node: typeof MAP_NODES[0]) => {
    if (node.isHQ && slaBreachSimulated) return '#FF4D5A';
    if (node.slaBreaches > 0) return '#FF9F43';
    return '#00D4FF';
  };

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      className="absolute inset-0 w-full h-full bg-[#050A0F] z-0"
      zoomControl={false}
      attributionControl={false}
    >
      {/* OpenStreetMap tiles styled to dark — no API key needed */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-dark-filter"
      />
      {MAP_NODES.map((node) => {
        const color = getNodeColor(node);
        const isBreached = node.isHQ && slaBreachSimulated;
        const trustColor = node.trustScore >= 90 ? '#35D07F' : node.trustScore >= 70 ? '#FF9F43' : '#FF4D5A';

        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isBreached ? 14 : node.isHQ ? 11 : 8}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: isBreached ? 1 : 0.85,
              weight: isBreached ? 3 : 2,
            }}
            eventHandlers={{
              click: () => { if (node.isHQ) onHqClick(); }
            }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={1} className="custom-tooltip" permanent={false}>
              <div style={{
                background: '#0A141C',
                border: '1px solid #1C303B',
                borderRadius: 8,
                padding: '10px 12px',
                minWidth: 210,
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: `0 0 20px ${color}22`,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1C303B' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#E8F3F7' }}>{node.wardName}</div>
                    <div style={{ fontSize: 9, color: '#566B76', marginTop: 1 }}>{node.city} Municipal Corporation</div>
                  </div>
                  {node.isHQ && (
                    <span style={{ fontSize: 8, background: color, color: '#050A0F', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>HQ</span>
                  )}
                  {node.slaBreaches > 0 && !node.isHQ && (
                    <span style={{ fontSize: 8, background: '#FF9F43', color: '#050A0F', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SLA RISK</span>
                  )}
                </div>

                {/* Metrics grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px', fontSize: 10 }}>
                  <span style={{ color: '#566B76' }}>Active Issues</span>
                  <span style={{ color: '#E8F3F7', textAlign: 'right', fontWeight: 700 }}>{node.activeIssues}</span>

                  <span style={{ color: '#566B76' }}>Resolved / Wk</span>
                  <span style={{ color: '#35D07F', textAlign: 'right' }}>{node.resolvedThisWeek} tickets</span>

                  <span style={{ color: '#566B76' }}>SLA Breaches</span>
                  <span style={{ color: isBreached || node.slaBreaches > 0 ? '#FF4D5A' : '#35D07F', textAlign: 'right', fontWeight: 700 }}>
                    {isBreached ? '5 (CRITICAL)' : node.slaBreaches || '0'}
                  </span>

                  <span style={{ color: '#566B76' }}>Avg Closure</span>
                  <span style={{ color: node.avgClosureHrs > 60 ? '#FF9F43' : '#E8F3F7', textAlign: 'right' }}>{node.avgClosureHrs}h</span>

                  <span style={{ color: '#566B76' }}>Workers</span>
                  <span style={{ color: '#E8F3F7', textAlign: 'right' }}>{node.workerCount} deployed</span>
                </div>

                {/* Top category */}
                <div style={{ marginTop: 6, padding: '4px 6px', background: '#050A0F', borderRadius: 4, border: '1px solid #1C303B', fontSize: 9 }}>
                  <span style={{ color: '#566B76' }}>TOP CATEGORY: </span>
                  <span style={{ color: '#FF9F43', fontWeight: 700 }}>{node.topCategory}</span>
                </div>

                {/* Contractor */}
                <div style={{ marginTop: 4, padding: '4px 6px', background: '#050A0F', borderRadius: 4, border: '1px solid #1C303B', fontSize: 9 }}>
                  <span style={{ color: '#566B76' }}>CONTRACTOR: </span>
                  <span style={{ color: '#B5C6CE' }}>{node.contractor}</span>
                </div>

                {/* Trust bar */}
                <div style={{ marginTop: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 3 }}>
                    <span style={{ color: '#566B76' }}>CONTRACTOR TRUST SCORE</span>
                    <span style={{ color: trustColor, fontWeight: 700 }}>{node.trustScore}%</span>
                  </div>
                  <TrustBar score={node.trustScore} />
                </div>

                {/* HQ CTA */}
                {node.isHQ && (
                  <div style={{ marginTop: 8, textAlign: 'center', fontSize: 9, color: color, fontWeight: 700, letterSpacing: '0.05em' }}>
                    [ CLICK TO INSPECT LIVE TICKETS ]
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
