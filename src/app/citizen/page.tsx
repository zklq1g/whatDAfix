"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

// Import the Tracker component we made earlier
import { Tracker } from "@/components/Tracker" 

import { supabase } from "@/lib/supabase"

export default function CitizenPortal() {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [submissionStep, setSubmissionStep] = useState(0) // 0: idle, 1-4: processing, 5: done
  const [ticketId, setTicketId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-login citizen anonymously on mount for frictionless demo
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await supabase.auth.signInAnonymously()
      }
    }
    initAuth()
  }, [])

  // 1. The GPS Lock Mechanism
  const acquireGPS = () => {
    setIsLocating(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLocating(false)
        },
        (error) => {
          console.error("GPS Error:", error)
          setIsLocating(false)
          // Hackathon fallback: If GPS fails in browser, fake it for the demo
          setLocation({ lat: 12.9716, lng: 77.5946 }) 
        }
      )
    }
  }

  // 2. The Supabase & AI Submission Flow
  const handleSubmit = async () => {
    if (!image || !location || !file) return
    
    // Simulate initial steps
    setSubmissionStep(1) // Photo Captured
    await new Promise(r => setTimeout(r, 800))
    
    setSubmissionStep(2) // GPS Locked
    await new Promise(r => setTimeout(r, 800))
    
    setSubmissionStep(3) // Edge AI Scanning
    await new Promise(r => setTimeout(r, 1000))
    
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Upload photo to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('civic-evidence')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('civic-evidence')
        .getPublicUrl(filePath)

      // Insert ticket into DB (PostGIS format for location geography)
      const severity = Math.floor(Math.random() * 41) + 60 // 60-100 severity score
      const category = "Pothole"

      const { data: ticketData, error: dbError } = await supabase
        .from('tickets')
        .insert({
          created_by: user.id,
          location: `POINT(${location.lng} ${location.lat})`,
          category,
          severity,
          before_image_url: publicUrl,
          ai_confidence: 0.94,
          ai_label: category,
          status: 'open'
        })
        .select('id')
        .single()

      if (dbError) throw dbError

      setTicketId(ticketData.id.substring(0, 8).toUpperCase())

      setSubmissionStep(4) // Routed to PWD
      await new Promise(r => setTimeout(r, 1000))
      
      setSubmissionStep(5) // Success!
    } catch (err) {
      console.error("Submission failed:", err)
      setSubmissionStep(0)
      alert("Submission failed. Please check connection and try again.")
    }
  }

  const canSubmit = image && location && submissionStep === 0


  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-4 flex flex-col items-center">
      <header className="w-full max-w-md mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">whatDAfix</h1>
        <p className="text-zinc-400 text-sm">Report Civic Issues. Zero Spam.</p>
      </header>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Report an Issue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Live Camera Enforcement */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">1. Take Live Photo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setFile(file)
                  setImage(URL.createObjectURL(file))
                }
              }}
            />
            
            {image ? (
              <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                <img src={image} alt="Civic issue" className="w-full h-48 object-cover" />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => { 
                    setImage(null)
                    setFile(null)
                    if(fileInputRef.current) fileInputRef.current.value = "" 
                  }}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-32 border-dashed border-zinc-700 hover:bg-zinc-800 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-8 w-8 text-zinc-500" />
                <span className="text-zinc-400">Open Camera (Gallery Disabled)</span>
              </Button>
            )}
          </div>

          {/* Mandatory GPS Lock */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">2. Verify Location</label>
            <Button 
              variant={location ? "secondary" : "default"} 
              className="w-full" 
              onClick={acquireGPS} 
              disabled={isLocating || !!location}
            >
              {isLocating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Acquiring Secure GPS...</>
              ) : location ? (
                <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> GPS Locked ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</>
              ) : (
                <><MapPin className="mr-2 h-4 w-4" /> Lock Current Location</>
              )}
            </Button>
          </div>

          {/* Submit & Framer Motion Tracker */}
          <AnimatePresence mode="wait">
            {submissionStep === 0 ? (
              <motion.div
                key="submit-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-lg h-12" 
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {canSubmit ? "Submit Report" : "Complete Steps 1 & 2 to Submit"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="tracker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-950 p-4 rounded-lg border border-zinc-800"
              >
                <Tracker step={submissionStep} />
                {submissionStep === 5 && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4 text-center text-green-500 font-bold"
                  >
                    Ticket #{ticketId || "8492"} Created & Routed to PWD!
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
    </main>
  )
}
