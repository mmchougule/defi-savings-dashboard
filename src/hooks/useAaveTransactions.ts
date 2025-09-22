'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface AaveTransaction {
  id: string
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay'
  asset: string
  amount: string
  amountUSD: string
  txHash: string
  timestamp: number
  status: 'completed' | 'pending' | 'failed'
  gasUsed?: string
  gasPriceGwei?: string
}

// Mock transaction data for demo - in production, fetch from Aave subgraph
const MOCK_TRANSACTIONS: AaveTransaction[] = [
  {
    id: '1',
    type: 'deposit',
    asset: 'USDC',
    amount: '500.00',
    amountUSD: '500.00',
    txHash: '0xf548122457437a980941d14cdc57473dc76cf01b7b64332612babd2068d87f6d',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    status: 'completed',
    gasUsed: '180,234',
    gasPriceGwei: '25'
  },
  {
    id: '2',
    type: 'withdraw',
    asset: 'DAI',
    amount: '250.00',
    amountUSD: '250.00',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    status: 'completed',
    gasUsed: '145,678',
    gasPriceGwei: '30'
  },
  {
    id: '3',
    type: 'deposit',
    asset: 'WETH',
    amount: '0.5',
    amountUSD: '1,325.00',
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    status: 'completed',
    gasUsed: '162,891',
    gasPriceGwei: '20'
  },
  {
    id: '4',
    type: 'borrow',
    asset: 'USDC',
    amount: '100.00',
    amountUSD: '100.00',
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    status: 'completed',
    gasUsed: '198,456',
    gasPriceGwei: '35'
  }
]

export function useAaveTransactions() {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<AaveTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isConnected || !address) {
        setTransactions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // In production, this would call the Aave subgraph or API
        // For now, return mock data filtered by connected address
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        
        setTransactions(MOCK_TRANSACTIONS)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [address, isConnected])

  return {
    transactions,
    loading,
    error,
    refetch: () => {
      if (isConnected && address) {
        setLoading(true)
        setTimeout(() => {
          setTransactions(MOCK_TRANSACTIONS)
          setLoading(false)
        }, 500)
      }
    }
  }
}
