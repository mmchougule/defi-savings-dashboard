'use client'

import { useState } from 'react'
import { Search, Plus, Minus, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

interface SearchProtocolsProps {
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
  onDeposit: (protocol: string) => void
  onWithdraw: (protocol: string) => void
}

export function SearchProtocols({ protocolData, onDeposit, onWithdraw }: SearchProtocolsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'name'>('apy')
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  if (!protocolData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading protocols...</div>
        </CardContent>
      </Card>
    )
  }

  const protocols = Object.values(protocolData).map((protocol) => ({
    name: protocol.name,
    displayName: protocol.name,
    apy: protocol.averageAPY || 0,
    tvl: protocol.totalValueLocked || 0,
    riskLevel: 'low' as const,
    supportedAssets: protocol.assets || [],
    description: protocol.description || 'DeFi protocol for savings'
  }))

  const filteredProtocols = protocols
    .filter(protocol => 
      protocol.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(protocol => filterRisk === 'all' || protocol.riskLevel === filterRisk)
    .sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return b.apy - a.apy
        case 'tvl':
          return b.tvl - a.tvl
        case 'name':
          return a.displayName.localeCompare(b.displayName)
        default:
          return 0
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          Search & Filter Protocols
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="apy">Sort by APY</option>
              <option value="tvl">Sort by TVL</option>
              <option value="name">Sort by Name</option>
            </select>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
        </div>

        {/* Protocol List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{protocol.displayName}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    protocol.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    protocol.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {protocol.riskLevel.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{protocol.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
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
                </div>

                {/* Supported Assets */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Supported Assets:</p>
                  <div className="flex flex-wrap gap-1">
                    {protocol.supportedAssets.slice(0, 3).map((asset: any) => (
                      <span 
                        key={asset.symbol}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {asset.symbol}
                      </span>
                    ))}
                    {protocol.supportedAssets.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{protocol.supportedAssets.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onDeposit(protocol.name)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Deposit</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onWithdraw(protocol.name)}
                    className="flex-1 flex items-center justify-center space-x-1"
                  >
                    <Minus className="h-4 w-4" />
                    <span>Withdraw</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProtocols.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No protocols found matching your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}