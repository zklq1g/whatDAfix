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
  before_image_url?: string | null;
  after_image_url?: string | null;
  assigned_to: string | null;
  sla_deadline: string;
  created_at: string;
  proof_of_work_hash: string | null;
  citizen_report?: string | null;
  contractor_response?: string | null;
  status_note?: string | null;
}

// --- CONSTANTS & MOCK DATA ---
const CONTRACTORS: Record<string, string> = {
  'PWD': 'L&T Infrastructure',
  'Sanitation': 'Urban Cleaners Pvt Ltd',
  'Water Board': 'AquaFix Solutions',
  'Electricity': 'Bescom Grid Ops',
  'PHED Odisha (Water Wing)': 'Odisha Water Contractors',
  'Bhubaneswar Smart City Ltd (Roads)': 'BSCL Infra',
  'BMC Sanitation Contractor (Veolia)': 'Veolia Environnement',
  'TPCODL (Electricity)': 'Tata Power',
  'BBMP Road Infrastructure Wing': 'BBMP Infra',
  'BWSSB (Water Board)': 'BWSSB Contractors',
  'IMC Swachhata Taskforce': 'Indore Cleaners',
  'BMC Solid Waste Mgmt': 'BMC Waste Mgmt',
  'BSES Rajdhani Power': 'BSES Contractors'
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

      const customTickets: Ticket[] = [
  { "id": "DEL-R-001", "location": { "lat": 28.6139, "lng": 77.2090 }, "category": "Severe Pothole", "status": "open", "assigned_to": "PWD Delhi", "citizen_report": "Massive crater on ITO crossing. Caused 3 accidents today.", "contractor_response": null, "created_at": "2024-08-10T08:00:00Z", "sla_deadline": "2024-08-13T08:00:00Z", "proof_of_work_hash": null },
  { "id": "DEL-W-002", "location": { "lat": 28.5355, "lng": 77.3910 }, "category": "Contaminated Water", "status": "wip", "assigned_to": "Delhi Jal Board", "citizen_report": "Noida Sector 62 water supply is yellow and smells like mud.", "contractor_response": "Flushing the main lines. Alternative tanker dispatched.", "created_at": "2024-08-26T09:00:00Z", "sla_deadline": "2024-08-28T09:00:00Z", "proof_of_work_hash": null },
  { "id": "DEL-E-003", "location": { "lat": 28.6304, "lng": 77.2177 }, "category": "Transformer Sparking", "status": "resolved", "assigned_to": "BSES Rajdhani", "citizen_report": "Sparks flying from the transformer near Karol Bagh market.", "contractor_response": "Faulty capacitor replaced. Area secured.", "created_at": "2024-08-25T18:00:00Z", "sla_deadline": "2024-08-26T06:00:00Z", "proof_of_work_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b" },
  { "id": "NDL-S-004", "location": { "lat": 28.4595, "lng": 77.0266 }, "category": "Garbage Overflow", "status": "open", "assigned_to": "MCG Gurugram", "citizen_report": "Dumpster at Cyber Hub hasn't been cleared in 5 days.", "contractor_response": null, "created_at": "2024-08-20T10:00:00Z", "sla_deadline": "2024-08-22T10:00:00Z", "proof_of_work_hash": null },
  { "id": "DEL-R-005", "location": { "lat": 28.7041, "lng": 77.1025 }, "category": "Broken Traffic Signal", "status": "rejected", "assigned_to": "Delhi Traffic Police", "citizen_report": "Traffic light at Rohini Sector 9 is completely dead.", "contractor_response": "Inspected. Signal is functioning normally. Issue might be local power cut.", "created_at": "2024-08-27T12:00:00Z", "sla_deadline": "2024-08-29T12:00:00Z", "proof_of_work_hash": null },
  { "id": "MUM-W-006", "location": { "lat": 19.0760, "lng": 72.8777 }, "category": "Water Pipe Leakage", "status": "open", "assigned_to": "BMC Water Dept", "citizen_report": "Huge geyser of water erupting at Dadar TT circle. Wasting millions of liters.", "contractor_response": null, "created_at": "2024-08-15T06:00:00Z", "sla_deadline": "2024-08-17T06:00:00Z", "proof_of_work_hash": null },
  { "id": "MUM-S-007", "location": { "lat": 19.0176, "lng": 72.8562 }, "category": "Drainage Blockage", "status": "wip", "assigned_to": "BMC Solid Waste", "citizen_report": "Drains in Colaba are choked with plastic. Smells terrible.", "contractor_response": "Desilting machines deployed. Work in progress.", "created_at": "2024-08-26T14:00:00Z", "sla_deadline": "2024-08-29T14:00:00Z", "proof_of_work_hash": null },
  { "id": "PNE-R-008", "location": { "lat": 18.5204, "lng": 73.8567 }, "category": "Unfilled Trench", "status": "open", "assigned_to": "PMC Roads", "citizen_report": "Jangli Maharaj Road dug up for fiber optics 2 weeks ago. Abandoned.", "contractor_response": null, "created_at": "2024-08-12T09:00:00Z", "sla_deadline": "2024-08-15T09:00:00Z", "proof_of_work_hash": null },
  { "id": "NGP-E-009", "location": { "lat": 21.1458, "lng": 79.0882 }, "category": "Streetlight Outage", "status": "resolved", "assigned_to": "MSEDCL Nagpur", "citizen_report": "Entire stretch of Wardha Road is pitch black at night.", "contractor_response": "Underground cable fault rectified.", "created_at": "2024-08-24T20:00:00Z", "sla_deadline": "2024-08-26T20:00:00Z", "proof_of_work_hash": "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c" },
  { "id": "NSK-S-010", "location": { "lat": 19.9975, "lng": 73.7898 }, "category": "Illegal Dumping", "status": "resolved", "assigned_to": "NMC Sanitation", "citizen_report": "Trucks dumping construction debris near Godavari river bank.", "contractor_response": "Caught on CCTV. Debris cleared. FIR filed against contractor.", "created_at": "2024-08-25T07:00:00Z", "sla_deadline": "2024-08-28T07:00:00Z", "proof_of_work_hash": "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d" },
  { "id": "BLR-R-011", "location": { "lat": 12.9716, "lng": 77.5946 }, "category": "Severe Pothole", "status": "open", "assigned_to": "BBMP Roads", "citizen_report": "Outer Ring Road near Marathahalli is a death trap. Huge potholes.", "contractor_response": null, "created_at": "2024-08-05T10:00:00Z", "sla_deadline": "2024-08-08T10:00:00Z", "proof_of_work_hash": null },
  { "id": "BLR-W-012", "location": { "lat": 12.9352, "lng": 77.6245 }, "category": "Contaminated Water", "status": "open", "assigned_to": "BWSSB", "citizen_report": "Cauvery water mixed with sewage in Koramangala 4th Block.", "contractor_response": null, "created_at": "2024-08-18T08:00:00Z", "sla_deadline": "2024-08-21T08:00:00Z", "proof_of_work_hash": null },
  { "id": "BLR-E-013", "location": { "lat": 13.0319, "lng": 77.5964 }, "category": "Fallen Tree on Lines", "status": "wip", "assigned_to": "BESCOM", "citizen_report": "Massive tree fell on power lines in Malleshwaram during rain.", "contractor_response": "Tree cutting crew on site. Power will be restored in 2 hours.", "created_at": "2024-08-27T15:00:00Z", "sla_deadline": "2024-08-28T15:00:00Z", "proof_of_work_hash": null },
  { "id": "MYS-S-014", "location": { "lat": 12.2958, "lng": 76.6394 }, "category": "Garbage Overflow", "status": "resolved", "assigned_to": "MCC Health Dept", "citizen_report": "Bins near Mysore Palace are overflowing with tourist waste.", "contractor_response": "Extra shifts deployed for tourist season. Area sanitized.", "created_at": "2024-08-26T11:00:00Z", "sla_deadline": "2024-08-28T11:00:00Z", "proof_of_work_hash": "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e" },
  { "id": "HUB-R-015", "location": { "lat": 15.3647, "lng": 75.1240 }, "category": "Missing Manhole Cover", "status": "open", "status_note": "SLA Breached", "assigned_to": "HDMC", "citizen_report": "Open manhole on Club Road. Extremely dangerous at night.", "contractor_response": null, "created_at": "2024-08-20T19:00:00Z", "sla_deadline": "2024-08-22T19:00:00Z", "proof_of_work_hash": null },
  { "id": "CHN-S-016", "location": { "lat": 13.0827, "lng": 80.2707 }, "category": "Public Toilet Unhygienic", "status": "wip", "assigned_to": "GCC Sanitation", "citizen_report": "Marina Beach public toilets have no water and are unusable.", "contractor_response": "Water tanker sent. Cleaning staff dispatched.", "created_at": "2024-08-27T06:00:00Z", "sla_deadline": "2024-08-29T06:00:00Z", "proof_of_work_hash": null },
  { "id": "CHN-W-017", "location": { "lat": 12.9816, "lng": 80.2501 }, "category": "Water Pipe Leakage", "status": "resolved", "assigned_to": "CMWSSB", "citizen_report": "Underground pipe burst in Velachery, flooding the street.", "contractor_response": "Valve shut off. Pipe welded and replaced.", "created_at": "2024-08-23T10:00:00Z", "sla_deadline": "2024-08-25T10:00:00Z", "proof_of_work_hash": "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f" },
  { "id": "CBE-E-018", "location": { "lat": 11.0168, "lng": 76.9558 }, "category": "Streetlight Outage", "status": "open", "assigned_to": "TANGEDCO", "citizen_report": "No streetlights on Avinashi Road flyover for a week.", "contractor_response": null, "created_at": "2024-08-19T18:00:00Z", "sla_deadline": "2024-08-22T18:00:00Z", "proof_of_work_hash": null },
  { "id": "MDU-R-019", "location": { "lat": 9.9252, "lng": 78.1198 }, "category": "Severe Pothole", "status": "rejected", "assigned_to": "Madurai Corp", "citizen_report": "Road near Meenakshi Temple is broken.", "contractor_response": "Road is actually under active, approved renovation. Not a pothole issue.", "created_at": "2024-08-26T09:00:00Z", "sla_deadline": "2024-08-29T09:00:00Z", "proof_of_work_hash": null },
  { "id": "TRC-S-020", "location": { "lat": 10.7905, "lng": 78.7047 }, "category": "Stray Animal Menace", "status": "open", "assigned_to": "Trichy Corp", "citizen_report": "Aggressive pack of stray dogs near Gandhi Market.", "contractor_response": null, "created_at": "2024-08-25T08:00:00Z", "sla_deadline": "2024-08-28T08:00:00Z", "proof_of_work_hash": null },
  { "id": "HYD-W-021", "location": { "lat": 17.3850, "lng": 78.4867 }, "category": "Contaminated Water", "status": "open", "assigned_to": "HMWSSB", "citizen_report": "Manjeera water supply in HITEC city is highly turbid.", "contractor_response": null, "created_at": "2024-08-21T07:00:00Z", "sla_deadline": "2024-08-24T07:00:00Z", "proof_of_work_hash": null },
  { "id": "HYD-R-022", "location": { "lat": 17.4399, "lng": 78.4983 }, "category": "Unfilled Trench", "status": "wip", "assigned_to": "GHMC Roads", "citizen_report": "Jubilee Hills road 10 dug up. No barricades at night.", "contractor_response": "Barricades installed. Asphalt work starting tomorrow.", "created_at": "2024-08-26T20:00:00Z", "sla_deadline": "2024-08-29T20:00:00Z", "proof_of_work_hash": null },
  { "id": "VSK-S-023", "location": { "lat": 17.6868, "lng": 83.2185 }, "category": "Garbage Overflow", "status": "resolved", "assigned_to": "GVMC", "citizen_report": "Beach road bins are overflowing after the weekend crowd.", "contractor_response": "Cleared by morning shift. Extra bins placed.", "created_at": "2024-08-26T06:00:00Z", "sla_deadline": "2024-08-28T06:00:00Z", "proof_of_work_hash": "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a" },
  { "id": "VIJ-E-024", "location": { "lat": 16.5062, "lng": 80.6480 }, "category": "Transformer Sparking", "status": "resolved", "assigned_to": "APSPDCL", "citizen_report": "Transformer near Benz Circle is humming loudly and heating up.", "contractor_response": "Load balanced. Oil top-up done.", "created_at": "2024-08-25T14:00:00Z", "sla_deadline": "2024-08-27T14:00:00Z", "proof_of_work_hash": "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b" },
  { "id": "TPT-R-025", "location": { "lat": 13.6288, "lng": 79.4192 }, "category": "Broken Traffic Signal", "status": "open", "assigned_to": "Tirupati Police", "citizen_report": "Signal at Alipiri toll is malfunctioning, causing massive jams.", "contractor_response": null, "created_at": "2024-08-24T09:00:00Z", "sla_deadline": "2024-08-26T09:00:00Z", "proof_of_work_hash": null },
  { "id": "AMD-S-026", "location": { "lat": 23.0225, "lng": 72.5714 }, "category": "Illegal Dumping", "status": "resolved", "assigned_to": "AMC Solid Waste", "citizen_report": "Medical waste dumped in regular bin near Civil Hospital.", "contractor_response": "Bio-medical waste team collected it. Vendor penalized.", "created_at": "2024-08-27T08:00:00Z", "sla_deadline": "2024-08-28T08:00:00Z", "proof_of_work_hash": "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c" },
  { "id": "SRT-W-027", "location": { "lat": 21.1702, "lng": 72.8311 }, "category": "Water Pipe Leakage", "status": "wip", "assigned_to": "SMC Water", "citizen_report": "Pipeline leaking heavily at Adajan bridge.", "contractor_response": "Excavation started. Replacement pipe arriving in 1 hour.", "created_at": "2024-08-27T11:00:00Z", "sla_deadline": "2024-08-29T11:00:00Z", "proof_of_work_hash": null },
  { "id": "VDR-E-028", "location": { "lat": 22.3072, "lng": 73.1812 }, "category": "Streetlight Outage", "status": "open", "assigned_to": "MGVCL", "citizen_report": "Alkapuri main road lights are dead. Very unsafe.", "contractor_response": null, "created_at": "2024-08-22T19:00:00Z", "sla_deadline": "2024-08-25T19:00:00Z", "proof_of_work_hash": null },
  { "id": "RJK-R-029", "location": { "lat": 22.3039, "lng": 70.8022 }, "category": "Severe Pothole", "status": "resolved", "assigned_to": "RMC Roads", "citizen_report": "Deep pothole on 150 Feet Ring Road.", "contractor_response": "Filled with cold mix asphalt as temporary measure. Permanent fix scheduled.", "created_at": "2024-08-25T10:00:00Z", "sla_deadline": "2024-08-28T10:00:00Z", "proof_of_work_hash": "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d" },
  { "id": "GND-S-030", "location": { "lat": 23.2156, "lng": 72.6369 }, "category": "Drainage Blockage", "status": "open", "assigned_to": "Gandhinagar Municipality", "citizen_report": "Sector 21 drainage is backing up into the streets.", "contractor_response": null, "created_at": "2024-08-23T15:00:00Z", "sla_deadline": "2024-08-26T15:00:00Z", "proof_of_work_hash": null },
  { "id": "KOL-W-031", "location": { "lat": 22.5726, "lng": 88.3639 }, "category": "Contaminated Water", "status": "open", "assigned_to": "KMC Water", "citizen_report": "Salt Lake Sector 5 water is highly chlorinated and undrinkable.", "contractor_response": null, "created_at": "2024-08-19T08:00:00Z", "sla_deadline": "2024-08-22T08:00:00Z", "proof_of_work_hash": null },
  { "id": "KOL-R-032", "location": { "lat": 22.5448, "lng": 88.3403 }, "category": "Missing Manhole Cover", "status": "wip", "assigned_to": "KMC Drainage", "citizen_report": "Cover missing near Park Street metro station.", "contractor_response": "Barricaded. New cast-iron cover being cast.", "created_at": "2024-08-26T16:00:00Z", "sla_deadline": "2024-08-29T16:00:00Z", "proof_of_work_hash": null },
  { "id": "DGP-E-033", "location": { "lat": 23.5204, "lng": 87.3119 }, "category": "Transformer Sparking", "status": "open", "assigned_to": "WBSEDCL", "citizen_report": "Transformer in City Center is leaking oil and sparking.", "contractor_response": null, "created_at": "2024-08-24T13:00:00Z", "sla_deadline": "2024-08-26T13:00:00Z", "proof_of_work_hash": null },
  { "id": "SLG-S-034", "location": { "lat": 26.7271, "lng": 88.3953 }, "category": "Garbage Overflow", "status": "resolved", "assigned_to": "Siliguri Municipal Corp", "citizen_report": "Hill Cart Road bins are overflowing, blocking traffic.", "contractor_response": "Compactor sent. Road cleared.", "created_at": "2024-08-27T09:00:00Z", "sla_deadline": "2024-08-29T09:00:00Z", "proof_of_work_hash": "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e" },
  { "id": "ASN-R-035", "location": { "lat": 23.6888, "lng": 86.9660 }, "category": "Unfilled Trench", "status": "open", "assigned_to": "Asansol Corp", "citizen_report": "GT Road dug up for drainage, left open for 10 days.", "contractor_response": null, "created_at": "2024-08-17T10:00:00Z", "sla_deadline": "2024-08-20T10:00:00Z", "proof_of_work_hash": null },
  { "id": "CHD-S-036", "location": { "lat": 30.7333, "lng": 76.7794 }, "category": "Broken Public Bin", "status": "resolved", "assigned_to": "MC Chandigarh", "citizen_report": "Smart bins in Sector 17 market are crushed and not working.", "contractor_response": "Vandalized bins replaced with heavy-duty models.", "created_at": "2024-08-25T12:00:00Z", "sla_deadline": "2024-08-28T12:00:00Z", "proof_of_work_hash": "0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f" },
  { "id": "LDH-W-037", "location": { "lat": 30.9010, "lng": 75.8573 }, "category": "Water Pipe Leakage", "status": "wip", "assigned_to": "Ludhiana Water Supply", "citizen_report": "Main pipeline burst near Clock Tower.", "contractor_response": "Water supply shut off. Welding team on site.", "created_at": "2024-08-27T07:00:00Z", "sla_deadline": "2024-08-29T07:00:00Z", "proof_of_work_hash": null },
  { "id": "AMR-E-038", "location": { "lat": 31.6340, "lng": 74.8723 }, "category": "Streetlight Outage", "status": "resolved", "assigned_to": "PSPCL", "citizen_report": "Heritage street lights near Golden Temple are flickering and dying.", "contractor_response": "LED drivers replaced across the heritage corridor.", "created_at": "2024-08-24T21:00:00Z", "sla_deadline": "2024-08-27T21:00:00Z", "proof_of_work_hash": "0x2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a" },
  { "id": "JPR-R-039", "location": { "lat": 26.9124, "lng": 75.7873 }, "category": "Severe Pothole", "status": "open", "assigned_to": "JMC Roads", "citizen_report": "Tonk Road has massive craters after the recent rain.", "contractor_response": null, "created_at": "2024-08-14T11:00:00Z", "sla_deadline": "2024-08-17T11:00:00Z", "proof_of_work_hash": null },
  { "id": "JOD-S-040", "location": { "lat": 26.2389, "lng": 73.0243 }, "category": "Illegal Dumping", "status": "open", "assigned_to": "Jodhpur Nagar Nigam", "citizen_report": "Plastic waste being burned in empty plot near Sardarpura.", "contractor_response": null, "created_at": "2024-08-26T17:00:00Z", "sla_deadline": "2024-08-29T17:00:00Z", "proof_of_work_hash": null },
  { "id": "LKO-W-041", "location": { "lat": 26.8467, "lng": 80.9462 }, "category": "Contaminated Water", "status": "wip", "assigned_to": "Jal Kal Lucknow", "citizen_report": "Gomti Nagar water supply has a strong chemical smell.", "contractor_response": "Checking chlorination dosing at the local plant.", "created_at": "2024-08-27T08:00:00Z", "sla_deadline": "2024-08-30T08:00:00Z", "proof_of_work_hash": null },
  { "id": "KNP-R-042", "location": { "lat": 26.4499, "lng": 80.3319 }, "category": "Broken Traffic Signal", "status": "open", "assigned_to": "Kanpur Traffic Police", "citizen_report": "Mall Road intersection signal is completely dark.", "contractor_response": null, "created_at": "2024-08-23T10:00:00Z", "sla_deadline": "2024-08-25T10:00:00Z", "proof_of_work_hash": null },
  { "id": "IDR-S-043", "location": { "lat": 22.7196, "lng": 75.8577 }, "category": "Garbage Overflow", "status": "resolved", "assigned_to": "IMC Swachhata", "citizen_report": "Sarafa Bazaar night market leaves massive trash piles by morning.", "contractor_response": "Mechanical sweepers deployed at 4 AM. Spotless by 6 AM.", "created_at": "2024-08-27T04:00:00Z", "sla_deadline": "2024-08-28T04:00:00Z", "proof_of_work_hash": "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b" },
  { "id": "BHO-E-044", "location": { "lat": 23.2599, "lng": 77.4126 }, "category": "Streetlight Outage", "status": "resolved", "assigned_to": "Bhopal Municipal", "citizen_report": "New Market road lights are out. Very dark for evening walkers.", "contractor_response": "Timer switch replaced. Lights operational.", "created_at": "2024-08-26T18:00:00Z", "sla_deadline": "2024-08-28T18:00:00Z", "proof_of_work_hash": "0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c" },
  { "id": "RPR-R-045", "location": { "lat": 21.2514, "lng": 81.6296 }, "category": "Unfilled Trench", "status": "open", "assigned_to": "Raipur Nagar Nigam", "citizen_report": "GE Road dug up for smart city project, no warning signs.", "contractor_response": null, "created_at": "2024-08-20T09:00:00Z", "sla_deadline": "2024-08-23T09:00:00Z", "proof_of_work_hash": null },
  { "id": "KOC-W-046", "location": { "lat": 9.9312, "lng": 76.2673 }, "category": "Water Pipe Leakage", "status": "resolved", "assigned_to": "KWA Kochi", "citizen_report": "Pipe leaking into the backwaters near Fort Kochi.", "contractor_response": "Clamp installed. Leak stopped.", "created_at": "2024-08-25T14:00:00Z", "sla_deadline": "2024-08-27T14:00:00Z", "proof_of_work_hash": "0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d" },
  { "id": "TVM-S-047", "location": { "lat": 8.5241, "lng": 76.9366 }, "category": "Drainage Blockage", "status": "wip", "assigned_to": "TVM Corp", "citizen_report": "Drains near Padmanabhaswamy Temple are clogged before the rain.", "contractor_response": "High-pressure jetting in progress.", "created_at": "2024-08-27T10:00:00Z", "sla_deadline": "2024-08-29T10:00:00Z", "proof_of_work_hash": null },
  { "id": "GOA-R-048", "location": { "lat": 15.4909, "lng": 73.8278 }, "category": "Severe Pothole", "status": "open", "assigned_to": "PWD Goa", "citizen_report": "Road to Anjuna beach is completely broken. Tourists complaining.", "contractor_response": null, "created_at": "2024-08-18T12:00:00Z", "sla_deadline": "2024-08-21T12:00:00Z", "proof_of_work_hash": null },
  { "id": "GHY-E-049", "location": { "lat": 26.1445, "lng": 91.7362 }, "category": "Transformer Sparking", "status": "open", "assigned_to": "APDCL", "citizen_report": "Transformer in Pan Bazaar is making loud popping sounds.", "contractor_response": null, "created_at": "2024-08-26T15:00:00Z", "sla_deadline": "2024-08-28T15:00:00Z", "proof_of_work_hash": null },
  { "id": "PAT-S-050", "location": { "lat": 25.5941, "lng": 85.1376 }, "category": "Garbage Overflow", "status": "open", "assigned_to": "Patna Municipal Corp", "citizen_report": "Boring Road intersection is piled high with uncollected garbage.", "contractor_response": null, "created_at": "2024-08-15T07:00:00Z", "sla_deadline": "2024-08-18T07:00:00Z", "proof_of_work_hash": null }
]
;

      let fetchedData = (error || !data || data.length === 0) ? generateMockTickets() : (data as Ticket[]);
      setTickets([...customTickets, ...fetchedData]);
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
    <div className="absolute bottom-6 left-6 z-[1000] w-80 bg-[#0D1922]/80 backdrop-blur-md border border-[#1C303B] rounded-lg shadow-2xl overflow-hidden" style={{ maxHeight: 'calc(100vh - 48px)' }}>
      <button onClick={toggle} className="w-full p-4 flex justify-between items-center hover:bg-[#1C303B]/30 transition-colors">
        <span className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 size={14} className="text-[#00E5FF]" /> Department Accountability
        </span>
        {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
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
