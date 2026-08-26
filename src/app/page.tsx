"use client"

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Camera, HardHat, ShieldCheck, Map, ArrowRight, Activity } from "lucide-react"
import { Logo } from "@/components/Logo"


const portals = [
  {
    tier: "Tier 1",
    title: "Citizen Portal",
    subtitle: "Report Civic Issues",
    description:
      "Take a live photo, lock your GPS, and submit a tamper-proof civic report in under 60 seconds. Zero gallery uploads. Zero spam.",
    href: "/citizen",
    icon: Camera,
    accent: "#35D07F",      // green — citizen action
    accentBg: "#35D07F18",
    badge: "PUBLIC ACCESS",
    badgeColor: "#35D07F",
    stat: "Active Right Now",
    statValue: "1,284 Citizens",
  },
  {
    tier: "Tier 2",
    title: "Worker Portal",
    subtitle: "Execute & Prove Work",
    description:
      "Your task queue. Anti-spoofing GPS geofencing enforces physical site visits. Upload 'After' evidence to close tickets. SLA is always live.",
    href: "/worker",
    icon: HardHat,
    accent: "#FF9F43",      // orange — urgency/work
    accentBg: "#FF9F4318",
    badge: "DEPARTMENT LOGIN",
    badgeColor: "#FF9F43",
    stat: "SLA Breaching",
    statValue: "5 Tickets",
  },
  {
    tier: "Tier 3",
    title: "Admin Command Center",
    subtitle: "Oversight & Escalation",
    description:
      "The God View. Monitor dynamic SLAs, manage AI fallback queues, resolve edge cases, and push critical data to CPGRAMS via REST APIs.",
    href: "/admin",
    icon: ShieldCheck,
    accent: "#B66CFF",      // violet — AI/system authority
    accentBg: "#B66CFF18",
    badge: "ADMIN ONLY",
    badgeColor: "#B66CFF",
    stat: "AI Fallbacks Pending",
    statValue: "3 Tickets",
  },
  {
    tier: "Tier 4",
    title: "Public Dashboard",
    subtitle: "Radical Transparency",
    description:
      "Live city heatmap of every civic issue — red for unresolved, green for fixed. Department leaderboard. Taxpayer ROI tracker. Open to all.",
    href: "/map",
    icon: Map,
    accent: "#00D4FF",      // cyan — brand/public
    accentBg: "#00D4FF18",
    badge: "LIVE · PUBLIC",
    badgeColor: "#00D4FF",
    stat: "Issues Resolved",
    statValue: "891 This Month",
  },
]

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#050A0F] text-[#E8F3F7] flex flex-col">
      {/* ── Top bar ─────────────────────────────────────── */}
      <nav className="border-b border-[#1C303B] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[#566B76] text-xs font-mono-tech hidden sm:inline">
            CIVIC ACCOUNTABILITY ENGINE v1.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3 w-3 text-[#35D07F] animate-pulse" />
          <span className="text-[#35D07F] text-xs font-mono-tech">SYSTEM LIVE</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 border border-[#1C303B] bg-[#08121A] rounded-full px-4 py-1.5 text-xs text-[#7E939E] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] animate-pulse inline-block" />
            End-to-End Municipal Accountability Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-4">
            Stop reporting into a{" "}
            <span className="text-[#FF4D5A]">black hole.</span>
            <br />
            <span className="text-[#00D4FF]">Force accountability.</span>
          </h1>

          <p className="max-w-xl mx-auto text-[#7E939E] text-base md:text-lg leading-relaxed">
            Cryptographic proof-of-work. Anti-spoofing GPS geofencing.
            AI-powered issue routing. Real-time SLA enforcement.
            <br />
            One platform. Four tiers.
          </p>
        </motion.div>

        {/* Live stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10"
        >
          {[
            { label: "Active Tickets", value: "142" },
            { label: "Resolved This Month", value: "891" },
            { label: "SLA Compliance", value: "94.2%" },
            { label: "Avg Response Time", value: "3.4 hrs" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-[#00D4FF] font-mono-tech">{s.value}</div>
              <div className="text-xs text-[#566B76] mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Portal Cards ────────────────────────────────── */}
      <section className="flex-1 px-4 sm:px-6 pb-16 max-w-6xl mx-auto w-full">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {portals.map((portal) => {
            const Icon = portal.icon
            return (
              <motion.div key={portal.href} variants={cardVariants}>
                <Link href={portal.href} className="group block h-full">
                  <div
                    className="h-full border border-[#1C303B] bg-[#0D1922] rounded-xl p-6 
                    transition-all duration-200 
                    hover:border-opacity-100 hover:bg-[#111F29]"
                    style={{
                      // subtle glow on hover via box shadow — applied via inline style
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${portal.accent}40, 0 8px 32px ${portal.accent}10`
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = `${portal.accent}50`
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                      ;(e.currentTarget as HTMLDivElement).style.borderColor = "#1C303B"
                    }}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className="p-2.5 rounded-lg"
                        style={{ background: portal.accentBg }}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: portal.accent }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-mono-tech font-semibold tracking-widest px-2.5 py-1 rounded-full border"
                        style={{
                          color: portal.badgeColor,
                          borderColor: `${portal.badgeColor}40`,
                          background: `${portal.badgeColor}10`,
                        }}
                      >
                        {portal.badge}
                      </span>
                    </div>

                    {/* Text */}
                    <div className="mb-5">
                      <p className="text-[10px] font-mono-tech text-[#566B76] tracking-widest uppercase mb-1">
                        {portal.tier}
                      </p>
                      <h2 className="text-lg font-bold text-[#E8F3F7] mb-1">{portal.title}</h2>
                      <p
                        className="text-sm font-semibold mb-3"
                        style={{ color: portal.accent }}
                      >
                        {portal.subtitle}
                      </p>
                      <p className="text-sm text-[#7E939E] leading-relaxed">{portal.description}</p>
                    </div>

                    {/* Bottom row — stat + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#1C303B]">
                      <div>
                        <p className="text-[10px] text-[#566B76] font-mono-tech uppercase tracking-wider">
                          {portal.stat}
                        </p>
                        <p
                          className="text-sm font-bold font-mono-tech"
                          style={{ color: portal.accent }}
                        >
                          {portal.statValue}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1 text-sm font-medium transition-transform duration-150 group-hover:translate-x-1"
                        style={{ color: portal.accent }}
                      >
                        Open Portal <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-[#1C303B] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[#566B76] text-xs">
          whatDAfix — Built for Frontend Arena Hackathon 2026
        </p>
        <p className="text-[#566B76] text-xs font-mono-tech">
          ZERO-TRUST · CRYPTOGRAPHIC PROOF-OF-WORK · DISTRIBUTED ACCOUNTABILITY
        </p>
      </footer>
    </main>
  )
}
