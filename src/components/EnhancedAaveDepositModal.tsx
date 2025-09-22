'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { Address } from 'viem'
import { CheckCircle, DollarSign, Coins, Zap, ExternalLink, Copy, Check } from 'lucide-react'
import { Modal } from './ui/responsive-modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useSendTransaction } from '@aave/react/viem'
import { useWalletClient } from 'wagmi'
import { useSupply, useWithdraw, evmAddress, bigDecimal, errAsync, chainId } from '@aave/react'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { cn } from '@/lib/utils'

// Aave v3 Ethereum mainnet market address
const AAVE_V3_ETHEREUM_MARKET = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'

interface EnhancedAaveDepositModalProps {
  action: 'deposit' | 'withdraw'
  open: boolean
  onClose: () => void
  userAddress: Address
}

// Enhanced Asset Card Component
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
  }
  const Icon = iconMap[asset.symbol as keyof typeof iconMap] || DollarSign

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-200 group",
        "hover:scale-105 hover:shadow-md",
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-md scale-105" 
          : "border-gray-200 hover:border-gray-300 bg-white"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          isSelected ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            isSelected ? "text-blue-600" : "text-gray-600"
          )} />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900">{asset.symbol}</div>
          <div className="text-sm text-gray-500">{asset.balance}</div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  )
}

