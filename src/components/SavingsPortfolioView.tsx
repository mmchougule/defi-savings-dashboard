'use client'

import { ProtocolBalance } from '../lib/protocols'
import { TrendingUp, DollarSign, Shield } from 'lucide-react'

interface SavingsPortfolioViewProps {
  portfolio: ProtocolBalance[]
}

export function SavingsPortfolioView({ portfolio }: SavingsPortfolioViewProps) {
  const totalValue = portfolio.reduce((sum, balance) => sum + balance.valueUSD, 0)
  const weightedAPY = portfolio.length > 0 
    ? portfolio.reduce((sum, balance) => sum + balance.apy * balance.valueUSD, 0) / totalValue
    : 0

  const protocolGroups = portfolio.reduce((groups, balance) => {
    if (!groups[balance.protocol]) {
      groups[balance.protocol] = []
    }
    groups[balance.protocol].push(balance)
    return groups
  }, {} as Record<string, ProtocolBalance[]>)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-800">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Weighted APY</p>
              <p className="text-2xl font-bold text-blue-800">
                {weightedAPY.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Active Protocols</p>
              <p className="text-2xl font-bold text-purple-800">
                {Object.keys(protocolGroups).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Protocol Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(protocolGroups).map(([protocol, balances]: [string, ProtocolBalance[]]) => {
            const protocolValue = balances.reduce((sum: number, balance: ProtocolBalance) => sum + balance.valueUSD, 0)
            const protocolAPY = balances.reduce((sum: number, balance: ProtocolBalance) => sum + balance.apy * balance.valueUSD, 0) / protocolValue
            
            return (
              <div key={protocol} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {protocol.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {balances.length} position{balances.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${protocolValue.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600">
                      {protocolAPY.toFixed(2)}% APY
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {balances.map((balance: ProtocolBalance, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {balance.symbol.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-700">{balance.symbol}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {balance.valueUSD.toLocaleString()} USD
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          {balance.apy.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}