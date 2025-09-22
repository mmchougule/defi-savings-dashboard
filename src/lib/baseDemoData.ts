import { Portfolio, TokenBalance } from './portfolio'
import { HedgePosition } from './baseTradeExecutor'
import { BaseMarket } from './basePredictionMarkets'

export interface BaseHedgeRecommendation {
  market: BaseMarket
  position: 'YES' | 'NO'
  confidence: number
  reasoning: string
  hedgeAmount: number
}

export const BASE_DEMO_PORTFOLIO: Portfolio = {
  eth: BigInt('3000000000000000000'), // 3 ETH
  tokens: [
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      symbol: 'USDC',
      balance: BigInt('8000000000'), // 8,000 USDC
      decimals: 6,
      usdValue: 8000
    },
    {
      address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // cbETH
      symbol: 'cbETH',
      balance: BigInt('2000000000000000000'), // 2 cbETH
      decimals: 18,
      usdValue: 6000
    }
  ],
  totalUsdValue: 23000 // ~3 ETH * $3000 + $8k USDC + $6k cbETH
}

export const BASE_DEMO_MARKETS: BaseMarket[] = [
  {
    id: '0xbase_demo_1',
    question: 'Will Base network TVL exceed $5B by end of 2024?',
    description: 'This market resolves to YES if Base network Total Value Locked (TVL) exceeds $5 billion by December 31, 2024.',
    outcomes: ['YES', 'NO'],
    prices: [0.42, 0.58],
    volume: 750000,
    liquidity: 125000,
    endDate: '2024-12-31T23:59:59Z',
    category: 'DeFi',
    tags: ['base', 'tvl', 'defi'],
    protocol: 'betbase',
    network: 'base',
    contractAddress: '0xbase1contract',
    volume24h: 35000
  },
  {
    id: '0xbase_demo_2',
    question: 'Will ETH price drop below $2800 on Base DEXs by Q2 2024?',
    description: 'Resolves YES if ETH trades below $2800 on any major Base DEX by end of Q2 2024.',
    outcomes: ['YES', 'NO'],
    prices: [0.36, 0.64],
    volume: 420000,
    liquidity: 85000,
    endDate: '2024-06-30T23:59:59Z',
    category: 'Crypto',
    tags: ['eth', 'base', 'price'],
    protocol: 'betbase',
    network: 'base',
    contractAddress: '0xbase2contract',
    volume24h: 22000
  }
]

export const BASE_DEMO_RECOMMENDATIONS: BaseHedgeRecommendation[] = [
  {
    market: BASE_DEMO_MARKETS[0],
    position: 'YES',
    confidence: 0.78,
    reasoning: 'Hedge against Base ecosystem risk. Your portfolio has significant Base exposure through cbETH and USDC.',
    hedgeAmount: 600 // ~2.6% of portfolio
  },
  {
    market: BASE_DEMO_MARKETS[1],
    position: 'YES',
    confidence: 0.82,
    reasoning: 'Hedge against ETH price decline. Your $9,000 in ETH/cbETH could lose value if price drops below $2,800.',
    hedgeAmount: 450 // ~2% of ETH position
  }
]

export const BASE_DEMO_POSITIONS: HedgePosition[] = [
  {
    id: 'base_pos_1',
    marketId: '0xbase_demo_1',
    position: 'YES',
    amount: 400,
    price: 0.38,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'open',
    network: 'base',
    pnl: 42.11 // Current price 0.42, entry 0.38
  },
  {
    id: 'base_pos_2',
    marketId: '0xbase_demo_2',
    position: 'YES',
    amount: 300,
    price: 0.33,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'open',
    network: 'base',
    pnl: 27.27 // Current price 0.36, entry 0.33
  }
]