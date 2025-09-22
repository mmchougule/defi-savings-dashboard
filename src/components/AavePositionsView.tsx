/**
 * Component to display Aave user positions using official @aave/react SDK
 * Based on: https://aave.com/docs/developers/aave-v3/markets/positions
 */

'use client'

import { Address } from 'viem'
import { useAavePositions } from '@/hooks/useAavePositions'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface AavePositionsViewProps {
  userAddress?: Address
}

export function AavePositionsView({ userAddress }: AavePositionsViewProps) {
  const {
    supplies,
    supplyLoading,
    supplyError,
    borrows,
    borrowLoading,
    borrowError,
    accountHealth,
    healthLoading,
    healthError,
  } = useAavePositions(userAddress)

  if (!userAddress) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            Connect your wallet to view Aave positions
          </p>
        </CardContent>
      </Card>
    )
  }

  if (supplyLoading || borrowLoading || healthLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading Aave positions...</p>
        </CardContent>
      </Card>
    )
  }

  if (supplyError || borrowError || healthError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Error loading Aave positions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasPositions = supplies.length > 0 || borrows.length > 0

  return (
    <div className="space-y-6">
      {/* Account Health */}
      {accountHealth && (
        <Card>
          <CardHeader>
            <CardTitle>Account Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <p className="text-sm text-gray-600">Net Worth</p>
                <p className="text-lg font-semibold">${accountHealth.netWorth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">eMode Status</p>
                <p className="text-lg font-semibold">
                  {accountHealth.eModeEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supply Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Supply Positions ({supplies.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplies.length > 0 ? (
            <div className="space-y-3">
              {supplies.map((supply: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {supply.reserve?.symbol?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{supply.reserve?.symbol || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">
                        {supply.scaledATokenBalance || '0'} supplied
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${supply.underlyingBalanceUSD || '0'}
                    </p>
                    <p className="text-sm text-green-600">
                      {supply.reserve?.supplyAPY || '0'}% APY
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No supply positions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Borrow Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span>Borrow Positions ({borrows.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {borrows.length > 0 ? (
            <div className="space-y-3">
              {borrows.map((borrow: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {borrow.reserve?.symbol?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{borrow.reserve?.symbol || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">
                        {borrow.totalDebt || '0'} borrowed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${borrow.totalDebtUSD || '0'}
                    </p>
                    <p className="text-sm text-red-600">
                      {borrow.reserve?.borrowAPY || '0'}% APY
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              No borrow positions found
            </p>
          )}
        </CardContent>
      </Card>

      {!hasPositions && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">
              No Aave positions found for this address
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AavePositionsView
