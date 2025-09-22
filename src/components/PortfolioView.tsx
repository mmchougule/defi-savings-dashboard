'use client'

import { Portfolio } from '../lib/portfolio'
import { formatUnits } from 'viem'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { DollarSign, TrendingUp } from 'lucide-react'

interface PortfolioViewProps {
  portfolio: Portfolio
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']

export function PortfolioView({ portfolio }: PortfolioViewProps) {
  const ethValue = parseFloat(formatUnits(portfolio.eth, 18)) * 3000 // Approximate ETH price
  
  const chartData = [
    { name: 'ETH', value: ethValue },
    ...portfolio.tokens.map(token => ({
      name: token.symbol,
      value: token.usdValue || 0
    }))
  ].filter(item => item.value > 0)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Portfolio Overview
          </h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ${portfolio.totalUsdValue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Total Value</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Allocation</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent as number * 100).toFixed(0)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Holdings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-800">ETH</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ethereum</p>
                    <p className="text-sm text-gray-500">
                      {parseFloat(formatUnits(portfolio.eth, 18)).toFixed(4)} ETH
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${ethValue.toFixed(2)}</p>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs">+2.4%</span>
                  </div>
                </div>
              </div>

              {portfolio.tokens.map((token) => (
                <div key={token.address} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-800">{token.symbol}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{token.symbol}</p>
                      <p className="text-sm text-gray-500">
                        {parseFloat(formatUnits(token.balance, token.decimals)).toFixed(2)} {token.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${token.usdValue?.toFixed(2) || '0.00'}</p>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span className="text-xs">+1.2%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}