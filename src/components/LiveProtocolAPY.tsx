'use client'

import { useEffect, useState } from 'react'
import { Shield, TrendingUp, Coins, Loader2 } from 'lucide-react'
import { protocolManager } from '../lib/protocols'

interface ProtocolAPY {
  name: string
  displayName: string
  apy: number
  icon: any
  color: string
  loading: boolean
}

export function LiveProtocolAPY() {
  const [protocols, setProtocols] = useState<ProtocolAPY[]>([
    {
      name: 'aave_v3',
      displayName: 'Aave v3',
      apy: 0,
      icon: Shield,
      color: 'from-blue-500 to-purple-500',
      loading: true
    },
    {
      name: 'compound_v3',
      displayName: 'Compound v3',
      apy: 0,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      loading: true
    },
    {
      name: 'maker_dsr',
      displayName: 'Maker DSR',
      apy: 0,
      icon: Coins,
      color: 'from-yellow-500 to-orange-500',
      loading: true
    }
  ])

  useEffect(() => {
    const fetchAPYs = async () => {
      const updatedProtocols = await Promise.all(
        protocols.map(async (protocol) => {
          try {
            // Get USDC APY for each protocol
            const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const
            const apy = await protocolManager.getSupplyApy(protocol.name, usdcAddress)
            
            return {
              ...protocol,
              apy: apy || 0,
              loading: false
            }
          } catch (error) {
            console.error(`Error fetching ${protocol.name} APY:`, error)
            return {
              ...protocol,
              apy: 0,
              loading: false
            }
          }
        })
      )
      
      setProtocols(updatedProtocols)
    }

    fetchAPYs()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {protocols.map((protocol) => {
        const Icon = protocol.icon
        
        return (
          <div key={protocol.name} className="glass border-slate-700 rounded-xl p-4 text-center">
            <div className={`w-12 h-12 bg-gradient-to-r ${protocol.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1">{protocol.displayName}</h3>
            {protocol.loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <p className="text-slate-400 text-sm">Loading...</p>
              </div>
            ) : (
              <p className="text-slate-300 text-sm font-medium">
                {protocol.apy > 0 ? `${protocol.apy.toFixed(2)}% APY` : 'No data'}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
