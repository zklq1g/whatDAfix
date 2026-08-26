"use client"
import { motion } from "framer-motion"
import { CheckCircle2, Loader2 } from "lucide-react"

export function Tracker({ step }: { step: number }) {
  const steps = ["Photo Captured", "GPS Locked", "Edge AI Scanning", "Routed to PWD"]
  
  return (
    <div className="space-y-4 p-4">
      {steps.map((label, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: step >= index ? 1 : 0.3, x: 0 }}
          transition={{ delay: index * 0.5 }} // Creates a sequential loading effect
          className="flex items-center gap-3"
        >
          {step > index ? (
            <CheckCircle2 className="text-green-500" />
          ) : step === index ? (
            <Loader2 className="animate-spin text-blue-500" />
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
          )}
          <span className={step >= index ? "text-foreground font-medium" : "text-muted-foreground"}>
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
