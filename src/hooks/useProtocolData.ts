'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { protocolManager } from '@/lib/protocols'
import { ProtocolBalance } from '@/types/contracts'

export function useProtocolData() {
  return useQuery({
    queryKey: ['protocolData'],
    queryFn: () => protocolManager.getAllProtocolData(),
    refetchInterval: false, // Disable auto-refetch
    staleTime: Infinity, // Never consider stale
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function useUserBalances() {
  const { address, isConnected } = useAccount()

  return useQuery({
    queryKey: ['userBalances', address?.toLowerCase()], // Ensure consistent string format
    queryFn: async (): Promise<ProtocolBalance[]> => {
      if (!address) return []
      return protocolManager.getUserBalances(address)
    },
    enabled: isConnected && !!address,
    refetchInterval: false, // Disable auto-refetch to prevent excessive calls
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export function usePortfolioSummary() {
  const { data: balances = [], isLoading } = useUserBalances()

  const summary = {
    totalUsd: balances.reduce((sum, balance) => sum + balance.balanceUsd, 0),
    totalAccruedUsd: balances.reduce((sum, balance) => sum + balance.accruedInterestUsd, 0),
    averageApy: balances.length > 0 
      ? balances.reduce((sum, balance) => sum + balance.apy, 0) / balances.length 
      : 0,
    protocolCount: new Set(balances.map(b => b.protocol)).size,
    assetCount: new Set(balances.map(b => b.asset)).size,
  }

  return {
    ...summary,
    balances,
    isLoading,
  }
}