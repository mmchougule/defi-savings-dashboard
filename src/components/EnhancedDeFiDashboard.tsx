/**
 * Enhanced DeFi Dashboard with official Aave SDK integration
 * Combines existing functionality with Aave positions and account health
 */

'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { DeFiSavingsDashboard } from './DeFiSavingsDashboard'
import { AavePositionsView } from './AavePositionsView'
import { WalletConnect } from './WalletConnect'
import { useAaveAccountHealth } from '@/hooks/useAavePositions'
import { AlertTriangle, TrendingUp, Wallet } from 'lucide-react'

export function EnhancedDeFiDashboard() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('overview')

  // Get account health for header display
  const { data: accountHealth, loading: healthLoading } = useAaveAccountHealth(address)

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>DeFi Savings Dashboard</CardTitle>
            <p className="text-gray-600">
              Connect your wallet to view your DeFi positions and account health
            </p>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with Account Health */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DeFi Dashboard</h1>
              <p className="text-gray-600">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <WalletConnect />
          </div>

          {/* Account Health Summary */}
          {accountHealth && !healthLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      accountHealth.healthFactor && parseFloat(accountHealth.healthFactor) < 1.5 
                        ? 'bg-red-100' 
                        : 'bg-green-100'
                    }`}>
                      {accountHealth.healthFactor && parseFloat(accountHealth.healthFactor) < 1.5 ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Health Factor</p>
                      <p className={`text-lg font-semibold ${
                        accountHealth.healthFactor && parseFloat(accountHealth.healthFactor) < 1.5 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {accountHealth.healthFactor || 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Wallet className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Worth</p>
                      <p className="text-lg font-semibold">${accountHealth.netWorth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      accountHealth.eModeEnabled ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <TrendingUp className={`h-5 w-5 ${
                        accountHealth.eModeEnabled ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Efficiency Mode</p>
                      <p className="text-lg font-semibold">
                        {accountHealth.eModeEnabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="aave">Aave Positions</TabsTrigger>
            <TabsTrigger value="protocols">All Protocols</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DeFiSavingsDashboard />
          </TabsContent>

          <TabsContent value="aave" className="space-y-6">
            <AavePositionsView userAddress={address} />
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Protocols</CardTitle>
                <p className="text-gray-600">
                  Comprehensive view of all your DeFi positions across protocols
                </p>
              </CardHeader>
              <CardContent>
                <DeFiSavingsDashboard />
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Detailed Aave Analysis</h3>
                  <AavePositionsView userAddress={address} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default EnhancedDeFiDashboard
