'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownCircle, ArrowUpCircle, ExternalLink, Copy, Check, Clock, DollarSign, Coins, Zap, TrendingUp, RefreshCw, Shield, AlertCircle } from 'lucide-react'
import { useRealTransactions, type RealTransaction } from '../hooks/useRealTransactions'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

const TransactionIcon = ({ type, asset, protocol }: { type: string; asset: string; protocol: string }) => {
  const iconMap = {
    'USDC': DollarSign,
    'DAI': Coins,
    'WETH': Zap,
    'USDT': DollarSign,
    'WBTC': Coins,
  }
  
  const AssetIcon = iconMap[asset as keyof typeof iconMap] || Coins
  
  const protocolColors = {
    'aave_v3': 'crypto-gradient',
    'compound_v2': 'crypto-green-gradient',
    'compound_v3': 'crypto-gradient',
    'maker_dsr': 'crypto-gold-gradient',
  }
  
  const protocolColor = protocolColors[protocol as keyof typeof protocolColors] || 'crypto-gradient'
  
  if (type === 'deposit') {
    return (
      <div className="relative">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", protocolColor)}>
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
        <div className="w-10 h-10 rounded-full crypto-gold-gradient flex items-center justify-center">
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
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", protocolColor)}>
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-800">
          <AssetIcon className="h-3 w-3 text-blue-400" />
        </div>
      </div>
    )
  }
}

const TransactionCard = ({ transaction, onCopyHash }: { transaction: RealTransaction; onCopyHash: (hash: string) => void }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyHash = () => {
    onCopyHash(transaction.txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200"
    >
      <div className="flex items-center space-x-4">
        <TransactionIcon type={transaction.type} asset={transaction.asset} protocol={transaction.protocol} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white capitalize">
                {transaction.type} {transaction.asset}
              </h3>
              <p className="text-sm text-slate-400">
                {getProtocolDisplayName(transaction.protocol)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">
                {transaction.amount} {transaction.asset}
              </p>
              <p className="text-sm text-slate-400">
                ${transaction.amountUSD}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{formatTime(transaction.timestamp)}</span>
              {transaction.status === 'completed' && (
                <span className="flex items-center space-x-1 text-green-400">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span>Confirmed</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyHash}
                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-400" />
                )}
              </button>
              <a
                href={`https://etherscan.io/tx/${transaction.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function RealTransactionHistory() {
  const { transactions, loading, error, refetch } = useRealTransactions()
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <span className="h-5 w-5 mr-2" />
              Recent Transactions
            </h2>
            <div className="w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Transactions</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <span className="h-5 w-5 mr-2" />
            Recent Transactions
          </h2>
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Transactions Found</h3>
            <p className="text-slate-400">
              Your transaction history will appear here once you start using DeFi protocols.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onCopyHash={handleCopyHash}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {copiedHash && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            Transaction hash copied!
          </motion.div>
        )}
      </div>
    </Card>
  )
}
