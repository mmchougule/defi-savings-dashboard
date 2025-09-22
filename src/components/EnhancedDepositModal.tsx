'use client'

import { useState, useMemo, useCallback } from 'react'
import { Address } from 'viem'
import { CheckCircle, DollarSign, Coins, Zap, ExternalLink, Copy, Check, ArrowUpRight, ArrowDownLeft, Shield, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { cn } from '@/lib/utils'
import { protocolManager } from '../lib/protocols'
import { formatUnits, parseUnits } from 'viem'
import { OnrampButton } from './OnrampButton'

interface EnhancedDepositModalProps {
  action: 'deposit' | 'withdraw'
  protocol: string
  open: boolean
  onClose: () => void
  userAddress: Address
}

// Enhanced Asset Card Component with better colors
const AssetCard = ({ 
  asset, 
  isSelected, 
  onSelect 
}: { 
  asset: {
    symbol: string
    name: string
    decimals: number
    balance: string
    address: string
  }
  isSelected: boolean
  onSelect: () => void 
}) => {
  const iconMap = {
    'USDC': DollarSign,
    'DAI': Coins,
    'WETH': Zap,
    'USDT': DollarSign,
    'WBTC': Coins,
  }
  const Icon = iconMap[asset.symbol as keyof typeof iconMap] || DollarSign

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
        isSelected 
          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200" 
          : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-gray-50"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          isSelected 
            ? "bg-gradient-to-r from-blue-600 to-purple-600" 
            : "bg-gray-200"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            isSelected ? "text-white" : "text-gray-600"
          )} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">{asset.symbol}</h3>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-500">{asset.name}</p>
          <p className="text-sm font-medium text-gray-700">
            Balance: {asset.balance} {asset.symbol}
          </p>
        </div>
      </div>
    </button>
  )
}

// Protocol Info Component
const ProtocolInfo = ({ protocol }: { protocol: string }) => {
  const protocolInfo = {
    'aave_v3': {
      name: 'Aave v3',
      description: 'Decentralized lending protocol',
      color: 'crypto-gradient',
      icon: Shield
    },
    'compound_v2': {
      name: 'Compound v2',
      description: 'Traditional cToken lending',
      color: 'crypto-green-gradient',
      icon: TrendingUp
    },
    'compound_v3': {
      name: 'Compound v3',
      description: 'Capital efficient money markets',
      color: 'crypto-gradient',
      icon: TrendingUp
    },
    'maker_dsr': {
      name: 'Maker DSR',
      description: 'Dai Savings Rate',
      color: 'crypto-gold-gradient',
      icon: Coins
    }
  }

  const info = protocolInfo[protocol as keyof typeof protocolInfo] || protocolInfo['aave_v3']
  const Icon = info.icon

  return (
    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", info.color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{info.name}</h3>
        <p className="text-sm text-gray-600">{info.description}</p>
      </div>
    </div>
  )
}

