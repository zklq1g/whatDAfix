"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Zap,
  ZapOff,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  ArrowUp,
  User,
  Radio,
  ScanLine,
  VideoOff,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// ----------------------------------------------------------------------------------
// COLOR SYSTEM (Master Palette)
// ----------------------------------------------------------------------------------

const COLORS = {
  bgMain: "#050A0F",
  bgSecondary: "#08121A",
  panel: "#0D1922",
  panelElevated: "#111F29",
  panelHover: "#152733",
  border: "#1C303B",

  textHeading: "#E8F3F7",
  textBody: "#B5C6CE",
  textSecondary: "#7E939E",
  textMeta: "#566B76",
};

// ----------------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------------

type FlowState = "camera" | "preview" | "locating" | "scanning" | "result";
type ToastType = "success" | "error" | "info" | "loading";

interface AIResult {
  issue: string;
  severity: number;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface ToastState {
  message: string;
  type: ToastType;
}

// ----------------------------------------------------------------------------------
// FAKE DATA
// ----------------------------------------------------------------------------------

const ISSUE_POOL = [
  { issue: "Pothole", range: [70, 95] as [number, number] },
  { issue: "Garbage Dump", range: [60, 90] as [number, number] },
  { issue: "Broken Streetlight", range: [50, 85] as [number, number] },
];

const HIDDEN_TIMEOUT_MS = 30000;
const FALLBACK_COORDS: Coordinates = { lat: 12.9716, lng: 77.5946 };

// ----------------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------------

export default function CitizenPortal() {
  const [flowState, setFlowState] = useState<FlowState>("camera");
  const [flashOn, setFlashOn] = useState(false);
  const [demoForceNew, setDemoForceNew] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | Blob | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [resultType, setResultType] = useState<"cluster" | "new" | null>(null);
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fallbackFileInputRef = useRef<HTMLInputElement>(null);
  const hiddenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Auto-login citizen anonymously on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    };
    initAuth();
  }, []);

  // --------------------------------------------------------------------------------
  // TOAST HELPERS
  // --------------------------------------------------------------------------------

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
    if (type !== "loading") {
      window.setTimeout(() => setToast(null), 3500);
    }
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  // --------------------------------------------------------------------------------
  // TIMER LOGIC (Anti-spoofing 30s window)
  // --------------------------------------------------------------------------------

  const clearHiddenTimer = () => {
    if (hiddenTimeoutRef.current) {
      clearTimeout(hiddenTimeoutRef.current);
      hiddenTimeoutRef.current = null;
    }
  };

  const startHiddenTimer = () => {
    clearHiddenTimer();
    hiddenTimeoutRef.current = setTimeout(() => {
      showToast(
        "Timeout: Location must be verified immediately after photo capture to prevent spoofing. Please retake.",
        "error"
      );
      resetToCamera();
    }, HIDDEN_TIMEOUT_MS);
  };

  const clearScanTimers = () => {
    scanTimeoutsRef.current.forEach((t) => clearTimeout(t));
    scanTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearHiddenTimer();
      clearScanTimers();
    };
  }, []);

  // --------------------------------------------------------------------------------
  // STATE 1 -> STATE 2 : LIVE CAPTURE (from in-browser video preview)
  // --------------------------------------------------------------------------------

  const handleLiveCapture = (dataUrl: string, blob: Blob) => {
    setCapturedImage(dataUrl);
    setCapturedFile(blob);
    setFlowState("preview");
    startHiddenTimer();
  };

  // Fallback path (only shown if getUserMedia fails/denied)
  const handleFallbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      setFlowState("preview");
      startHiddenTimer();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRetake = () => {
    resetToCamera();
  };

  // --------------------------------------------------------------------------------
  // STATE 2 -> STATE 3 : CONFIRM & LOCK LOCATION
  // --------------------------------------------------------------------------------

  const handleConfirmLocation = () => {
    clearHiddenTimer();
    setConfirming(true);
    setFlowState("locating");
    fetchLocation();
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation unsupported, using fallback coords for demo.");
      finalizeLocation(FALLBACK_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finalizeLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.log("Geolocation failed, faking coordinates for demo:", err);
        finalizeLocation(FALLBACK_COORDS);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const finalizeLocation = (coords: Coordinates) => {
    setLocation(coords);
    setConfirming(false);
    setFlowState("scanning");
  };

  // --------------------------------------------------------------------------------
  // STATE 4 : FAKE AI SCAN
  // --------------------------------------------------------------------------------

  useEffect(() => {
    if (flowState === "scanning") {
      runFakeAIScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowState]);

  const runFakeAIScan = () => {
    clearScanTimers();
    setScanLogs([]);
    setAiResult(null);

    const preLogs = [
      "Reading EXIF metadata...",
      "Verifying capture timestamp...",
      "Running Edge AI classification...",
    ];

    const chosen = ISSUE_POOL[Math.floor(Math.random() * ISSUE_POOL.length)];
    const severity = Math.floor(
      chosen.range[0] + Math.random() * (chosen.range[1] - chosen.range[0])
    );

    preLogs.forEach((log, idx) => {
      const t = setTimeout(() => {
        setScanLogs((prev) => [...prev, log]);
      }, (idx + 1) * 650);
      scanTimeoutsRef.current.push(t);
    });

    const finalLogTimer = setTimeout(() => {
      setScanLogs((prev) => [
        ...prev,
        `Issue Detected: ${chosen.issue} (Severity: ${severity}/100)`,
      ]);
      setAiResult({ issue: chosen.issue, severity });
    }, preLogs.length * 650 + 500);
    scanTimeoutsRef.current.push(finalLogTimer);

    const decisionTimer = setTimeout(() => {
      decideResult();
    }, 3000);
    scanTimeoutsRef.current.push(decisionTimer);
  };

  // --------------------------------------------------------------------------------
  // STATE 5 : RESULT (CLUSTER VS NEW)
  // --------------------------------------------------------------------------------

  const decideResult = () => {
    const isNew = !demoForceNew;

    setResultType(isNew ? "new" : "cluster");
    if (isNew) {
      setTicketNumber(Math.floor(1000 + Math.random() * 9000));
    }
    setFlowState("result");
  };

  const handleUpvote = () => {
    console.log("network(fake): POST /reports/upvote", { location, aiResult });
    showToast("Upvoted! SLA urgency increased.", "success");
    setTimeout(() => resetToCamera(), 1400);
  };

  const handleSubmitTicket = async () => {
    if (!aiResult || !location || !capturedFile) return;

    setConfirming(true);
    showToast("Securing evidence and reporting to municipality...", "loading");

    try {
      // Ensure we have an authenticated session
      let { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'demo@whatdafix.local',
          password: 'demopassword123',
        });
        
        if (signInError) {
          throw new Error(`Demo sign-in failed: ${signInError.message}`);
        }
        ({ data: { user } } = await supabase.auth.getUser());
        if (!user) throw new Error("Sign-in succeeded but user is still null.");
      }

      // Upload evidence image
      const ext = capturedFile instanceof File ? capturedFile.name.split(".").pop() : "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext || "jpg"}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("civic-evidence")
        .upload(filePath, capturedFile, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("civic-evidence")
        .getPublicUrl(filePath);

      // Create ticket via RPC (handles PostGIS geometry properly)
      const { data: ticketId, error: dbError } = await supabase.rpc("create_citizen_ticket", {
        p_location_lat: location.lat,
        p_location_lng: location.lng,
        p_category: aiResult.issue,
        p_severity: aiResult.severity,
        p_before_image_url: publicUrl,
        p_ai_confidence: 0.94,
        p_ai_label: aiResult.issue,
      });

      if (dbError) throw dbError;

      const realId = (ticketId as string).substring(0, 8).toUpperCase();
      setTicketNumber(parseInt(realId, 16) || ticketNumber);

      hideToast();
      showToast(`Ticket #${realId} created and routed to PWD.`, "success");
      setTimeout(() => resetToCamera(), 2000);
    } catch (err: any) {
      console.error("Submission error:", err);
      hideToast();
      const msg = err?.message || err?.error_description || JSON.stringify(err);
      showToast(`Error: ${msg}`, "error");
    } finally {
      setConfirming(false);
    }
  };

  // --------------------------------------------------------------------------------
  // RESET
  // --------------------------------------------------------------------------------

  const resetToCamera = () => {
    clearHiddenTimer();
    clearScanTimers();
    setCapturedImage(null);
    setCapturedFile(null);
    setLocation(null);
    setScanLogs([]);
    setAiResult(null);
    setResultType(null);
    setTicketNumber(null);
    setConfirming(false);
    setFlowState("camera");
  };

  // --------------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      <div
        className="relative w-full max-w-[480px] h-screen flex flex-col overflow-hidden"
        style={{
          backgroundColor: COLORS.bgMain,
          borderLeft: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          color: COLORS.textBody,
        }}
      >
        <TopBar demoForceNew={demoForceNew} setDemoForceNew={setDemoForceNew} />

        <AnimatePresence>
          {toast && <ToastBanner toast={toast} />}
        </AnimatePresence>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {flowState === "camera" && (
              <CameraViewState
                key="camera"
                flashOn={flashOn}
                setFlashOn={setFlashOn}
                onCapture={handleLiveCapture}
                onUseFallback={() => fallbackFileInputRef.current?.click()}
                showToast={showToast}
              />
            )}

            {flowState === "preview" && capturedImage && (
              <PreviewState
                key="preview"
                image={capturedImage}
                confirming={confirming}
                onRetake={handleRetake}
                onConfirm={handleConfirmLocation}
              />
            )}

            {flowState === "locating" && capturedImage && (
              <LocatingState key="locating" image={capturedImage} />
            )}

            {flowState === "scanning" && capturedImage && (
              <ScanningState key="scanning" image={capturedImage} logs={scanLogs} />
            )}

            {flowState === "result" &&
              capturedImage &&
              resultType &&
              aiResult &&
              location && (
                <ResultState
                  key="result"
                  image={capturedImage}
                  resultType={resultType}
                  aiResult={aiResult}
                  location={location}
                  ticketNumber={ticketNumber}
                  onUpvote={handleUpvote}
                  onSubmit={handleSubmitTicket}
                />
              )}
          </AnimatePresence>
        </div>

        {/* Fallback file input — only used if live camera access fails */}
        <input
          ref={fallbackFileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFallbackFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ====================================================================================
// TOP BAR
// ====================================================================================

function TopBar({
  demoForceNew,
  setDemoForceNew,
}: {
  demoForceNew: boolean;
  setDemoForceNew: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 z-30 relative"
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: "rgba(52, 211, 153, 0.08)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
          }}
        >
          <span className="text-emerald-400 font-bold text-sm">wD</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: COLORS.textHeading }}
          >
            whatDAfix
          </span>
          <span className="text-[10px]" style={{ color: COLORS.textMeta }}>
            Citizen Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDemoForceNew(!demoForceNew)}
          className="flex items-center gap-1.5 group"
          title="Demo: Toggle Result"
        >
          <div
            className="w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-200"
            style={{
              backgroundColor: demoForceNew ? "#34D399" : COLORS.panelElevated,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <motion.div
              layout
              className="w-4 h-4 rounded-full shadow"
              style={{ backgroundColor: COLORS.textHeading }}
              animate={{ x: demoForceNew ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </button>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: COLORS.panelElevated,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <User size={16} style={{ color: COLORS.textSecondary }} />
        </div>
      </div>
    </div>
  );
}

// ====================================================================================
// TOAST
// ====================================================================================

function ToastBanner({ toast }: { toast: ToastState }) {
  const styleMap: Record<
    ToastType,
    { bg: string; border: string; text: string }
  > = {
    success: {
      bg: "rgba(52, 211, 153, 0.1)",
      border: "rgba(52, 211, 153, 0.35)",
      text: "#6EE7B7",
    },
    error: {
      bg: "rgba(248, 113, 113, 0.1)",
      border: "rgba(248, 113, 113, 0.35)",
      text: "#FCA5A5",
    },
    info: {
      bg: "rgba(96, 165, 250, 0.1)",
      border: "rgba(96, 165, 250, 0.35)",
      text: "#93C5FD",
    },
    loading: {
      bg: "rgba(250, 204, 21, 0.1)",
      border: "rgba(250, 204, 21, 0.35)",
      text: "#FDE047",
    },
  };

  const s = styleMap[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-16 left-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg flex items-center gap-2"
      style={{
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
      }}
    >
      {toast.type === "loading" && <Loader2 size={15} className="animate-spin shrink-0" />}
      {toast.message}
    </motion.div>
  );
}

// ====================================================================================
// STATE 1: LIVE CAMERA VIEW (getUserMedia)
// ====================================================================================

function CameraViewState({
  flashOn,
  setFlashOn,
  onCapture,
  onUseFallback,
  showToast,
}: {
  flashOn: boolean;
  setFlashOn: (v: boolean) => void;
  onCapture: (dataUrl: string, blob: Blob) => void;
  onUseFallback: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (withTorch: boolean, cancelled: { val: boolean }) => {
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera API unsupported in this browser (requires HTTPS).");
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(withTorch ? { advanced: [{ torch: true }] } as any : {}),
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (cancelled.val) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Also try applyConstraints for torch (belt-and-suspenders)
      if (withTorch) {
        const track = stream.getVideoTracks()[0];
        try { await track?.applyConstraints({ advanced: [{ torch: true } as any] }); } catch { /* ok */ }
      }
      setCameraReady(true);
    } catch (err) {
      console.log("Camera access failed:", err);
      setCameraError("Camera access denied or unavailable. Use upload fallback below.");
    }
  };

  // Start camera on mount
  useEffect(() => {
    const cancelled = { val: false };
    setCameraError(null);
    startCamera(flashOn, cancelled);
    return () => {
      cancelled.val = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restart stream when flashOn changes to apply torch at getUserMedia level
  const prevFlashRef = useRef(flashOn);
  useEffect(() => {
    if (prevFlashRef.current === flashOn) return;
    prevFlashRef.current = flashOn;
    if (!cameraReady && !cameraError) return; // still starting, skip
    const cancelled = { val: false };
    setCameraError(null);
    stopStream();
    startCamera(flashOn, cancelled);
    return () => { cancelled.val = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashOn]);

  const toggleFlash = () => setFlashOn(!flashOn);

  const [capturing, setCapturing] = useState(false);

  const handleCaptureClick = async () => {
    const video = videoRef.current;
    if (!video || !cameraReady) {
      showToast("Camera not ready yet.", "error");
      return;
    }

    setCapturing(true);
    setTimeout(() => setCapturing(false), 180);

    const track = streamRef.current?.getVideoTracks()[0];

    // Try ImageCapture API — uses hardware shutter + flash signal
    if (track && typeof (window as any).ImageCapture !== "undefined") {
      try {
        const imageCapture = new (window as any).ImageCapture(track);
        const capabilities = await imageCapture.getPhotoCapabilities().catch(() => null);
        const canFlash = capabilities?.fillLightMode?.includes("flash");
        const blob: Blob = await imageCapture.takePhoto(
          flashOn && canFlash ? { fillLightMode: "flash" } : {}
        );
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        onCapture(dataUrl, blob);
        return;
      } catch {
        // Fall through to canvas
      }
    }

    // Canvas fallback — torch is already on via stream constraints
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    canvas.toBlob(
      (blob) => { if (blob) onCapture(dataUrl, blob); },
      "image/jpeg",
      0.9
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: COLORS.bgSecondary }}
      >
        {/* Live video preview */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: cameraError ? "none" : "block" }}
        />

        {/* White flash overlay — briefly shown on shutter press */}
        <AnimatePresence>
          {capturing && (
            <motion.div
              key="flash"
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-white pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {/* Loading state before stream is ready */}
        {!cameraError && !cameraReady && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ backgroundColor: COLORS.bgSecondary }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: "#60A5FA" }} />
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>
              Requesting camera access...
            </p>
          </div>
        )}

        {/* Error / permission denied fallback */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <VideoOff size={36} style={{ color: COLORS.textMeta }} />
            <p className="text-sm" style={{ color: COLORS.textBody }}>
              {cameraError}
            </p>
            <button
              onClick={onUseFallback}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: COLORS.panelElevated,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textHeading,
              }}
            >
              <Upload size={15} />
              Upload Photo Instead
            </button>
          </div>
        )}

        {/* Corner brackets overlay (only when camera is live) */}
        {cameraReady && !cameraError && (
          <div className="absolute inset-8 pointer-events-none">
            <Corner className="top-0 left-0 border-t-2 border-l-2" />
            <Corner className="top-0 right-0 border-t-2 border-r-2" />
            <Corner className="bottom-0 left-0 border-b-2 border-l-2" />
            <Corner className="bottom-0 right-0 border-b-2 border-r-2" />
          </div>
        )}

        {/* Flashlight toggle */}
        {cameraReady && !cameraError && (
          <button
            onClick={toggleFlash}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
            style={{
              backgroundColor: flashOn
                ? "rgba(250, 204, 21, 0.15)"
                : "rgba(8, 18, 26, 0.6)",
              border: flashOn
                ? "1px solid rgba(250, 204, 21, 0.5)"
                : `1px solid ${COLORS.border}`,
              color: flashOn ? "#FDE047" : COLORS.textSecondary,
            }}
          >
            {flashOn ? <Zap size={18} /> : <ZapOff size={18} />}
          </button>
        )}
      </div>

      {/* Capture control */}
      <div
        className="pb-10 pt-6 flex items-center justify-center"
        style={{ backgroundColor: COLORS.bgMain }}
      >
        <button
          onClick={handleCaptureClick}
          disabled={!cameraReady || !!cameraError}
          className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          style={{
            border: `4px solid ${COLORS.panelElevated}`,
            backgroundColor: COLORS.textHeading,
            boxShadow: `0 0 0 4px rgba(232, 243, 247, 0.06)`,
          }}
        >
          <div
            className="w-16 h-16 rounded-full"
            style={{
              backgroundColor: COLORS.textHeading,
              border: `1px solid ${COLORS.border}`,
            }}
          />
        </button>
      </div>
    </motion.div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <div
      className={`absolute w-8 h-8 ${className}`}
      style={{ borderColor: "rgba(52, 211, 153, 0.6)" }}
    />
  );
}

