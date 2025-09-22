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
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction'
import { PortfolioReader, Portfolio } from '../lib/portfolio'
import { HedgeEngine, HedgeConfig } from '../lib/hedgeEngine'
import { BaseTradeExecutor, HedgePosition } from '../lib/baseTradeExecutor'
import { BasePredictionMarketsClient, BaseMarket } from '../lib/basePredictionMarkets'
import { PortfolioView } from './PortfolioView'
import { Shield, TrendingUp, Settings, Play, Zap, LogOut, User } from 'lucide-react'
import { 
  BASE_DEMO_PORTFOLIO, 
  BASE_DEMO_RECOMMENDATIONS, 
  BASE_DEMO_POSITIONS,
  BaseHedgeRecommendation 
} from '../lib/baseDemoData'

export function BaseHedgeDashboard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { disconnect } = useDisconnect()

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [recommendations, setRecommendations] = useState<BaseHedgeRecommendation[]>([])
  const [positions, setPositions] = useState<HedgePosition[]>([])
  const [baseMarkets, setBaseMarkets] = useState<BaseMarket[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingRecommendations, setUpdatingRecommendations] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [config, setConfig] = useState<any>({
    riskTolerance: 'medium',
    maxHedgePercentage: 10,
    minLiquidity: 10000
  })

  const hedgeEngine = useMemo(() => new HedgeEngine(), [])
  const basePredictionClient = useMemo(() => new BasePredictionMarketsClient(), [])

  const loadPortfolioData = useCallback(async () => {
    if (!address || !publicClient) return

    setLoading(true)
    try {
      const portfolioReader = new PortfolioReader(publicClient)
      const portfolioData = await portfolioReader.getPortfolio(address)
      setPortfolio(portfolioData)

      if (walletClient) {
        const baseTradeExecutor = new BaseTradeExecutor(publicClient, walletClient)
        const userPositions = await baseTradeExecutor.getUserPositions(address)
        setPositions(userPositions)
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }, [address, publicClient, walletClient])

  const loadBaseMarkets = useCallback(async () => {
    try {
      const markets = await basePredictionClient.getActiveBaseMarkets()
      setBaseMarkets(markets)
    } catch (error) {
      console.error('Failed to load Base markets:', error)
    }
  }, [basePredictionClient])

  useEffect(() => {
    if (address && publicClient) {
      loadPortfolioData()
    }
  }, [address, publicClient, loadPortfolioData])

  useEffect(() => {
    loadBaseMarkets()
  }, [loadBaseMarkets])

  // Separate effect for config changes to prevent infinite loops
  useEffect(() => {
    if (address && publicClient && portfolio && !updatingRecommendations) {
      const timeoutId = setTimeout(async () => {
        setUpdatingRecommendations(true)
        try {
          const hedgeRecommendations = await hedgeEngine.generateHedgeRecommendations(portfolio, config)
          setRecommendations(hedgeRecommendations)
        } catch (error) {
          console.error('Failed to update recommendations:', error)
        } finally {
          setUpdatingRecommendations(false)
        }
      }, 300) // 300ms debounce

      return () => clearTimeout(timeoutId)
    }
  }, [config, portfolio, address, publicClient, hedgeEngine, updatingRecommendations])

  const loadDemoData = () => {
    setPortfolio(BASE_DEMO_PORTFOLIO)
    setRecommendations(BASE_DEMO_RECOMMENDATIONS)
    setPositions(BASE_DEMO_POSITIONS)
    setDemoMode(true)
  }

  const executeHedge = async (recommendation: BaseHedgeRecommendation) => {
    if (demoMode) {
      const newPosition: HedgePosition = {
        id: `${recommendation.market.id}_${Date.now()}`,
        marketId: recommendation.market.id,
        position: recommendation.position,
        amount: recommendation.hedgeAmount,
        price: recommendation.market.prices[recommendation.position === 'YES' ? 0 : 1],
        timestamp: new Date(),
        status: 'open',
        network: 'base'
      }
      setPositions(prev => [...prev, newPosition])
      return
    }

    if (!address || !publicClient || !walletClient) return

    try {
      const baseTradeExecutor = new BaseTradeExecutor(publicClient, walletClient)
      const result = await baseTradeExecutor.executeHedge(recommendation, address)
      if (result.success) {
        const newPosition: HedgePosition = {
          id: `${recommendation.market.id}_${Date.now()}`,
          marketId: recommendation.market.id,
          position: recommendation.position,
          amount: recommendation.hedgeAmount,
          price: recommendation.market.prices[recommendation.position === 'YES' ? 0 : 1],
          timestamp: new Date(),
          status: 'open',
          network: 'base'
        }
        
        baseTradeExecutor.saveBasePosition(address, newPosition)
        await loadPortfolioData()
      }
    } catch (error) {
      console.error('Base hedge execution failed:', error)
    }
  }

  if (!isConnected && !demoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-gray-800">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>Base Hedge Agent</span>
          </div>
          <p className="text-gray-600 text-lg">AI-powered hedge recommendations using Base prediction markets</p>
          
          <div className="space-y-4">
            {/* OnchainKit Wallet Connect */}
            <div className="w-full">
              <ConnectWallet>
                <div className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  <Zap className="h-5 w-5" />
                  <span>Connect to Base</span>
                </div>
              </ConnectWallet>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            <button
              onClick={loadDemoData}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="h-5 w-5" />
              <span>Try Demo Mode</span>
            </button>
            
            <p className="text-xs text-gray-500">
              Demo mode shows sample data without connecting a wallet
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Base Hedge Agent</h1>
                <p className="text-sm text-gray-500">Powered by OnchainKit & BetBase</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!demoMode && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  🔵 Base Network
                </div>
              )}
              {demoMode && (
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  🎮 Demo Mode
                </div>
              )}
              
              {/* Wallet Connection State */}
              {isConnected && address ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {`${address.slice(0, 6)}...${address.slice(-4)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <ConnectWallet>
                  <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Zap className="h-4 w-4" />
                    <span>Connect Wallet</span>
                  </div>
                </ConnectWallet>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {portfolio && <PortfolioView portfolio={portfolio} />}
              
              {/* Base Markets Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Base Prediction Markets ({baseMarkets.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {baseMarkets.slice(0, 4).map((market) => (
                    <div key={market.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {market.question}
                      </h4>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Vol: ${market.volume.toLocaleString()}</span>
                        <span className="text-blue-600">{market.protocol.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hedge Recommendations */}
              {recommendations.length > 0 && (
                <BaseHedgeRecommendations 
                  recommendations={recommendations}
                  onExecuteHedge={executeHedge}
                  isDemo={demoMode}
                />
              )}
            </div>

            <div className="space-y-6">
              {/* Risk Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Base Network Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Tolerance
                    </label>
                    <select 
                      value={config.riskTolerance}
                      onChange={(e) => setConfig({...config, riskTolerance: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Conservative (5%)</option>
                      <option value="medium">Moderate (10%)</option>
                      <option value="high">Aggressive (20%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Hedge % of Portfolio
                    </label>
                    <input
                      type="number"
                      value={config.maxHedgePercentage}
                      onChange={(e) => setConfig({...config, maxHedgePercentage: parseInt(e.target.value)})}
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    onClick={demoMode ? loadDemoData : loadPortfolioData}
                    disabled={updatingRecommendations}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updatingRecommendations ? 'Updating...' : 'Update Recommendations'}
                  </button>
                </div>
              </div>

              {/* Base Network Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Why Base Network?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Lower gas fees than Ethereum</li>
                  <li>• Fast transaction confirmation</li>
                  <li>• Native Coinbase integration</li>
                  <li>• Growing prediction market ecosystem</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Base-specific Hedge Recommendations Component
function BaseHedgeRecommendations({ 
  recommendations, 
  onExecuteHedge, 
  isDemo 
}: {
  recommendations: BaseHedgeRecommendation[]
  onExecuteHedge: (rec: BaseHedgeRecommendation) => Promise<void>
  isDemo: boolean
}) {
  const [executing, setExecuting] = useState<string | null>(null)

  const handleExecute = async (recommendation: BaseHedgeRecommendation) => {
    setExecuting(recommendation.market.id)
    try {
      await onExecuteHedge(recommendation)
    } finally {
      setExecuting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Base Network Hedge Recommendations
        </h2>
        <p className="text-gray-600 mt-1">AI-powered suggestions using Base prediction markets</p>
      </div>

      <div className="p-6 space-y-4">
        {recommendations.map((recommendation) => (
          <div key={recommendation.market.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {Math.round(recommendation.confidence * 100)}% confidence
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {recommendation.position}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    Base Network
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2">
                  {recommendation.market.question}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {recommendation.reasoning}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Hedge Amount</p>
                    <p className="font-medium">${recommendation.hedgeAmount.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Network</p>
                    <p className="font-medium text-blue-600">Base</p>
                  </div>
                </div>
              </div>

              <div className="ml-4">
                {isDemo ? (
                  <button
                    onClick={() => handleExecute(recommendation)}
                    disabled={executing === recommendation.market.id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {executing === recommendation.market.id ? 'Executing...' : 'Apply Hedge'}
                  </button>
                ) : (
                  <Transaction>
                    <TransactionButton
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      disabled={executing === recommendation.market.id}
                      onClick={() => handleExecute(recommendation)}
                    />
                    <TransactionSponsor />
                    <TransactionStatus>
                      <TransactionStatusLabel />
                      <TransactionStatusAction />
                    </TransactionStatus>
                  </Transaction>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}