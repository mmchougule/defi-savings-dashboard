import { Portfolio, TokenBalance } from './portfolio'

export interface Market {
  id: string
  question: string
  description: string
  outcomes: string[]
  prices: number[]
  volume: number
  liquidity: number
  endDate: string
  category: string
  tags: string[]
}

export interface HedgeRecommendation {
  market: Market
  position: 'YES' | 'NO'
  confidence: number
  reasoning: string
  hedgeAmount: number
}

export interface HedgeConfig {
  riskTolerance: 'low' | 'medium' | 'high'
  maxHedgePercentage: number
  minLiquidity: number
}

export class HedgeEngine {
  constructor() {}

  async generateHedgeRecommendations(
    portfolio: Portfolio,
    config: HedgeConfig
  ): Promise<HedgeRecommendation[]> {
    const recommendations: HedgeRecommendation[] = []

    const ethHedges = await this.findEthHedges(portfolio.eth, config)
    recommendations.push(...ethHedges)

    for (const token of portfolio.tokens) {
      const tokenHedges = await this.findTokenHedges(token, config)
      recommendations.push(...tokenHedges)
    }

    const stablecoinHedges = await this.findStablecoinHedges(portfolio.tokens, config)
    recommendations.push(...stablecoinHedges)

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  private async findEthHedges(ethBalance: bigint, config: HedgeConfig): Promise<HedgeRecommendation[]> {
    const ethValueUsd = parseFloat((ethBalance * BigInt(3000)) / BigInt(10**18))
    if (ethValueUsd < 100) return []

    // Mock markets for demo - in production this would query real prediction markets
    const markets: Market[] = []
    const recommendations: HedgeRecommendation[] = []

    for (const market of markets) {
      if (market.liquidity < config.minLiquidity) continue

      const hedgeAmount = Math.min(ethValueUsd * (config.maxHedgePercentage / 100), ethValueUsd * 0.1)
      
      if (market.question.toLowerCase().includes('below') || 
          market.question.toLowerCase().includes('under') ||
          market.question.toLowerCase().includes('<')) {
        recommendations.push({
          market,
          position: 'YES',
          confidence: this.calculateConfidence(market, 'price_protection'),
          reasoning: `Hedge against ETH price decline. Your ${ethValueUsd.toFixed(0)} USD in ETH could lose value if price drops.`,
          hedgeAmount
        })
      }
    }

    return recommendations
  }

  private async findTokenHedges(token: TokenBalance, config: HedgeConfig): Promise<HedgeRecommendation[]> {
    if (!token.usdValue || token.usdValue < 50) return []

    // Mock markets for demo
    const markets: Market[] = []
    const recommendations: HedgeRecommendation[] = []

    for (const market of markets) {
      if (market.liquidity < config.minLiquidity) continue

      const hedgeAmount = Math.min(token.usdValue * (config.maxHedgePercentage / 100), token.usdValue * 0.15)

      if (this.isNegativePriceMarket(market, token.symbol)) {
        recommendations.push({
          market,
          position: 'YES',
          confidence: this.calculateConfidence(market, 'token_protection'),
          reasoning: `Hedge ${token.symbol} position worth $${token.usdValue.toFixed(0)} against price decline.`,
          hedgeAmount
        })
      }
    }

    return recommendations
  }

  private async findStablecoinHedges(tokens: TokenBalance[], config: HedgeConfig): Promise<HedgeRecommendation[]> {
    const stablecoins = tokens.filter(t => ['USDC', 'USDT', 'DAI'].includes(t.symbol))
    const totalStableValue = stablecoins.reduce((sum, token) => sum + (token.usdValue || 0), 0)
    
    if (totalStableValue < 100) return []

    // Mock markets for demo
    const inflationMarkets: Market[] = []
    const recommendations: HedgeRecommendation[] = []

    for (const market of inflationMarkets) {
      if (market.liquidity < config.minLiquidity) continue

      const hedgeAmount = Math.min(totalStableValue * (config.maxHedgePercentage / 100), totalStableValue * 0.05)

      if (this.isHighInflationMarket(market)) {
        recommendations.push({
          market,
          position: 'YES',
          confidence: this.calculateConfidence(market, 'inflation_protection'),
          reasoning: `Hedge $${totalStableValue.toFixed(0)} in stablecoins against inflation risk.`,
          hedgeAmount
        })
      }
    }

    return recommendations
  }

  private isNegativePriceMarket(market: Market, symbol: string): boolean {
    const question = market.question.toLowerCase()
    const symbolLower = symbol.toLowerCase()
    
    return question.includes(symbolLower) && (
      question.includes('below') ||
      question.includes('under') ||
      question.includes('drop') ||
      question.includes('fall') ||
      question.includes('<') ||
      question.includes('decline')
    )
  }

  private isHighInflationMarket(market: Market): boolean {
    const question = market.question.toLowerCase()
    
    return (
      question.includes('inflation') ||
      question.includes('cpi') ||
      question.includes('fed') ||
      question.includes('interest rate')
    ) && (
      question.includes('above') ||
      question.includes('higher') ||
      question.includes('increase') ||
      question.includes('>')
    )
  }

  private calculateConfidence(market: Market, hedgeType: string): number {
    let confidence = 0.5

    if (market.volume > 100000) confidence += 0.2
    if (market.liquidity > 50000) confidence += 0.15
    
    const daysToEnd = (new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysToEnd > 30 && daysToEnd < 180) confidence += 0.1

    if (hedgeType === 'price_protection' && market.prices[0] < 0.3) confidence += 0.1
    if (hedgeType === 'inflation_protection' && market.prices[0] > 0.4) confidence += 0.15

    return Math.min(confidence, 0.95)
  }
}