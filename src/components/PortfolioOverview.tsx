'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { TrendingUp, DollarSign, Percent, Layers } from 'lucide-react'

interface PortfolioOverviewProps {
  totalUsd: number
  totalAccruedUsd: number
  averageApy: number
  protocolCount: number
  assetCount: number
  interestData: Array<{
    protocol: string
    symbol: string
    balance: string
    apy: number
    valueUSD: number
    projectedDaily: number
    projectedMonthly: number
    projectedYearly: number
  }>
  totalEarnings: number
  totalProjectedDaily: number
  totalProjectedMonthly: number
  totalProjectedYearly: number
}

export function PortfolioOverview({ 
  totalUsd, 
  totalAccruedUsd, 
  averageApy, 
  protocolCount, 
  assetCount,
  interestData,
  totalEarnings,
  totalProjectedDaily,
  totalProjectedMonthly,
  totalProjectedYearly
}: PortfolioOverviewProps) {

  const stats = [
    {
      title: 'Total Balance',
      value: `$${isNaN(totalUsd) ? '0.00' : totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Total deposited across all protocols',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Total Earnings',
      value: `$${isNaN(totalEarnings) ? '0.00' : totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Total interest earned',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Average APY',
      value: `${isNaN(averageApy) ? '0.00' : averageApy.toFixed(2)}%`,
      description: 'Weighted average yield',
      icon: Percent,
      color: 'text-purple-600'
    },
    {
      title: 'Diversification',
      value: `${protocolCount || 0}/${assetCount || 0}`,
      description: 'Protocols/Assets',
      icon: Layers,
      color: 'text-orange-600'
    },
  ]

  const projections = [
    {
      title: 'Daily Projection',
      value: `$${isNaN(totalProjectedDaily) ? '0.00' : totalProjectedDaily.toFixed(2)}`,
      description: 'Estimated daily earnings'
    },
    {
      title: 'Monthly Projection',
      value: `$${isNaN(totalProjectedMonthly) ? '0.00' : totalProjectedMonthly.toFixed(2)}`,
      description: 'Estimated monthly earnings'
    },
    {
      title: 'Yearly Projection',
      value: `$${isNaN(totalProjectedYearly) ? '0.00' : totalProjectedYearly.toFixed(2)}`,
      description: 'Estimated yearly earnings'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Earnings Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {projections.map((projection) => (
              <div key={projection.title} className="text-center">
                <div className="text-2xl font-bold text-green-600">{projection.value}</div>
                <div className="text-sm font-medium text-gray-900">{projection.title}</div>
                <div className="text-xs text-gray-500">{projection.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}