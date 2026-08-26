"use client"
import dynamic from 'next/dynamic'

// Leaflet requires window, so we must load it dynamically
const CityMap = dynamic(() => import('@/components/CityMap').then(mod => mod.CityMap), {
  ssr: false,
  loading: () => <p className="p-4">Loading Map...</p>
})

export default function MapPortal() {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Public Transparency Dashboard</h1>
      <CityMap />
    </div>
  )
}