// ====================================================================================
// STATE 2: PREVIEW + LOCATION LOCK
// ====================================================================================

function PreviewState({
  image,
  confirming,
  onRetake,
  onConfirm,
}: {
  image: string;
  confirming: boolean;
  onRetake: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      <div className="relative flex-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Captured issue" className="w-full h-full object-cover" />
        <div
          className="absolute top-4 left-4 backdrop-blur px-3 py-1.5 rounded-full text-[11px]"
          style={{
            backgroundColor: "rgba(8, 18, 26, 0.75)",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textBody,
          }}
        >
          Photo captured — confirm quickly
        </div>
      </div>

      <div
        className="p-4 flex gap-3"
        style={{
          backgroundColor: COLORS.bgSecondary,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <button
          onClick={onRetake}
          disabled={confirming}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textBody,
            backgroundColor: COLORS.panel,
          }}
        >
          <RotateCcw size={16} />
          Retake
        </button>
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="flex-[1.4] flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-70"
          style={{ backgroundColor: "#34D399", color: "#04140D" }}
        >
          <MapPin size={16} />
          {confirming ? "Locking..." : "Confirm & Lock Location"}
        </button>
      </div>
    </motion.div>
  );
}

// ====================================================================================
// STATE 3: LOCATING
// ====================================================================================

