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

// Rich ward-level operational data — 107 real municipal wards across India
const MAP_NODES = [
  // ── NEW DELHI ──────────────────────────────────────────────────
  { id: 'd1',  wardName: 'Ward 12 — Karol Bagh',       city: 'New Delhi',   lat: 28.6516, lng: 77.1904, activeIssues: 42, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 38, contractor: 'NorthDel Infra Pvt. Ltd',    trustScore: 94, workerCount: 11, isHQ: false },
  { id: 'd2',  wardName: 'Ward 23 — Chandni Chowk',    city: 'New Delhi',   lat: 28.6507, lng: 77.2297, activeIssues: 67, resolvedThisWeek: 38, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 58, contractor: 'OldDelhi Roads Corp',        trustScore: 71, workerCount: 18, isHQ: false },
  { id: 'd3',  wardName: 'Ward 41 — Lajpat Nagar',     city: 'New Delhi',   lat: 28.5674, lng: 77.2432, activeIssues: 33, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 30, contractor: 'Metro Lights LLC',           trustScore: 89, workerCount: 9,  isHQ: false },
  { id: 'd4',  wardName: 'Ward 55 — Rohini Sector 7',  city: 'New Delhi',   lat: 28.7415, lng: 77.0799, activeIssues: 51, resolvedThisWeek: 41, slaBreaches: 1, topCategory: 'Water Supply Failure',     avgClosureHrs: 47, contractor: 'JalBoard Delhi Works',       trustScore: 82, workerCount: 14, isHQ: false },
  { id: 'd5',  wardName: 'Ward 67 — Dwarka Sec 12',    city: 'New Delhi',   lat: 28.5921, lng: 77.0460, activeIssues: 28, resolvedThisWeek: 22, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 27, contractor: 'CleanDel Municipal Svc',     trustScore: 96, workerCount: 7,  isHQ: false },
  { id: 'd6',  wardName: 'Ward 78 — Saket',            city: 'New Delhi',   lat: 28.5244, lng: 77.2090, activeIssues: 19, resolvedThisWeek: 18, slaBreaches: 0, topCategory: 'Tree Fall Hazard',         avgClosureHrs: 22, contractor: 'GreenGuard Delhi',          trustScore: 98, workerCount: 5,  isHQ: false },
  { id: 'd7',  wardName: 'Ward 89 — Shahdara',         city: 'New Delhi',   lat: 28.6692, lng: 77.2939, activeIssues: 74, resolvedThisWeek: 49, slaBreaches: 3, topCategory: 'Open Manhole',             avgClosureHrs: 72, contractor: 'EastDelhi Hazard Ctrl',     trustScore: 58, workerCount: 21, isHQ: false },
  { id: 'd8',  wardName: 'Ward 93 — Mustafabad',       city: 'New Delhi',   lat: 28.7085, lng: 77.2845, activeIssues: 88, resolvedThisWeek: 44, slaBreaches: 5, topCategory: 'Sewage Overflow',          avgClosureHrs: 91, contractor: 'NordEast Sewage Corp',       trustScore: 42, workerCount: 24, isHQ: false },

  // ── MUMBAI ────────────────────────────────────────────────────
  { id: 'm1',  wardName: 'Ward 8 — Dharavi',           city: 'Mumbai',      lat: 19.0390, lng: 72.8527, activeIssues: 88, resolvedThisWeek: 41, slaBreaches: 3, topCategory: 'Open Manhole/Road Hazard', avgClosureHrs: 71, contractor: 'WestCoast Civic Corp',      trustScore: 61, workerCount: 17, isHQ: false },
  { id: 'm2',  wardName: 'Ward 14 — Bandra West',      city: 'Mumbai',      lat: 19.0596, lng: 72.8295, activeIssues: 22, resolvedThisWeek: 20, slaBreaches: 0, topCategory: 'Coastal Erosion Report',   avgClosureHrs: 31, contractor: 'BandraPlus Infra',          trustScore: 93, workerCount: 6,  isHQ: false },
  { id: 'm3',  wardName: 'Ward 21 — Kurla East',       city: 'Mumbai',      lat: 19.0726, lng: 72.8807, activeIssues: 56, resolvedThisWeek: 33, slaBreaches: 2, topCategory: 'Drainage Overflow',        avgClosureHrs: 63, contractor: 'KurlaInfratech Ltd',         trustScore: 67, workerCount: 15, isHQ: false },
  { id: 'm4',  wardName: 'Ward 33 — Andheri West',     city: 'Mumbai',      lat: 19.1363, lng: 72.8296, activeIssues: 39, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 44, contractor: 'SuburbanCivic Mumbai',       trustScore: 79, workerCount: 11, isHQ: false },
  { id: 'm5',  wardName: 'Ward 48 — Mulund West',      city: 'Mumbai',      lat: 19.1726, lng: 72.9579, activeIssues: 27, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 29, contractor: 'MulundLights & Road',       trustScore: 91, workerCount: 8,  isHQ: false },
  { id: 'm6',  wardName: 'Ward 61 — Ghatkopar East',   city: 'Mumbai',      lat: 19.0858, lng: 72.9082, activeIssues: 47, resolvedThisWeek: 28, slaBreaches: 2, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 55, contractor: 'CentralMumbai JalCorp',     trustScore: 74, workerCount: 13, isHQ: false },
  { id: 'm7',  wardName: 'Ward 72 — Malad East',       city: 'Mumbai',      lat: 19.1874, lng: 72.8653, activeIssues: 61, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Garbage Accumulation',     avgClosureHrs: 58, contractor: 'MaladSanitary Works',        trustScore: 69, workerCount: 16, isHQ: false },
  { id: 'm8',  wardName: 'Ward 85 — Borivali West',    city: 'Mumbai',      lat: 19.2307, lng: 72.8567, activeIssues: 18, resolvedThisWeek: 17, slaBreaches: 0, topCategory: 'Park Maintenance',         avgClosureHrs: 18, contractor: 'GreenBorivali Pvt Ltd',     trustScore: 97, workerCount: 4,  isHQ: false },

  // ── BENGALURU ─────────────────────────────────────────────────
  { id: 'b1',  wardName: 'Ward 42 — Koramangala',      city: 'Bengaluru',   lat: 12.9352, lng: 77.6245, activeIssues: 142, resolvedThisWeek: 98, slaBreaches: 2, topCategory: 'Road Collapse/Sinkhole',  avgClosureHrs: 61, contractor: 'BangaloreCivic Tech',       trustScore: 73, workerCount: 31, isHQ: true },
  { id: 'b2',  wardName: 'Ward 15 — Whitefield',       city: 'Bengaluru',   lat: 12.9698, lng: 77.7499, activeIssues: 63, resolvedThisWeek: 44, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 52, contractor: 'WhiteBlu Roads Ltd',         trustScore: 78, workerCount: 18, isHQ: false },
  { id: 'b3',  wardName: 'Ward 27 — Jayanagar',        city: 'Bengaluru',   lat: 12.9250, lng: 77.5938, activeIssues: 31, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 33, contractor: 'SouthBengaluru Infra',      trustScore: 90, workerCount: 9,  isHQ: false },
  { id: 'b4',  wardName: 'Ward 38 — Hebbal',           city: 'Bengaluru',   lat: 13.0350, lng: 77.5943, activeIssues: 55, resolvedThisWeek: 38, slaBreaches: 1, topCategory: 'Waterlogging',             avgClosureHrs: 49, contractor: 'NorthBnglr DWorks',         trustScore: 81, workerCount: 14, isHQ: false },
  { id: 'b5',  wardName: 'Ward 51 — Electronic City',  city: 'Bengaluru',   lat: 12.8399, lng: 77.6770, activeIssues: 48, resolvedThisWeek: 35, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 37, contractor: 'TechZone Civic Ops',         trustScore: 88, workerCount: 12, isHQ: false },
  { id: 'b6',  wardName: 'Ward 64 — Rajajinagar',      city: 'Bengaluru',   lat: 12.9932, lng: 77.5552, activeIssues: 37, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 28, contractor: 'BngrWest SanitaWorks',      trustScore: 92, workerCount: 10, isHQ: false },
  { id: 'b7',  wardName: 'Ward 73 — Yelahanka',        city: 'Bengaluru',   lat: 13.1005, lng: 77.5963, activeIssues: 29, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 35, contractor: 'NorthSuburb Roads BNG',     trustScore: 87, workerCount: 8,  isHQ: false },
  { id: 'b8',  wardName: 'Ward 88 — BTM Layout',       city: 'Bengaluru',   lat: 12.9166, lng: 77.6101, activeIssues: 71, resolvedThisWeek: 51, slaBreaches: 2, topCategory: 'Sewage Overflow',          avgClosureHrs: 65, contractor: 'BTM Civic Systems',          trustScore: 66, workerCount: 19, isHQ: false },

  // ── CHENNAI ───────────────────────────────────────────────────
  { id: 'c1',  wardName: 'Ward 19 — T. Nagar',         city: 'Chennai',     lat: 13.0418, lng: 80.2341, activeIssues: 34, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 44, contractor: 'SouthMet Services',          trustScore: 89, workerCount: 9,  isHQ: false },
  { id: 'c2',  wardName: 'Ward 31 — Adyar',            city: 'Chennai',     lat: 13.0012, lng: 80.2565, activeIssues: 28, resolvedThisWeek: 25, slaBreaches: 0, topCategory: 'Coastal Flood Risk',       avgClosureHrs: 38, contractor: 'AdyarCoastal Works',         trustScore: 91, workerCount: 8,  isHQ: false },
  { id: 'c3',  wardName: 'Ward 44 — Velachery',        city: 'Chennai',     lat: 12.9815, lng: 80.2180, activeIssues: 52, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Waterlogging',             avgClosureHrs: 57, contractor: 'Velachery Drainage Corp',    trustScore: 75, workerCount: 14, isHQ: false },
  { id: 'c4',  wardName: 'Ward 58 — Tambaram',         city: 'Chennai',     lat: 12.9249, lng: 80.1000, activeIssues: 41, resolvedThisWeek: 33, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 42, contractor: 'SouthSuburb Roads TN',      trustScore: 85, workerCount: 11, isHQ: false },
  { id: 'c5',  wardName: 'Ward 67 — Ambattur',         city: 'Chennai',     lat: 13.1143, lng: 80.1548, activeIssues: 38, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 36, contractor: 'NorthChennaiBuildCorp',     trustScore: 88, workerCount: 10, isHQ: false },
  { id: 'c6',  wardName: 'Ward 79 — Sholinganallur',   city: 'Chennai',     lat: 12.9010, lng: 80.2279, activeIssues: 45, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Streetlight Failure',      avgClosureHrs: 50, contractor: 'IT Corridor Civic Ops',      trustScore: 80, workerCount: 12, isHQ: false },
  { id: 'c7',  wardName: 'Ward 88 — Perambur',         city: 'Chennai',     lat: 13.1172, lng: 80.2426, activeIssues: 61, resolvedThisWeek: 43, slaBreaches: 2, topCategory: 'Open Manhole',             avgClosureHrs: 66, contractor: 'NordChennai RoadForce',     trustScore: 63, workerCount: 16, isHQ: false },
  { id: 'c8',  wardName: 'Ward 99 — Kodambakkam',      city: 'Chennai',     lat: 13.0524, lng: 80.2193, activeIssues: 23, resolvedThisWeek: 21, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 25, contractor: 'CentralChennaClean',         trustScore: 94, workerCount: 6,  isHQ: false },

  // ── KOLKATA ───────────────────────────────────────────────────
  { id: 'k1',  wardName: 'Ward 4 — Shyambazar',        city: 'Kolkata',     lat: 22.5958, lng: 88.3793, activeIssues: 15, resolvedThisWeek: 18, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 29, contractor: 'EastBridge Solutions',       trustScore: 97, workerCount: 6,  isHQ: false },
  { id: 'k2',  wardName: 'Ward 17 — Park Street',      city: 'Kolkata',     lat: 22.5520, lng: 88.3521, activeIssues: 24, resolvedThisWeek: 22, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 32, contractor: 'KMC Central Works',          trustScore: 93, workerCount: 7,  isHQ: false },
  { id: 'k3',  wardName: 'Ward 29 — Ballygunge',       city: 'Kolkata',     lat: 22.5270, lng: 88.3646, activeIssues: 19, resolvedThisWeek: 17, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 27, contractor: 'SouthKol Drainage Corp',     trustScore: 95, workerCount: 5,  isHQ: false },
  { id: 'k4',  wardName: 'Ward 42 — Beliaghata',       city: 'Kolkata',     lat: 22.5744, lng: 88.3933, activeIssues: 46, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Garbage Accumulation',     avgClosureHrs: 54, contractor: 'EastKol Sanita Corp',        trustScore: 76, workerCount: 13, isHQ: false },
  { id: 'k5',  wardName: 'Ward 56 — Jadavpur',         city: 'Kolkata',     lat: 22.4975, lng: 88.3718, activeIssues: 33, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 38, contractor: 'SouthKol Roads Pvt',        trustScore: 86, workerCount: 9,  isHQ: false },
  { id: 'k6',  wardName: 'Ward 68 — Behala',           city: 'Kolkata',     lat: 22.4969, lng: 88.3113, activeIssues: 55, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Open Manhole',             avgClosureHrs: 62, contractor: 'WestKolHazardCtrl',          trustScore: 68, workerCount: 15, isHQ: false },
  { id: 'k7',  wardName: 'Ward 79 — Dumdum',           city: 'Kolkata',     lat: 22.6418, lng: 88.4028, activeIssues: 38, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 44, contractor: 'NorthKol JalWorks',          trustScore: 84, workerCount: 10, isHQ: false },

  // ── HYDERABAD ─────────────────────────────────────────────────
  { id: 'h1',  wardName: 'Ward 31 — Banjara Hills',    city: 'Hyderabad',   lat: 17.4153, lng: 78.4456, activeIssues: 57, resolvedThisWeek: 44, slaBreaches: 1, topCategory: 'Pothole/Road Damage',      avgClosureHrs: 52, contractor: 'DeccanBuild Contractors',    trustScore: 78, workerCount: 14, isHQ: false },
  { id: 'h2',  wardName: 'Ward 44 — Kukatpally',       city: 'Hyderabad',   lat: 17.4849, lng: 78.4138, activeIssues: 69, resolvedThisWeek: 48, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 61, contractor: 'KPHB Civic Works',          trustScore: 71, workerCount: 18, isHQ: false },
  { id: 'h3',  wardName: 'Ward 57 — Madhapur',         city: 'Hyderabad',   lat: 17.4400, lng: 78.3889, activeIssues: 43, resolvedThisWeek: 36, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 40, contractor: 'CyberCity Infrastructure',    trustScore: 86, workerCount: 11, isHQ: false },
  { id: 'h4',  wardName: 'Ward 68 — Secunderabad',     city: 'Hyderabad',   lat: 17.4399, lng: 78.4983, activeIssues: 51, resolvedThisWeek: 38, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 55, contractor: 'TwinCities DrainCorp',      trustScore: 77, workerCount: 13, isHQ: false },
  { id: 'h5',  wardName: 'Ward 79 — LB Nagar',         city: 'Hyderabad',   lat: 17.3469, lng: 78.5497, activeIssues: 62, resolvedThisWeek: 41, slaBreaches: 2, topCategory: 'Garbage Accumulation',     avgClosureHrs: 67, contractor: 'SouthHyd Sanita Works',     trustScore: 65, workerCount: 17, isHQ: false },
  { id: 'h6',  wardName: 'Ward 88 — Uppal',            city: 'Hyderabad',   lat: 17.4059, lng: 78.5596, activeIssues: 48, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 53, contractor: 'EastHyd Infra Pvt',         trustScore: 74, workerCount: 13, isHQ: false },

  // ── PUNE ──────────────────────────────────────────────────────
  { id: 'p1',  wardName: 'Ward 7 — Shivajinagar',      city: 'Pune',        lat: 18.5204, lng: 73.8567, activeIssues: 29, resolvedThisWeek: 25, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 33, contractor: 'PuneCore Works Ltd',        trustScore: 92, workerCount: 8,  isHQ: false },
  { id: 'p2',  wardName: 'Ward 18 — Kothrud',          city: 'Pune',        lat: 18.5074, lng: 73.8077, activeIssues: 36, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 38, contractor: 'WestPune Roads Corp',        trustScore: 90, workerCount: 10, isHQ: false },
  { id: 'p3',  wardName: 'Ward 29 — Hadapsar',         city: 'Pune',        lat: 18.5089, lng: 73.9260, activeIssues: 54, resolvedThisWeek: 39, slaBreaches: 1, topCategory: 'Garbage Accumulation',     avgClosureHrs: 51, contractor: 'EastPune MuniSvc',          trustScore: 79, workerCount: 14, isHQ: false },
  { id: 'p4',  wardName: 'Ward 41 — Pimpri',           city: 'Pune',        lat: 18.6298, lng: 73.7997, activeIssues: 41, resolvedThisWeek: 32, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 43, contractor: 'PCMC Infra Works',          trustScore: 85, workerCount: 11, isHQ: false },
  { id: 'p5',  wardName: 'Ward 55 — Baner',            city: 'Pune',        lat: 18.5590, lng: 73.7868, activeIssues: 23, resolvedThisWeek: 21, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 26, contractor: 'BanerCity Civic Ops',       trustScore: 95, workerCount: 6,  isHQ: false },
  { id: 'p6',  wardName: 'Ward 64 — Kondhwa',          city: 'Pune',        lat: 18.4642, lng: 73.8818, activeIssues: 47, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Road Collapse',            avgClosureHrs: 57, contractor: 'SouthPune RoadForce',       trustScore: 76, workerCount: 12, isHQ: false },

  // ── AHMEDABAD ─────────────────────────────────────────────────
  { id: 'a1',  wardName: 'Ward 8 — Maninagar',         city: 'Ahmedabad',   lat: 22.9937, lng: 72.5876, activeIssues: 49, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 53, contractor: 'AMC Zone East Works',        trustScore: 80, workerCount: 13, isHQ: false },
  { id: 'a2',  wardName: 'Ward 21 — Bopal',            city: 'Ahmedabad',   lat: 23.0274, lng: 72.4685, activeIssues: 27, resolvedThisWeek: 23, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 31, contractor: 'WestAMC Roads Pvt',         trustScore: 91, workerCount: 7,  isHQ: false },
  { id: 'a3',  wardName: 'Ward 35 — Naranpura',        city: 'Ahmedabad',   lat: 23.0503, lng: 72.5523, activeIssues: 38, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 40, contractor: 'GWSSB Civic Ops',           trustScore: 87, workerCount: 10, isHQ: false },
  { id: 'a4',  wardName: 'Ward 48 — Vatva',            city: 'Ahmedabad',   lat: 22.9532, lng: 72.6441, activeIssues: 61, resolvedThisWeek: 42, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 68, contractor: 'SouthAMC EnviroWorks',      trustScore: 64, workerCount: 17, isHQ: false },
  { id: 'a5',  wardName: 'Ward 59 — Chandkheda',       city: 'Ahmedabad',   lat: 23.1143, lng: 72.5874, activeIssues: 33, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 36, contractor: 'NorthAMC Sanita Corp',      trustScore: 88, workerCount: 9,  isHQ: false },

  // ── JAIPUR ────────────────────────────────────────────────────
  { id: 'j1',  wardName: 'Ward 11 — Sindhi Camp',      city: 'Jaipur',      lat: 26.9124, lng: 75.7873, activeIssues: 44, resolvedThisWeek: 32, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 50, contractor: 'RajCivic Infrastructure',   trustScore: 77, workerCount: 12, isHQ: false },
  { id: 'j2',  wardName: 'Ward 24 — Mansarovar',       city: 'Jaipur',      lat: 26.8517, lng: 75.7691, activeIssues: 31, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 34, contractor: 'PinkCity ElecWorks',        trustScore: 89, workerCount: 9,  isHQ: false },
  { id: 'j3',  wardName: 'Ward 38 — Vaishali Nagar',   city: 'Jaipur',      lat: 26.9032, lng: 75.7388, activeIssues: 26, resolvedThisWeek: 23, slaBreaches: 0, topCategory: 'Water Supply Failure',     avgClosureHrs: 28, contractor: 'PHED Rajasthan Works',      trustScore: 93, workerCount: 7,  isHQ: false },
  { id: 'j4',  wardName: 'Ward 52 — Sanganer',         city: 'Jaipur',      lat: 26.7944, lng: 75.8080, activeIssues: 53, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 64, contractor: 'SouthJaipur EnvCtrl',       trustScore: 62, workerCount: 14, isHQ: false },
  { id: 'j5',  wardName: 'Ward 65 — Murlipura',        city: 'Jaipur',      lat: 26.9658, lng: 75.7782, activeIssues: 37, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 41, contractor: 'NorthJMC Sanita Corp',      trustScore: 84, workerCount: 10, isHQ: false },

  // ── SURAT ─────────────────────────────────────────────────────
  { id: 's1',  wardName: 'Ward 6 — Ring Road',         city: 'Surat',       lat: 21.1702, lng: 72.8311, activeIssues: 38, resolvedThisWeek: 31, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 39, contractor: 'SMC Zone-C Works',          trustScore: 87, workerCount: 10, isHQ: false },
  { id: 's2',  wardName: 'Ward 17 — Udhna',            city: 'Surat',       lat: 21.1592, lng: 72.8656, activeIssues: 55, resolvedThisWeek: 38, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 62, contractor: 'SouthSurat EnviroWorks',    trustScore: 65, workerCount: 15, isHQ: false },
  { id: 's3',  wardName: 'Ward 28 — Katargam',         city: 'Surat',       lat: 21.2132, lng: 72.8252, activeIssues: 42, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 48, contractor: 'NorthSurat DrainCorp',      trustScore: 79, workerCount: 11, isHQ: false },
  { id: 's4',  wardName: 'Ward 39 — Vesu',             city: 'Surat',       lat: 21.1358, lng: 72.7742, activeIssues: 19, resolvedThisWeek: 18, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 21, contractor: 'WestSurat ElecOps',         trustScore: 96, workerCount: 5,  isHQ: false },

  // ── LUCKNOW ───────────────────────────────────────────────────
  { id: 'l1',  wardName: 'Ward 14 — Hazratganj',       city: 'Lucknow',     lat: 26.8568, lng: 80.9418, activeIssues: 52, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 60, contractor: 'LMC Zone-A Infra',          trustScore: 72, workerCount: 14, isHQ: false },
  { id: 'l2',  wardName: 'Ward 28 — Aliganj',          city: 'Lucknow',     lat: 26.8956, lng: 80.9568, activeIssues: 36, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 40, contractor: 'NorthLko JalCorp',          trustScore: 85, workerCount: 9,  isHQ: false },
  { id: 'l3',  wardName: 'Ward 41 — Gomtinagar',       city: 'Lucknow',     lat: 26.8493, lng: 81.0019, activeIssues: 28, resolvedThisWeek: 25, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 30, contractor: 'LkoCentralClean Pvt',       trustScore: 91, workerCount: 7,  isHQ: false },
  { id: 'l4',  wardName: 'Ward 57 — Indira Nagar',     city: 'Lucknow',     lat: 26.8855, lng: 80.9962, activeIssues: 47, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 54, contractor: 'EastLko Drainage Corp',     trustScore: 77, workerCount: 12, isHQ: false },
  { id: 'l5',  wardName: 'Ward 71 — Alambagh',         city: 'Lucknow',     lat: 26.8055, lng: 80.8963, activeIssues: 61, resolvedThisWeek: 43, slaBreaches: 2, topCategory: 'Open Manhole',             avgClosureHrs: 69, contractor: 'SouthLko RoadForce',        trustScore: 63, workerCount: 16, isHQ: false },

  // ── KANPUR ────────────────────────────────────────────────────
  { id: 'kp1', wardName: 'Ward 9 — Civil Lines',       city: 'Kanpur',      lat: 26.4750, lng: 80.3294, activeIssues: 48, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 55, contractor: 'KMC Central Infra',         trustScore: 75, workerCount: 13, isHQ: false },
  { id: 'kp2', wardName: 'Ward 23 — Swaroop Nagar',    city: 'Kanpur',      lat: 26.4913, lng: 80.2963, activeIssues: 63, resolvedThisWeek: 44, slaBreaches: 2, topCategory: 'Sewage Overflow',          avgClosureHrs: 71, contractor: 'KanpurDrain Corp',          trustScore: 61, workerCount: 17, isHQ: false },
  { id: 'kp3', wardName: 'Ward 37 — Kidwai Nagar',     city: 'Kanpur',      lat: 26.4566, lng: 80.3460, activeIssues: 39, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 43, contractor: 'SouthKNP Sanita Corp',      trustScore: 82, workerCount: 10, isHQ: false },

  // ── NAGPUR ────────────────────────────────────────────────────
  { id: 'ng1', wardName: 'Ward 7 — Dharampeth',        city: 'Nagpur',      lat: 21.1365, lng: 79.0751, activeIssues: 31, resolvedThisWeek: 26, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 34, contractor: 'NMC West Zone Infra',       trustScore: 90, workerCount: 8,  isHQ: false },
  { id: 'ng2', wardName: 'Ward 19 — Sitabuldi',        city: 'Nagpur',      lat: 21.1457, lng: 79.0849, activeIssues: 44, resolvedThisWeek: 35, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 44, contractor: 'NMC Central Works',         trustScore: 86, workerCount: 11, isHQ: false },
  { id: 'ng3', wardName: 'Ward 33 — Gandhibagh',       city: 'Nagpur',      lat: 21.1541, lng: 79.1017, activeIssues: 56, resolvedThisWeek: 39, slaBreaches: 1, topCategory: 'Open Manhole',             avgClosureHrs: 60, contractor: 'NMC East HazardCtrl',       trustScore: 73, workerCount: 15, isHQ: false },
  { id: 'ng4', wardName: 'Ward 46 — Wathoda',          city: 'Nagpur',      lat: 21.1100, lng: 79.1329, activeIssues: 38, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 41, contractor: 'NMC South Sanita Corp',     trustScore: 85, workerCount: 10, isHQ: false },

  // ── BHOPAL ────────────────────────────────────────────────────
  { id: 'bp1', wardName: 'Ward 12 — MP Nagar',         city: 'Bhopal',      lat: 23.2332, lng: 77.4324, activeIssues: 37, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 40, contractor: 'BMC Zone-B Roads',          trustScore: 88, workerCount: 10, isHQ: false },
  { id: 'bp2', wardName: 'Ward 24 — Bhopal Old City',  city: 'Bhopal',      lat: 23.2685, lng: 77.4012, activeIssues: 53, resolvedThisWeek: 38, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 57, contractor: 'OldBhopal DrainSvc',        trustScore: 76, workerCount: 14, isHQ: false },
  { id: 'bp3', wardName: 'Ward 35 — Kolar Road',       city: 'Bhopal',      lat: 23.1714, lng: 77.4558, activeIssues: 28, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Water Pipeline Leak',      avgClosureHrs: 31, contractor: 'SouthBhopal JalWorks',      trustScore: 92, workerCount: 7,  isHQ: false },

  // ── VISAKHAPATNAM ─────────────────────────────────────────────
  { id: 'v1',  wardName: 'Ward 8 — MVP Colony',        city: 'Visakhapatnam', lat: 17.7231, lng: 83.3012, activeIssues: 41, resolvedThisWeek: 32, slaBreaches: 0, topCategory: 'Coastal Erosion',       avgClosureHrs: 44, contractor: 'GVMC North Zone',          trustScore: 85, workerCount: 11, isHQ: false },
  { id: 'v2',  wardName: 'Ward 21 — Gajuwaka',         city: 'Visakhapatnam', lat: 17.6828, lng: 83.2058, activeIssues: 62, resolvedThisWeek: 44, slaBreaches: 2, topCategory: 'Industrial Effluent',   avgClosureHrs: 67, contractor: 'GVMC South EnvCtrl',       trustScore: 64, workerCount: 17, isHQ: false },
  { id: 'v3',  wardName: 'Ward 34 — Waltair',          city: 'Visakhapatnam', lat: 17.7304, lng: 83.3317, activeIssues: 24, resolvedThisWeek: 22, slaBreaches: 0, topCategory: 'Road Damage',           avgClosureHrs: 27, contractor: 'GVMC East Roads',          trustScore: 94, workerCount: 6,  isHQ: false },

  // ── PATNA ─────────────────────────────────────────────────────
  { id: 'pt1', wardName: 'Ward 5 — Boring Road',       city: 'Patna',       lat: 25.6093, lng: 85.1376, activeIssues: 55, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 65, contractor: 'PMC Zone-A Infra',          trustScore: 66, workerCount: 15, isHQ: false },
  { id: 'pt2', wardName: 'Ward 18 — Rajendra Nagar',   city: 'Patna',       lat: 25.5941, lng: 85.1411, activeIssues: 43, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 52, contractor: 'PMC Central DrainCorp',     trustScore: 74, workerCount: 11, isHQ: false },
  { id: 'pt3', wardName: 'Ward 31 — Patliputra Colony',city: 'Patna',       lat: 25.6125, lng: 85.0880, activeIssues: 34, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 37, contractor: 'PMC Sanita Corp',           trustScore: 83, workerCount: 9,  isHQ: false },

  // ── BHUBANESWAR ───────────────────────────────────────────────
  { id: 'bb1', wardName: 'Ward 11 — Saheed Nagar',     city: 'Bhubaneswar', lat: 20.2961, lng: 85.8245, activeIssues: 32, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 35, contractor: 'BMC East Infra',            trustScore: 89, workerCount: 9,  isHQ: false },
  { id: 'bb2', wardName: 'Ward 22 — Khandagiri',       city: 'Bhubaneswar', lat: 20.2557, lng: 85.7848, activeIssues: 45, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 50, contractor: 'BMC West DrainWorks',       trustScore: 79, workerCount: 12, isHQ: false },

  // ── KOCHI ─────────────────────────────────────────────────────
  { id: 'kc1', wardName: 'Ward 9 — Ernakulam',         city: 'Kochi',       lat: 9.9816,  lng: 76.2999, activeIssues: 29, resolvedThisWeek: 25, slaBreaches: 0, topCategory: 'Flooding/Waterlogging',    avgClosureHrs: 32, contractor: 'KMC Zone-C Works',          trustScore: 91, workerCount: 8,  isHQ: false },
  { id: 'kc2', wardName: 'Ward 21 — Mattancherry',     city: 'Kochi',       lat: 9.9587,  lng: 76.2596, activeIssues: 41, resolvedThisWeek: 32, slaBreaches: 1, topCategory: 'Coastal Erosion',          avgClosureHrs: 46, contractor: 'KMC South CoastalWks',      trustScore: 80, workerCount: 11, isHQ: false },
  { id: 'kc3', wardName: 'Ward 35 — Kakkanad',         city: 'Kochi',       lat: 10.0265, lng: 76.3558, activeIssues: 36, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 39, contractor: 'EastKochi InfraCorp',       trustScore: 87, workerCount: 10, isHQ: false },

  // ── INDORE ────────────────────────────────────────────────────
  { id: 'in1', wardName: 'Ward 13 — Rajwada',          city: 'Indore',      lat: 22.7184, lng: 75.8577, activeIssues: 48, resolvedThisWeek: 37, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 52, contractor: 'IMC Zone-A Roads',          trustScore: 79, workerCount: 13, isHQ: false },
  { id: 'in2', wardName: 'Ward 27 — Vijay Nagar',      city: 'Indore',      lat: 22.7435, lng: 75.8850, activeIssues: 31, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 34, contractor: 'IMC ElecWorks',             trustScore: 90, workerCount: 8,  isHQ: false },
  { id: 'in3', wardName: 'Ward 41 — Palasia',          city: 'Indore',      lat: 22.7195, lng: 75.8792, activeIssues: 39, resolvedThisWeek: 31, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 40, contractor: 'IMC Sanita Corp',           trustScore: 93, workerCount: 10, isHQ: false },

  // ── THIRUVANANTHAPURAM ────────────────────────────────────────
  { id: 'tv1', wardName: 'Ward 6 — Kowdiar',           city: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, activeIssues: 27, resolvedThisWeek: 23, slaBreaches: 0, topCategory: 'Road Damage',       avgClosureHrs: 30, contractor: 'TVM Corp Zone-A',          trustScore: 92, workerCount: 7,  isHQ: false },
  { id: 'tv2', wardName: 'Ward 18 — Kazhakootam',      city: 'Thiruvananthapuram', lat: 8.5772, lng: 76.8793, activeIssues: 43, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Drainage Overflow',  avgClosureHrs: 48, contractor: 'TVM North DrainSvc',       trustScore: 78, workerCount: 11, isHQ: false },

  // ── COIMBATORE ────────────────────────────────────────────────
  { id: 'cb1', wardName: 'Ward 7 — RS Puram',          city: 'Coimbatore',  lat: 11.0144, lng: 76.9629, activeIssues: 33, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 35, contractor: 'CoimbatoreCorp WestWks',    trustScore: 88, workerCount: 9,  isHQ: false },
  { id: 'cb2', wardName: 'Ward 19 — Singanallur',      city: 'Coimbatore',  lat: 10.9988, lng: 77.0213, activeIssues: 51, resolvedThisWeek: 37, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 56, contractor: 'CoimbEast DrainCorp',       trustScore: 75, workerCount: 14, isHQ: false },

  // ── GUWAHATI ──────────────────────────────────────────────────
  { id: 'gw1', wardName: 'Ward 4 — Paltan Bazar',      city: 'Guwahati',    lat: 26.1445, lng: 91.7362, activeIssues: 58, resolvedThisWeek: 38, slaBreaches: 2, topCategory: 'Flooding/Landslide Risk',  avgClosureHrs: 68, contractor: 'GMC Central Works',         trustScore: 67, workerCount: 16, isHQ: false },
  { id: 'gw2', wardName: 'Ward 15 — Dispur',           city: 'Guwahati',    lat: 26.1258, lng: 91.8044, activeIssues: 37, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 44, contractor: 'GMC East Roads Pvt',        trustScore: 82, workerCount: 10, isHQ: false },

  // ── CHANDIGARH ────────────────────────────────────────────────
  { id: 'ch1', wardName: 'Ward 3 — Sector 22',         city: 'Chandigarh',  lat: 30.7408, lng: 76.7882, activeIssues: 21, resolvedThisWeek: 20, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 22, contractor: 'MC Chandigarh Elec',        trustScore: 97, workerCount: 5,  isHQ: false },
  { id: 'ch2', wardName: 'Ward 16 — Sector 38',        city: 'Chandigarh',  lat: 30.7126, lng: 76.7684, activeIssues: 16, resolvedThisWeek: 15, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 18, contractor: 'MC Chandigarh Roads',       trustScore: 98, workerCount: 4,  isHQ: false },

  // ── VARANASI ──────────────────────────────────────────────────
  { id: 'vr1', wardName: 'Ward 7 — Dashashwamedh',     city: 'Varanasi',    lat: 25.3067, lng: 83.0100, activeIssues: 69, resolvedThisWeek: 45, slaBreaches: 3, topCategory: 'Ghaat Drainage Overflow',  avgClosureHrs: 78, contractor: 'VMC Heritage Zone Corp',    trustScore: 55, workerCount: 19, isHQ: false },
  { id: 'vr2', wardName: 'Ward 22 — Sigra',            city: 'Varanasi',    lat: 25.3330, lng: 82.9881, activeIssues: 44, resolvedThisWeek: 32, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 52, contractor: 'VMC North Infra',           trustScore: 72, workerCount: 12, isHQ: false },

  // ── AMRITSAR ──────────────────────────────────────────────────
  { id: 'am1', wardName: 'Ward 5 — Heritage Zone',     city: 'Amritsar',    lat: 31.6340, lng: 74.8723, activeIssues: 52, resolvedThisWeek: 38, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 61, contractor: 'AMC Heritage Roads',        trustScore: 70, workerCount: 14, isHQ: false },
  { id: 'am2', wardName: 'Ward 18 — Ranjit Avenue',    city: 'Amritsar',    lat: 31.6494, lng: 74.8721, activeIssues: 28, resolvedThisWeek: 25, slaBreaches: 0, topCategory: 'Streetlight Failure',      avgClosureHrs: 30, contractor: 'AMC Elec Corp',             trustScore: 91, workerCount: 7,  isHQ: false },

  // ── DEHRADUN ──────────────────────────────────────────────────
  { id: 'dd1', wardName: 'Ward 9 — Rajpur Road',       city: 'Dehradun',    lat: 30.3465, lng: 78.0322, activeIssues: 35, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Landslide Risk Report',    avgClosureHrs: 39, contractor: 'Dehradun Hill Works',       trustScore: 86, workerCount: 9,  isHQ: false },
  { id: 'dd2', wardName: 'Ward 20 — ISBT Area',        city: 'Dehradun',    lat: 30.3177, lng: 78.0375, activeIssues: 47, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 53, contractor: 'DMC Central Infra',         trustScore: 76, workerCount: 12, isHQ: false },

  // ── MADURAI ───────────────────────────────────────────────────
  { id: 'md1', wardName: 'Ward 8 — Goripalayam',       city: 'Madurai',     lat: 9.9195,  lng: 78.1193, activeIssues: 49, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 56, contractor: 'MMC South DrainSvc',        trustScore: 76, workerCount: 13, isHQ: false },
  { id: 'md2', wardName: 'Ward 19 — Anna Nagar',       city: 'Madurai',     lat: 9.9585,  lng: 78.1254, activeIssues: 31, resolvedThisWeek: 26, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 33, contractor: 'MMC North Sanita',          trustScore: 88, workerCount: 8,  isHQ: false },

  // ── RAIPUR ────────────────────────────────────────────────────
  { id: 'rp1', wardName: 'Ward 11 — Pandri',           city: 'Raipur',      lat: 21.2514, lng: 81.6296, activeIssues: 41, resolvedThisWeek: 31, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 45, contractor: 'RMC Zone-B Roads',          trustScore: 83, workerCount: 11, isHQ: false },
  { id: 'rp2', wardName: 'Ward 24 — Shankar Nagar',    city: 'Raipur',      lat: 21.2669, lng: 81.6541, activeIssues: 36, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 40, contractor: 'RMC DrainCorp',             trustScore: 86, workerCount: 9,  isHQ: false },

  // ── AGRA ──────────────────────────────────────────────────────
  { id: 'ag1', wardName: 'Ward 6 — Tajganj',           city: 'Agra',        lat: 27.1767, lng: 78.0214, activeIssues: 58, resolvedThisWeek: 39, slaBreaches: 2, topCategory: 'Heritage Zone Encroach',   avgClosureHrs: 68, contractor: 'AMC Heritage Works',        trustScore: 63, workerCount: 16, isHQ: false },
  { id: 'ag2', wardName: 'Ward 19 — Sikandra',         city: 'Agra',        lat: 27.2172, lng: 77.9555, activeIssues: 39, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 44, contractor: 'AMC North Infra',           trustScore: 80, workerCount: 10, isHQ: false },

  // ── MORE SCATTERED NODES (Tier 2/3) ───────────────────────────
  { id: 'r01', wardName: 'Ward 3 — Jodhpur Sadar',     city: 'Jodhpur',     lat: 26.2389, lng: 73.0243, activeIssues: 44, resolvedThisWeek: 32, slaBreaches: 1, topCategory: 'Water Supply Failure',     avgClosureHrs: 51, contractor: 'Blue City Civic Corp',      trustScore: 74, workerCount: 12, isHQ: false },
  { id: 'r02', wardName: 'Ward 11 — Udaipur City',     city: 'Udaipur',     lat: 24.5854, lng: 73.7125, activeIssues: 29, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 33, contractor: 'Lake City Infra',          trustScore: 88, workerCount: 8,  isHQ: false },
  { id: 'r03', wardName: 'Ward 7 — Kota Industrial',   city: 'Kota',        lat: 25.2138, lng: 75.8648, activeIssues: 61, resolvedThisWeek: 43, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 67, contractor: 'Kota Civic Works Ltd',     trustScore: 62, workerCount: 16, isHQ: false },
  { id: 'r04', wardName: 'Ward 5 — Bikaner Central',   city: 'Bikaner',     lat: 28.0229, lng: 73.3119, activeIssues: 36, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 40, contractor: 'Desert Civic Corp',        trustScore: 83, workerCount: 9,  isHQ: false },
  { id: 'r05', wardName: 'Ward 9 — Ajmer Dargah',      city: 'Ajmer',       lat: 26.4499, lng: 74.6399, activeIssues: 48, resolvedThisWeek: 35, slaBreaches: 1, topCategory: 'Heritage Encroachment',    avgClosureHrs: 55, contractor: 'AMC Pilgrim Zone Corp',   trustScore: 71, workerCount: 13, isHQ: false },
  { id: 'g01', wardName: 'Ward 5 — Vadodara Raopura',  city: 'Vadodara',    lat: 22.3072, lng: 73.1812, activeIssues: 46, resolvedThisWeek: 35, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 50, contractor: 'VMC Zone-A Roads',        trustScore: 78, workerCount: 12, isHQ: false },
  { id: 'g02', wardName: 'Ward 12 — Rajkot Central',   city: 'Rajkot',      lat: 22.3039, lng: 70.8022, activeIssues: 38, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 42, contractor: 'RMC Zone-B Infra',        trustScore: 84, workerCount: 10, isHQ: false },
  { id: 'g03', wardName: 'Ward 8 — Bhavnagar Port',    city: 'Bhavnagar',   lat: 21.7645, lng: 72.1519, activeIssues: 33, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Coastal Erosion',          avgClosureHrs: 37, contractor: 'Port City Coastal Wks',   trustScore: 87, workerCount: 9,  isHQ: false },
  { id: 'mp1', wardName: 'Ward 14 — Jabalpur Napier',  city: 'Jabalpur',    lat: 23.1815, lng: 79.9864, activeIssues: 52, resolvedThisWeek: 38, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 58, contractor: 'JMC Marble City Roads',   trustScore: 76, workerCount: 14, isHQ: false },
  { id: 'mp2', wardName: 'Ward 7 — Gwalior Morar',     city: 'Gwalior',     lat: 26.2183, lng: 78.1828, activeIssues: 47, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 54, contractor: 'GMC Zone-B DrainSvc',     trustScore: 73, workerCount: 13, isHQ: false },
  { id: 'up1', wardName: 'Ward 6 — Allahabad Katra',   city: 'Prayagraj',   lat: 25.4358, lng: 81.8463, activeIssues: 68, resolvedThisWeek: 47, slaBreaches: 3, topCategory: 'Ghaat Flood Risk',         avgClosureHrs: 76, contractor: 'PMC Triveni Corp',        trustScore: 54, workerCount: 18, isHQ: false },
  { id: 'up2', wardName: 'Ward 9 — Meerut Hapur Rd',   city: 'Meerut',      lat: 28.9845, lng: 77.7064, activeIssues: 55, resolvedThisWeek: 39, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 63, contractor: 'MMC Zone-A Infra',        trustScore: 68, workerCount: 15, isHQ: false },
  { id: 'up3', wardName: 'Ward 5 — Bareilly Civil',    city: 'Bareilly',    lat: 28.3670, lng: 79.4304, activeIssues: 42, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 50, contractor: 'BMC North DrainSvc',      trustScore: 75, workerCount: 11, isHQ: false },
  { id: 'up4', wardName: 'Ward 3 — Moradabad City',    city: 'Moradabad',   lat: 28.8386, lng: 78.7733, activeIssues: 37, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Garbage Accumulation',     avgClosureHrs: 41, contractor: 'MMC Sanita Corp',         trustScore: 84, workerCount: 10, isHQ: false },
  { id: 'up5', wardName: 'Ward 7 — Aligarh Civil',     city: 'Aligarh',     lat: 27.8974, lng: 78.0880, activeIssues: 49, resolvedThisWeek: 35, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 56, contractor: 'AMC Zone-B Roads',        trustScore: 72, workerCount: 13, isHQ: false },
  { id: 'hy1', wardName: 'Ward 4 — Faridabad NIT',     city: 'Faridabad',   lat: 28.4089, lng: 77.3178, activeIssues: 58, resolvedThisWeek: 41, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 65, contractor: 'MCF Zone-B EnvCtrl',     trustScore: 66, workerCount: 16, isHQ: false },
  { id: 'hy2', wardName: 'Ward 9 — Gurgaon Sec 14',    city: 'Gurugram',    lat: 28.4595, lng: 77.0266, activeIssues: 43, resolvedThisWeek: 35, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 48, contractor: 'MCG Smart Civic Ops',    trustScore: 78, workerCount: 12, isHQ: false },
  { id: 'pb1', wardName: 'Ward 5 — Ludhiana Gill Rd',  city: 'Ludhiana',    lat: 30.9010, lng: 75.8573, activeIssues: 63, resolvedThisWeek: 44, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 70, contractor: 'LMC Zone-C EnvCtrl',     trustScore: 63, workerCount: 17, isHQ: false },
  { id: 'pb2', wardName: 'Ward 8 — Jalandhar Bootan',  city: 'Jalandhar',   lat: 31.3260, lng: 75.5762, activeIssues: 48, resolvedThisWeek: 35, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 54, contractor: 'JMC Central Roads',      trustScore: 74, workerCount: 13, isHQ: false },
  { id: 'hp1', wardName: 'Ward 4 — Shimla Mall Road',  city: 'Shimla',      lat: 31.1048, lng: 77.1734, activeIssues: 29, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Landslide Risk Report',    avgClosureHrs: 33, contractor: 'SMC Hill Works Corp',    trustScore: 89, workerCount: 8,  isHQ: false },
  { id: 'uk1', wardName: 'Ward 5 — Haridwar Kankhal',  city: 'Haridwar',    lat: 29.9457, lng: 78.1642, activeIssues: 56, resolvedThisWeek: 39, slaBreaches: 2, topCategory: 'Pilgrim Route Damage',     avgClosureHrs: 64, contractor: 'HMC Ganga Ghat Corp',   trustScore: 65, workerCount: 15, isHQ: false },
  { id: 'jh1', wardName: 'Ward 8 — Ranchi Main Road',  city: 'Ranchi',      lat: 23.3441, lng: 85.3096, activeIssues: 53, resolvedThisWeek: 37, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 61, contractor: 'RMC Zone-A Roads',       trustScore: 69, workerCount: 14, isHQ: false },
  { id: 'jh2', wardName: 'Ward 5 — Jamshedpur Bistupur',city:'Jamshedpur',  lat: 22.8046, lng: 86.2029, activeIssues: 38, resolvedThisWeek: 30, slaBreaches: 0, topCategory: 'Industrial Effluent',      avgClosureHrs: 43, contractor: 'JMC Tata Nagar Corp',   trustScore: 84, workerCount: 10, isHQ: false },
  { id: 'cg1', wardName: 'Ward 6 — Bhilai Steel City', city: 'Bhilai',      lat: 21.1938, lng: 81.3509, activeIssues: 49, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Industrial Effluent',      avgClosureHrs: 55, contractor: 'BMC Steel Zone Env',     trustScore: 72, workerCount: 13, isHQ: false },
  { id: 'od1', wardName: 'Ward 7 — Cuttack Badambadi', city: 'Cuttack',     lat: 20.4625, lng: 85.8830, activeIssues: 46, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Flood Risk Report',        avgClosureHrs: 52, contractor: 'CMC Mahanadi Corp',      trustScore: 74, workerCount: 12, isHQ: false },
  { id: 'wb1', wardName: 'Ward 5 — Asansol Burnpur',   city: 'Asansol',     lat: 23.6832, lng: 86.9620, activeIssues: 54, resolvedThisWeek: 38, slaBreaches: 2, topCategory: 'Industrial Effluent',      avgClosureHrs: 62, contractor: 'AMC Steel Zone Env',     trustScore: 66, workerCount: 14, isHQ: false },
  { id: 'bi1', wardName: 'Ward 6 — Gaya Bodhgaya Rd',  city: 'Gaya',        lat: 24.7914, lng: 84.9994, activeIssues: 51, resolvedThisWeek: 36, slaBreaches: 2, topCategory: 'Pilgrim Route Damage',     avgClosureHrs: 59, contractor: 'GMC Bodh Corp',          trustScore: 67, workerCount: 14, isHQ: false },
  { id: 'ap1', wardName: 'Ward 7 — Vijayawada Benz',   city: 'Vijayawada',  lat: 16.5062, lng: 80.6480, activeIssues: 56, resolvedThisWeek: 40, slaBreaches: 2, topCategory: 'Road Damage',              avgClosureHrs: 63, contractor: 'VMC Zone-A Roads',       trustScore: 68, workerCount: 15, isHQ: false },
  { id: 'tg1', wardName: 'Ward 4 — Warangal Hanamkonda',city:'Warangal',   lat: 17.9784, lng: 79.5941, activeIssues: 49, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 55, contractor: 'WMC Zone-A Infra',       trustScore: 76, workerCount: 13, isHQ: false },
  { id: 'ka1', wardName: 'Ward 6 — Mysuru Nazarabad',  city: 'Mysuru',      lat: 12.2958, lng: 76.6394, activeIssues: 35, resolvedThisWeek: 28, slaBreaches: 0, topCategory: 'Drainage Overflow',        avgClosureHrs: 38, contractor: 'MCC Heritage Corp',      trustScore: 88, workerCount: 9,  isHQ: false },
  { id: 'kl1', wardName: 'Ward 4 — Kozhikode Chalappuram',city:'Kozhikode', lat: 11.2588, lng: 75.7804, activeIssues: 34, resolvedThisWeek: 27, slaBreaches: 0, topCategory: 'Drainage Overflow',       avgClosureHrs: 38, contractor: 'KMC Coastal Corp',       trustScore: 88, workerCount: 9,  isHQ: false },
  { id: 'tn1', wardName: 'Ward 5 — Salem Steel',        city: 'Salem',       lat: 11.6643, lng: 78.1460, activeIssues: 47, resolvedThisWeek: 34, slaBreaches: 1, topCategory: 'Industrial Effluent',      avgClosureHrs: 53, contractor: 'SMC Steel Zone Env',     trustScore: 73, workerCount: 13, isHQ: false },
  { id: 'ne1', wardName: 'Ward 3 — Shillong Police Bazar',city:'Shillong',  lat: 25.5788, lng: 91.8933, activeIssues: 31, resolvedThisWeek: 24, slaBreaches: 0, topCategory: 'Landslide Risk Report',    avgClosureHrs: 35, contractor: 'SMC Hill Works Corp',    trustScore: 87, workerCount: 8,  isHQ: false },
  { id: 'jk1', wardName: 'Ward 5 — Srinagar Lal Chowk', city: 'Srinagar',   lat: 34.0837, lng: 74.7973, activeIssues: 44, resolvedThisWeek: 31, slaBreaches: 1, topCategory: 'Road Damage',              avgClosureHrs: 51, contractor: 'SMC Valley Works',       trustScore: 75, workerCount: 12, isHQ: false },
  { id: 'ga1', wardName: 'Ward 4 — Panaji Campal',      city: 'Panaji',      lat: 15.4989, lng: 73.8278, activeIssues: 19, resolvedThisWeek: 17, slaBreaches: 0, topCategory: 'Coastal Erosion',          avgClosureHrs: 21, contractor: 'CCP Goa Coastal Corp',   trustScore: 94, workerCount: 5,  isHQ: false },
  { id: 'mh1', wardName: 'Ward 2 — Jalgaon Central',    city: 'Jalgaon',     lat: 21.0077, lng: 75.5626, activeIssues: 38, resolvedThisWeek: 29, slaBreaches: 0, topCategory: 'Road Damage',              avgClosureHrs: 42, contractor: 'JMC North Infra',        trustScore: 82, workerCount: 10, isHQ: false },
  { id: 'mh2', wardName: 'Ward 4 — Aurangabad Cantm',   city: 'Aurangabad',  lat: 19.8762, lng: 75.3433, activeIssues: 49, resolvedThisWeek: 36, slaBreaches: 1, topCategory: 'Drainage Overflow',        avgClosureHrs: 55, contractor: 'AMC Heritage DrainSvc',  trustScore: 76, workerCount: 13, isHQ: false },
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
            radius={isBreached ? 8 : node.isHQ ? 6 : 3}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: isBreached ? 0.8 : 0.3,
              weight: isBreached ? 2 : 1,
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

