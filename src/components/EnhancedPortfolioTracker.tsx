'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  Shield, 
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useUserBalances, usePortfolioSummary } from '../hooks/useProtocolData'
import { useRealTransactions } from '../hooks/useRealTransactions'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { cn } from '@/lib/utils'

interface PortfolioStats {
  totalValue: number
  totalEarnings: number
  averageAPY: number
  protocolCount: number
  assetCount: number
  dailyEarnings: number
  monthlyEarnings: number
  yearlyEarnings: number
}

interface ProtocolBreakdown {
  protocol: string
  value: number
  percentage: number
  apy: number
  assets: Array<{
    symbol: string
    value: number
    apy: number
  }>
}

export function EnhancedPortfolioTracker() {
  const { address, isConnected } = useAccount()
  const { data: balances = [], isLoading: balancesLoading } = useUserBalances()
  const { transactions, loading: transactionsLoading } = useRealTransactions()
  const [refreshing, setRefreshing] = useState(false)

  const portfolioStats: PortfolioStats = useMemo(() => {
    const totalValue = balances.reduce((sum, balance) => sum + balance.valueUSD, 0)
    const totalEarnings = balances.reduce((sum, balance) => sum + (balance.valueUSD * balance.apy / 100), 0)
    const averageAPY = balances.length > 0 
      ? balances.reduce((sum, balance) => sum + balance.apy, 0) / balances.length 
      : 0
    
    const dailyEarnings = totalValue * (averageAPY / 100) / 365
    const monthlyEarnings = dailyEarnings * 30
    const yearlyEarnings = totalValue * (averageAPY / 100)

    return {
      totalValue,
      totalEarnings,
      averageAPY,
      protocolCount: new Set(balances.map(b => b.protocol)).size,
      assetCount: new Set(balances.map(b => b.symbol)).size,
      dailyEarnings,
      monthlyEarnings,
      yearlyEarnings
    }
  }, [balances])

  const protocolBreakdown: ProtocolBreakdown[] = useMemo(() => {
    const protocolMap = new Map<string, ProtocolBreakdown>()
    
    balances.forEach(balance => {
      if (!protocolMap.has(balance.protocol)) {
        protocolMap.set(balance.protocol, {
          protocol: balance.protocol,
          value: 0,
          percentage: 0,
          apy: 0,
          assets: []
        })
      }
      
      const protocol = protocolMap.get(balance.protocol)!
      protocol.value += balance.valueUSD
      protocol.assets.push({
        symbol: balance.symbol,
        value: balance.valueUSD,
        apy: balance.apy
      })
    })

    // Calculate percentages and average APYs
    const totalValue = portfolioStats.totalValue
    protocolMap.forEach(protocol => {
      protocol.percentage = totalValue > 0 ? (protocol.value / totalValue) * 100 : 0
      protocol.apy = protocol.assets.length > 0 
        ? protocol.assets.reduce((sum, asset) => sum + asset.apy, 0) / protocol.assets.length 
        : 0
    })

    return Array.from(protocolMap.values()).sort((a, b) => b.value - a.value)
  }, [balances, portfolioStats.totalValue])

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5)
  }, [transactions])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatAPY = (apy: number) => {
    return `${apy.toFixed(2)}%`
  }

  const getProtocolDisplayName = (protocol: string) => {
    const names = {
      'aave_v3': 'Aave v3',
      'compound_v2': 'Compound v2',
      'compound_v3': 'Compound v3',
      'maker_dsr': 'Maker DSR'
    }
    return names[protocol as keyof typeof names] || protocol
  }

  const getProtocolColor = (protocol: string) => {
    const colors = {
      'aave_v3': 'crypto-gradient',
      'compound_v2': 'crypto-green-gradient',
      'compound_v3': 'crypto-gradient',
      'maker_dsr': 'crypto-gold-gradient'
    }
    return colors[protocol as keyof typeof colors] || 'crypto-gradient'
  }

  if (!isConnected) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6 text-center">
          <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
          <p className="text-slate-400">
            Connect your wallet to view your DeFi portfolio and track your earnings.
          </p>
        </div>
      </Card>
    )
  }

  if (balancesLoading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Portfolio Overview</h2>
            <div className="w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Portfolio Overview</h2>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              disabled={refreshing} className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 crypto-green-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(portfolioStats.totalValue)}</h3>
              <p className="text-slate-400">Total Value</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 crypto-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{formatAPY(portfolioStats.averageAPY)}</h3>
              <p className="text-slate-400">Average APY</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 crypto-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{portfolioStats.protocolCount}</h3>
              <p className="text-slate-400">Protocols</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 crypto-gold-gradient rounded-full flex items-center justify-center mx-auto mb-3">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{portfolioStats.assetCount}</h3>
              <p className="text-slate-400">Assets</p>
            </div>
          </div>

          {/* Earnings Projections */}
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Projected Earnings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{formatCurrency(portfolioStats.dailyEarnings)}</p>
                <p className="text-slate-400">Daily</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(portfolioStats.monthlyEarnings)}</p>
                <p className="text-slate-400">Monthly</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(portfolioStats.yearlyEarnings)}</p>
                <p className="text-slate-400">Yearly</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Protocol Breakdown */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Protocol Breakdown</h2>
          
          {protocolBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Assets Found</h3>
              <p className="text-slate-400">
                Start depositing assets to DeFi protocols to see your portfolio breakdown.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {protocolBreakdown.map((protocol, index) => (
                <motion.div
                  key={protocol.protocol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getProtocolColor(protocol.protocol))}>
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{getProtocolDisplayName(protocol.protocol)}</h3>
                        <p className="text-sm text-slate-400">{protocol.assets.length} asset{protocol.assets.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{formatCurrency(protocol.value)}</p>
                      <p className="text-sm text-slate-400">{protocol.percentage.toFixed(1)}% of portfolio</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {protocol.assets.map((asset, assetIndex) => (
                      <div key={assetIndex} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{asset.symbol}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-400">{formatAPY(asset.apy)} APY</span>
                          <span className="text-white font-medium">{formatCurrency(asset.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
