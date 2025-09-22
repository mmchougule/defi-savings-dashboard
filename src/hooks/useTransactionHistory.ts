import { useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Transaction, 
  PortfolioPosition, 
  PortfolioSnapshot,
  TransactionStatus,
  transactionHistory 
} from '@/lib/transactionHistory'

interface UseTransactionHistoryReturn {
  transactions: Transaction[]
  positions: PortfolioPosition[]
  performance: {
    totalInvested: number
    currentValue: number
    totalReturns: number
    totalReturnsPercent: number
    realizedGains: number
    unrealizedGains: number
    bestPerformingAsset: string | null
    worstPerformingAsset: string | null
  }
  isLoading: boolean
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void
  updateTransactionStatus: (id: string, status: TransactionStatus, error?: string) => void
  createSnapshot: () => PortfolioSnapshot
  clearHistory: () => void
  refetch: () => void
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  // Query for transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', address?.toLowerCase()], // Ensure consistent string format
    queryFn: () => address ? transactionHistory.getTransactions(address) : [],
    enabled: !!address,
    refetchInterval: false, // Disable auto-refetch
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Query for positions
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ['positions', address?.toLowerCase()], // Ensure consistent string format
    queryFn: () => address ? transactionHistory.getPositions(address) : [],
    enabled: !!address,
    refetchInterval: 30000,
  })

  // Query for performance metrics
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['performance', address?.toLowerCase()], // Ensure consistent string format
    queryFn: () => address ? transactionHistory.calculatePerformance(address) : {
      totalInvested: 0,
      currentValue: 0,
      totalReturns: 0,
      totalReturnsPercent: 0,
      realizedGains: 0,
      unrealizedGains: 0,
      bestPerformingAsset: null,
      worstPerformingAsset: null,
    },
    enabled: !!address,
    refetchInterval: 30000,
  })

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!address) return

    const transaction: Transaction = {
      ...transactionData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      userAddress: address,
    }

    transactionHistory.saveTransaction(transaction)
    
    // Invalidate relevant queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['transactions', address] })
    queryClient.invalidateQueries({ queryKey: ['positions', address] })
    queryClient.invalidateQueries({ queryKey: ['performance', address] })
  }, [address, queryClient])

  const updateTransactionStatus = useCallback((
    id: string, 
    status: TransactionStatus, 
    error?: string
  ) => {
    transactionHistory.updateTransactionStatus(id, status, undefined, undefined, error)
    
    if (address) {
      queryClient.invalidateQueries({ queryKey: ['transactions', address] })
      queryClient.invalidateQueries({ queryKey: ['positions', address] })
      queryClient.invalidateQueries({ queryKey: ['performance', address] })
    }
  }, [address, queryClient])

  const createSnapshot = useCallback((): PortfolioSnapshot => {
    if (!address) {
      throw new Error('No wallet connected')
    }
    
    const snapshot = transactionHistory.createSnapshot(address)
    
    // Invalidate queries to reflect the new snapshot
    queryClient.invalidateQueries({ queryKey: ['snapshots', address] })
    
    return snapshot
  }, [address, queryClient])

  const clearHistory = useCallback(() => {
    transactionHistory.clearAllData()
    
    if (address) {
      queryClient.invalidateQueries({ queryKey: ['transactions', address] })
      queryClient.invalidateQueries({ queryKey: ['positions', address] })
      queryClient.invalidateQueries({ queryKey: ['performance', address] })
      queryClient.invalidateQueries({ queryKey: ['snapshots', address] })
    }
  }, [address, queryClient])

  const refetch = useCallback(() => {
    if (address) {
      queryClient.invalidateQueries({ queryKey: ['transactions', address] })
      queryClient.invalidateQueries({ queryKey: ['positions', address] })
      queryClient.invalidateQueries({ queryKey: ['performance', address] })
    }
  }, [address, queryClient])

  return {
    transactions,
    positions,
    performance: performance || {
      totalInvested: 0,
      currentValue: 0,
      totalReturns: 0,
      totalReturnsPercent: 0,
      realizedGains: 0,
      unrealizedGains: 0,
      bestPerformingAsset: null,
      worstPerformingAsset: null,
    },
    isLoading: transactionsLoading || positionsLoading || performanceLoading,
    addTransaction,
    updateTransactionStatus,
    createSnapshot,
    clearHistory,
    refetch,
  }
}

// Hook for portfolio snapshots/history
export function usePortfolioSnapshots(limit: number = 50) {
  const { address } = useAccount()
  
  return useQuery({
    queryKey: ['snapshots', address, limit],
    queryFn: () => address ? transactionHistory.getSnapshots(address, limit) : [],
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook for transaction monitoring (watches pending transactions)
export function useTransactionMonitoring() {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  
  const { data: pendingTransactions = [] } = useQuery({
    queryKey: ['pendingTransactions', address],
    queryFn: () => {
      if (!address) return []
      return transactionHistory.getTransactions(address)
        .filter(tx => tx.status === TransactionStatus.PENDING)
    },
    enabled: !!address,
    refetchInterval: 5000, // Check every 5 seconds
  })

  // Auto-update transaction status for pending transactions
  useEffect(() => {
    if (pendingTransactions.length === 0) return

    const checkTransactionStatus = async (tx: Transaction) => {
      try {
        // In a real implementation, you would check the transaction status on-chain
        // For now, we'll simulate auto-confirmation after 30 seconds
        if (Date.now() - tx.timestamp > 30000) {
          transactionHistory.updateTransactionStatus(
            tx.id, 
            TransactionStatus.CONFIRMED,
            Math.floor(Math.random() * 1000000), // Mock block number
            12 // Mock confirmations
          )
          
          if (address) {
            queryClient.invalidateQueries({ queryKey: ['transactions', address] })
            queryClient.invalidateQueries({ queryKey: ['pendingTransactions', address] })
          }
        }
      } catch (error) {
        console.error('Error checking transaction status:', error)
        transactionHistory.updateTransactionStatus(
          tx.id,
          TransactionStatus.FAILED,
          undefined,
          undefined,
          'Failed to confirm transaction'
        )
      }
    }

    // Check each pending transaction
    pendingTransactions.forEach(checkTransactionStatus)
  }, [pendingTransactions, address, queryClient])

  return {
    pendingTransactions,
    pendingCount: pendingTransactions.length,
  }
}