export function EnhancedDepositModal({ 
  action, 
  protocol, 
  open, 
  onClose, 
  userAddress 
}: EnhancedDepositModalProps) {
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get real token balances
  const { balance: usdcBalance } = useUSDCBalance()
  const { balance: daiBalance } = useDAIBalance()
  const { balance: wethBalance } = useWETHBalance()

  // Supported assets based on protocol
  const supportedAssets = useMemo(() => {
    const baseAssets = [
      { symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: usdcBalance, address: CONTRACT_ADDRESSES.USDC },
      { symbol: 'USDT', name: 'Tether USD', decimals: 6, balance: '0.00', address: CONTRACT_ADDRESSES.USDT },
      { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, balance: daiBalance, address: CONTRACT_ADDRESSES.DAI },
      { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, balance: wethBalance, address: CONTRACT_ADDRESSES.WETH },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, balance: '0.00', address: CONTRACT_ADDRESSES.WBTC },
    ]

    // Filter based on protocol support
    switch (protocol) {
      case 'maker_dsr':
        return baseAssets.filter(asset => asset.symbol === 'DAI')
      case 'compound_v3':
        return baseAssets.filter(asset => ['USDC', 'WETH'].includes(asset.symbol))
      case 'compound_v2':
        return baseAssets.filter(asset => ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'].includes(asset.symbol))
      case 'aave_v3':
      default:
        return baseAssets
    }
  }, [usdcBalance, daiBalance, wethBalance, protocol])

  const selectedAssetData = supportedAssets.find(asset => asset.symbol === selectedAsset)

  const handleMaxAmount = useCallback(() => {
    if (selectedAssetData) {
      setAmount(selectedAssetData.balance)
    }
  }, [selectedAssetData])

  const handleSubmit = useCallback(async () => {
    if (!selectedAssetData || !amount) return

    setIsExecuting(true)
    setError(null)

    try {
      const amountWei = parseUnits(amount, selectedAssetData.decimals)
      
      const txHash = action === 'deposit' 
        ? await protocolManager.deposit(
            protocol,
            selectedAssetData.address,
            amountWei,
            userAddress
          )
        : await protocolManager.withdraw(
            protocol,
            selectedAssetData.address,
            amountWei,
            userAddress
          )

      setTxHash(txHash)
      
      // Refresh balances after successful transaction
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setIsExecuting(false)
    }
  }, [selectedAssetData, amount, action, protocol, userAddress])

  const handleClose = useCallback(() => {
    setAmount('')
    setError(null)
    setTxHash(null)
    setIsExecuting(false)
    onClose()
  }, [onClose])

  if (txHash) {
    const protocolDisplayName = protocol === 'compound_v3' ? 'Compound v3' : 
                                protocol === 'compound_v2' ? 'Compound v2' :
                                protocol === 'aave_v3' ? 'Aave v3' :
                                protocol === 'maker_dsr' ? 'Maker DSR' : protocol.toUpperCase()
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Transaction Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Your {action} to {protocolDisplayName} has been completed successfully.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 font-medium">
              {action === 'deposit' ? '🎉 You are now earning yield!' : '💰 Funds withdrawn successfully'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {action === 'deposit' 
                ? `Your ${selectedAsset} is now earning interest in ${protocolDisplayName}`
                : `Your ${selectedAsset} has been returned to your wallet`
              }
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
            <p className="font-mono text-sm break-all">{txHash}</p>
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Balances will refresh automatically...
          </div>
          <Button onClick={handleClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    )
  }

  if (!open) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {action === 'deposit' ? (
                <ArrowUpRight className="h-6 w-6" />
              ) : (
                <ArrowDownLeft className="h-6 w-6" />
              )}
              <div>
                <h2 className="text-xl font-bold capitalize">
                  {action} to {protocol.replace('_', ' ').toUpperCase()}
                </h2>
                <p className="text-blue-100">
                  {action === 'deposit' ? 'Supply assets to earn yield' : 'Withdraw your assets'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Protocol Info */}
          <ProtocolInfo protocol={protocol} />

          {/* Asset Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Asset</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportedAssets.map((asset) => (
                <AssetCard
                  key={asset.symbol}
                  asset={asset}
                  isSelected={selectedAsset === asset.symbol}
                  onSelect={() => setSelectedAsset(asset.symbol)}
                />
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="text-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Amount</h3>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 text-lg"
                  step="0.01"
                  min="0"
                />
                <Button
                  variant="outline"
                  onClick={handleMaxAmount}
                  className="px-6"
                >
                  Max
                </Button>
              </div>
              {selectedAssetData && (
                <p className="text-sm text-gray-500">
                  Available: {selectedAssetData.balance} {selectedAssetData.symbol}
                </p>
              )}
            </div>
          </div>

          {/* Onramp Section - Show when user has insufficient balance */}
          {action === 'deposit' && selectedAssetData && parseFloat(selectedAssetData.balance) < parseFloat(amount || '0') && (
            <div className="border-t border-gray-200 pt-6">
              <OnrampButton 
                asset={selectedAsset} 
                amount={amount || '100'}
                className="mb-4"
              />
            </div>
          )}

          {/* Transaction Summary */}
          <div className="text-gray-900 rounded-xl p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Protocol:</span>
                <span className="font-medium">{protocol.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium capitalize">{action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Asset:</span>
                <span className="font-medium">{selectedAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{amount || '0'} {selectedAsset}</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!amount || !selectedAssetData || isExecuting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
            >
              {isExecuting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `${action === 'deposit' ? 'Deposit' : 'Withdraw'} ${selectedAsset}`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}