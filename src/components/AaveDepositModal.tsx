'use client'

import { useState, useMemo, useCallback } from 'react'
import { Address } from 'viem'
import { X, Plus, Minus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useSendTransaction } from '@aave/react/viem'
import { useWalletClient } from 'wagmi'
import { useSupply, useWithdraw, evmAddress, bigDecimal, errAsync, chainId } from '@aave/react'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'
import { CONTRACT_ADDRESSES } from '../constants/contracts'

// Aave v3 Ethereum mainnet market address
const AAVE_V3_ETHEREUM_MARKET = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'

interface AaveDepositModalProps {
  action: 'deposit' | 'withdraw'
  onClose: () => void
  userAddress: Address
}

export function AaveDepositModal({ action, onClose, userAddress }: AaveDepositModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USDC')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const { data: walletClient } = useWalletClient()
  const [sendTransaction, sending] = useSendTransaction(walletClient)

  // Get real token balances - only when address is available
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

  const handleSubmit = useCallback(async () => {
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

    setIsLoading(true)
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
              // Single transaction execution
              return sendTransaction(plan)

            case "ApprovalRequired":
              // Approval + transaction sequence
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
              // Single transaction execution
              return sendTransaction(plan)

            case "ApprovalRequired":
              // Approval + transaction sequence
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
    } finally {
      setIsLoading(false)
    }
  }, [amount, selectedAssetData, walletClient, userAddress, prepareSupply, prepareWithdraw, sendTransaction, action])

  const handleMaxAmount = useCallback(() => {
    if (selectedAssetData) {
      setAmount(selectedAssetData.balance)
    }
  }, [selectedAssetData])

  // Combine loading states following official documentation pattern
  const isLoadingTransaction = isLoading || preparingSupply.loading || preparingWithdraw.loading || sending.loading

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Transaction Successful!
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Your {action} has been completed successfully
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Transaction Hash:</p>
              <p className="font-mono text-sm break-all text-gray-800">{txHash}</p>
            </div>
            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                action === 'deposit' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {action === 'deposit' ? (
                  <Plus className="h-5 w-5 text-green-600" />
                ) : (
                  <Minus className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {action === 'deposit' ? 'Deposit to' : 'Withdraw from'} Aave v3
                </CardTitle>
                <p className="text-sm text-gray-500">Ethereum Mainnet</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Transaction Failed</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Asset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {supportedAssets.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedAsset === asset.symbol
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-sm text-gray-900">{asset.symbol}</div>
                    <div className="text-xs text-gray-500 mt-1">{asset.balance}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20 text-lg"
                step="0.01"
                min="0"
              />
              <Button
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

          {/* Transaction Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Protocol:</span>
                <span className="font-medium text-gray-900">Aave v3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className="font-medium text-gray-900 capitalize">{action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Asset:</span>
                <span className="font-medium text-gray-900">{selectedAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">{amount || '0'} {selectedAsset}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!amount || isLoadingTransaction || !selectedAssetData}
              className={`flex-1 ${
                action === 'deposit' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoadingTransaction ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `${action === 'deposit' ? 'Deposit' : 'Withdraw'}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
