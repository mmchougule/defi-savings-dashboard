'use client'

import { useState, useEffect } from 'react'
import { requestMonitor } from '@/lib/requestMonitor'

export function ApiUsageStatus() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    requestsLastMinute: 0,
    averageRequestsPerMinute: 0,
    uptime: 0
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setStats(requestMonitor.getStats())
    
    const interval = setInterval(() => {
      setStats(requestMonitor.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Only show in development and after client hydration
  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-green-400 p-3 rounded font-mono text-xs z-50 border border-green-500">
      <div className="text-green-300 font-bold mb-1">API Usage Monitor</div>
      <div>Total: {stats.totalRequests}</div>
      <div>Last min: {stats.requestsLastMinute}/50</div>
      <div>Avg/min: {stats.averageRequestsPerMinute.toFixed(1)}</div>
      <div>Uptime: {stats.uptime}m</div>
    </div>
  )
}