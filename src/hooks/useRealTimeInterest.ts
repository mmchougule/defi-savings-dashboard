import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProtocolBalance } from '@/types/contracts'
import { InterestCalculator, AccrualCalculation } from '@/lib/interestCalculator'
import { priceService } from '@/lib/priceService'

interface RealTimeInterestData {
  [key: string]: AccrualCalculation & {
    lastUpdated: number
    projectedYield24h: number
    projectedYield30d: number
    projectedYield1y: number
  }
}

interface UseRealTimeInterestReturn {
  interestData: RealTimeInterestData
  totalEarnings: number
  totalProjectedDaily: number
  totalProjectedMonthly: number
  totalProjectedYearly: number
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useRealTimeInterest(
  balances: ProtocolBalance[],
  refreshInterval: number = false // Disable polling
): UseRealTimeInterestReturn {
  const [interestData, setInterestData] = useState<RealTimeInterestData>({})
  const [error, setError] = useState<Error | null>(null)

  // Fetch current token prices
  const { data: tokenPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['tokenPrices', balances.map(b => b.symbol).sort()],
    queryFn: async () => {
      const symbols = [...new Set(balances.map(b => b.symbol))]
      return await priceService.getMultipleTokenPrices(symbols)
    },
    refetchInterval: false, // Disable polling
    staleTime: Infinity, // Never consider stale
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const calculateInterestForBalance = useCallback(async (balance: ProtocolBalance) => {
    try {
      const tokenPrice = tokenPrices?.[balance.symbol] || 0
      const now = Date.now()
      
      // Assume position was created 30 days ago for demo
      // In production, this would come from stored transaction history
      const estimatedStartTime = now - (30 * 24 * 60 * 60 * 1000)
      const timeElapsed = (now - estimatedStartTime) / 1000

      // Get token decimals (common decimals for major tokens)
      const decimals = getTokenDecimals(balance.symbol)
      
      const accrual = InterestCalculator.calculateAccrual(
        balance.balance,
        balance.apy,
        timeElapsed,
        decimals,
        tokenPrice
      )

      return {
        ...accrual,
        lastUpdated: now,
        projectedYield24h: accrual.projections.daily,
        projectedYield30d: accrual.projections.monthly,
        projectedYield1y: accrual.projections.yearly,
      }
    } catch (err) {
      console.error(`Error calculating interest for ${balance.symbol}:`, err)
      throw err
    }
  }, [tokenPrices])

  // Calculate interest data for all balances
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['realTimeInterest', balances.map(b => ({
      protocol: b.protocol,
      symbol: b.symbol,
      balance: b.balance.toString(), // Convert BigInt to string for serialization
      apy: b.apy,
      valueUSD: b.valueUSD
    })), tokenPrices],
    queryFn: async () => {
      if (!tokenPrices || balances.length === 0) return {}

      const results: RealTimeInterestData = {}
      
      await Promise.all(
        balances.map(async (balance) => {
          try {
            const key = `${balance.protocol}-${balance.symbol}`
            results[key] = await calculateInterestForBalance(balance)
          } catch (err) {
            console.error(`Failed to calculate interest for ${balance.protocol}-${balance.symbol}:`, err)
          }
        })
      )

      return results
    },
    enabled: !pricesLoading && balances.length > 0,
    refetchInterval: false,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Update local state when query data changes
  useEffect(() => {
    if (data) {
      setInterestData(data)
      setError(null)
    }
  }, [data])

  // Calculate totals
  const totals = Object.values(interestData).reduce(
    (acc, curr) => ({
      earnings: acc.earnings + curr.earningsUSD,
      daily: acc.daily + curr.projectedYield24h,
      monthly: acc.monthly + curr.projectedYield30d,
      yearly: acc.yearly + curr.projectedYield1y,
    }),
    { earnings: 0, daily: 0, monthly: 0, yearly: 0 }
  )

  return {
    interestData,
    totalEarnings: totals.earnings,
    totalProjectedDaily: totals.daily,
    totalProjectedMonthly: totals.monthly,
    totalProjectedYearly: totals.yearly,
    isLoading: isLoading || pricesLoading,
    error,
    refetch,
  }
}

// Helper function to get token decimals
function getTokenDecimals(symbol: string): number {
  const decimalsMap: Record<string, number> = {
    'USDC': 6,
    'USDT': 6,
    'DAI': 18,
    'WETH': 18,
    'ETH': 18,
    'WBTC': 8,
    'BTC': 8,
  }
  
  return decimalsMap[symbol.toUpperCase()] || 18
}

// Hook for portfolio optimization suggestions
export function useYieldOptimization(
  totalAmount: number,
  riskTolerance: number = 5
) {
  return useQuery({
    queryKey: ['yieldOptimization', totalAmount, riskTolerance],
    queryFn: async () => {
      // Mock protocol data - in production this would come from live protocol APIs
      const protocols = [
        {
          name: 'Aave v3',
          apy: 4.2,
          tvl: 12000000000,
          riskScore: 2,
          gasEstimate: 25,
        },
        {
          name: 'Compound v3',
          apy: 3.8,
          tvl: 8000000000,
          riskScore: 3,
          gasEstimate: 30,
        },
        {
          name: 'Maker DSR',
          apy: 3.3,
          tvl: 5000000000,
          riskScore: 1,
          gasEstimate: 20,
        },
      ]

      return InterestCalculator.suggestOptimalYield(
        protocols,
        totalAmount,
        riskTolerance
      )
    },
    enabled: totalAmount > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for historical performance tracking
export function useHistoricalPerformance(positions: ProtocolBalance[]) {
  return useQuery({
    queryKey: ['historicalPerformance', positions],
    queryFn: async () => {
      if (positions.length === 0) return null

      // Convert positions to the format expected by the calculator
      const formattedPositions = positions.map(position => ({
        principal: position.balance, // In production, track actual principal
        currentBalance: position.balance, // This would be updated in real-time
        timeHeld: 30 * 24 * 60 * 60, // 30 days for demo
        decimals: getTokenDecimals(position.symbol),
      }))

      return InterestCalculator.calculateTimeWeightedReturn(formattedPositions)
    },
    enabled: positions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}