import { Address } from 'viem'
import { safeBigintStringify, safeBigintParse } from './bigintUtils'

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  APPROVE = 'approve',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface Transaction {
  id: string
  hash: string
  type: TransactionType
  protocol: string
  asset: Address
  symbol: string
  amount: bigint
  amountFormatted: string
  valueUSD: number
  apy: number
  userAddress: Address
  timestamp: number
  status: TransactionStatus
  confirmations?: number
  gasUsed?: string
  gasPrice?: string
  blockNumber?: number
  error?: string
}

export interface PortfolioPosition {
  id: string
  protocol: string
  asset: Address
  symbol: string
  totalDeposited: bigint
  totalWithdrawn: bigint
  currentBalance: bigint
  averageApy: number
  firstDepositTimestamp: number
  lastUpdateTimestamp: number
  transactions: string[] // Transaction IDs
  valueUSD: number
  unrealizedGainsUSD: number
}

export interface PortfolioSnapshot {
  timestamp: number
  totalValueUSD: number
  totalEarningsUSD: number
  positions: PortfolioPosition[]
  transactions: Transaction[]
}

export class TransactionHistoryManager {
  private readonly STORAGE_KEY_TRANSACTIONS = 'defi_dashboard_transactions'
  private readonly STORAGE_KEY_POSITIONS = 'defi_dashboard_positions'
  private readonly STORAGE_KEY_SNAPSHOTS = 'defi_dashboard_snapshots'

  /**
   * Save a new transaction
   */
  saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions()
    transactions.push(transaction)
    
    // Keep only last 1000 transactions to prevent storage bloat
    if (transactions.length > 1000) {
      transactions.splice(0, transactions.length - 1000)
    }
    
