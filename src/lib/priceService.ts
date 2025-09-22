import { Address, formatUnits } from 'viem'
import { readContract } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { STATIC_MODE, staticTokenPrices, simulateNetworkDelay } from './staticData'

// Chainlink Price Feed ABI (simplified)
const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Chainlink Price Feeds on Ethereum Mainnet
const PRICE_FEEDS: Record<string, Address> = {
  'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  'USDC/USD': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
  'USDT/USD': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
  'DAI/USD': '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9'
}

// Token symbol to price feed mapping
const TOKEN_PRICE_FEEDS: Record<string, keyof typeof PRICE_FEEDS> = {
  'WETH': 'ETH/USD',
  'ETH': 'ETH/USD',
  'WBTC': 'BTC/USD',
  'BTC': 'BTC/USD',
  'USDC': 'USDC/USD',
  'USDT': 'USDT/USD',
  'DAI': 'DAI/USD'
}

export class PriceService {
  private priceCache = new Map<string, { price: number; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache duration to reduce API calls
  private requestQueue = new Map<string, Promise<number>>() // Deduplicate requests

  /**
   * Get USD price for a token symbol
   */
  async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Use static data in development mode
      if (STATIC_MODE) {
        await simulateNetworkDelay(100) // Simulate slight delay
        return staticTokenPrices[symbol.toUpperCase() as keyof typeof staticTokenPrices] || 0
      }

      // Check cache first
      const cacheKey = symbol.toUpperCase()
      const cached = this.priceCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.price
      }

      // Check if request is already in progress (deduplication)
      if (this.requestQueue.has(cacheKey)) {
        return await this.requestQueue.get(cacheKey)!
      }

      const priceFeedKey = TOKEN_PRICE_FEEDS[symbol.toUpperCase()]
      if (!priceFeedKey) {
        console.warn(`No price feed found for token: ${symbol}`)
        return 0
      }

      // Create request promise and add to queue
      const pricePromise = this.fetchTokenPriceInternal(cacheKey, priceFeedKey)
      this.requestQueue.set(cacheKey, pricePromise)

      try {
        return await pricePromise
      } finally {
        // Remove from queue when done
        this.requestQueue.delete(cacheKey)
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      return 0
    }
  }

  private async fetchTokenPriceInternal(cacheKey: string, priceFeedKey: string): Promise<number> {
    const priceFeedAddress = PRICE_FEEDS[priceFeedKey]
    const price = await this.fetchChainlinkPrice(priceFeedAddress)

    // Cache the price
    this.priceCache.set(cacheKey, { price, timestamp: Date.now() })
    
    return price
  }

  /**
   * Calculate USD value for a token amount
   */
  async calculateUSDValue(
    balance: bigint,
    symbol: string,
    decimals: number
  ): Promise<number> {
    try {
      const price = await this.getTokenPrice(symbol)
      if (price === 0) return 0

      const balanceFormatted = parseFloat(formatUnits(balance, decimals))
      return balanceFormatted * price
    } catch (error) {
      console.error(`Error calculating USD value for ${symbol}:`, error)
      return 0
    }
  }

  /**
   * Fetch price from Chainlink price feed
   */
  private async fetchChainlinkPrice(priceFeedAddress: Address): Promise<number> {
    try {
      // Get the latest round data
      const [, answer] = await readContract(wagmiConfig, {
        address: priceFeedAddress,
        abi: CHAINLINK_PRICE_FEED_ABI,
        functionName: 'latestRoundData'
      })

      // Get decimals for the price feed
      const decimals = await readContract(wagmiConfig, {
        address: priceFeedAddress,
        abi: CHAINLINK_PRICE_FEED_ABI,
        functionName: 'decimals'
      })

      // Convert to number (Chainlink prices are typically 8 decimals)
      const price = parseFloat(formatUnits(BigInt(answer.toString()), decimals))
      return price
    } catch (error) {
      console.error('Error fetching Chainlink price:', error)
      throw error
    }
  }

  /**
   * Get multiple token prices in a batch
   */
  async getMultipleTokenPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {}
    
    // Use Promise.allSettled to handle any individual failures gracefully
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => ({
        symbol,
        price: await this.getTokenPrice(symbol)
      }))
    )

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        prices[result.value.symbol] = result.value.price
      }
    })

    return prices
  }

  /**
   * Clear price cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.priceCache.clear()
  }
}

// Export a singleton instance
export const priceService = new PriceService()