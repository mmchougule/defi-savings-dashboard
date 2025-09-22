'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useDisconnect } from 'wagmi'
import { 
  Wallet, 
  ArrowDown, 
  ArrowUp, 
  DollarSign, 
  Coins, 
  Zap,
  Shield,
  Star,
  BarChart3,
  History,
  LogOut,
  ChevronRight,
  Sparkles,
  PiggyBank,
  Target,
  Trophy,
  TrendingUp
} from 'lucide-react'
import { WalletConnection } from './WalletConnection'
import { PrivyWalletConnect } from './PrivyWalletConnect'
import { EnhancedDepositModal } from './EnhancedDepositModal'
import { RealTransactionHistory } from './RealTransactionHistory'
import { EnhancedPortfolioTracker } from './EnhancedPortfolioTracker'
import { LiveProtocolAPY } from './LiveProtocolAPY'
import { useUserBalances, usePortfolioSummary } from '../hooks/useProtocolData'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

// Beginner-friendly protocol cards
const ProtocolCard = ({ 
  name, 
  displayName,
  description, 
  apy, 
  tvl, 
  icon: Icon, 
  gradient,
  onClick,
  userBalance = '0.00',
  earning = '0.00'
}: {
  name: string
  displayName?: string
  description: string
  apy: string
  tvl: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  onClick: () => void
  userBalance?: string
  earning?: string
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="hover-lift"
    >
      <Card 
        className={cn(
          "glass border-slate-700 p-6 cursor-pointer transition-all duration-300 hover:bg-white/10",
          "relative overflow-hidden group"
        )}
        onClick={onClick}
      >
        {/* Background gradient effect */}
        <div className={cn("absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity", gradient)} />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", gradient)}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{displayName || name}</h3>
                <p className="text-slate-400 text-sm beginner-tooltip" data-tooltip={description}>
                  {description.length > 30 ? description.substring(0, 30) + '...' : description}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wide beginner-tooltip" data-tooltip="Annual Percentage Yield - how much you earn per year">
                APY
              </div>
              <div className="text-green-400 font-bold text-lg">{apy}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wide beginner-tooltip" data-tooltip="Total Value Locked - how much money is in this protocol">
                TVL
              </div>
              <div className="text-white font-bold text-lg">{tvl}</div>
            </div>
          </div>

          {/* User position */}
          {parseFloat(userBalance) > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-slate-400 text-xs">Your Balance</div>
                  <div className="text-white font-semibold">${userBalance}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs">Earning</div>
                  <div className="text-green-400 font-semibold">+${earning}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Beginner dashboard stats
const DashboardStats = ({ totalBalance, totalEarnings, portfolioGrowth }: {
  totalBalance: string
  totalEarnings: string
  portfolioGrowth: string
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-slate-700 p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl crypto-gradient flex items-center justify-center">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-slate-400 text-sm beginner-tooltip" data-tooltip="Total amount of money you have in DeFi protocols">
                Total Savings
              </div>
              <div className="text-white text-2xl font-bold">${totalBalance}</div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-slate-700 p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl crypto-green-gradient flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-slate-400 text-sm beginner-tooltip" data-tooltip="Money you've earned from interest and rewards">
                Total Earned
              </div>
              <div className="text-green-400 text-2xl font-bold">+${totalEarnings}</div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-slate-700 p-6 hover-lift">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl crypto-gold-gradient flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-slate-400 text-sm beginner-tooltip" data-tooltip="How much your portfolio has grown over time">
                Growth
              </div>
              <div className="text-yellow-400 text-2xl font-bold">{portfolioGrowth}%</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

// Wallet overview component
const WalletOverview = () => {
  const { balance: usdcBalance } = useUSDCBalance()
  const { balance: daiBalance } = useDAIBalance()
  const { balance: wethBalance } = useWETHBalance()

  const tokens = [
    { symbol: 'USDC', balance: usdcBalance, icon: DollarSign, color: 'text-blue-400' },
    { symbol: 'DAI', balance: daiBalance, icon: Coins, color: 'text-yellow-400' },
    { symbol: 'WETH', balance: wethBalance, icon: Zap, color: 'text-purple-400' },
  ]

  return (
    <Card className="glass border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl crypto-gradient flex items-center justify-center">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold">Your Wallet</h3>
          <p className="text-slate-400 text-sm">Available to deposit</p>
        </div>
      </div>

      <div className="space-y-3">
        {tokens.map((token) => (
          <div key={token.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <token.icon className={cn("h-5 w-5", token.color)} />
              <span className="text-white font-medium">{token.symbol}</span>
            </div>
            <div className="text-slate-300 font-mono">
              {parseFloat(token.balance) > 0 ? token.balance : '0.00'}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function CryptoTwitterDashboard() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: userBalances } = useUserBalances()
  const { totalUsd, totalAccruedUsd } = usePortfolioSummary()
  
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null)
  const [modalAction, setModalAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'transactions'>('portfolio')

  // Enhanced protocol data with all supported protocols
  const protocols = [
    {
      name: 'aave_v3',
      displayName: 'Aave v3',
      description: 'Decentralized lending protocol',
      apy: '4.2%',
      tvl: '$12.8B',
      icon: Shield,
      gradient: 'crypto-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'aave_v3')?.balance || '0.00'),
      earning: '24.50'
    },
    {
      name: 'compound_v2',
      displayName: 'Compound v2',
      description: 'Traditional cToken lending',
      apy: '4.1%',
      tvl: '$8.5B',
      icon: Coins,
      gradient: 'crypto-green-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'compound_v2')?.balance || '0.00'),
      earning: '0.00'
    },
    {
      name: 'compound_v3',
      displayName: 'Compound v3',
      description: 'Capital efficient markets',
      apy: '3.9%',
      tvl: '$7.5B',
      icon: TrendingUp,
      gradient: 'crypto-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'compound_v3')?.balance || '0.00'),
      earning: '0.00'
    },
    {
      name: 'maker_dsr',
      displayName: 'Maker DSR',
      description: 'Dai Savings Rate',
      apy: '3.3%',
      tvl: '$5.0B',
      icon: DollarSign,
      gradient: 'crypto-gold-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'maker_dsr')?.balance || '0.00'),
      earning: '0.00'
    }
  ]

  const handleProtocolClick = (protocolName: string) => {
    setSelectedProtocol(protocolName)
    setModalAction('deposit')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProtocol(null)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg"
        >
          <div className="w-24 h-24 rounded-3xl crypto-gradient mx-auto mb-6 flex items-center justify-center">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Ethereum's Global Savings Account
          </h1>
          <p className="text-slate-300 text-xl mb-8">
            Deposit stablecoins, earn with Aave, Compound, Maker — withdraw anytime.
          </p>
          <div className="glass border-slate-700 rounded-2xl p-6 mb-8">
            <PrivyWalletConnect />
          </div>
          
          {/* Live Protocol APY */}
          <LiveProtocolAPY />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-500 text-sm">
            <div className="inline-flex items-center gap-2 beginner-tooltip" data-tooltip="Your money stays in your wallet, we don't hold it">
              <Shield className="h-4 w-4" />
              Non-custodial & Secure
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
            <div className="inline-flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Deposit/withdraw in 2 clicks
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl crypto-gradient flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DeFi Savings</h1>
            <p className="text-slate-400 text-sm">
              Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTransactions(!showTransactions)}
            className="glass border-slate-600 text-slate-300 hover:bg-white/10 beginner-tooltip"
            data-tooltip="View your transaction history"
          >
            <History className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
            className="glass border-slate-600 text-slate-300 hover:bg-white/10 beginner-tooltip"
            data-tooltip="Disconnect your wallet"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <DashboardStats 
          totalBalance={(totalUsd || 0).toFixed(2)}
          totalEarnings={(totalAccruedUsd || 0).toFixed(2)}
          portfolioGrowth={totalUsd > 0 ? ((totalAccruedUsd / totalUsd) * 100).toFixed(1) : "0.0"}
        />

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                activeTab === 'portfolio'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                activeTab === 'transactions'
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              Transactions
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            {activeTab === 'portfolio' ? (
              <div className="space-y-8">
                {/* Enhanced Portfolio Tracker */}
                <EnhancedPortfolioTracker />
                
                {/* Protocols */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl font-bold text-white">DeFi Protocols</h2>
                    <div className="beginner-tooltip" data-tooltip="These are safe protocols where you can deposit crypto to earn interest">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {protocols.map((protocol, index) => (
                      <motion.div
                        key={protocol.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ProtocolCard
                          {...protocol}
                          onClick={() => handleProtocolClick(protocol.name)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <RealTransactionHistory />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WalletOverview />
            
            {/* Quick actions */}
            <Card className="glass border-slate-700 p-6">
              <h3 className="text-white font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSelectedProtocol('Aave v3')
                    setModalAction('deposit')
                    setIsModalOpen(true)
                  }}
                  className="w-full crypto-green-gradient hover:opacity-90 beginner-tooltip"
                  data-tooltip="Put money into Aave to start earning interest"
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Deposit & Earn
                </Button>
                
                <Button
                  onClick={() => {
                    setSelectedProtocol('Aave v3')
                    setModalAction('withdraw')
                    setIsModalOpen(true)
                  }}
                  variant="outline"
                  className="w-full glass border-slate-600 text-slate-300 hover:bg-white/10 beginner-tooltip"
                  data-tooltip="Take your money out of Aave"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </Card>

            {/* Help section */}
            <Card className="glass border-slate-700 p-6">
              <h3 className="text-white font-bold mb-3">New to DeFi?</h3>
              <p className="text-slate-400 text-sm mb-4">
                DeFi lets you earn interest on your crypto, just like a savings account but better rates!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full glass border-slate-600 text-slate-300 hover:bg-white/10"
                onClick={() => window.open('https://ethereum.org/en/defi/', '_blank')}
              >
                Learn More
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && selectedProtocol && (
        <EnhancedDepositModal
          action={modalAction}
          protocol={selectedProtocol}
          open={isModalOpen}
          onClose={handleCloseModal}
          userAddress={address!}
        />
      )}
    </div>
  )
}
