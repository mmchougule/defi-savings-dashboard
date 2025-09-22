'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, usePublicClient, useWalletClient, useDisconnect } from 'wagmi'
import { Address } from 'viem'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { 
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from '@coinbase/onchainkit/transaction'
import { protocolManager } from '../lib/protocols'
import { useProtocolData, useUserBalances, usePortfolioSummary } from '../hooks/useProtocolData'
import { useRealTimeInterest } from '../hooks/useRealTimeInterest'
import { PortfolioOverview } from './PortfolioOverview'
import { ProtocolAPYView } from './ProtocolAPYView'
import { DepositWithdrawModal } from './DepositWithdrawModal'
import { EnhancedAaveDepositModal } from './EnhancedAaveDepositModal'
import { SearchProtocols } from './SearchProtocols'
import { Shield, TrendingUp, Settings, Play, Zap, LogOut, User, Plus, Minus, RefreshCw } from 'lucide-react'

export function DeFiSavingsDashboard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { disconnect } = useDisconnect()


  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAction, setModalAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [loading, setLoading] = useState(false)

  // Fetch protocol data and user balances
  const { data: protocolData, isLoading: protocolsLoading } = useProtocolData()
  const { data: userBalances = [], isLoading: balancesLoading, refetch: refetchBalances } = useUserBalances()
  const { totalUsd, totalAccruedUsd, averageApy, protocolCount, assetCount, balances, isLoading: summaryLoading } = usePortfolioSummary()
  
  // Real-time interest calculations
  const { 
    interestData, 
    totalEarnings, 
    totalProjectedDaily, 
    totalProjectedMonthly, 
    totalProjectedYearly,
    isLoading: interestLoading 
  } = useRealTimeInterest(balances)

  const handleDeposit = useCallback((protocol: string) => {
    setSelectedProtocol(protocol)
    setModalAction('deposit')
    setIsModalOpen(true)
  }, [])

  const handleWithdraw = useCallback((protocol: string) => {
    setSelectedProtocol(protocol)
    setModalAction('withdraw')
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedProtocol(null)
    // Refresh balances after modal closes
    refetchBalances()
  }, [refetchBalances])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-gray-800">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>DeFi Savings Dashboard</span>
          </div>
          <p className="text-gray-600 text-lg">Low-risk DeFi protocols for secure savings</p>
          
          <div className="space-y-4">
            <ConnectWallet>
              <div className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Zap className="h-5 w-5" />
                <span className="font-semibold text-lg">Connect Wallet</span>
              </div>
            </ConnectWallet>
            
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  DeFi Savings Dashboard
                </h1>
                <p className="text-sm text-slate-600 mt-1">Secure, low-risk DeFi protocols on Ethereum</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={() => refetchBalances()}
                disabled={balancesLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Refresh</span>
              </button>
              
              {/* Network Badge */}
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                🔷 Ethereum Mainnet
              </div>
              
              {/* Wallet Connection State */}
              {isConnected && address ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border border-slate-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <User className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {`${address.slice(0, 6)}...${address.slice(-4)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Disconnect</span>
                  </button>
                </div>
              ) : (
                <ConnectWallet>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Connect Wallet</span>
                  </div>
                </ConnectWallet>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {protocolsLoading || balancesLoading || summaryLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-slate-600 font-medium">Loading your DeFi portfolio...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <PortfolioOverview 
              totalUsd={totalUsd}
              totalAccruedUsd={totalAccruedUsd}
              averageApy={averageApy}
              protocolCount={protocolCount}
              assetCount={assetCount}
              interestData={interestData}
              totalEarnings={totalEarnings}
              totalProjectedDaily={totalProjectedDaily}
              totalProjectedMonthly={totalProjectedMonthly}
              totalProjectedYearly={totalProjectedYearly}
            />

            {/* Protocol APY View */}
            <ProtocolAPYView 
              protocolData={protocolData}
              userBalances={userBalances}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />

            {/* Search and Filter */}
            <SearchProtocols 
              protocolData={protocolData}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />
          </div>
        )}
      </main>

      {/* Deposit/Withdraw Modal */}
      {isModalOpen && selectedProtocol && (
        <>
          {selectedProtocol === 'Aave v3' ? (
            <EnhancedAaveDepositModal
              action={modalAction}
              open={isModalOpen}
              onClose={handleCloseModal}
              userAddress={address}
            />
          ) : (
            <DepositWithdrawModal
              protocol={selectedProtocol}
              action={modalAction}
              onClose={handleCloseModal}
              userAddress={address}
            />
          )}
        </>
      )}
    </div>
  )
}