// Enhanced Transaction Success Component
const TransactionSuccess = ({ 
  txHash, 
  amount, 
  asset, 
  action,
  onClose 
}: { 
  txHash: string
  amount: string
  asset: string
  action: string
  onClose: () => void 
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [txHash])

  const handleViewOnEtherscan = useCallback(() => {
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
  }, [txHash])

  return (
    <div className="text-center space-y-6 p-6">
      {/* Success Animation */}
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
        <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {action === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!
        </h3>
        <p className="text-gray-600">
          Your {action} of {amount} {asset} has been completed
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Amount</span>
          <span className="font-semibold text-gray-900">{amount} {asset}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Protocol</span>
          <span className="font-semibold text-gray-900">Aave v3</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-start gap-2">
            <span className="text-gray-600 text-sm">Transaction</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-900">
                {txHash.slice(0, 6)}...{txHash.slice(-4)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleViewOnEtherscan}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View on Etherscan
        </Button>
        <Button onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </div>
  )
}

export function EnhancedAaveDepositModal({ action, open, onClose, userAddress }: EnhancedAaveDepositModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { data: walletClient } = useWalletClient()
  const [sendTransaction, sending] = useSendTransaction(walletClient)

  // Get real token balances
  const { balance: usdcBalance } = useUSDCBalance()
  const { balance: daiBalance } = useDAIBalance()
  const { balance: wethBalance } = useWETHBalance()

  // Supported assets with real balances
  const supportedAssets = useMemo(() => [
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: usdcBalance, address: CONTRACT_ADDRESSES.USDC },
    { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, balance: daiBalance, address: CONTRACT_ADDRESSES.DAI },
    { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, balance: wethBalance, address: CONTRACT_ADDRESSES.WETH },
  ], [usdcBalance, daiBalance, wethBalance])

  const selectedAssetData = supportedAssets.find(asset => asset.symbol === selectedAsset)

  // Aave SDK hooks
  const [prepareSupply, preparingSupply] = useSupply()
  const [prepareWithdraw, preparingWithdraw] = useWithdraw()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !selectedAssetData) {
      setError('Please enter an amount and select an asset')
      return
    }

    if (!walletClient) {
      setError('Wallet not connected. Please connect your wallet first.')
      return
    }

    if (!userAddress) {
      setError('User address not available. Please reconnect your wallet.')
      return
    }

    startTransition(async () => {
      setError(null)

      try {
        const assetAddress = selectedAssetData.address as Address
        const amountValue = bigDecimal(amount)

        if (action === 'deposit') {
          // Follow official Aave SDK documentation pattern for supply
          const result = await prepareSupply({
            market: evmAddress(AAVE_V3_ETHEREUM_MARKET),
            amount: {
              erc20: {
                currency: evmAddress(assetAddress),
                value: amountValue,
              },
            },
            sender: evmAddress(userAddress),
            chainId: chainId(1), // Ethereum mainnet
          }).andThen((plan) => {
            switch (plan.__typename) {
              case "TransactionRequest":
                return sendTransaction(plan)
              case "ApprovalRequired":
                return sendTransaction(plan.approval).andThen(() =>
                  sendTransaction(plan.originalTransaction)
                )
              case "InsufficientBalanceError":
                return errAsync(
                  new Error(`Insufficient balance: ${plan.required.value} required.`)
                )
              default:
                return errAsync(new Error('Unknown transaction plan type'))
            }
          })

          if (result.isErr()) {
            throw new Error('Transaction failed')
          }

          setTxHash(result.value as string)
        } else {
          // Follow official Aave SDK documentation pattern for withdraw
          const result = await prepareWithdraw({
            market: evmAddress(AAVE_V3_ETHEREUM_MARKET),
            amount: {
              erc20: {
                currency: evmAddress(assetAddress),
                value: {
                  exact: amountValue,
                },
              },
            },
            sender: evmAddress(userAddress),
            chainId: chainId(1), // Ethereum mainnet
          }).andThen((plan) => {
            switch (plan.__typename) {
              case "TransactionRequest":
                return sendTransaction(plan)
              case "ApprovalRequired":
                return sendTransaction(plan.approval).andThen(() =>
                  sendTransaction(plan.originalTransaction)
                )
              case "InsufficientBalanceError":
                return errAsync(
                  new Error(`Insufficient balance: ${plan.required.value} required.`)
                )
              default:
                return errAsync(new Error('Unknown transaction plan type'))
            }
          })

          if (result.isErr()) {
            throw new Error('Withdraw failed')
          }

          setTxHash(result.value as string)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Transaction failed')
      }
    })
  }, [amount, selectedAssetData, walletClient, userAddress, prepareSupply, prepareWithdraw, sendTransaction, action])

  const handleMaxAmount = useCallback(() => {
    if (selectedAssetData) {
      setAmount(selectedAssetData.balance)
    }
  }, [selectedAssetData])

  const handleClose = useCallback(() => {
    setAmount('')
    setSelectedAsset('USDC')
    setError(null)
    setTxHash(null)
    onClose()
  }, [onClose])

  // Combine loading states
  const isLoadingTransaction = isPending || preparingSupply.loading || preparingWithdraw.loading || sending.loading

  return (
    <Modal.Root open={open} onOpenChange={handleClose}>
      <Modal.Content className="sm:max-w-md">
        {txHash ? (
          <TransactionSuccess
            txHash={txHash}
            amount={amount}
            asset={selectedAsset}
            action={action}
            onClose={handleClose}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <Modal.Header>
              <Modal.Title className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  action === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {action === 'deposit' ? (
                    <Coins className="h-4 w-4 text-green-600" />
                  ) : (
                    <Zap className="h-4 w-4 text-red-600" />
                  )}
                </div>
                {action === 'deposit' ? 'Deposit to' : 'Withdraw from'} Aave v3
              </Modal.Title>
              <Modal.Description>
                {action === 'deposit' 
                  ? 'Earn yield by supplying assets to Aave'
                  : 'Withdraw your supplied assets from Aave'
                }
              </Modal.Description>
            </Modal.Header>

            <Modal.Body className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm font-medium text-red-800">Transaction Failed</p>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              )}

              {/* Asset Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Asset
                </label>
                <div className="grid gap-3">
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
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-12 pr-20"
                    step="0.01"
                    min="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMaxAmount}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 text-xs"
                  >
                    Max
                  </Button>
                </div>
                {selectedAssetData && (
                  <p className="text-xs text-gray-500">
                    Available: {selectedAssetData.balance} {selectedAsset}
                  </p>
                )}
              </div>

              {/* Transaction Preview */}
              {amount && selectedAssetData && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Protocol</span>
                      <span className="font-medium text-gray-900">Aave v3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Action</span>
                      <span className="font-medium text-gray-900 capitalize">{action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Asset</span>
                      <span className="font-medium text-gray-900">{selectedAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium text-gray-900">{amount} {selectedAsset}</span>
                    </div>
                  </div>
                </div>
              )}
            </Modal.Body>

            <Modal.FormFooter
              isPending={isLoadingTransaction}
              submitLabel={
                isLoadingTransaction 
                  ? `Processing ${action}...` 
                  : `${action === 'deposit' ? 'Deposit' : 'Withdraw'}`
              }
            />
          </form>
        )}
      </Modal.Content>
    </Modal.Root>
  )
}
