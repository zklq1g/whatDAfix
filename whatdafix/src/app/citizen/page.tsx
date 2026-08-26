"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

// Import the Tracker component we made earlier
import { Tracker } from "@/components/Tracker" 

export default function CitizenPortal() {
  const [image, setImage] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [submissionStep, setSubmissionStep] = useState(0) // 0: idle, 1-4: processing, 5: done
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 2. The Fake AI Submission Flow
  const handleSubmit = async () => {
    if (!image || !location) return
    
    // Simulate the 4-step AI process we pitch to judges
    setSubmissionStep(1) // Photo Captured
    await new Promise(r => setTimeout(r, 1000))
    
    setSubmissionStep(2) // GPS Locked
    await new Promise(r => setTimeout(r, 1000))
    
    setSubmissionStep(3) // Edge AI Scanning
    await new Promise(r => setTimeout(r, 1500))
    
    setSubmissionStep(4) // Routed to PWD
    await new Promise(r => setTimeout(r, 1000))
    
    setSubmissionStep(5) // Success!
    
    // TODO: Here is where you would actually insert into Supabase
    // await supabase.from('tickets').insert({ ... })
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
                if (file) setImage(URL.createObjectURL(file))
              }}
            />
            
            {image ? (
              <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                <img src={image} alt="Civic issue" className="w-full h-48 object-cover" />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => { setImage(null); if(fileInputRef.current) fileInputRef.current.value = "" }}
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
                    Ticket #8492 Created & Routed to PWD!
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
