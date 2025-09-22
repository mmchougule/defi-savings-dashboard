'use client'

import { useState } from 'react'
import { Address, parseUnits } from 'viem'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { protocolManager } from '@/lib/protocols'
import { TransactionStatus } from '@/types/contracts'

export function useTransaction() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<TransactionStatus[]>([])

  const addTransaction = (tx: Omit<TransactionStatus, 'timestamp'>) => {
    const newTx: TransactionStatus = {
      ...tx,
      timestamp: Date.now(),
    }
    setTransactions(prev => [newTx, ...prev])
  }

  const updateTransactionStatus = (hash: Address, status: TransactionStatus['status']) => {
    setTransactions(prev =>
      prev.map(tx => (tx.hash === hash ? { ...tx, status } : tx))
    )
  }

  const deposit = async (
    protocol: string,
    asset: Address,
    amount: string,
    decimals: number
  ) => {
    if (!address) throw new Error('Wallet not connected')

    try {
      const amountBigInt = parseUnits(amount, decimals)
      const hash = await protocolManager.deposit(protocol, asset, amountBigInt, address)

      addTransaction({
        hash,
        status: 'pending',
        type: 'deposit',
        protocol,
        asset: asset, // Would need to resolve symbol
        amount,
      })

      return hash
    } catch (error) {
      console.error('Deposit failed:', error)
      throw error
    }
  }

  const withdraw = async (
    protocol: string,
    asset: Address,
    amount: string,
    decimals: number
  ) => {
    if (!address) throw new Error('Wallet not connected')

    try {
      const amountBigInt = parseUnits(amount, decimals)
      const hash = await protocolManager.withdraw(protocol, asset, amountBigInt, address)

      addTransaction({
        hash,
        status: 'pending',
        type: 'withdraw',
        protocol,
        asset: asset, // Would need to resolve symbol
        amount,
      })

      return hash
    } catch (error) {
      console.error('Withdraw failed:', error)
      throw error
    }
  }

  return {
    transactions,
    deposit,
    withdraw,
    updateTransactionStatus,
  }
}

export function useTransactionReceipt(hash?: Address) {
  return useWaitForTransactionReceipt({
    hash,
  })
}