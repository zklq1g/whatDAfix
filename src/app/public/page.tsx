"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, useSpring, useTransform } from 'framer-motion';
import { 
  Activity, ShieldCheck, TrendingUp, ChevronDown, ChevronUp, 
  AlertTriangle, CheckCircle2, Image as ImageIcon, Hash, Building2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- TYPES ---
export interface Ticket {
  id: string;
  location: { lat: number; lng: number } | any; // PostGIS or JSON
  category: string;
  status: 'open' | 'wip' | 'resolved' | 'rejected';
  before_image_url: string | null;
  after_image_url: string | null;
  assigned_to: string | null;
  sla_deadline: string;
  created_at: string;
  proof_of_work_hash: string | null;
}

// --- CONSTANTS & MOCK DATA ---
const CONTRACTORS: Record<string, string> = {
  'PWD': 'L&T Infrastructure',
  'Sanitation': 'Urban Cleaners Pvt Ltd',
  'Water Board': 'AquaFix Solutions',
  'Electricity': 'Bescom Grid Ops'
};

const generateMockTickets = (): Ticket[] => {
  const statuses: Ticket['status'][] = ['open', 'wip', 'resolved'];
  const categories = ['Pothole', 'Garbage Dump', 'Water Leak', 'Broken Streetlight'];
  const depts = Object.keys(CONTRACTORS);
  const mocks: Ticket[] = [];
  
  for (let i = 0; i < 35; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const dept = depts[Math.floor(Math.random() * depts.length)];
    mocks.push({
      id: `PUB-${1000 + i}`,
      location: { lat: 12.9716 + (Math.random() - 0.5) * 0.05, lng: 77.5946 + (Math.random() - 0.5) * 0.05 },
      category: categories[Math.floor(Math.random() * categories.length)],
      status,
      before_image_url: 'https://placehold.co/400x300/0D1922/1C303B?text=Before',
      after_image_url: status === 'resolved' ? 'https://placehold.co/400x300/0D1922/00FF9D?text=After' : null,
      assigned_to: dept,
      sla_deadline: new Date(Date.now() + (Math.random() - 0.5) * 100000000).toISOString(),
      created_at: new Date(Date.now() - Math.random() * 100000000).toISOString(),
      proof_of_work_hash: status === 'resolved' ? `0x${Math.random().toString(16).substr(2, 8)}` : null
    });
  }
  return mocks;
};

// --- HELPERS ---
export const getImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('civic-evidence').getPublicUrl(path);
  return data.publicUrl;
};

// Dynamically import Map to avoid SSR window errors
const MapCore = dynamic(() => import('./MapCore'), { ssr: false });

export default function PublicDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, location, category, status, before_image_url, after_image_url, assigned_to, sla_deadline, created_at, proof_of_work_hash')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setTickets(generateMockTickets()); // Fallback for demo
      } else {
        setTickets(data as Ticket[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const roiValue = resolvedCount * 5000; // ₹5,000 saved per verified fix

  if (loading) return <div className="h-screen w-full bg-[#050A0F] flex items-center justify-center text-[#00E5FF] font-mono">DECRYPTING PUBLIC LEDGER...</div>;

  return (
    // Root must NOT have overflow-hidden — that clips the WebGL canvas!
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: '#050A0F' }}>
      
      {/* 1. The Map — fullscreen background layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapCore tickets={tickets} />
      </div>

      {/* 2. All UI overlays — sit on top of the map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

        {/* Top Left HUD */}
        <div style={{ pointerEvents: 'auto' }} className="absolute top-6 left-6 bg-[#0D1922]/80 backdrop-blur-md border border-[#1C303B] p-4 rounded-lg shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-[#00E5FF] rounded flex items-center justify-center text-[#050A0F] font-bold">W</div>
            <span className="text-white font-bold tracking-wide">whatDAfix <span className="text-[#00E5FF]">Public</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <Activity size={12} className="text-[#00FF9D] animate-pulse" /> LIVE CITY HEALTH: {tickets.length} Active Nodes
          </div>
        </div>

        {/* Top Right ROI Tracker */}
        <div style={{ pointerEvents: 'auto' }}>
          <ROITracker value={roiValue} resolvedCount={resolvedCount} />
        </div>

        {/* Bottom Left Leaderboard */}
        <div style={{ pointerEvents: 'auto' }}>
          <Leaderboard tickets={tickets} isOpen={isLeaderboardOpen} toggle={() => setIsLeaderboardOpen(!isLeaderboardOpen)} />
        </div>

      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function ROITracker({ value, resolvedCount }: { value: number, resolvedCount: number }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => `₹ ${Math.round(current).toLocaleString('en-IN')}`);

  useEffect(() => { spring.set(value); }, [value, spring]);

  return (
    <div className="absolute top-6 right-6 z-[1000] bg-[#0D1922]/80 backdrop-blur-md border border-[#1C303B] p-5 rounded-lg shadow-2xl text-right min-w-[240px]">
      <div className="flex items-center justify-end gap-2 text-xs text-gray-400 uppercase tracking-widest mb-2">
        Taxpayer Money Saved <TrendingUp size={14} className="text-[#00FF9D]" />
      </div>
      <motion.div className="text-3xl font-bold text-[#00FF9D] font-mono mb-1 drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">
        {display}
      </motion.div>
      <div className="text-[10px] text-gray-500 font-mono">
        Via {resolvedCount} early reports & verified fixes
      </div>
    </div>
  );
}

function Leaderboard({ tickets, isOpen, toggle }: { tickets: Ticket[], isOpen: boolean, toggle: () => void }) {
  const stats = useMemo(() => {
    const deptStats: Record<string, { total: number, resolved: number }> = {};
    tickets.forEach(t => {
      const dept = t.assigned_to || 'Unassigned';
      if (!deptStats[dept]) deptStats[dept] = { total: 0, resolved: 0 };
      deptStats[dept].total++;
      if (t.status === 'resolved') deptStats[dept].resolved++;
    });
    
    return Object.entries(deptStats).map(([dept, data]) => ({
      dept,
      contractor: CONTRACTORS[dept] || 'Unknown Corp',
      rate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0
    })).sort((a, b) => b.rate - a.rate);
  }, [tickets]);

  return (
    <div className="absolute bottom-6 left-6 z-[1000] w-80 bg-[#0D1922]/80 backdrop-blur-md border border-[#1C303B] rounded-lg shadow-2xl overflow-hidden">
      <button onClick={toggle} className="w-full p-4 flex justify-between items-center hover:bg-[#1C303B]/30 transition-colors">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 size={14} className="text-[#00E5FF]" /> Department Accountability
        </span>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-3 text-[10px] text-gray-500 uppercase font-bold mb-2 px-1">
            <span>Department</span>
            <span>Contractor</span>
            <span className="text-right">Rate</span>
          </div>
          {stats.map((s, i) => {
            let color = 'text-gray-300';
            if (i === 0) color = 'text-[#00FF9D]';
            if (i === stats.length - 1) color = 'text-[#FF3366]';

            return (
              <div key={s.dept} className="grid grid-cols-3 text-xs items-center bg-[#050A0F]/50 p-2 rounded border border-[#1C303B]">
                <span className="font-bold text-white truncate">{s.dept}</span>
                <span className="text-gray-400 text-[10px] truncate">{s.contractor}</span>
                <span className={`text-right font-mono font-bold ${color}`}>{s.rate}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
