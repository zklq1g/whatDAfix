import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibre, Popup, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Ticket } from './page';

// Worker file is copied to public/ so it's served from same origin — no CORS, no Turbopack bundling issues.
// public/maplibre-gl-worker.mjs → http://localhost:3000/maplibre-gl-worker.mjs
setWorkerUrl('/maplibre-gl-worker.mjs');

const STATUS_COLORS: Record<string, string> = {
  open: '#FF3366',
  wip: '#FFB020',
  resolved: '#00FF9D',
  rejected: '#64748B',
  cluster: '#00E5FF',
};

// Map ticket ID prefix to City and State
const PREFIX_MAP: Record<string, { city: string; state: string }> = {
  DEL: { city: 'Delhi', state: 'Delhi' },
  NDL: { city: 'New Delhi', state: 'Delhi' },
  MUM: { city: 'Mumbai', state: 'Maharashtra' },
  PNE: { city: 'Pune', state: 'Maharashtra' },
  NGP: { city: 'Nagpur', state: 'Maharashtra' },
  NSK: { city: 'Nashik', state: 'Maharashtra' },
  BLR: { city: 'Bangalore', state: 'Karnataka' },
  MYS: { city: 'Mysore', state: 'Karnataka' },
  HUB: { city: 'Hubli', state: 'Karnataka' },
  CHN: { city: 'Chennai', state: 'Tamil Nadu' },
  CBE: { city: 'Coimbatore', state: 'Tamil Nadu' },
  MDU: { city: 'Madurai', state: 'Tamil Nadu' },
  TRC: { city: 'Trichy', state: 'Tamil Nadu' },
  HYD: { city: 'Hyderabad', state: 'Telangana' },
  VSK: { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  VIJ: { city: 'Vijayawada', state: 'Andhra Pradesh' },
  TPT: { city: 'Tirupati', state: 'Andhra Pradesh' },
  AMD: { city: 'Ahmedabad', state: 'Gujarat' },
  SRT: { city: 'Surat', state: 'Gujarat' },
  VDR: { city: 'Vadodara', state: 'Gujarat' },
  RJK: { city: 'Rajkot', state: 'Gujarat' },
  GND: { city: 'Gandhinagar', state: 'Gujarat' },
  KOL: { city: 'Kolkata', state: 'West Bengal' },
  DGP: { city: 'Durgapur', state: 'West Bengal' },
  SLG: { city: 'Siliguri', state: 'West Bengal' },
  ASN: { city: 'Asansol', state: 'West Bengal' },
  CHD: { city: 'Chandigarh', state: 'Chandigarh' },
  LDH: { city: 'Ludhiana', state: 'Punjab' },
  AMR: { city: 'Amritsar', state: 'Punjab' },
  JPR: { city: 'Jaipur', state: 'Rajasthan' },
  JOD: { city: 'Jodhpur', state: 'Rajasthan' },
  LKO: { city: 'Lucknow', state: 'Uttar Pradesh' },
  KNP: { city: 'Kanpur', state: 'Uttar Pradesh' },
  IDR: { city: 'Indore', state: 'Madhya Pradesh' },
  BHO: { city: 'Bhopal', state: 'Madhya Pradesh' },
  RPR: { city: 'Raipur', state: 'Chhattisgarh' },
  KOC: { city: 'Kochi', state: 'Kerala' },
  TVM: { city: 'Trivandrum', state: 'Kerala' },
  GOA: { city: 'Goa', state: 'Goa' },
  GHY: { city: 'Guwahati', state: 'Assam' },
  PAT: { city: 'Patna', state: 'Bihar' },
  BBS: { city: 'Bhubaneswar', state: 'Odisha' },
};

export const CONTRACTORS: Record<string, string> = {
  // Same contractor mappings
  'PWD Delhi': 'PWD Infra',
  'Delhi Jal Board': 'DJB Water',
  'BSES Rajdhani': 'BSES Power',
  'MCG Gurugram': 'MCG Sanitation',
  'BMC Water Dept': 'BMC Water',
  'BMC Solid Waste': 'BMC Swachhata',
  'PMC Roads': 'PMC Highway',
  'MSEDCL Nagpur': 'MSEDCL Power',
  'BBMP Roads': 'BBMP Infra',
  'BWSSB': 'BWSSB Water',
  'BESCOM': 'BESCOM Power',
  'MCC Health Dept': 'MCC Health',
  'HDMC': 'HDMC Civic',
  'CMWSSB': 'CMWSSB Water',
  'TANGEDCO': 'TANGEDCO Power',
  'Madurai Corp': 'MDU Civic',
  'Trichy Corp': 'TRC Civic',
  'HMWSSB': 'HMWSSB Water',
  'GHMC Roads': 'GHMC Infra',
  'GVMC': 'GVMC Sanitation',
  'APSPDCL': 'APSPDCL Power',
  'AMC Solid Waste': 'AMC Health',
  'SMC Water': 'SMC Water Dept',
  'MGVCL': 'MGVCL Power',
  'RMC Roads': 'RMC Highway',
  'KMC Water': 'KMC Water Dept',
  'KMC Drainage': 'KMC Sewerage',
  'WBSEDCL': 'WBSEDCL Power',
  'PHED Odisha (Water Wing)': 'PHED Water',
  'Bhubaneswar Smart City Ltd (Roads)': 'BSCL Roads',
};

export default function MapCore({ tickets }: { tickets: Ticket[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<typeof MapLibre> | null>(null);
  const cameraStateRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Compute GeoJSON Features
  const features = React.useMemo(() => {
    const featureList: any[] = [];
    const stateMap = new Map<string, { latSum: number, lngSum: number, count: number }>();
    const cityMap = new Map<string, { latSum: number, lngSum: number, count: number, state: string }>();

    tickets.forEach(t => {
      if (!t.location?.lat || !t.location?.lng) return;
      
      const prefix = t.id.substring(0, 3);
      const locInfo = PREFIX_MAP[prefix] || { city: 'Unknown', state: 'Unknown' };
      
      // Individual Ticket Feature
      featureList.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [t.location.lng, t.location.lat] },
        properties: {
          level: 'ticket',
          id: t.id,
          color: STATUS_COLORS[t.status] || '#FFB020',
          ticketData: JSON.stringify(t)
        }
      });

      // Accumulate for City
      const cityKey = locInfo.city;
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, { latSum: 0, lngSum: 0, count: 0, state: locInfo.state });
      }
      const c = cityMap.get(cityKey)!;
      c.latSum += t.location.lat;
      c.lngSum += t.location.lng;
      c.count += 1;

      // Accumulate for State
      const stateKey = locInfo.state;
      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, { latSum: 0, lngSum: 0, count: 0 });
      }
      const s = stateMap.get(stateKey)!;
      s.latSum += t.location.lat;
      s.lngSum += t.location.lng;
      s.count += 1;
    });

    // Add City Features
    cityMap.forEach((data, city) => {
      featureList.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [data.lngSum / data.count, data.latSum / data.count] },
        properties: {
          level: 'city',
          label: `${city}: ${data.count} Issue${data.count > 1 ? 's' : ''}`,
          count: data.count
        }
      });
    });

    // Add State Features
    stateMap.forEach((data, state) => {
      featureList.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [data.lngSum / data.count, data.latSum / data.count] },
        properties: {
          level: 'state',
          label: `${state}: ${data.count} Issue${data.count > 1 ? 's' : ''}`,
          count: data.count
        }
      });
    });

    return { type: 'FeatureCollection', features: featureList };
  }, [tickets]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    try {
      const map = new MapLibre({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [80.0, 22.5],
        zoom: 3.8,
        pitch: 0,
        attributionControl: false,
      });
      
      map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');

      mapRef.current = map;

      map.on('load', () => {
        // Switch to globe projection
        map.setProjection({ type: 'globe' } as any);

        // Add Source
        map.addSource('civic-issues', {
          type: 'geojson',
          data: features as any,
        });

        // Layer 1: State glow/labels (Zoom 0-5)
        map.addLayer({
          id: 'state-glow',
          type: 'circle',
          source: 'civic-issues',
          filter: ['all', ['==', 'level', 'state']],
          maxzoom: 5.5,
          paint: {
            'circle-color': '#00E5FF',
            'circle-radius': ['+', 15, ['*', ['get', 'count'], 2]],
            'circle-opacity': 0.3,
            'circle-blur': 1
          }
        });

        map.addLayer({
          id: 'state-label',
          type: 'symbol',
          source: 'civic-issues',
          filter: ['all', ['==', 'level', 'state']],
          maxzoom: 5.5,
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#00E5FF',
            'text-halo-color': '#050A0F',
            'text-halo-width': 2
          }
        });

        // Layer 2: City glow/labels (Zoom 5.5-8.5)
        map.addLayer({
          id: 'city-glow',
          type: 'circle',
          source: 'civic-issues',
          filter: ['all', ['==', 'level', 'city']],
          minzoom: 5.5,
          maxzoom: 8.5,
          paint: {
            'circle-color': '#FFB020',
            'circle-radius': ['+', 12, ['*', ['get', 'count'], 1.5]],
            'circle-opacity': 0.4,
            'circle-blur': 0.8
          }
        });

        map.addLayer({
          id: 'city-label',
          type: 'symbol',
          source: 'civic-issues',
          filter: ['all', ['==', 'level', 'city']],
          minzoom: 5.5,
          maxzoom: 8.5,
          layout: {
            'text-field': ['get', 'label'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#FFB020',
            'text-halo-color': '#050A0F',
            'text-halo-width': 2
          }
        });

        // Layer 3: Individual Tickets (Zoom > 8.5)
        map.addLayer({
          id: 'ticket-points',
          type: 'circle',
          source: 'civic-issues',
          filter: ['all', ['==', 'level', 'ticket']],
          minzoom: 8.5,
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#050A0F'
          }
        });

        let activePopup: InstanceType<typeof Popup> | null = null;

        map.on('click', 'ticket-points', (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const ticketStr = feature.properties.ticketData;
          if (!ticketStr) return;
          
          const ticket = JSON.parse(ticketStr);
          const coordinates = feature.geometry.coordinates.slice();

          if (!cameraStateRef.current) {
            cameraStateRef.current = {
              center: map.getCenter(),
              zoom: map.getZoom(),
              pitch: map.getPitch(),
              bearing: map.getBearing()
            };
          }

          map.flyTo({
            center: coordinates,
            zoom: Math.max(map.getZoom(), 16),
            pitch: 45,
            bearing: -17.6,
            duration: 1500,
            essential: true
          });

          const contractorName = ticket.assigned_to 
            ? (CONTRACTORS[ticket.assigned_to] || ticket.assigned_to)
            : 'Unknown Contractor';

          const timeStr = new Date(ticket.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          });
          
          const popupHtml = `
            <div style="background:#0D1922; border: 1px solid #1C303B; border-radius: 4px; padding: 12px; width: 280px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); font-family: monospace;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #1C303B; padding-bottom:8px">
                <div>
                  <div style="color:#00E5FF; font-size:10px; text-transform:uppercase; letter-spacing:1px">TICKET // ${ticket.id}</div>
                  <div style="color:#fff; font-size:14px; font-weight:bold; margin-top:2px">${ticket.category}</div>
                </div>
                <div style="text-align:right">
                  <div style="color:${STATUS_COLORS[ticket.status] || '#fff'}; font-size:10px; text-transform:uppercase; border:1px solid ${STATUS_COLORS[ticket.status] || '#fff'}; padding:2px 6px; border-radius:2px; display:inline-block">
                    ${ticket.status}
                  </div>
                </div>
              </div>
              ${ticket.citizen_report ? `
              <div style="background:#050A0F; padding:8px; border-radius:4px; border:1px solid #1C303B; margin-bottom:8px">
                <div style="font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Citizen Report</div>
                <div style="font-size:11px; color:#ddd; line-height:1.4">
                  "${ticket.citizen_report}"
                </div>
                ${ticket.contractor_response ? `
                <div style="margin-top:6px; padding-top:6px; border-top:1px dashed #1C303B">
                  <div style="font-size:9px; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Contractor Update</div>
                  <div style="font-size:11px; color:#00E5FF; line-height:1.4">
                    > ${ticket.contractor_response}
                  </div>
                </div>
                ` : ''}
              </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; font-size:10px; color:#555">
                <div>ASSIGNEE: <span style="color:#888">${contractorName}</span></div>
                <div>LOG: <span style="color:#888">${timeStr}</span></div>
              </div>
              ${ticket.proof_of_work_hash ? `
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid #1C303B; font-size:9px; color:#00FF9D; word-break:break-all">
                  ✓ HASH: ${ticket.proof_of_work_hash.substring(0,24)}...
                </div>
              ` : ''}
            </div>
          `;

          if (activePopup) activePopup.remove();

          activePopup = new Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '320px',
            className: 'tactical-popup'
          })
          .setLngLat(coordinates)
          .setHTML(popupHtml)
          .addTo(map);

          activePopup.on('close', () => {
            if (cameraStateRef.current) {
              map.flyTo({
                ...cameraStateRef.current,
                duration: 1500,
                essential: true
              });
              cameraStateRef.current = null;
            }
          });
        });

        map.on('mouseenter', 'ticket-points', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'ticket-points', () => { map.getCanvas().style.cursor = ''; });
        
        map.on('mouseenter', 'state-label', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'state-label', () => { map.getCanvas().style.cursor = ''; });
        map.on('click', 'state-label', (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const coordinates = e.features[0].geometry.coordinates.slice();
          map.flyTo({ center: coordinates, zoom: 6.5, duration: 1500 });
        });

        map.on('mouseenter', 'city-label', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'city-label', () => { map.getCanvas().style.cursor = ''; });
        map.on('click', 'city-label', (e: any) => {
          if (!e.features || e.features.length === 0) return;
          const coordinates = e.features[0].geometry.coordinates.slice();
          map.flyTo({ center: coordinates, zoom: 9.5, duration: 1500 });
        });

      });
    } catch (err: any) {
      setMapError(err.message);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const updateSource = () => {
      if (map.getSource('civic-issues')) {
        (map.getSource('civic-issues') as any).setData(features);
      }
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once('styledata', updateSource);
    }
  }, [features]);

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#050A0F' }}>
      <style>{`
        .tactical-popup .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
        }
        .tactical-popup .maplibregl-popup-tip {
          border-top-color: #1C303B !important;
          border-bottom-color: #1C303B !important;
        }
        .tactical-popup .maplibregl-popup-close-button {
          color: #555;
          right: 4px;
          top: 4px;
          font-size: 16px;
          outline: none;
        }
        .tactical-popup .maplibregl-popup-close-button:hover {
          color: #FF3366;
          background: transparent;
        }
      `}</style>
      
      {mapError && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/80 text-red-500 font-mono p-8 text-center">
          <div>
            <h3 className="text-xl font-bold mb-2">MAP INITIALIZATION FAILED</h3>
            <p>{mapError}</p>
          </div>
        </div>
      )}

      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
