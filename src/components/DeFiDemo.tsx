'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { protocolManager } from '../lib/protocols'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ProtocolDemo {
  name: string
  displayName: string
  description: string
  apy: number
  tvl: number
  supportedAssets: string[]
  exampleCode: string
}

export function DeFiDemo() {
  const { address, isConnected } = useAccount()
  const [selectedProtocol, setSelectedProtocol] = useState<string>('compound_v2')
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC')
  const [amount, setAmount] = useState<string>('100')
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<string>('')
  const [userBalances, setUserBalances] = useState<Array<{
    protocol: string
    asset: Address
    symbol: string
    balance: bigint
    apy: number
    valueUSD: number
  }>>([])

  const protocols: ProtocolDemo[] = [
    {
      name: 'compound_v2',
      displayName: 'Compound v2',
      description: 'Traditional cToken lending protocol',
      apy: 4.1,
      tvl: 85000000,
      supportedAssets: ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'],
      exampleCode: `// Compound v2 Deposit Example
const cTokenAddress = '0x39AA39c021dfbaE8faC545936693aC917d5E7563'; // cUSDC
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// 1. Approve cToken to spend USDC
await usdcContract.approve(cTokenAddress, amount);

// 2. Mint cTokens (deposit)
const tx = await cTokenContract.mint(amount);
await tx.wait();`
    },
    {
      name: 'maker_dsr',
      displayName: 'Maker DSR',
      description: 'Dai Savings Rate from MakerDAO',
      apy: 3.3,
      tvl: 50000000,
      supportedAssets: ['DAI'],
      exampleCode: `// Maker DSR Deposit Example
const dsrManagerAddress = '0x373238337Bfe1146fb49989fc222523f83081dDb';
const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// 1. Approve DSR Manager to spend DAI
await daiContract.approve(dsrManagerAddress, amount);

// 2. Join DSR (deposit)
const tx = await dsrManagerContract.join(amount);
await tx.wait();`
    },
    {
      name: 'aave_v3',
      displayName: 'Aave v3',
      description: 'Decentralized lending and borrowing protocol',
      apy: 4.2,
      tvl: 150000000,
      supportedAssets: ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'],
      exampleCode: `// Aave v3 Deposit Example
const aavePoolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
const assetAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC

// 1. Approve Aave Pool to spend tokens
await tokenContract.approve(aavePoolAddress, amount);

// 2. Supply to Aave v3 Pool
const tx = await aavePoolContract.supply(
  assetAddress, 
  amount, 
  userAddress, 
  0 // referralCode
);
await tx.wait();`
    },
    {
      name: 'compound_v3',
      displayName: 'Compound v3',
      description: 'Capital efficient money markets',
      apy: 3.9,
      tvl: 100000000,
      supportedAssets: ['USDC', 'WETH'],
      exampleCode: `// Compound v3 Deposit Example
const cometAddress = '0xc3d688B66703497DAA19211EEdff47f25384cdc3'; // USDC Comet
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

// 1. Approve Comet to spend USDC
await usdcContract.approve(cometAddress, amount);

// 2. Supply to Comet
const tx = await cometContract.supply(usdcAddress, amount);
await tx.wait();`
    }
  ]

  const selectedProtocolData = protocols.find(p => p.name === selectedProtocol)

  const loadUserBalances = async () => {
    if (!address) return
    
    try {
      const balances = await protocolManager.getUserBalances(address)
      setUserBalances(balances)
    } catch (error) {
      console.error('Error loading balances:', error)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadUserBalances()
    }
  }, [isConnected, address, loadUserBalances])

  const handleDeposit = async () => {
    if (!address || !selectedProtocolData) return

    setIsExecuting(true)
    setResult('')

    try {
      // Parse amount to wei (assuming 6 decimals for USDC, 18 for others)
      const decimals = selectedAsset === 'USDC' || selectedAsset === 'USDT' ? 6 : 18
      const amountWei = BigInt(parseFloat(amount) * Math.pow(10, decimals))

      // Execute deposit through protocol manager
      const txHash = await protocolManager.deposit(
        selectedProtocolData.name,
        getAssetAddress(selectedAsset),
        amountWei,
        address
      )

      setResult(`✅ Deposit successful! Transaction: ${txHash}`)
      await loadUserBalances()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult(`❌ Error: ${errorMessage}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!address || !selectedProtocolData) return

    setIsExecuting(true)
    setResult('')

    try {
      // Parse amount to wei
      const decimals = selectedAsset === 'USDC' || selectedAsset === 'USDT' ? 6 : 18
      const amountWei = BigInt(parseFloat(amount) * Math.pow(10, decimals))

      // Execute withdraw through protocol manager
      const txHash = await protocolManager.withdraw(
        selectedProtocolData.name,
        getAssetAddress(selectedAsset),
        amountWei,
        address
      )

      setResult(`✅ Withdraw successful! Transaction: ${txHash}`)
      await loadUserBalances()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult(`❌ Error: ${errorMessage}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const getAssetAddress = (asset: string): Address => {
    const addresses: Record<string, Address> = {
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
      'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
      'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
      'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address,
    }
    return addresses[asset] || addresses['USDC']
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatAPY = (apy: number) => {
    return `${apy.toFixed(2)}%`
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">DeFi Savings Demo</CardTitle>
            <p className="text-gray-600 mt-2">
              Connect your wallet to interact with DeFi protocols
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <ConnectWallet />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">DeFi Savings Protocol Demo</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive demonstration of deposit and withdraw functionality for Compound v2, Compound v3, Aave v3, and Maker DSR protocols
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Protocol Selection & Interaction */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Protocol Interaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Protocol Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Protocol
                  </label>
                  <select
                    value={selectedProtocol}
                    onChange={(e) => setSelectedProtocol(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {protocols.map((protocol) => (
                      <option key={protocol.name} value={protocol.name}>
                        {protocol.displayName} - {formatAPY(protocol.apy)} APY
                      </option>
                    ))}
                  </select>
                </div>

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
                    {selectedProtocolData?.supportedAssets.map((asset) => (
                      <option key={asset} value={asset}>
                        {asset}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDeposit}
                    disabled={isExecuting}
                    className="flex-1"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    {isExecuting ? 'Depositing...' : 'Deposit'}
                  </Button>
                  <Button
                    onClick={handleWithdraw}
                    disabled={isExecuting}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                    {isExecuting ? 'Withdrawing...' : 'Withdraw'}
                  </Button>
                </div>

                {/* Result */}
                {result && (
                  <div className={`p-3 rounded-lg ${
                    result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      {result.includes('✅') ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      <span className="text-sm">{result}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Your Balances
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadUserBalances}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userBalances.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No balances found</p>
                ) : (
                  <div className="space-y-3">
                    {userBalances.map((balance, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{balance.symbol}</p>
                          <p className="text-sm text-gray-500">{balance.protocol}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${balance.valueUSD.toFixed(2)}</p>
                          <p className="text-sm text-green-600">{balance.apy.toFixed(2)}% APY</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Protocol Information & Code */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Protocol Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedProtocolData && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedProtocolData.displayName}</h3>
                        <p className="text-gray-600">{selectedProtocolData.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Current APY</p>
                        <p className="text-xl font-bold text-green-600">{formatAPY(selectedProtocolData.apy)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Total Value Locked</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedProtocolData.tvl)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Supported Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProtocolData.supportedAssets.map((asset) => (
                          <span
                            key={asset}
                            className={`px-3 py-1 rounded-full text-sm ${
                              asset === selectedAsset 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Implementation Code</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{selectedProtocolData?.exampleCode}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
