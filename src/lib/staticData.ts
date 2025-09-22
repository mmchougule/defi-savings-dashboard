import { Address } from 'viem'
import { ProtocolBalance } from '@/types/contracts'

// Static demo data disabled for production
export const STATIC_MODE = false

export const staticProtocolData = {
  aave_v3: {
    name: 'Aave v3',
    displayName: 'Aave v3',
    description: 'Decentralized lending and borrowing protocol',
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E579809275A4AA1651688a1F8218C95E' as Address,
        apy: 4.2,
        tvl: 150000000,
        decimals: 6,
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
        apy: 3.8,
        tvl: 120000000,
        decimals: 6,
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
        apy: 3.5,
        tvl: 80000000,
        decimals: 18,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
        apy: 2.1,
        tvl: 200000000,
        decimals: 18,
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address,
        apy: 1.8,
        tvl: 90000000,
        decimals: 8,
      },
    ],
  },
  compound_v3: {
    name: 'Compound v3',
    displayName: 'Compound v3',
    description: 'Capital efficient money markets',
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E579809275A4AA1651688a1F8218C95E' as Address,
        apy: 3.9,
        tvl: 100000000,
        decimals: 6,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
        apy: 1.9,
        tvl: 75000000,
        decimals: 18,
      },
    ],
  },
  compound_v2: {
    name: 'Compound v2',
    displayName: 'Compound v2',
    description: 'Traditional cToken lending protocol',
    assets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E579809275A4AA1651688a1F8218C95E' as Address,
        apy: 4.1,
        tvl: 85000000,
        decimals: 6,
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
        apy: 3.7,
        tvl: 65000000,
        decimals: 6,
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
        apy: 3.4,
        tvl: 70000000,
        decimals: 18,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
        apy: 2.0,
        tvl: 60000000,
        decimals: 18,
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address,
        apy: 1.6,
        tvl: 40000000,
        decimals: 8,
      },
    ],
  },
  maker_dsr: {
    name: 'Maker DSR',
    displayName: 'Maker DSR',
    description: 'Dai Savings Rate from MakerDAO',
    assets: [
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
        apy: 3.3,
        tvl: 50000000,
        decimals: 18,
      },
    ],
  },
}

export const staticUserBalances: ProtocolBalance[] = [
  {
    protocol: 'aave_v3',
    asset: '0xA0b86a33E579809275A4AA1651688a1F8218C95E' as Address,
    symbol: 'USDC',
    balance: BigInt('5000000000'), // 5000 USDC
    apy: 4.2,
    valueUSD: 5000,
  },
  {
    protocol: 'compound_v3',
    asset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
    symbol: 'WETH',
    balance: BigInt('2000000000000000000'), // 2 WETH
    apy: 1.9,
    valueUSD: 6400, // Assuming ETH at $3200
  },
  {
    protocol: 'compound_v2',
    asset: '0xA0b86a33E579809275A4AA1651688a1F8218C95E' as Address,
    symbol: 'USDC',
    balance: BigInt('3000000000'), // 3000 USDC
    apy: 4.1,
    valueUSD: 3000,
  },
  {
    protocol: 'maker_dsr',
    asset: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
    symbol: 'DAI',
    balance: BigInt('1500000000000000000000'), // 1500 DAI
    apy: 3.3,
    valueUSD: 1500,
  },
]

export const staticTokenPrices = {
  'USDC': 1.00,
  'USDT': 1.00,
  'DAI': 1.00,
  'WETH': 3200.00,
  'ETH': 3200.00,
  'WBTC': 95000.00,
  'BTC': 95000.00,
}

// Helper function to simulate network delay
export function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}