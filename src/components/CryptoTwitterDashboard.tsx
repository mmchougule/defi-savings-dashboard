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
  Trophy
} from 'lucide-react'
import { WalletConnection } from './WalletConnection'
import { EnhancedAaveDepositModal } from './EnhancedAaveDepositModal'
import { AaveTransactionHistory } from './AaveTransactionHistory'
import { useUserBalances, usePortfolioSummary } from '../hooks/useProtocolData'
import { useUSDCBalance, useDAIBalance, useWETHBalance } from '../hooks/useTokenBalance'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { cn } from '@/lib/utils'

// Beginner-friendly protocol cards
const ProtocolCard = ({ 
  name, 
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
                <h3 className="font-bold text-white text-lg">{name}</h3>
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

  // Beginner-friendly protocol data
  const protocols = [
    {
      name: 'Aave v3',
      description: 'Safest way to earn interest on your crypto',
      apy: '3.2%',
      tvl: '$12.8B',
      icon: Shield,
      gradient: 'crypto-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'Aave v3')?.balance || '0.00'),
      earning: '24.50'
    },
    {
      name: 'Compound',
      description: 'Popular lending protocol with great rewards',
      apy: '2.8%',
      tvl: '$8.4B',
      icon: BarChart3,
      gradient: 'crypto-green-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'Compound')?.balance || '0.00'),
      earning: '12.30'
    },
    {
      name: 'MakerDAO',
      description: 'Earn with the stablecoin that started it all',
      apy: '4.1%',
      tvl: '$6.2B',
      icon: Star,
      gradient: 'crypto-gold-gradient',
      userBalance: String(userBalances?.find(b => b.protocol === 'MakerDAO')?.balance || '0.00'),
      earning: '8.90'
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
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to DeFi Savings
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            The easiest way to earn money with your crypto. 
            <br />No complicated stuff, just simple savings.
          </p>
          <div className="glass border-slate-700 rounded-2xl p-6 mb-8">
            <WalletConnection />
          </div>
          <div className="text-slate-500 text-sm">
            <div className="inline-flex items-center gap-2 beginner-tooltip" data-tooltip="Your money stays in your wallet, we don't hold it">
              <Shield className="h-4 w-4" />
              Non-custodial & Secure
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
          portfolioGrowth="12.4"
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Protocols */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-white">Start Earning</h2>
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

            {/* Transaction History */}
            <AnimatePresence>
              {showTransactions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AaveTransactionHistory />
                </motion.div>
              )}
            </AnimatePresence>
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
      {isModalOpen && selectedProtocol && selectedProtocol === 'Aave v3' && (
        <EnhancedAaveDepositModal
          action={modalAction}
          open={isModalOpen}
          onClose={handleCloseModal}
          userAddress={address!}
        />
      )}
    </div>
  )
}
