"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ShieldAlert, Activity, AlertTriangle, CheckCircle2, MapPin, Wrench,
  Download, ChevronDown, Users, ArrowLeftRight, Eye, Radio,
  Cpu, ShieldCheck, X, Image as ImageIcon,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ticket {
  id: string;
  status: 'open' | 'wip' | 'resolved' | 'rejected';
  ai_confidence: number | null;
  ai_label: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  upvote_count: number;
  frt_deadline: string | null;
  sla_deadline: string | null;
  wip_started_at: string | null;
  resolved_at: string | null;
  created_at: string;
  category: string | null;
  severity: number | null;
  proof_of_work_hash: string | null;
  reporter?: { display_name: string } | null;
  worker?: { display_name: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getImageUrl = (path: string | null): string => {
  if (!path) return 'https://placehold.co/400x300/0D1922/1C303B?text=No+Image';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('civic-evidence').getPublicUrl(path);
  return data.publicUrl;
};

// ---------------------------------------------------------------------------
// Mock data — Hackathon fallback (used when DB is empty or offline)
// ---------------------------------------------------------------------------

const MOCK_TICKETS: Ticket[] = [
  {
    id: '8492',
    status: 'open',
    ai_confidence: 0.62,
    ai_label: 'Water Leak or Garbage?',
    before_image_url: null,
    after_image_url: null,
    upvote_count: 14,
    frt_deadline: new Date().toISOString(),
    sla_deadline: new Date().toISOString(),
    wip_started_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    category: null,
    severity: null,
    proof_of_work_hash: null,
    reporter: { display_name: 'Citizen_99' },
  },
  {
    id: '8493',
    status: 'open',
    ai_confidence: 0.45,
    ai_label: 'Pothole or Sinkhole?',
    before_image_url: null,
    after_image_url: null,
    upvote_count: 8,
    frt_deadline: new Date().toISOString(),
    sla_deadline: new Date().toISOString(),
    wip_started_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    category: null,
    severity: null,
    proof_of_work_hash: null,
    reporter: { display_name: 'Local_Res' },
  },
  {
    id: '8494',
    status: 'open',
    ai_confidence: 0.71,
    ai_label: 'Illegal Dumping',
    before_image_url: null,
    after_image_url: null,
    upvote_count: 22,
    frt_deadline: new Date().toISOString(),
    sla_deadline: new Date().toISOString(),
    wip_started_at: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
    category: null,
    severity: null,
    proof_of_work_hash: null,
    reporter: { display_name: 'Watcher_1' },
  },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminCommandCenter() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaBreachSimulated, setSlaBreachSimulated] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // ── Supabase fetch ──────────────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          reporter:profiles!tickets_created_by_fkey ( display_name ),
          worker:profiles!tickets_assigned_to_fkey ( display_name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data && data.length > 0 ? (data as Ticket[]) : MOCK_TICKETS);
    } catch {
      setTickets(MOCK_TICKETS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleSimulateBreach = () => {
    setDemoOpen(false);
    setSlaBreachSimulated(true);
    toast.error('⚠️ ALERT: 3 Tickets have breached 48-hour SLA. Auto-escalating to Commissioner.', {
      duration: 5000,
      style: { background: '#FF4D5A', color: '#fff', border: '1px solid #FF4D5A' },
    });
  };

  const handleEscalateToCrowd = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    toast.success('Pushed to 4 verified Power Users in 1km radius.', {
      style: { background: '#00D4FF', color: '#050A0F', fontWeight: 'bold' },
    });
  };

  const handleRouteManually = async (ticketId: string, dept: string) => {
    if (!dept) return;
    await supabase.from('tickets').update({ category: dept }).eq('id', ticketId);
    toast.info(`Ticket #${ticketId} routed to ${dept}.`);
  };

  // ── Computed metrics ─────────────────────────────────────────────────────
  const activeIssues = tickets.filter(t => t.status !== 'resolved' && t.status !== 'rejected').length;
  const aiFallbackQueue = tickets.filter(t => (t.ai_confidence ?? 1) < 0.8 && t.status === 'open');
  const criticalAlerts = slaBreachSimulated ? 3 : 0;

  const slaCompliance = slaBreachSimulated ? 72 : 88;
  const slaData = [
    { name: 'Compliance', value: slaCompliance },
    { name: 'Breach', value: 100 - slaCompliance },
  ];

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full bg-[#050A0F] flex items-center justify-center text-[#00D4FF] font-mono tracking-widest">
        INITIALIZING COMMAND CENTER...
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050A0F] text-[#E8F3F7] p-4 font-sans selection:bg-[#00D4FF] selection:text-[#050A0F]">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-6 border-b border-[#1C303B] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00D4FF] rounded flex items-center justify-center text-[#050A0F] font-bold text-sm">
            W
          </div>
          <span className="font-mono text-sm text-[#7E939E]">whatDAfix // ADMIN</span>
        </div>

        <h1 className="text-xl font-bold tracking-widest text-[#00D4FF] uppercase hidden md:block">
          Admin Command Center — Ward 42
        </h1>

        {/* Demo controls dropdown */}
        <div className="relative">
          <button
            onClick={() => setDemoOpen(v => !v)}
            className="flex items-center gap-2 bg-[#0D1922] border border-[#1C303B] px-4 py-2 rounded text-sm hover:border-[#00D4FF] transition-colors text-[#B5C6CE]"
          >
            Demo Controls <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {demoOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 mt-2 w-52 bg-[#0D1922] border border-[#1C303B] rounded shadow-xl z-50"
              >
                <button
                  onClick={handleSimulateBreach}
                  className="w-full text-left px-4 py-3 text-sm text-[#FF4D5A] hover:bg-[#1C303B] transition-colors flex items-center gap-2"
                >
                  <AlertTriangle size={14} /> Simulate SLA Breach
                </button>
                {slaBreachSimulated && (
                  <button
                    onClick={() => { setSlaBreachSimulated(false); setDemoOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-[#35D07F] hover:bg-[#1C303B] transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} /> Reset Demo State
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ─── Q1: System Health KPI row ─── */}
        <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Active Issues */}
          <div className="bg-[#0D1922] border border-[#1C303B] p-6 rounded-lg flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2 text-[#7E939E] text-xs uppercase tracking-widest">
              <Activity size={14} className="text-[#00D4FF]" /> Active Issues
            </div>
            <div className="font-mono text-5xl font-bold text-[#E8F3F7]">{activeIssues}</div>
            <div className="text-xs text-[#566B76] font-mono">12 added today · Real-time sync</div>
          </div>

          {/* SLA Compliance donut */}
          <div className="bg-[#0D1922] border border-[#1C303B] p-6 rounded-lg flex flex-col justify-between gap-4">
            <div className="flex items-center gap-2 text-[#7E939E] text-xs uppercase tracking-widest">
              <ShieldAlert size={14} className="text-[#35D07F]" /> SLA Compliance Rate
            </div>
            <div className="relative flex items-center justify-center h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={44}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill={slaBreachSimulated ? '#FF9F43' : '#35D07F'} />
                    <Cell fill="#1C303B" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span
                className="absolute font-mono text-2xl font-bold"
                style={{ color: slaBreachSimulated ? '#FF9F43' : '#35D07F' }}
              >
                {slaCompliance}%
              </span>
            </div>
            <div className="text-xs text-[#566B76] font-mono">Target: 85%</div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-[#0D1922] border border-[#1C303B] p-6 rounded-lg flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#7E939E] text-xs uppercase tracking-widest">
              <AlertTriangle
                size={14}
                className={criticalAlerts > 0 ? 'text-[#FF4D5A]' : 'text-[#566B76]'}
              />
              Critical Alerts
            </div>
            <motion.div
              className={`font-mono text-5xl font-bold ${
                criticalAlerts > 0 ? 'text-[#FF4D5A]' : 'text-[#566B76]'
              }`}
              animate={
                criticalAlerts > 0
                  ? { scale: [1, 1.08, 1], opacity: [1, 0.7, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {criticalAlerts}
            </motion.div>
            <div className="text-xs text-[#566B76] font-mono">
              {criticalAlerts > 0 ? 'Auto-escalating to Commissioner' : 'System Nominal'}
            </div>
            {criticalAlerts > 0 && (
              <div className="absolute inset-0 bg-[#FF4D5A] opacity-5 pointer-events-none rounded-lg" />
            )}
          </div>
        </section>

        {/* ─── Q2: AI Fallback Queue ─── */}
        <section className="bg-[#0D1922] border border-[#1C303B] rounded-lg flex flex-col overflow-hidden min-h-[380px]">
          <div className="px-4 py-3 border-b border-[#1C303B] bg-[#08121A] flex justify-between items-center shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF9F43] flex items-center gap-2">
              <Eye size={14} /> AI Fallback Queue
            </h2>
            <span className="text-[10px] font-mono text-[#566B76]">Confidence &lt; 80%</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {aiFallbackQueue.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[#566B76] text-sm py-12 font-mono"
                >
                  Queue Clear. AI handling all tickets.
                </motion.div>
              ) : (
                aiFallbackQueue.map(ticket => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -120, transition: { duration: 0.3 } }}
                    className="bg-[#050A0F] border border-[#1C303B] rounded-lg p-3 flex gap-3"
                  >
                    <img
                      src={getImageUrl(ticket.before_image_url)}
                      alt="Issue"
                      className="w-16 h-16 object-cover rounded border border-[#1C303B] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-mono text-[#00D4FF]">#{ticket.id.slice(0, 6)}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FF9F43]/10 text-[#FF9F43] rounded shrink-0">
                          {((ticket.ai_confidence ?? 0) * 100).toFixed(0)}% Conf
                        </span>
                      </div>
                      <p className="text-sm text-[#B5C6CE] truncate mt-1">
                        AI: {ticket.ai_label ?? 'Unknown'}
                      </p>
                      <p className="text-[11px] text-[#566B76] mt-0.5 flex items-center gap-1">
                        <Users size={10} /> {ticket.upvote_count} upvotes
                      </p>

                      <div className="flex gap-2 mt-3">
                        <select
                          defaultValue=""
                          onChange={e => handleRouteManually(ticket.id, e.target.value)}
                          className="bg-[#0D1922] border border-[#1C303B] text-xs text-[#B5C6CE] rounded px-2 py-1 outline-none focus:border-[#00D4FF] transition-colors"
                        >
                          <option value="" disabled>Route manually…</option>
                          <option value="PWD">PWD</option>
                          <option value="Sanitation">Sanitation</option>
                          <option value="Water Board">Water Board</option>
                        </select>
                        <button
                          onClick={() => handleEscalateToCrowd(ticket.id)}
                          className="flex-1 bg-[#00D4FF] text-[#050A0F] text-xs font-bold rounded px-2 py-1 hover:bg-[#00A8CC] transition-colors flex items-center justify-center gap-1"
                        >
                          <Users size={11} /> Escalate to Crowd
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── Q3: National Escalation Grid (Geo-Spatial Threat Map) ─── */}
        <LiveGeoMap
          tickets={tickets}
          slaBreachSimulated={slaBreachSimulated}
          onTicketSelect={setSelectedTicket}
        />

        {/* ─── Q4: Department Leaderboard ─── */}
        <section className="lg:col-span-2 bg-[#0D1922] border border-[#1C303B] rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1C303B] bg-[#08121A] flex justify-between items-center shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#B5C6CE] flex items-center gap-2">
              <ArrowLeftRight size={14} /> Department Accountability Leaderboard
            </h2>
            <button className="flex items-center gap-1.5 text-xs text-[#00D4FF] hover:underline font-mono">
              <Download size={12} /> Export for CPGRAMS
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#050A0F] text-[#566B76] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 font-mono">Rank</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Contractor</th>
                  <th className="p-4 font-mono text-right">Resolution Rate</th>
                  <th className="p-4 font-mono text-right">Avg SLA Time</th>
                  <th className="p-4 font-mono text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C303B]">
                <LeaderboardRow
                  rank={1}
                  dept="PWD (Roads)"
                  contractor="L&T Civic"
                  rate={94}
                  sla="12h"
                  color="#35D07F"
                  trend="↑ +3%"
                  trendColor="#35D07F"
                />
                <LeaderboardRow
                  rank={2}
                  dept="Sanitation"
                  contractor="UrbanClean Pvt"
                  rate={81}
                  sla="28h"
                  color="#FF9F43"
                  trend="→ Stable"
                  trendColor="#7E939E"
                />
                <LeaderboardRow
                  rank={3}
                  dept="Water Board"
                  contractor="AquaFix Ltd"
                  rate={slaBreachSimulated ? 32 : 45}
                  sla={slaBreachSimulated ? '72h+' : '54h'}
                  color="#FF4D5A"
                  trend={slaBreachSimulated ? '↓ −13%' : '↓ −5%'}
                  trendColor="#FF4D5A"
                />
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* ── Dark overlay behind slide-out panel ── */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setSelectedTicket(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Ticket Detail Slide-Out Panel ── */}
      <AnimatePresence>
        {selectedTicket && (
          <TicketDetailPanel
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            slaBreachSimulated={slaBreachSimulated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static geo data & ledger seeds
// ---------------------------------------------------------------------------

const MAP_NODES = [
  { id: 'delhi', name: 'New Delhi (Ward 12)', x: 48, y: 22, issues: 42, slaBreaches: 0, color: '#00D4FF' },
  { id: 'kolkata', name: 'Kolkata (Ward 4)', x: 75, y: 38, issues: 15, slaBreaches: 0, color: '#00D4FF' },
  { id: 'mumbai', name: 'Mumbai (Ward 8)', x: 30, y: 52, issues: 88, slaBreaches: 1, color: '#FF9F43' },
  { id: 'chennai', name: 'Chennai (Ward 19)', x: 56, y: 76, issues: 34, slaBreaches: 0, color: '#00D4FF' },
  // Ward 42 is our focal point for the demo
  { id: 'ward42', name: 'Bengaluru (Ward 42 - HQ)', x: 50, y: 68, issues: 142, slaBreaches: 0, color: '#00D4FF', isHQ: true }, 
];

const LIVE_LEDGER_MOCK = [
  { time: '10:42:01', hash: '0x8f4e...a2', action: 'GPS Verified', status: 'PASS' },
  { time: '10:42:15', hash: '0x2b1c...9f', action: 'Worker Geofence Entry', status: 'PASS' },
  { time: '10:43:02', hash: '0x99a4...c1', action: 'After-Photo Sealed', status: 'PASS' },
  { time: '10:44:10', hash: '0x11f2...b4', action: 'AI Confidence Check', status: 'PASS' },
];

// ---------------------------------------------------------------------------
// LiveGeoMap
// ---------------------------------------------------------------------------

interface LiveGeoMapProps {
  tickets: Ticket[];
  slaBreachSimulated: boolean;
  onTicketSelect: (t: Ticket) => void;
}

function LiveGeoMap({ tickets, slaBreachSimulated, onTicketSelect }: LiveGeoMapProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [ledger, setLedger] = useState(LIVE_LEDGER_MOCK);

  // Simulate live cryptographic ledger updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        hash: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 2)}`,
        action: ['Image Hash Sealed', 'GPS Spoofing Check', 'SLA Timer Sync', 'Crowd Escalation', 'EXIF Metadata Verified', 'Geofence Ping'][Math.floor(Math.random() * 6)],
        status: 'PASS'
      };
      setLedger(prev => [newLog, ...prev].slice(0, 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getNodeColor = (node: typeof MAP_NODES[0]) => {
    if (node.isHQ && slaBreachSimulated) return '#FF4D5A';
    return node.color;
  };

  const hqTicket = tickets.find(t => t.status !== 'rejected') ?? tickets[0] ?? null;

  return (
    <section className="bg-[#0D1922] border border-[#1C303B] rounded-lg flex flex-col overflow-hidden min-h-[380px]">
      {/* Header */}
      <div className="p-4 border-b border-[#1C303B] flex justify-between items-center bg-[#0A141C] z-10 shrink-0">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] flex items-center gap-2">
          <Radio size={14} className="animate-pulse" /> National Escalation Grid
        </h2>
        <span className="text-[10px] font-mono text-[#566B76]">Zero-Trust Geofence Active · 5 Wards</span>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 relative bg-[#050A0F] overflow-hidden">
        {/* Radar Grid Background */}
        <div className="absolute inset-0 opacity-[0.07]" 
          style={{ backgroundImage: 'radial-gradient(circle, #00D4FF 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
        </div>

        {/* SVG Map of India (Glowing Low-Poly Tactical Style) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Glow Filter for the map outline */}
            <filter id="neon-glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Radar Rings */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#00D4FF" strokeWidth="0.2" strokeOpacity="0.3" strokeDasharray="2 2" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="#00D4FF" strokeWidth="0.2" strokeOpacity="0.3" strokeDasharray="2 2" />
          
          {/* Animated Radar Sweep */}
          <line x1="50" y1="50" x2="50" y2="10" stroke="#00D4FF" strokeWidth="0.5" strokeOpacity="0.6">
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from="0 50 50" 
              to="360 50 50" 
              dur="4s" 
              repeatCount="indefinite" 
            />
          </line>

          {/* Low-Poly India Outline */}
          <path 
            d="M 45 10 L 50 8 L 55 10 L 60 15 L 65 18 L 70 25 L 75 30 L 80 35 L 85 40 L 82 45 L 85 50 L 80 55 L 75 60 L 70 65 L 65 75 L 60 85 L 55 95 L 50 90 L 45 80 L 40 70 L 35 65 L 30 60 L 25 55 L 20 50 L 25 45 L 30 40 L 25 35 L 30 30 L 35 25 L 40 20 Z" 
            fill="#00D4FF" 
            fillOpacity="0.05" 
            stroke="#00D4FF" 
            strokeWidth="1" 
            strokeOpacity="0.8"
            filter="url(#neon-glow)"
          />
        </svg>

        {/* Map Nodes */}
        {MAP_NODES.map((node) => {
          const color = getNodeColor(node);
          const isBreached = node.isHQ && slaBreachSimulated;
          const isHovered = activeNode === node.id;
          
          return (
            <motion.div 
              key={node.id}
              className="absolute cursor-pointer z-20"
              style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              onClick={() => {
                if (node.isHQ && hqTicket) {
                  onTicketSelect(hqTicket); 
                }
              }}
            >
              {/* Pulsing Ring */}
              <motion.div 
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: color }}
                animate={{ 
                  scale: isBreached ? [1, 3, 1] : [1, 1.8, 1], 
                  opacity: [0.6, 0, 0.6] 
                }}
                transition={{ repeat: Infinity, duration: isBreached ? 1 : 2, ease: 'easeOut' }}
              />
              
              {/* Core Dot */}
              <div 
                className="w-3 h-3 rounded-full border border-white/30 relative z-10 transition-transform duration-150"
                style={{ 
                  backgroundColor: color, 
                  boxShadow: `0 0 ${isHovered ? 16 : 8}px ${color}`,
                  transform: isHovered ? 'scale(1.4)' : 'scale(1)',
                }}
              />

              {/* Tactical Tooltip */}
              <AnimatePresence>
                {activeNode === node.id && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.92 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-56 bg-[#0D1922] border border-[#1C303B] p-3 rounded-lg shadow-2xl z-50 pointer-events-none"
                  >
                    <div className="flex justify-between items-center mb-2 border-b border-[#1C303B] pb-1">
                      <span className="text-[11px] font-bold text-[#E8F3F7]">{node.name}</span>
                      {node.isHQ && <span className="text-[8px] bg-[#00D4FF] text-[#050A0F] px-1.5 py-0.5 rounded font-bold">HQ</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="text-[#566B76]">Active Issues:</div>
                      <div className="text-[#E8F3F7] text-right">{node.issues}</div>
                      
                      <div className="text-[#566B76]">SLA Breaches:</div>
                      <div className={`text-right font-bold ${isBreached ? 'text-[#FF4D5A]' : 'text-[#35D07F]'}`}>
                        {isBreached ? '3 (CRITICAL)' : node.slaBreaches}
                      </div>

                      <div className="text-[#566B76]">Trust Score:</div>
                      <div className="text-[#35D07F] text-right flex items-center justify-end gap-1">
                        <ShieldCheck size={9} /> 98.4%
                      </div>
                    </div>
                    {node.isHQ && (
                      <div className="mt-2 pt-1 border-t border-[#1C303B] text-[9px] text-[#00D4FF] font-mono text-center font-bold animate-pulse">
                        [ CLICK TO INSPECT HQ TICKETS ]
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Live Cryptographic Ledger (The Zero-Trust Proof) */}
      <div className="h-[90px] border-t border-[#1C303B] bg-[#050A0F] p-2 overflow-hidden relative shrink-0">
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <ShieldCheck size={10} className="text-[#35D07F]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#35D07F]">Live Cryptographic Verification Ledger</span>
        </div>
        <div className="space-y-1 font-mono text-[10px]">
          <AnimatePresence mode="popLayout">
            {ledger.map((log) => (
              <motion.div 
                key={log.time + log.hash}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[#566B76]"
              >
                <span className="text-[#1C303B] shrink-0">[{log.time}]</span>
                <span className="text-[#00D4FF] shrink-0">{log.hash}</span>
                <span className="text-[#7E939E] truncate">{log.action}</span>
                <span className="ml-auto text-[#35D07F] flex items-center gap-0.5 shrink-0">
                  <CheckCircle2 size={9} /> {log.status}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-[#050A0F] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TicketDetailPanel  (slide-out from right)
// ---------------------------------------------------------------------------

interface TicketDetailPanelProps {
  ticket: Ticket;
  onClose: () => void;
  slaBreachSimulated: boolean;
}

function TicketDetailPanel({ ticket, onClose, slaBreachSimulated }: TicketDetailPanelProps) {
  const statusColors: Record<string, string> = {
    open: '#00D4FF', wip: '#FF9F43', resolved: '#35D07F', rejected: '#FF4D5A',
  };
  const statusColor = statusColors[ticket.status] ?? '#7E939E';

  const auditSteps = [
    {
      icon: <MapPin size={13} />, color: '#00D4FF', title: 'Reported by Citizen',
      time: new Date(ticket.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      detail: `User: ${ticket.reporter?.display_name ?? 'Anonymous'}\nGPS: 12.9716° N, 77.5946° E\nDevice: Android / iOS\nHash: 0x8f4e...a2`,
    },
    {
      icon: <Cpu size={13} />, color: '#B66CFF', title: 'AI Classification',
      time: '+43s',
      detail: `Label: ${ticket.ai_label ?? 'Unknown'}\nConfidence: ${((ticket.ai_confidence ?? 0) * 100).toFixed(0)}%\nAction: ${(ticket.ai_confidence ?? 1) < 0.8 ? 'Sent to Crowd Review' : 'Auto-routed to dept'}`,
    },
    {
      icon: <Wrench size={13} />, color: '#FF9F43', title: 'Worker Assigned',
      time: ticket.wip_started_at
        ? new Date(ticket.wip_started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Pending',
      detail: `Worker: ${ticket.worker?.display_name ?? 'Unassigned'}\nGeofence Entry: ${ticket.wip_started_at ? 'VERIFIED' : 'NOT YET'}`,
    },
    {
      icon: <AlertTriangle size={13} />,
      color: slaBreachSimulated ? '#FF4D5A' : '#1C303B',
      title: 'SLA Status',
      time: slaBreachSimulated ? 'BREACHED' : 'Within Limit',
      detail: slaBreachSimulated
        ? 'BREACH: Exceeded 48h limit\nPenalty: 5% Contractor Deduction\nAuto-escalated to Commissioner'
        : 'Resolution on track.\nNo penalties triggered.',
    },
    {
      icon: <CheckCircle2 size={13} />,
      color: ticket.status === 'resolved' ? '#35D07F' : '#1C303B',
      title: 'Resolution Evidence',
      time: ticket.resolved_at
        ? new Date(ticket.resolved_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Awaiting',
      detail: ticket.proof_of_work_hash
        ? `After-Photo Hash:\n${ticket.proof_of_work_hash}\nStatus: Cryptographically Sealed`
        : 'Resolution not yet submitted.',
    },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A141C] border-l border-[#1C303B] shadow-2xl z-50 flex flex-col"
    >
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-[#1C303B] bg-[#050A0F] flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-[#E8F3F7] font-mono">
              Ticket #{ticket.id.slice(0, 8).toUpperCase()}
            </h2>
            <span
              className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
              style={{ backgroundColor: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}
            >
              {ticket.status}
            </span>
          </div>
          <p className="text-xs text-[#7E939E] font-mono">{ticket.ai_label ?? 'Unknown Issue'} · {ticket.category}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#566B76] hover:text-[#E8F3F7] transition-colors mt-0.5"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Before / After evidence */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={11} className="text-[#566B76]" />
            <span className="text-[10px] font-bold text-[#566B76] uppercase tracking-widest">Visual Evidence</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'BEFORE', url: ticket.before_image_url },
              { label: 'AFTER',  url: ticket.after_image_url  },
            ].map(({ label, url }) => (
              <div key={label}>
                <div className="text-[9px] font-mono text-[#566B76] mb-1">{label}</div>
                <img
                  src={url
                    ? (url.startsWith('http') ? url : supabase.storage.from('civic-evidence').getPublicUrl(url).data.publicUrl)
                    : 'https://placehold.co/400x300/0D1922/1C303B?text=No+Image'
                  }
                  alt={label}
                  className="w-full h-28 object-cover rounded border border-[#1C303B]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI & telemetry row */}
        <div className="mx-5 mb-4 bg-[#050A0F] border border-[#1C303B] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={11} className="text-[#B66CFF]" />
            <span className="text-[10px] font-bold text-[#566B76] uppercase tracking-widest">AI & Telemetry</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-xs font-mono">
            {[
              { k: 'AI Label',    v: ticket.ai_label ?? '—',       c: '#E8F3F7' },
              { k: 'Confidence',  v: `${((ticket.ai_confidence ?? 0) * 100).toFixed(0)}%`, c: (ticket.ai_confidence ?? 1) < 0.8 ? '#FF9F43' : '#35D07F' },
              { k: 'Upvotes',     v: `${ticket.upvote_count} citizens`, c: '#00D4FF' },
              { k: 'Severity',    v: `${ticket.severity ?? '—'}/100`,    c: '#E8F3F7' },
            ].map(({ k, v, c }) => (
              <React.Fragment key={k}>
                <span className="text-[#566B76]">{k}</span>
                <span className="text-right" style={{ color: c }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Zero-Trust Audit trail (vertical timeline) */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={11} className="text-[#35D07F]" />
            <span className="text-[10px] font-bold text-[#566B76] uppercase tracking-widest">Zero-Trust Audit Trail</span>
          </div>
          <div className="relative pl-6 border-l-2 border-[#1C303B] space-y-5">
            {auditSteps.map((step, i) => (
              <div key={i} className="relative">
                <div
                  className="absolute -left-[25px] top-0 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-[#0A141C] shrink-0"
                  style={{ backgroundColor: step.color, color: step.color === '#1C303B' ? '#566B76' : '#050A0F' }}
                >
                  {step.icon}
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-[#E8F3F7]">{step.title}</span>
                  <span className="text-[10px] font-mono text-[#566B76]">{step.time}</span>
                </div>
                <pre className="text-[10px] font-mono text-[#7E939E] whitespace-pre-wrap leading-relaxed bg-[#050A0F] p-2 rounded border border-[#1C303B]">
                  {step.detail}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-[#1C303B] bg-[#050A0F] grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={onClose}
          className="py-2 text-xs font-bold bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/30 rounded hover:bg-[#FF4D5A]/20 transition-colors"
        >
          Reject & Fine
        </button>
        <button
          onClick={onClose}
          className="py-2 text-xs font-bold bg-[#35D07F] text-[#050A0F] rounded hover:bg-[#2BAF6A] transition-colors"
        >
          Verify & Close
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// LeaderboardRow
// ---------------------------------------------------------------------------

interface LeaderboardRowProps {
  rank: number;
  dept: string;
  contractor: string;
  rate: number;
  sla: string;
  color: string;
  trend: string;
  trendColor: string;
}

function LeaderboardRow({ rank, dept, contractor, rate, sla, color, trend, trendColor }: LeaderboardRowProps) {
  return (
    <tr className="hover:bg-[#08121A] transition-colors">
      <td className="p-4 font-mono text-[#566B76] text-sm">#{rank}</td>
      <td className="p-4 font-semibold text-[#E8F3F7]">{dept}</td>
      <td className="p-4 text-[#7E939E] text-sm">{contractor}</td>
      <td className="p-4 font-mono text-right font-bold" style={{ color }}>
        {rate}%
        <div className="w-full bg-[#1C303B] rounded-full h-1 mt-1" style={{ maxWidth: '80px', marginLeft: 'auto' }}>
          <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${rate}%`, backgroundColor: color }} />
        </div>
      </td>
      <td className="p-4 font-mono text-right text-[#7E939E] text-sm">{sla}</td>
      <td className="p-4 font-mono text-right text-xs" style={{ color: trendColor }}>{trend}</td>
    </tr>
  );
}
