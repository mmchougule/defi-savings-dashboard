'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, ExternalLink, Copy, Check, Clock, DollarSign, Coins, Zap, TrendingUp, RefreshCw } from 'lucide-react'
import { useAaveTransactions, type AaveTransaction } from '../hooks/useAaveTransactions'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

const TransactionIcon = ({ type, asset }: { type: string; asset: string }) => {
  const iconMap = {
    'USDC': DollarSign,
    'DAI': Coins,
    'WETH': Zap,
  }
  
  const AssetIcon = iconMap[asset as keyof typeof iconMap] || Coins
  
  if (type === 'deposit') {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full crypto-green-gradient flex items-center justify-center">
          <ArrowDownCircle className="h-5 w-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800">
          <AssetIcon className="h-3 w-3 text-green-400" />
        </div>
      </div>
    )
  } else if (type === 'withdraw') {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
          <ArrowUpCircle className="h-5 w-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800">
          <AssetIcon className="h-3 w-3 text-red-400" />
        </div>
      </div>
    )
  } else {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full crypto-gradient flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800">
          <AssetIcon className="h-3 w-3 text-blue-400" />
        </div>
      </div>
    )
  }
}

const TransactionRow = ({ transaction }: { transaction: AaveTransaction }) => {
  const [copied, setCopied] = useState(false)

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transaction.txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewOnEtherscan = () => {
    window.open(`https://etherscan.io/tx/${transaction.txHash}`, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group hover-lift glass rounded-2xl p-4 hover:bg-white/10 cursor-pointer transition-all duration-300"
      onClick={handleViewOnEtherscan}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TransactionIcon type={transaction.type} asset={transaction.asset} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white capitalize beginner-tooltip" 
                    data-tooltip={`${transaction.type === 'deposit' ? 'Money put into' : transaction.type === 'withdraw' ? 'Money taken out of' : 'Money borrowed from'} Aave`}>
                {transaction.type}
              </span>
              <span className="text-slate-400 text-sm">•</span>
              <span className="text-slate-300 font-medium">{transaction.asset}</span>
              {transaction.status === 'pending' && (
                <Clock className="h-4 w-4 text-yellow-400 animate-spin" />
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-1">
              <span className="text-slate-400 text-sm">{formatTime(transaction.timestamp)}</span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopy()
                  }}
                  className="text-slate-500 hover:text-slate-300 transition-colors beginner-tooltip"
                  data-tooltip="Copy transaction hash"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                
                <span className="text-slate-500 font-mono text-xs">
                  {transaction.txHash.slice(0, 6)}...{transaction.txHash.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={cn(
            "font-bold text-lg",
            transaction.type === 'deposit' ? "text-green-400" : 
            transaction.type === 'withdraw' ? "text-red-400" : "text-blue-400"
          )}>
            {transaction.type === 'withdraw' ? '-' : '+'}{transaction.amount} {transaction.asset}
          </div>
          <div className="text-slate-400 text-sm">${transaction.amountUSD}</div>
          
          {transaction.gasUsed && (
            <div className="text-slate-500 text-xs mt-1 beginner-tooltip" 
                 data-tooltip="Network fee paid for this transaction">
              Gas: {transaction.gasPriceGwei} gwei
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const TransactionFilters = ({ 
  filter, 
  onFilterChange 
}: { 
  filter: string
  onFilterChange: (filter: string) => void 
}) => {
  const filters = [
    { key: 'all', label: 'All Transactions', icon: null },
    { key: 'deposit', label: 'Deposits', icon: ArrowDownCircle },
    { key: 'withdraw', label: 'Withdrawals', icon: ArrowUpCircle },
    { key: 'borrow', label: 'Borrows', icon: TrendingUp },
  ]

  return (
    <div className="flex gap-2 mb-6">
      {filters.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={filter === key ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(key)}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            filter === key 
              ? "crypto-gradient text-white shadow-lg" 
              : "glass border-slate-600 text-slate-300 hover:bg-white/10"
          )}
        >
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </Button>
      ))}
    </div>
  )
}

export function AaveTransactionHistory() {
  const { transactions, loading, error, refetch } = useAaveTransactions()
  const [filter, setFilter] = useState('all')

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  )

  if (loading) {
    return (
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />
            <span className="text-slate-300">Loading your transactions...</span>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass border-slate-700 p-6">
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Failed to load transactions</div>
          <Button onClick={refetch} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Transaction History</h3>
          <p className="text-slate-400 text-sm beginner-tooltip" 
             data-tooltip="All your Aave deposits, withdrawals, and borrows">
            Your Aave activity ({transactions.length} transactions)
          </p>
        </div>
        
        <Button
          onClick={refetch}
          variant="outline"
          size="sm"
          className="glass border-slate-600 text-slate-300 hover:bg-white/10 beginner-tooltip"
          data-tooltip="Refresh transaction list"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <TransactionFilters filter={filter} onFilterChange={setFilter} />

      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full glass mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-slate-300 font-medium mb-2">No transactions yet</h4>
            <p className="text-slate-500 text-sm">
              {filter === 'all' 
                ? "Your Aave transactions will appear here once you start depositing or borrowing"
                : `No ${filter} transactions found`}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TransactionRow transaction={transaction} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            className="w-full glass border-slate-600 text-slate-300 hover:bg-white/10 beginner-tooltip"
            data-tooltip="View all transactions on Etherscan"
            onClick={() => window.open('https://etherscan.io/address/YOUR_ADDRESS', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View All on Etherscan
          </Button>
        </div>
      )}
    </Card>
  )
}
