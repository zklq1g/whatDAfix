'use client';

import { useEffect, useRef } from 'react';
import { Map as MapLibre, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl('https://unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl-worker.mjs');

export default function TestMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const style = key
      ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${key}`
      : 'https://tiles.openfreemap.org/styles/dark';

    console.log('MAPTILER KEY:', key ? 'SET' : 'NOT SET');
    console.log('Using style:', style);

    const map = new MapLibre({
      container: containerRef.current,
      style,
      center: [77.59, 12.97],
      zoom: 4,
    });

    map.on('load', () => console.log('MAP LOADED OK'));
    map.on('error', (e) => console.error('MAP ERROR:', e));

    return () => map.remove();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(0,0,0,0.8)', color: '#00ffcc',
        fontFamily: 'monospace', padding: '8px 12px', borderRadius: 4,
        zIndex: 999, fontSize: 12
      }}>
        MAP TEST PAGE — Check browser console for errors
      </div>
    </div>
  );
}
