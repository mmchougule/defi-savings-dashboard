'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { protocolManager } from '../lib/protocols'
import { useProtocolData, useUserBalances } from '../hooks/useProtocolData'
import { PortfolioOverview } from './PortfolioOverview'
import { ProtocolAPYView } from './ProtocolAPYView'
import { EnhancedDepositModal } from './EnhancedDepositModal'
import { SearchProtocols } from './SearchProtocols'
import { Shield, TrendingUp, Settings, Zap, LogOut, User, Plus, Minus, RefreshCw, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface ProtocolInfo {
  name: string
  displayName: string
  description: string
  icon: string
  website: string
  supportedAssets: string[]
  averageAPY: number
  totalValueLocked: number
}

export function EnhancedProtocolDashboard() {
  const { address, isConnected } = useAccount()
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<'deposit' | 'withdraw'>('deposit')

  // Fetch protocol data and user balances
  const { data: protocolData, isLoading: protocolsLoading } = useProtocolData()
  const { data: userBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useUserBalances()

  // Process protocol data to include all supported protocols
  const protocols: ProtocolInfo[] = useMemo(() => {
    if (!protocolData) return []
    
    return [
      {
        name: 'aave_v3',
        displayName: 'Aave v3',
        description: 'Decentralized lending and borrowing protocol',
        icon: '/icons/aave.svg',
        website: 'https://aave.com',
        supportedAssets: ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'],
        averageAPY: protocolData.aave?.averageAPY || 0,
        totalValueLocked: protocolData.aave?.totalValueLocked || 0,
      },
      {
        name: 'compound_v3',
        displayName: 'Compound v3',
        description: 'Capital efficient money markets',
        icon: '/icons/compound.svg',
        website: 'https://compound.finance',
        supportedAssets: ['USDC', 'WETH'],
        averageAPY: protocolData.compound?.averageAPY || 0,
        totalValueLocked: protocolData.compound?.totalValueLocked || 0,
      },
      {
        name: 'compound_v2',
        displayName: 'Compound v2',
        description: 'Traditional cToken lending protocol',
        icon: '/icons/compound.svg',
        website: 'https://compound.finance',
        supportedAssets: ['USDC', 'USDT', 'DAI', 'WETH', 'WBTC'],
        averageAPY: protocolData.compoundV2?.averageAPY || 0,
        totalValueLocked: protocolData.compoundV2?.totalValueLocked || 0,
      },
      {
        name: 'maker_dsr',
        displayName: 'Maker DSR',
        description: 'Dai Savings Rate from MakerDAO',
        icon: '/icons/maker.svg',
        website: 'https://makerdao.com',
        supportedAssets: ['DAI'],
        averageAPY: protocolData.maker?.averageAPY || 0,
        totalValueLocked: protocolData.maker?.totalValueLocked || 0,
      },
    ]
  }, [protocolData])

  const handleDeposit = useCallback((protocolName: string) => {
    setSelectedProtocol(protocolName)
    setModalAction('deposit')
    setIsModalOpen(true)
  }, [])

  const handleWithdraw = useCallback((protocolName: string) => {
    setSelectedProtocol(protocolName)
    setModalAction('withdraw')
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedProtocol(null)
    refetchBalances()
  }, [refetchBalances])

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
            <CardTitle className="text-2xl font-bold text-gray-900">DeFi Savings Dashboard</CardTitle>
            <p className="text-gray-600 mt-2">
              Connect your wallet to start earning yield on your crypto assets
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">DeFi Savings</h1>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchBalances()}
                disabled={balancesLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${balancesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <PortfolioOverview 
            totalUsd={0} 
            totalAccruedUsd={0} 
            averageApy={0} 
            protocolCount={0}
            assetCount={0}
            interestData={[]}
            totalEarnings={0}
            totalProjectedDaily={0}
            totalProjectedMonthly={0}
            totalProjectedYearly={0}
          />
        </div>

        {/* Protocol Selection */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">DeFi Protocols</h2>
            <SearchProtocols 
              protocolData={protocolData as any || {}} 
              onDeposit={handleDeposit} 
              onWithdraw={handleWithdraw} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {protocols.map((protocol) => (
              <Card key={protocol.name} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">{protocol.displayName}</CardTitle>
                        <p className="text-sm text-gray-500">{protocol.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">APY</p>
                      <p className="font-semibold text-green-600">{formatAPY(protocol.averageAPY)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">TVL</p>
                      <p className="font-semibold">{formatCurrency(protocol.totalValueLocked)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-sm mb-2">Supported Assets</p>
                    <div className="flex flex-wrap gap-1">
                      {protocol.supportedAssets.map((asset) => (
                        <span
                          key={asset}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeposit(protocol.name)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Deposit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleWithdraw(protocol.name)}
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Withdraw
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Protocol APY Comparison */}
        <div className="mb-8">
          <ProtocolAPYView 
            protocolData={protocolData as any || {}}
            userBalances={[]}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
          />
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      {isModalOpen && selectedProtocol && (
        <EnhancedDepositModal
          protocol={selectedProtocol}
          action={modalAction}
          open={isModalOpen}
          onClose={handleCloseModal}
          userAddress={address as Address}
        />
      )}
    </div>
  )
}
