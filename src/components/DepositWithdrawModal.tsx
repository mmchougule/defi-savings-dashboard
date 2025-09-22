'use client'

import { useState, useEffect, useMemo } from 'react'
import { Address, encodeFunctionData, parseAbi } from 'viem'
import { safeLog } from '@/lib/bigintUtils'
import { safeTransactionCalls, validateTransactionCalls, createTransactionCall } from '@/lib/transactionUtils'
import { X, Plus, Minus, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction'
import { formatUnits, parseUnits } from 'viem'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'

interface DepositWithdrawModalProps {
  protocol: string
  action: 'deposit' | 'withdraw'
  onClose: () => void
  userAddress: Address
}

export function DepositWithdrawModal({ protocol, action, onClose, userAddress }: DepositWithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(protocol === 'maker_dsr' ? 'DAI' : 'USDC')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Protocol name is already in the correct format
  const protocolName = protocol

  // Get real token balances
  const { balance: usdcBalance } = useUSDCBalance()
  const { balance: daiBalance } = useDAIBalance()
  const { balance: wethBalance } = useWETHBalance()

  // Supported assets with contract addresses and real balances
  const supportedAssets = useMemo(() => {
    if (protocolName === 'maker_dsr') {
      // Maker DSR only supports DAI
      return [
        { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, balance: daiBalance, address: CONTRACT_ADDRESSES.DAI },
      ]
    } else {
      // Aave v3 and other protocols support multiple assets
      return [
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: usdcBalance, address: CONTRACT_ADDRESSES.USDC },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6, balance: '0.00', address: CONTRACT_ADDRESSES.USDT }, // USDT balance not implemented yet
        { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, balance: daiBalance, address: CONTRACT_ADDRESSES.DAI },
        { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, balance: wethBalance, address: CONTRACT_ADDRESSES.WETH },
      ]
    }
  }, [protocolName, usdcBalance, daiBalance, wethBalance])

  const selectedAssetData = supportedAssets.find(asset => asset.symbol === selectedAsset)

  // Generate transaction calls based on protocol and action
  const transactionCalls = useMemo(() => {
    if (!amount || !selectedAssetData || !selectedAssetData.address) {
      safeLog('Missing required data:', { amount, selectedAssetData })
      return []
    }

    const amountWei = parseUnits(amount, selectedAssetData.decimals)
    const assetAddress = selectedAssetData.address

    safeLog('Generating transaction calls:', {
      protocol: protocolName,
      action,
      amount,
      amountWei,
      assetAddress,
      userAddress
    })

    // Validate addresses
    if (!assetAddress) {
      console.error('Missing asset address:', { assetAddress })
      return []
    }

    // Handle different protocols
    if (protocolName === 'maker_dsr') {
      // Maker DSR only supports DAI
      if (selectedAsset !== 'DAI') {
        console.error('Maker DSR only supports DAI')
        return []
      }

      const dsrManagerAddress = CONTRACT_ADDRESSES.MAKER_DSR_MANAGER
      
      if (action === 'deposit') {
        // First approve the DSR manager to spend DAI
        const approveCall = createTransactionCall(
          assetAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function approve(address spender, uint256 amount) returns (bool)'
            ]),
            functionName: 'approve',
            args: [dsrManagerAddress, amountWei]
          })
        )

        // Then join the DSR
        const joinCall = createTransactionCall(
          dsrManagerAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function join(uint256 wad)'
            ]),
            functionName: 'join',
            args: [amountWei]
          })
        )

        return [approveCall, joinCall]
      } else {
        // Withdraw from DSR
        return [createTransactionCall(
          dsrManagerAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function exit(uint256 wad)'
            ]),
            functionName: 'exit',
            args: [amountWei]
          })
        )]
      }
    } else if (protocolName === 'compound_v2') {
      // Compound v2 cToken logic
      const cTokenAddresses = {
        [CONTRACT_ADDRESSES.USDC]: CONTRACT_ADDRESSES.CUSDC,
        [CONTRACT_ADDRESSES.USDT]: CONTRACT_ADDRESSES.CUSDT,
        [CONTRACT_ADDRESSES.DAI]: CONTRACT_ADDRESSES.CDAI,
        [CONTRACT_ADDRESSES.WETH]: CONTRACT_ADDRESSES.CETH,
        [CONTRACT_ADDRESSES.WBTC]: CONTRACT_ADDRESSES.CWBTC,
      }

      const cTokenAddress = cTokenAddresses[assetAddress]
      if (!cTokenAddress) {
        console.error('Unsupported asset for Compound v2:', assetAddress)
        return []
      }

      if (action === 'deposit') {
        // First approve the cToken to spend underlying tokens
        const approveCall = createTransactionCall(
          assetAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function approve(address spender, uint256 amount) returns (bool)'
            ]),
            functionName: 'approve',
            args: [cTokenAddress, amountWei]
          })
        )

        // Then mint cTokens
        const mintCall = createTransactionCall(
          cTokenAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function mint(uint256 mintAmount) returns (uint256)'
            ]),
            functionName: 'mint',
            args: [amountWei]
          })
        )

        return [approveCall, mintCall]
      } else {
        // Withdraw from Compound v2 (redeem underlying)
        const redeemCall = createTransactionCall(
          cTokenAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function redeemUnderlying(uint256 redeemAmount) returns (uint256)'
            ]),
            functionName: 'redeemUnderlying',
            args: [amountWei]
          })
        )

        return [redeemCall]
      }
    } else if (protocolName === 'aave_v3') {
      // Aave v3 logic
      const aavePoolAddress = CONTRACT_ADDRESSES.AAVE_V3_POOL

      safeLog('Aave v3 transaction setup:', {
        aavePoolAddress,
        assetAddress,
        amountWei,
        userAddress
      })

      if (!aavePoolAddress) {
        console.error('Missing Aave pool address')
        return []
      }

      if (action === 'deposit') {
        // First approve the Aave pool to spend tokens
        const approveCall = createTransactionCall(
          assetAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function approve(address spender, uint256 amount) returns (bool)'
            ]),
            functionName: 'approve',
            args: [aavePoolAddress, amountWei]
          })
        )

        // Then supply to Aave v3 pool
        const supplyCall = createTransactionCall(
          aavePoolAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
            ]),
            functionName: 'supply',
            args: [assetAddress, amountWei, userAddress, 0] // referralCode = 0
          })
        )

        const calls = [approveCall, supplyCall]
        safeLog('Generated Aave deposit calls:', calls)
        return calls
      } else {
        // Withdraw from Aave v3 pool
        const withdrawCall = createTransactionCall(
          aavePoolAddress,
          encodeFunctionData({
            abi: parseAbi([
              'function withdraw(address asset, uint256 amount, address to)'
            ]),
            functionName: 'withdraw',
            args: [assetAddress, amountWei, userAddress]
          })
        )
        safeLog('Generated Aave withdraw call:', withdrawCall)
        return [withdrawCall]
      }
    } else {
      console.error('Unsupported protocol:', protocolName)
      return []
    }
  }, [amount, selectedAsset, action, userAddress, selectedAssetData, protocolName])


  const handleMaxAmount = () => {
    if (selectedAssetData) {
      setAmount(selectedAssetData.balance)
    }
  }

  if (txHash) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Plus className="h-5 w-5 mr-2" />
              Transaction Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Your {action} transaction has been submitted successfully!
              </p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                <p className="font-mono text-sm break-all">{txHash}</p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {action === 'deposit' ? (
                <Plus className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <Minus className="h-5 w-5 mr-2 text-red-600" />
              )}
              {action === 'deposit' ? 'Deposit to' : 'Withdraw from'} {protocol}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedAssets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} - {asset.name} (Balance: {asset.balance})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
                step="0.01"
                min="0"
              />
              <Button
                variant="outline"
                onClick={handleMaxAmount}
                className="px-3"
              >
                Max
              </Button>
            </div>
            {selectedAssetData && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {selectedAssetData.balance} {selectedAsset}
              </p>
            )}
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Protocol:</span>
                <span className="font-medium">{protocol}</span>
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

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            {transactionCalls.length > 0 ? (
              <Transaction
                calls={safeTransactionCalls(transactionCalls) as any}
              >
                <TransactionButton
                  disabled={!amount || isLoading || !selectedAssetData}
                  className="flex-1"
                  text={isLoading ? 'Processing...' : `${action === 'deposit' ? 'Deposit' : 'Withdraw'}`}
                />
                <TransactionSponsor />
                <TransactionStatus>
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            ) : (
              <Button
                disabled={!amount || !selectedAssetData}
                className="flex-1"
              >
                {action === 'deposit' ? 'Deposit' : 'Withdraw'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
  )
}