"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Timer,
  AlertTriangle,
  Radio,
  Scan,
  CheckCircle,
  Camera,
  MapPin,
  ChevronDown,
  RefreshCw,
  X,
  Navigation,
  ArrowLeft,
} from "lucide-react";

// --- TYPES ---
interface Ticket {
  id: string;
  department: string;
  issue_type: string;
  severity: number;
  created_at: string;
  status: string; // 'open', 'wip', 'resolved', 'escalated'
  before_image_url: string;
  after_image_url?: string;
  sla_hours: number;
  latitude?: number;
  longitude?: number;
  wip_started_at?: string;
}

interface DemoControls {
  badGps: boolean;
  aiConfusion: boolean;
}

// --- MAIN COMPONENT ---
export default function DepartmentPortal() {
  const [currentState, setCurrentState] = useState<number>(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  
  const [demo, setDemo] = useState<DemoControls>({ badGps: false, aiConfusion: false });
  const [showDemoPanel, setShowDemoPanel] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lockTimer, setLockTimer] = useState<number>(30);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- FETCH TICKETS ---
  const fetchTickets = useCallback(async () => {
    // Select from our newly created view to map category -> issue_type and postgis location -> lat/lng
    let query = supabase.from("department_tickets_view").select("*").in("status", ["open", "wip"]).order("created_at", { ascending: true });
    if (departmentFilter !== "All") {
      query = query.eq("department", departmentFilter);
    }
    const { data, error } = await query;
    if (data) setTickets(data);
  }, [departmentFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) { console.error("Camera access denied:", err); }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    if (currentState === 4) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [currentState]);

  // --- 30-SECOND LOCK TIMER ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (capturedImage && currentState === 4) {
      setLockTimer(30);
      interval = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCapturedImage(null);
            startCamera();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [capturedImage, currentState]);

  // --- HELPERS ---
  const runFakeLogs = async (logArray: string[], delay: number = 800) => {
    setLogs([]);
    for (let i = 0; i < logArray.length; i++) {
      await new Promise((r) => setTimeout(r, delay));
      setLogs((prev) => [...prev, logArray[i]]);
    }
  };

  // NEW: Persistent Timer Logic (Handles both FRT and SLA based on DB status)
  const getTimerData = (ticket: Ticket) => {
    let targetTime: number;
    let label: string;
    let isSLA = false;

    if (ticket.status === 'wip' && ticket.wip_started_at) {
      // Calculate SLA from the exact moment WIP started in Supabase
      targetTime = new Date(ticket.wip_started_at).getTime() + ticket.sla_hours * 60 * 60 * 1000;
      label = "RESOLUTION SLA";
      isSLA = true;
    } else {
      // Calculate FRT (24h) from creation
      targetTime = new Date(ticket.created_at).getTime() + 24 * 60 * 60 * 1000;
      label = "FIRST RESPONSE";
    }

    const diff = targetTime - Date.now();
    if (diff <= 0) return { text: "OVERDUE", color: "text-[#FF3366]", label, isSLA };
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    const color = isSLA 
       ? (h >= 24 ? "text-[#00FF9D]" : h > 0 ? "text-[#FFB020]" : "text-[#FF3366]")
       : (h >= 12 ? "text-[#00FF9D]" : h > 0 ? "text-[#FFB020]" : "text-[#FF3366]");

    return { text: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`, color, label, isSLA };
  };

  // NEW: Google Maps Navigation
  const handleNavigate = (lat?: number, lng?: number) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // --- STATE TRANSITIONS ---
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // If ticket is already WIP (e.g., after a refresh), skip geofencing and go to active WIP
    if (ticket.status === 'wip') {
      setCurrentState(3);
    } else {
      setCurrentState(2);
    }
  };

  const handleStartWIP = async () => {
    setIsProcessing(true);
    if (demo.badGps) {
      await runFakeLogs(["Checking Cell-Tower Triangulation...", "Error: Mock Location Detected."], 600);
      setIsProcessing(false);
      return;
    }
    
    await runFakeLogs([
      "Checking Cell-Tower Triangulation... Matched.",
      "Verifying GPS... Locked.",
      "Distance < 10m. Physical Presence Confirmed."
    ], 800);
    
    if (selectedTicket) {
      // Save the exact start time to Supabase to make the timer persistent
      await supabase.from("tickets").update({ 
        status: "wip", 
        wip_started_at: new Date().toISOString() 
      }).eq("id", selectedTicket.id);
      
      // Update local state to reflect DB change immediately
      setSelectedTicket({ ...selectedTicket, status: "wip", wip_started_at: new Date().toISOString() });
    }
    setIsProcessing(false);
    setCurrentState(3);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg"));
        stopCamera();
      }
    }
  };

  const handleSubmitProof = async () => {
    if (!capturedImage || !selectedTicket) return;
    setIsProcessing(true);
    setCurrentState(5);

    const blob = await (await fetch(capturedImage)).blob();
    // Bypassing auth for demo: we use a random session ID for storage
    const sessionId =
      typeof window !== "undefined" && localStorage.getItem("demoSessionId")
        ? localStorage.getItem("demoSessionId")!
        : Math.random().toString(36).substring(2);
    if (typeof window !== "undefined") {
      localStorage.setItem("demoSessionId", sessionId);
    }

    const fileName = `demo-${sessionId}/after_${selectedTicket.id}_${Date.now()}.jpg`;
    const { data: uploadData } = await supabase.storage.from("civic-evidence").upload(fileName, blob, { contentType: "image/jpeg" });

    if (uploadData) {
      const { data: urlData } = supabase.storage.from("civic-evidence").getPublicUrl(fileName);
      await supabase.from("tickets").update({ 
        // Our enum is 'open', 'wip', 'resolved', 'rejected'
        status: demo.aiConfusion ? "rejected" : "resolved", 
        after_image_url: urlData.publicUrl 
      }).eq("id", selectedTicket.id);
    }

    if (demo.aiConfusion) {
      await runFakeLogs(["Comparing Semantic Features...", "Obstructed View Detected.", "Confidence: 62%. Below Threshold."], 1000);
    } else {
      await runFakeLogs(["Comparing Semantic Features... Match.", "EXIF Data... Verified.", "Cryptographic Hash Generated."], 1000);
    }
    setIsProcessing(false);
  };

  const resetToQueue = () => {
    setCurrentState(1);
    setSelectedTicket(null);
    setCapturedImage(null);
    setLogs([]);
    fetchTickets(); // Refresh queue to show updated SLA timers
  };

  // Force re-render every second for ticking timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050A0F] text-[#E8F3F7] flex justify-center font-mono">
      <div className="w-full max-w-[480px] relative flex flex-col h-screen overflow-hidden">
        
        {/* TOP BAR WITH BACK BUTTON */}
        <header className="bg-[#08121A] border-b border-[#1C303B] p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {currentState > 1 ? (
              <button onClick={resetToQueue} className="text-[#B5C6CE] hover:text-[#E8F3F7] transition p-1 -ml-1">
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div className="w-8 h-8 bg-[#00E5FF] rounded-md flex items-center justify-center text-[#050A0F] font-bold">W</div>
            )}
            <span className="text-[#E8F3F7] font-bold tracking-tight">whatDAfix</span>
          </div>
          {currentState === 1 && (
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-[#0D1922] border border-[#1C303B] text-[#B5C6CE] text-xs rounded px-2 py-1 outline-none"
            >
              <option value="All">All Depts</option>
              <option value="PWD (Roads)">PWD (Roads)</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Water Board">Water Board</option>
              <option value="General">General</option>
            </select>
          )}
        </header>

        {/* DEMO CONTROL PANEL */}
        <div className="bg-[#111F29] border-b border-[#1C303B]">
          <button 
            onClick={() => setShowDemoPanel(!showDemoPanel)}
            className="w-full text-[10px] text-[#566B76] uppercase tracking-widest p-2 flex justify-center items-center gap-1 hover:bg-[#152733] transition"
          >
            <ChevronDown size={12} className={`transition ${showDemoPanel ? '' : 'rotate-180'}`} />
            Demo Controls
          </button>
          {showDemoPanel && (
            <div className="p-4 flex flex-col gap-3 border-t border-[#1C303B]">
              <label className="flex items-center justify-between text-xs text-[#B5C6CE]">
                <span>Simulate Bad GPS</span>
                <div onClick={() => setDemo({ ...demo, badGps: !demo.badGps })} className={`w-10 h-5 rounded-full relative cursor-pointer transition ${demo.badGps ? 'bg-[#FF3366]' : 'bg-[#1C303B]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${demo.badGps ? 'left-5' : 'left-0.5'}`} />
                </div>
              </label>
              <label className="flex items-center justify-between text-xs text-[#B5C6CE]">
                <span>Simulate AI Confusion</span>
                <div onClick={() => setDemo({ ...demo, aiConfusion: !demo.aiConfusion })} className={`w-10 h-5 rounded-full relative cursor-pointer transition ${demo.aiConfusion ? 'bg-[#FFB020]' : 'bg-[#1C303B]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${demo.aiConfusion ? 'left-5' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto relative">
          
          {/* STATE 1: URGENCY QUEUE */}
          {currentState === 1 && (
            <div className="p-4 flex flex-col gap-3">
              <h2 className="text-[#7E939E] text-xs uppercase tracking-widest mb-2">Active Dispatch Queue</h2>
              {tickets.length === 0 && <p className="text-[#566B76] text-sm">No active tickets.</p>}
              {tickets.map((ticket) => {
                const timer = getTimerData(ticket);
                const borderColor = timer.color.replace('text-', 'border-');
                return (
                  <div 
                    key={ticket.id} 
                    onClick={() => handleSelectTicket(ticket)}
                    className={`bg-[#0D1922] border-l-4 ${borderColor} border border-[#1C303B] rounded-r-lg p-4 cursor-pointer hover:bg-[#111F29] transition`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[#E8F3F7] font-bold text-sm">{ticket.issue_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${timer.isSLA ? 'bg-[#152733] border-[#00E5FF] text-[#00E5FF]' : 'bg-[#050A0F] border-[#1C303B] text-[#00E5FF]'}`}>
                        SEV: {ticket.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#7E939E]">
                      <span>{ticket.department}</span>
                      <div className={`flex items-center gap-1 font-mono ${timer.color}`}>
                        <Timer size={12} />
                        <span className="uppercase text-[10px] mr-1 opacity-70">{timer.label}:</span> {timer.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STATE 2: GEOFENCING & START WIP */}
          {currentState === 2 && selectedTicket && (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="text-[#E8F3F7] font-bold text-lg">{selectedTicket.issue_type}</h2>
                  <button 
                    onClick={() => handleNavigate(selectedTicket.latitude, selectedTicket.longitude)}
                    className="bg-[#00E5FF] text-[#050A0F] p-2 rounded-lg hover:bg-[#00B8CC] transition flex items-center gap-1 text-xs font-bold"
                  >
                    <Navigation size={14} /> NAVIGATE
                  </button>
                </div>
                <p className="text-[#7E939E] text-xs flex items-center gap-1 mb-4">
                  <MapPin size={12}/> Sector 4, Grid 9 ({selectedTicket.latitude?.toFixed(4) || "0.0000"}, {selectedTicket.longitude?.toFixed(4) || "0.0000"})
                </p>
                
                <div className="bg-[#0D1922] border border-[#1C303B] rounded-lg overflow-hidden mb-4 aspect-video relative">
                  <img src={selectedTicket.before_image_url} alt="Before" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-2 left-2 bg-[#050A0F]/80 text-[#FFB020] text-[10px] px-2 py-1 rounded uppercase tracking-wider">Before</div>
                </div>

                <div className="bg-[#050A0F] border border-[#1C303B] rounded p-3 h-24 overflow-y-auto font-mono text-[10px] text-[#00FF9D] mb-4">
                  {logs.length === 0 && <span className="text-[#566B76]">Awaiting geofence verification...</span>}
                  {logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
                </div>
              </div>

              <button 
                onClick={handleStartWIP}
                disabled={isProcessing}
                className="w-full bg-[#00E5FF] text-[#050A0F] font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#00B8CC] transition disabled:opacity-50"
              >
                {isProcessing ? <Radio className="animate-ping" size={20} /> : <Radio size={20} />}
                START WORK IN PROGRESS
              </button>

              {demo.badGps && logs.length > 0 && !isProcessing && (
                <div className="absolute inset-0 bg-[#FF3366]/95 z-50 flex flex-col items-center justify-center p-8 text-center">
                  <AlertTriangle size={48} className="mb-4 text-white" />
                  <h3 className="text-white font-bold text-xl mb-2">Physical Presence Unverified</h3>
                  <p className="text-white/80 text-sm mb-6">Distance &gt; 100m or Mock Location Detected.</p>
                  <button onClick={() => { setLogs([]); }} className="bg-white text-[#FF3366] font-bold px-6 py-2 rounded">Retry</button>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: WIP ACTIVE */}
          {currentState === 3 && selectedTicket && (
            <div className="flex flex-col h-full">
              <div className="bg-[#152733] p-4 text-center border-b border-[#1C303B] animate-pulse">
                <div className="text-[#00E5FF] text-xs font-bold tracking-widest mb-1">STATUS: WORK IN PROGRESS</div>
                <div className={`text-3xl font-mono font-bold ${getTimerData(selectedTicket).color}`}>
                  {getTimerData(selectedTicket).text}
                </div>
                <div className="text-[#7E939E] text-[10px] mt-1">{getTimerData(selectedTicket).label} REMAINING</div>
              </div>
              
              <div className="flex-1 p-4 flex flex-col justify-center items-center text-center">
                <Scan size={64} className="text-[#00E5FF] mb-4 animate-spin" style={{ animationDuration: '3s' }} />
                <p className="text-[#B5C6CE] text-sm">Location Locked. Telemetry Active.</p>
                <p className="text-[#566B76] text-xs mt-2">Complete the repair and capture cryptographic proof to close ticket.</p>
              </div>

              <div className="p-4 border-t border-[#1C303B] bg-[#08121A]">
                <button 
                  onClick={() => setCurrentState(4)}
                  className="w-full bg-[#00FF9D] text-[#050A0F] font-bold py-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Camera size={20} />
                  MARK RESOLVED & UPLOAD PROOF
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: CRYPTOGRAPHIC PROOF */}
          {currentState === 4 && selectedTicket && (
            <div className="flex flex-col h-full bg-[#050A0F]">
              <div className="h-1/3 relative border-b border-[#1C303B] bg-[#0D1922]">
                <img src={selectedTicket.before_image_url} alt="Before" className="w-full h-full object-cover opacity-60" />
                <div className="absolute top-2 left-2 bg-[#050A0F]/80 text-[#FFB020] text-[10px] px-2 py-1 rounded uppercase tracking-wider">Target State</div>
              </div>

              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {!capturedImage ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-[#050A0F]/80 text-[#00FF9D] text-[10px] px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                      <Radio size={10} className="animate-pulse"/> Live Feed
                    </div>
                  </>
                ) : (
                  <>
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-[#050A0F]/80 text-[#00E5FF] text-[10px] px-2 py-1 rounded uppercase tracking-wider">Captured Proof</div>
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center">
                      <div className="bg-[#FF3366] text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                        LOCK EXPIRES IN: {lockTimer}s
                      </div>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="p-4 bg-[#08121A] border-t border-[#1C303B] flex gap-3">
                {!capturedImage ? (
                  <button onClick={handleCapturePhoto} className="flex-1 bg-[#E8F3F7] text-[#050A0F] font-bold py-4 rounded-lg flex items-center justify-center gap-2">
                    <Camera size={20} /> CAPTURE AFTER PHOTO
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setCapturedImage(null); startCamera(); }} className="w-14 bg-[#1C303B] text-[#E8F3F7] rounded-lg flex items-center justify-center">
                      <RefreshCw size={20} />
                    </button>
                    <button onClick={handleSubmitProof} className="flex-1 bg-[#00FF9D] text-[#050A0F] font-bold py-4 rounded-lg flex items-center justify-center gap-2">
                      <Scan size={20} /> LOCK LOCATION & SUBMIT
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STATE 5: AI VERIFICATION */}
          {currentState === 5 && (
            <div className="p-6 flex flex-col h-full items-center justify-center text-center">
              {isProcessing ? (
                <>
                  <Scan size={48} className="text-[#00E5FF] mb-6 animate-spin" style={{ animationDuration: '2s' }} />
                  <h2 className="text-[#E8F3F7] font-bold mb-4">Processing Evidence</h2>
                  <div className="w-full bg-[#0D1922] border border-[#1C303B] rounded p-3 h-32 overflow-y-auto font-mono text-[10px] text-[#00FF9D] text-left mb-6">
                    {logs.map((log, i) => <div key={i}>{`> ${log}`}</div>)}
                  </div>
                </>
              ) : (
                <>
                  {!demo.aiConfusion ? (
                    <>
                      <CheckCircle size={64} className="text-[#00FF9D] mb-4" />
                      <h2 className="text-[#E8F3F7] font-bold text-xl mb-2">Ticket Resolved</h2>
                      <p className="text-[#7E939E] text-sm mb-8">Proof-of-Work Logged to Supabase. Cryptographic Hash Verified.</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={64} className="text-[#FFB020] mb-4" />
                      <h2 className="text-[#E8F3F7] font-bold text-xl mb-2">AI Inconclusive</h2>
                      <p className="text-[#7E939E] text-sm mb-8">Ticket escalated to Admin Command Center for manual review.</p>
                    </>
                  )}
                  <button onClick={resetToQueue} className="w-full bg-[#152733] border border-[#1C303B] text-[#E8F3F7] font-bold py-4 rounded-lg hover:bg-[#1C303B] transition">
                    RETURN TO QUEUE
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