function LocatingState({ image }: { image: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="Captured issue" className="w-full h-full object-cover opacity-30" />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: "rgba(5, 10, 15, 0.55)" }}
      >
        <div className="relative">
          <Loader2 size={44} className="animate-spin" style={{ color: "#60A5FA" }} />
          <MapPin size={20} className="absolute inset-0 m-auto" style={{ color: "#93C5FD" }} />
        </div>
        <p
          className="text-sm font-medium tracking-wide"
          style={{ color: COLORS.textHeading }}
        >
          Acquiring Secure GPS Coordinates...
        </p>
        <p className="text-[11px]" style={{ color: COLORS.textMeta }}>
          Do not close the app
        </p>
      </div>
    </motion.div>
  );
}

// ====================================================================================
// STATE 4: AI SCANNING
// ====================================================================================

function ScanningState({ image, logs }: { image: string; logs: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      <div className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Captured issue" className="w-full h-full object-cover" />

        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{ border: "2px solid rgba(96, 165, 250, 0.5)" }}
        />

        <motion.div
          className="absolute left-0 right-0 h-0.5"
          style={{
            backgroundColor: "#34D399",
            boxShadow: "0 0 12px 2px rgba(52, 211, 153, 0.7)",
          }}
          animate={{ top: ["5%", "95%", "5%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />

        <div
          className="absolute top-4 left-4 flex items-center gap-2 backdrop-blur px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: "rgba(8, 18, 26, 0.75)",
            border: "1px solid rgba(96, 165, 250, 0.35)",
          }}
        >
          <ScanLine size={14} style={{ color: "#93C5FD" }} />
          <span className="text-[11px] font-medium" style={{ color: "#BFDBFE" }}>
            Analyzing with Edge AI
          </span>
        </div>
      </div>

      <div
        className="p-4 h-40 overflow-y-auto font-mono text-[11px] space-y-1.5"
        style={{
          backgroundColor: COLORS.bgSecondary,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        {logs.length === 0 && (
          <span style={{ color: COLORS.textMeta }}>Initializing pipeline...</span>
        )}
        {logs.map((log, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2"
          >
            <span style={{ color: COLORS.textMeta }}>{">"}</span>
            <span
              style={{
                color: log.startsWith("Issue Detected") ? "#FDE047" : "#6EE7B7",
                fontWeight: log.startsWith("Issue Detected") ? 600 : 400,
              }}
            >
              {log}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ====================================================================================
// STATE 5: RESULT
// ====================================================================================

function ResultState({
  image,
  resultType,
  aiResult,
  location,
  ticketNumber,
  onUpvote,
  onSubmit,
}: {
  image: string;
  resultType: "cluster" | "new";
  aiResult: AIResult;
  location: Coordinates;
  ticketNumber: number | null;
  onUpvote: () => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: COLORS.bgMain }}
    >
      <div className="relative h-52 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Captured issue" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${COLORS.bgMain}, transparent)`,
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 -mt-6 relative z-10 pb-4">
        {resultType === "cluster" ? (
          <ClusterCard aiResult={aiResult} />
        ) : (
          <NewTicketCard aiResult={aiResult} location={location} ticketNumber={ticketNumber} />
        )}
      </div>

      <div
        className="p-4"
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.bgMain,
        }}
      >
        {resultType === "cluster" ? (
          <button
            onClick={onUpvote}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#FB923C", color: "#1A0E02" }}
          >
            <ArrowUp size={16} />
            Upvote Existing Report
          </button>
        ) : (
          <button
            onClick={onSubmit}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#34D399", color: "#04140D" }}
          >
            <Send size={16} />
            Submit to Municipality
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ClusterCard({ aiResult }: { aiResult: AIResult }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        border: "1px solid rgba(251, 146, 60, 0.3)",
        backgroundColor: "rgba(251, 146, 60, 0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} style={{ color: "#FB923C" }} />
        <span className="font-semibold text-sm" style={{ color: "#FDBA74" }}>
          Cluster Detected
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: COLORS.textBody }}>
        <span className="font-semibold" style={{ color: "#FED7AA" }}>
          3 other citizens
        </span>{" "}
        have reported this exact issue within a{" "}
        <span className="font-semibold" style={{ color: "#FED7AA" }}>
          20-meter radius
        </span>{" "}
        in the last 24 hours.
      </p>

      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: "1px solid rgba(251, 146, 60, 0.2)" }}
      >
        <Radio size={14} style={{ color: "#FB923C" }} />
        <span className="text-xs" style={{ color: COLORS.textSecondary }}>
          Detected: {aiResult.issue} • Severity {aiResult.severity}/100
        </span>
      </div>
    </div>
  );
}

function NewTicketCard({
  aiResult,
  location,
  ticketNumber,
}: {
  aiResult: AIResult;
  location: Coordinates;
  ticketNumber: number | null;
}) {
  const severityLabel =
    aiResult.severity >= 80 ? "High" : aiResult.severity >= 60 ? "Moderate" : "Low";

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        border: "1px solid rgba(52, 211, 153, 0.3)",
        backgroundColor: "rgba(52, 211, 153, 0.08)",
      }}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} style={{ color: "#34D399" }} />
        <span className="font-semibold text-sm" style={{ color: "#6EE7B7" }}>
          New Issue Classified
        </span>
      </div>

      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5"
        style={{ backgroundColor: COLORS.panelElevated }}
      >
        <span className="text-sm font-medium" style={{ color: COLORS.textHeading }}>
          {aiResult.issue}
        </span>
        <span
          className="text-xs px-2 py-1 rounded-full font-semibold"
          style={{
            backgroundColor: "rgba(52, 211, 153, 0.15)",
            color: "#6EE7B7",
          }}
        >
          {severityLabel} · {aiResult.severity}/100
        </span>
      </div>

      <div
        className="flex items-center gap-2 text-xs pt-1"
        style={{
          borderTop: "1px solid rgba(52, 211, 153, 0.2)",
          color: COLORS.textSecondary,
        }}
      >
        <MapPin size={13} style={{ color: "#34D399" }} />
        <span>
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (locked)
        </span>
      </div>

      {ticketNumber && (
        <div className="text-[11px]" style={{ color: COLORS.textMeta }}>
          Draft Ticket ID: #{ticketNumber}
        </div>
      )}
    </div>
  );
}
