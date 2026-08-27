"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  ShieldAlert, Activity, AlertTriangle, CheckCircle2, MapPin, Wrench,
  Download, ChevronDown, Users, ArrowLeftRight, Eye, Hash, Clock,
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
  created_at: string;
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
    created_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
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
    created_at: new Date().toISOString(),
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);

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

        {/* ─── Q3: Zero-Trust Audit Trail ─── */}
        <section className="bg-[#0D1922] border border-[#1C303B] rounded-lg flex flex-col overflow-hidden min-h-[380px]">
          <div className="px-4 py-3 border-b border-[#1C303B] bg-[#08121A] flex justify-between items-center shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#35D07F] flex items-center gap-2">
              <Hash size={14} /> Zero-Trust Audit Trail
            </h2>
            <span className="text-[10px] font-mono text-[#566B76]">Ticket #8492</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 overflow-x-auto">
            <div className="flex items-start w-full max-w-2xl relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-5 right-5 h-px bg-[#1C303B]" />

              <AuditNode
                icon={<MapPin size={16} />}
                color="#00D4FF"
                title="Reported"
                time="10:42 AM"
                tooltip={`GPS: 12.9716° N, 77.5946° E\nDevice: iPhone 13\nHash: 0x8f4e...a2`}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              <AuditNode
                icon={<Wrench size={16} />}
                color="#FF9F43"
                title="WIP Started"
                time="11:15 AM"
                tooltip={`Worker ID: W-992\nGeofence: VERIFIED\nEntry Hash: 0x2b1c...9f`}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />

              {/* Conditional SLA breach node */}
              <AnimatePresence>
                {slaBreachSimulated && (
                  <motion.div
                    key="breach"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex-1 flex flex-col items-center relative z-10"
                  >
                    <motion.div
                      className="w-10 h-10 rounded-full bg-[#FF4D5A] flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,77,90,0.5)]"
                      animate={{ boxShadow: ['0 0 8px #FF4D5A', '0 0 22px #FF4D5A', '0 0 8px #FF4D5A'] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <AlertTriangle size={16} />
                    </motion.div>
                    <div className="mt-3 text-center">
                      <div className="text-[11px] font-bold text-[#FF4D5A] uppercase">Delayed</div>
                      <div className="text-[10px] font-mono text-[#7E939E]">SLA Exceeded</div>
                      <div className="text-[10px] font-mono text-[#FF4D5A]">+4 Hours</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AuditNode
                icon={<CheckCircle2 size={16} />}
                color={slaBreachSimulated ? '#1C303B' : '#35D07F'}
                title="Resolved"
                time={slaBreachSimulated ? 'Pending…' : '02:30 PM'}
                tooltip={`After Photo Hash:\n0x99a4...c1\nStatus: Cryptographically Sealed`}
                active={!slaBreachSimulated}
                activeTooltip={activeTooltip}
                setActiveTooltip={setActiveTooltip}
              />
            </div>
          </div>

          {/* Audit metadata strip */}
          <div className="px-4 py-3 border-t border-[#1C303B] bg-[#08121A] grid grid-cols-3 gap-2 shrink-0">
            {[
              { label: 'EXIF Match', value: 'PASS', ok: true },
              { label: 'Geofence', value: slaBreachSimulated ? 'WARN' : 'PASS', ok: !slaBreachSimulated },
              { label: 'Hash Sealed', value: slaBreachSimulated ? 'PENDING' : 'PASS', ok: !slaBreachSimulated },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-[10px] text-[#566B76] font-mono uppercase">{item.label}</div>
                <div
                  className="text-xs font-bold font-mono mt-0.5"
                  style={{ color: item.ok ? '#35D07F' : '#FF9F43' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AuditNodeProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  time: string;
  tooltip: string;
  active?: boolean;
  activeTooltip: string | null;
  setActiveTooltip: (v: string | null) => void;
}

function AuditNode({
  icon, color, title, time, tooltip, active = true,
  activeTooltip, setActiveTooltip,
}: AuditNodeProps) {
  const isHovered = activeTooltip === title;

  return (
    <div
      className="flex-1 flex flex-col items-center relative cursor-pointer z-10"
      onMouseEnter={() => active && setActiveTooltip(title)}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: active ? color : '#1C303B',
          color: active ? '#050A0F' : '#566B76',
          boxShadow: active ? `0 0 12px ${color}55` : 'none',
        }}
      >
        {icon}
      </div>
      <div className="mt-3 text-center">
        <div
          className="text-[11px] font-bold uppercase tracking-wide"
          style={{ color: active ? color : '#566B76' }}
        >
          {title}
        </div>
        <div className="text-[10px] font-mono text-[#566B76] flex items-center gap-1 justify-center mt-0.5">
          <Clock size={8} /> {time}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && active && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute top-16 bg-[#0D1922] border border-[#1C303B] p-3 rounded-lg shadow-2xl z-50 w-48 pointer-events-none"
          >
            <pre className="text-[10px] font-mono text-[#00D4FF] whitespace-pre-wrap leading-relaxed">
              {tooltip}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        <div
          className="w-full bg-[#1C303B] rounded-full h-1 mt-1"
          style={{ maxWidth: '80px', marginLeft: 'auto' }}
        >
          <div
            className="h-1 rounded-full transition-all duration-700"
            style={{ width: `${rate}%`, backgroundColor: color }}
          />
        </div>
      </td>
      <td className="p-4 font-mono text-right text-[#7E939E] text-sm">{sla}</td>
      <td className="p-4 font-mono text-right text-xs" style={{ color: trendColor }}>{trend}</td>
    </tr>
  );
}
