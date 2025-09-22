'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { ProtocolConfig, SupportedAsset } from '@/types/contracts'
import { useTransaction } from '@/hooks/useTransactions'
import { useEthereumTransactions } from '@/hooks/useEthereumTransactions'

interface ProtocolCardProps {
  protocol: ProtocolConfig
  data?: {
    name: string
    assets: Array<{
      symbol: string
      supplyApy?: number
      utilization?: number
    }>
  }
}

export function ProtocolCard({ protocol, data }: ProtocolCardProps) {
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset | null>(null)
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const { deposit, withdraw, transactions: localTransactions } = useTransaction()
  const { transactions: ethereumTransactions } = useEthereumTransactions()
  const [isLoading, setIsLoading] = useState(false)
  
  // Combine local and Ethereum transactions, prioritizing Ethereum transactions
  const transactions = [...ethereumTransactions, ...localTransactions]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset || !amount) return

    setIsLoading(true)
    try {
      if (action === 'deposit') {
        await deposit(protocol.name, selectedAsset.address, amount, selectedAsset.decimals)
      } else {
        await withdraw(protocol.name, selectedAsset.address, amount, selectedAsset.decimals)
      }
      setAmount('')
    } catch (error) {
      console.error('Transaction failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAssetData = (asset: SupportedAsset) => {
    if (!data) return null
    return data.assets.find(a => a.symbol === asset.symbol)
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {protocol.displayName.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {protocol.displayName}
              </CardTitle>
              <CardDescription className="text-slate-600 mt-1">{protocol.description}</CardDescription>
            </div>
          </div>
          <a
            href={protocol.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
          >
            Visit Site
          </a>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            Select Asset
          </label>
          <select
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all duration-200"
            value={selectedAsset?.symbol || ''}
            onChange={(e) => {
              const asset = protocol.supportedAssets.find(a => a.symbol === e.target.value)
              setSelectedAsset(asset || null)
            }}
          >
            <option value="">Choose an asset</option>
            {protocol.supportedAssets.map((asset) => {
              const assetData = getAssetData(asset)
              return (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} {assetData && `(${assetData.supplyApy?.toFixed(2)}% APY)`}
                </option>
              )
            })}
          </select>
        </div>

        {selectedAsset && (
          <>
            {/* Asset Stats */}
            {(() => {
              const assetData = getAssetData(selectedAsset)
              if (assetData) {
                return (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Supply APY</div>
                      <div className="font-semibold text-green-600">
                        {assetData.supplyApy?.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Utilization</div>
                      <div className="font-semibold">
                        {assetData.utilization?.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Action Selection */}
            <div className="flex rounded-xl border-2 border-gray-200 p-1 bg-gray-50">
              <button
                type="button"
                className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-200 ${
                  action === 'deposit'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
                onClick={() => setAction('deposit')}
              >
                Deposit
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-3 text-sm font-semibold transition-all duration-200 ${
                  action === 'withdraw'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
                onClick={() => setAction('withdraw')}
              >
                Withdraw
              </button>
            </div>

            {/* Amount Input */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Amount ({selectedAsset.symbol})
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder={`0.0 ${selectedAsset.symbol}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="rounded-xl border-2 border-gray-200 px-4 py-3 text-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all duration-200"
                />
              </div>

              <Button
                type="submit"
                className={`w-full py-3 text-lg font-semibold rounded-xl transition-all duration-200 ${
                  action === 'deposit'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                } shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                loading={isLoading}
                disabled={!amount || isLoading}
              >
                {action === 'deposit' ? 'Deposit' : 'Withdraw'} {selectedAsset.symbol}
              </Button>
            </form>
          </>
        )}

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Recent Transactions
            </h4>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.hash} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        tx.status === 'pending' ? 'bg-yellow-500' :
                        tx.status === 'success' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="font-semibold text-gray-800">
                        {tx.type === 'eth_transfer' ? 'ETH Transfer' : 
                         tx.type === 'token_transfer' ? 'Token Transfer' : 
                         tx.type}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {tx.amount} {tx.asset}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-1">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    tx.status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                    'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}