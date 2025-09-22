'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Shield, Plus, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'

interface ProtocolAPYViewProps {
  protocolData: Record<string, {
    name: string
    displayName: string
    description: string
    icon: string
    website: string
    apy: number
    tvl: number
    riskLevel: 'low' | 'medium' | 'high'
    supportedAssets: Array<{
      symbol: string
      name: string
      address: string
      decimals: number
      icon: string
      supplyApy?: number
    }>
  }>
  userBalances: Array<{
    protocol: string
    asset: string
    symbol: string
    balance: bigint
    apy: number
    valueUSD: number
  }>
  onDeposit: (protocol: string) => void
  onWithdraw: (protocol: string) => void
}

export function ProtocolAPYView({ protocolData, userBalances, onDeposit, onWithdraw }: ProtocolAPYViewProps) {
  if (!protocolData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading protocol data...</div>
        </CardContent>
      </Card>
    )
  }

  const protocols = Object.values(protocolData).map((protocol: any) => ({
    name: protocol.name,
    displayName: protocol.name,
    apy: protocol.averageAPY || 0,
    tvl: protocol.totalValueLocked || 0,
    riskLevel: 'low' as const,
    supportedAssets: protocol.assets || []
  }))

  const chartData = protocols.map(protocol => ({
    name: protocol.displayName,
    apy: protocol.apy,
    tvl: protocol.tvl / 1000000000, // Convert to billions
    riskLevel: protocol.riskLevel
  }))

  const maxAPY = Math.max(...protocols.map(p => p.apy))
  const minAPY = Math.min(...protocols.map(p => p.apy))
  const avgAPY = protocols.reduce((sum, p) => sum + p.apy, 0) / protocols.length

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
          APY Comparison
        </h2>
        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Highest</p>
            <p className="font-semibold text-green-600">{maxAPY.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Average</p>
            <p className="font-semibold text-blue-600">{avgAPY.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Lowest</p>
            <p className="font-semibold text-gray-600">{minAPY.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* APY Bar Chart */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">APY by Protocol</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'APY (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'APY']}
                labelFormatter={(label) => `Protocol: ${label}`}
              />
              <Bar 
                dataKey="apy" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Protocol Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Protocol Details</h3>
          <div className="space-y-4">
            {protocols
              .sort((a, b) => b.apy - a.apy)
              .map((protocol) => (
                <div key={protocol.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-gray-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{protocol.displayName}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      protocol.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                      protocol.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {protocol.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">APY</p>
                      <p className="font-semibold text-green-600">{protocol.apy.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">TVL</p>
                      <p className="font-semibold text-gray-700">
                        ${(protocol.tvl / 1000000000).toFixed(1)}B
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Assets</p>
                      <p className="font-semibold text-gray-700">{protocol.supportedAssets.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Website</p>
                      <a 
                        href={protocol.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Visit →
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">Supported Assets:</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => onDeposit(protocol.name)}
                          className="flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Deposit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onWithdraw(protocol.name)}
                          className="flex items-center space-x-1"
                        >
                          <Minus className="h-3 w-3" />
                          <span>Withdraw</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {protocol.supportedAssets.map((asset: any, index: number) => (
                        <span 
                          key={`${asset.symbol}-${index}`}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {asset.symbol} ({asset.supplyApy?.toFixed(1) || '0.0'}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}