    this.setTransactions(transactions)
    this.updatePosition(transaction)
  }

  /**
   * Get all transactions for a user
   */
  getTransactions(userAddress?: Address): Transaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS)
      if (!stored) return []
      
      const transactions: Transaction[] = safeBigintParse(stored)
      
      if (userAddress) {
        return transactions.filter(tx => tx.userAddress.toLowerCase() === userAddress.toLowerCase())
      }
      
      return transactions
    } catch (error) {
      console.error('Error retrieving transactions:', error)
      return []
    }
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(
    transactionId: string, 
    status: TransactionStatus, 
    blockNumber?: number,
    confirmations?: number,
    error?: string
  ): void {
    const transactions = this.getTransactions()
    const txIndex = transactions.findIndex(tx => tx.id === transactionId)
    
    if (txIndex !== -1) {
      transactions[txIndex] = {
        ...transactions[txIndex],
        status,
        blockNumber,
        confirmations,
        error,
      }
      this.setTransactions(transactions)
    }
  }

  /**
   * Get portfolio positions for a user
   */
  getPositions(userAddress: Address): PortfolioPosition[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_POSITIONS)
      if (!stored) return []
      
      const allPositions: PortfolioPosition[] = JSON.parse(stored)
      return allPositions.filter(pos => 
        pos.transactions.some(txId => {
          const tx = this.getTransactionById(txId)
          return tx?.userAddress.toLowerCase() === userAddress.toLowerCase()
        })
      )
    } catch (error) {
      console.error('Error retrieving positions:', error)
      return []
    }
  }

  /**
   * Update or create a portfolio position based on transaction
   */
  private updatePosition(transaction: Transaction): void {
    const positions = this.getAllPositions()
    const positionKey = `${transaction.protocol}-${transaction.symbol}-${transaction.userAddress}`
    
    let position = positions.find(p => 
      p.protocol === transaction.protocol && 
      p.symbol === transaction.symbol &&
      p.transactions.some(txId => {
        const tx = this.getTransactionById(txId)
        return tx?.userAddress.toLowerCase() === transaction.userAddress.toLowerCase()
      })
    )

    if (!position) {
      // Create new position
      position = {
        id: positionKey,
        protocol: transaction.protocol,
        asset: transaction.asset,
        symbol: transaction.symbol,
        totalDeposited: 0n,
        totalWithdrawn: 0n,
        currentBalance: 0n,
        averageApy: transaction.apy,
        firstDepositTimestamp: transaction.timestamp,
        lastUpdateTimestamp: transaction.timestamp,
        transactions: [],
        valueUSD: 0,
        unrealizedGainsUSD: 0,
      }
      positions.push(position)
    }

    // Update position based on transaction type
    if (transaction.type === TransactionType.DEPOSIT) {
      position.totalDeposited += transaction.amount
      position.currentBalance += transaction.amount
    } else if (transaction.type === TransactionType.WITHDRAW) {
      position.totalWithdrawn += transaction.amount
      position.currentBalance = position.currentBalance > transaction.amount 
        ? position.currentBalance - transaction.amount 
        : 0n
    }

    // Update metadata
    position.transactions.push(transaction.id)
    position.lastUpdateTimestamp = transaction.timestamp
    position.valueUSD = transaction.valueUSD
    
    // Calculate weighted average APY
    const relevantTxs = position.transactions
      .map(id => this.getTransactionById(id))
      .filter(tx => tx && (tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.WITHDRAW))
    
    if (relevantTxs.length > 0) {
      const totalValue = relevantTxs.reduce((sum, tx) => sum + (tx?.valueUSD || 0), 0)
      const weightedApy = relevantTxs.reduce((sum, tx) => 
        sum + ((tx?.apy || 0) * (tx?.valueUSD || 0)), 0)
      position.averageApy = totalValue > 0 ? weightedApy / totalValue : transaction.apy
    }

    this.setPositions(positions)
  }

  /**
   * Create a portfolio snapshot
   */
  createSnapshot(userAddress: Address): PortfolioSnapshot {
    const positions = this.getPositions(userAddress)
    const transactions = this.getTransactions(userAddress)
    
    const snapshot: PortfolioSnapshot = {
      timestamp: Date.now(),
      totalValueUSD: positions.reduce((sum, pos) => sum + pos.valueUSD, 0),
      totalEarningsUSD: positions.reduce((sum, pos) => sum + pos.unrealizedGainsUSD, 0),
      positions: [...positions],
      transactions: [...transactions],
    }

    this.saveSnapshot(snapshot)
    return snapshot
  }

  /**
   * Get historical snapshots
   */
  getSnapshots(userAddress: Address, limit: number = 100): PortfolioSnapshot[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_SNAPSHOTS)
      if (!stored) return []
      
      const snapshots: PortfolioSnapshot[] = JSON.parse(stored)
      
      // Filter by user and return most recent first
      return snapshots
        .filter(snapshot => 
          snapshot.transactions.some(tx => 
            tx.userAddress.toLowerCase() === userAddress.toLowerCase()
          )
        )
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
    } catch (error) {
      console.error('Error retrieving snapshots:', error)
      return []
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  calculatePerformance(userAddress: Address): {
    totalInvested: number
    currentValue: number
    totalReturns: number
    totalReturnsPercent: number
    realizedGains: number
    unrealizedGains: number
    bestPerformingAsset: string | null
    worstPerformingAsset: string | null
  } {
    const positions = this.getPositions(userAddress)
    const transactions = this.getTransactions(userAddress)
    
    const totalInvested = positions.reduce((sum, pos) => {
      const deposited = Number(pos.totalDeposited) / Math.pow(10, this.getTokenDecimals(pos.symbol))
      const withdrawn = Number(pos.totalWithdrawn) / Math.pow(10, this.getTokenDecimals(pos.symbol))
      return sum + (deposited - withdrawn)
    }, 0)
    
    const currentValue = positions.reduce((sum, pos) => sum + pos.valueUSD, 0)
    const totalReturns = currentValue - totalInvested
    const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0
    
    // Calculate realized gains from withdraw transactions
    const realizedGains = transactions
      .filter(tx => tx.type === TransactionType.WITHDRAW)
      .reduce((sum, tx) => sum + tx.valueUSD, 0) - totalInvested
    
    const unrealizedGains = totalReturns - realizedGains

    // Find best and worst performing assets
    let bestPerformingAsset: string | null = null
    let worstPerformingAsset: string | null = null
    let bestReturn = -Infinity
    let worstReturn = Infinity

    positions.forEach(pos => {
      const invested = Number(pos.totalDeposited - pos.totalWithdrawn) / Math.pow(10, this.getTokenDecimals(pos.symbol))
      const returnPercent = invested > 0 ? ((pos.valueUSD - invested) / invested) * 100 : 0
      
      if (returnPercent > bestReturn) {
        bestReturn = returnPercent
        bestPerformingAsset = pos.symbol
      }
      
      if (returnPercent < worstReturn) {
        worstReturn = returnPercent
        worstPerformingAsset = pos.symbol
      }
    })

    return {
      totalInvested,
      currentValue,
      totalReturns,
      totalReturnsPercent,
      realizedGains,
      unrealizedGains,
      bestPerformingAsset,
      worstPerformingAsset,
    }
  }

  /**
   * Clear all data (for testing or user preference)
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY_TRANSACTIONS)
    localStorage.removeItem(this.STORAGE_KEY_POSITIONS)
    localStorage.removeItem(this.STORAGE_KEY_SNAPSHOTS)
  }

  // Private helper methods
  private setTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_TRANSACTIONS, safeBigintStringify(transactions))
    } catch (error) {
      console.error('Error saving transactions:', error)
    }
  }

  private getAllPositions(): PortfolioPosition[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_POSITIONS)
      return stored ? safeBigintParse(stored) : []
    } catch {
      return []
    }
  }

  private setPositions(positions: PortfolioPosition[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_POSITIONS, safeBigintStringify(positions))
    } catch (error) {
      console.error('Error saving positions:', error)
    }
  }

  private saveSnapshot(snapshot: PortfolioSnapshot): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY_SNAPSHOTS)
      const snapshots: PortfolioSnapshot[] = stored ? safeBigintParse(stored) : []
      
      snapshots.push(snapshot)
      
      // Keep only last 100 snapshots
      if (snapshots.length > 100) {
        snapshots.splice(0, snapshots.length - 100)
      }
      
      localStorage.setItem(this.STORAGE_KEY_SNAPSHOTS, safeBigintStringify(snapshots))
    } catch (error) {
      console.error('Error saving snapshot:', error)
    }
  }

  private getTransactionById(id: string): Transaction | undefined {
    const transactions = this.getTransactions()
    return transactions.find(tx => tx.id === id)
  }

  private getTokenDecimals(symbol: string): number {
    const decimalsMap: Record<string, number> = {
      'USDC': 6,
      'USDT': 6,
      'DAI': 18,
      'WETH': 18,
      'ETH': 18,
      'WBTC': 8,
    }
    return decimalsMap[symbol.toUpperCase()] || 18
  }
}

// Export singleton instance
export const transactionHistory = new TransactionHistoryManager()