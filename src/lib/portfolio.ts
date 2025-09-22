import { PublicClient, Address, formatUnits, parseAbi } from 'viem'

export interface TokenBalance {
  address: Address
  symbol: string
  balance: bigint
  decimals: number
  usdValue?: number
}

export interface Portfolio {
  eth: bigint
  tokens: TokenBalance[]
  totalUsdValue: number
}

const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
])

const COMMON_TOKENS: { [key: string]: Address } = {
  USDC: '0xA0b86a33E6441b8C4C8C0d4B0C8C0d4B0C8C0d4B',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
}

export class PortfolioReader {
  constructor(private client: PublicClient) {}

  async getPortfolio(address: Address): Promise<Portfolio> {
    const [ethBalance, tokenBalances] = await Promise.all([
      this.getEthBalance(address),
      this.getTokenBalances(address)
    ])

    const totalUsdValue = await this.calculateTotalValue(ethBalance, tokenBalances)

    return {
      eth: ethBalance,
      tokens: tokenBalances,
      totalUsdValue
    }
  }

  private async getEthBalance(address: Address): Promise<bigint> {
    return await this.client.getBalance({ address })
  }

  private async getTokenBalances(address: Address): Promise<TokenBalance[]> {
    const balances: TokenBalance[] = []

    for (const [symbol, tokenAddress] of Object.entries(COMMON_TOKENS)) {
      try {
        const [balance, decimals] = await Promise.all([
          this.client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          }),
          this.client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals'
          })
        ])

        if (balance > 0n) {
          balances.push({
            address: tokenAddress,
            symbol,
            balance,
            decimals
          })
        }
      } catch (error) {
        console.warn(`Failed to fetch ${symbol} balance:`, error)
      }
    }

    return balances
  }

  private async calculateTotalValue(ethBalance: bigint, tokens: TokenBalance[]): Promise<number> {
    let total = 0
    
    const ethPrice = await this.fetchTokenPrice('ethereum')
    total += parseFloat(formatUnits(ethBalance, 18)) * ethPrice

    for (const token of tokens) {
      const price = await this.fetchTokenPrice(token.symbol.toLowerCase())
      const balance = parseFloat(formatUnits(token.balance, token.decimals))
      total += balance * price
      token.usdValue = balance * price
    }

    return total
  }

  private async fetchTokenPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data[symbol]?.usd || 0
    } catch (error) {
      console.warn(`Failed to fetch price for ${symbol}:`, error)
      return 0
    }
  }
}