import { HedgePosition } from './tradeExecutor'
import { Market } from './polymarket'

export interface PnLData {
  currentValue: number
  entryValue: number
  unrealizedPnL: number
  realizedPnL: number
  totalPnL: number
  percentage: number
}

export interface PositionWithPnL extends HedgePosition {
  pnlData: PnLData
  currentPrice: number
}

export class PnLTracker {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 60000 // 1 minute

  async calculatePositionPnL(position: HedgePosition, market?: Market): Promise<PnLData> {
    const currentPrice = await this.getCurrentMarketPrice(position.marketId, market)
    const entryPrice = position.price
    const positionSize = position.amount

    const entryValue = positionSize
    const currentValue = (currentPrice / entryPrice) * positionSize

    let unrealizedPnL = 0
    if (position.status === 'open') {
      if (position.position === 'YES') {
        unrealizedPnL = currentValue - entryValue
      } else {
        unrealizedPnL = entryValue - currentValue
      }
    }

    const realizedPnL = position.status === 'closed' ? (position.pnl || 0) : 0
    const totalPnL = unrealizedPnL + realizedPnL
    const percentage = (totalPnL / entryValue) * 100

    return {
      currentValue,
      entryValue,
      unrealizedPnL,
      realizedPnL,
      totalPnL,
      percentage
    }
  }

  async getPortfolioPnL(positions: HedgePosition[]): Promise<{
    totalUnrealized: number
    totalRealized: number
    totalPnL: number
    totalInvested: number
    overallPercentage: number
    openPositions: number
    closedPositions: number
  }> {
    let totalUnrealized = 0
    let totalRealized = 0
    let totalInvested = 0
    let openPositions = 0
    let closedPositions = 0

    for (const position of positions) {
      const pnlData = await this.calculatePositionPnL(position)
      
      totalUnrealized += pnlData.unrealizedPnL
      totalRealized += pnlData.realizedPnL
      totalInvested += pnlData.entryValue

      if (position.status === 'open') {
        openPositions++
      } else {
        closedPositions++
      }
    }

    const totalPnL = totalUnrealized + totalRealized
    const overallPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0

    return {
      totalUnrealized,
      totalRealized,
      totalPnL,
      totalInvested,
      overallPercentage,
      openPositions,
      closedPositions
    }
  }

  async getPositionsWithPnL(positions: HedgePosition[]): Promise<PositionWithPnL[]> {
    const positionsWithPnL: PositionWithPnL[] = []

    for (const position of positions) {
      const pnlData = await this.calculatePositionPnL(position)
      const currentPrice = await this.getCurrentMarketPrice(position.marketId)

      positionsWithPnL.push({
        ...position,
        pnlData,
        currentPrice
      })
    }

    return positionsWithPnL.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private async getCurrentMarketPrice(marketId: string, market?: Market): Promise<number> {
    const cached = this.priceCache.get(marketId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price
    }

    let price: number

    if (market) {
      price = market.prices[0]
    } else {
      price = await this.fetchMarketPrice(marketId)
    }

    this.priceCache.set(marketId, { price, timestamp: Date.now() })
    return price
  }

  private async fetchMarketPrice(marketId: string): Promise<number> {
    try {
      const response = await fetch(`https://api.polymarket.com/markets/${marketId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch market price')
      }
      
      const data = await response.json()
      return data.prices?.[0] || 0.5
    } catch (error) {
      console.warn(`Failed to fetch price for market ${marketId}:`, error)
      return Math.random() * 0.4 + 0.3 // Mock price between 0.3-0.7
    }
  }

  getPerformanceMetrics(positions: PositionWithPnL[]): {
    winRate: number
    avgReturn: number
    bestTrade: PositionWithPnL | null
    worstTrade: PositionWithPnL | null
    sharpeRatio: number
  } {
    const closedPositions = positions.filter(p => p.status === 'closed')
    
    if (closedPositions.length === 0) {
      return {
        winRate: 0,
        avgReturn: 0,
        bestTrade: null,
        worstTrade: null,
        sharpeRatio: 0
      }
    }

    const returns = closedPositions.map(p => p.pnlData.percentage)
    const winningTrades = returns.filter(r => r > 0).length
    const winRate = (winningTrades / closedPositions.length) * 100

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    
    const bestTrade = closedPositions.reduce((best, current) => 
      !best || current.pnlData.percentage > best.pnlData.percentage ? current : best
    )
    
    const worstTrade = closedPositions.reduce((worst, current) => 
      !worst || current.pnlData.percentage < worst.pnlData.percentage ? current : worst
    )

    const returnStd = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )
    
    const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0

    return {
      winRate,
      avgReturn,
      bestTrade,
      worstTrade,
      sharpeRatio
    }
  }
}