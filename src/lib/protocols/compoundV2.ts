import { Address, formatUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { CTOKEN_ABI, ERC20_ABI } from '@/constants/abis'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { ProtocolBalance } from '@/types/contracts'
import { priceService } from '../priceService'

export class CompoundV2Adapter {
  private cTokenAddresses = {
    [CONTRACT_ADDRESSES.USDC]: CONTRACT_ADDRESSES.CUSDC,
    [CONTRACT_ADDRESSES.USDT]: CONTRACT_ADDRESSES.CUSDT,
    [CONTRACT_ADDRESSES.DAI]: CONTRACT_ADDRESSES.CDAI,
    [CONTRACT_ADDRESSES.WETH]: CONTRACT_ADDRESSES.CETH, // cETH for ETH/WETH
    [CONTRACT_ADDRESSES.WBTC]: CONTRACT_ADDRESSES.CWBTC,
  }

  private getCTokenAddress(asset: Address): Address {
    const cTokenAddress = this.cTokenAddresses[asset]
    if (!cTokenAddress) {
      throw new Error(`Unsupported asset: ${asset}`)
    }
    return cTokenAddress
  }

  private isSupportedAsset(asset: Address): boolean {
    return asset in this.cTokenAddresses
  }

  async getSupplyApy(asset: Address): Promise<number> {
    try {
      if (!this.isSupportedAsset(asset)) {
        console.warn(`Compound v2 does not support asset: ${asset}`)
        return 0
      }

      const cTokenAddress = this.getCTokenAddress(asset)
      
      const supplyRatePerBlock = await readContract(wagmiConfig, {
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'supplyRatePerBlock',
      })

      // Convert supply rate per block to APY
      // Compound v2 returns rate per block with 18 decimals
      const BLOCKS_PER_YEAR = 365 * 24 * 60 * 60 / 12 // Assuming 12 second block time
      const ratePerBlock = Number(supplyRatePerBlock) / 1e18
      const apy = (Math.pow(1 + ratePerBlock, BLOCKS_PER_YEAR) - 1) * 100

      return apy
    } catch (error) {
      console.error('Error fetching Compound v2 supply APY:', error)
      return 0
    }
  }

  async getUserBalance(userAddress: Address, asset: Address): Promise<ProtocolBalance | null> {
    try {
      if (!this.isSupportedAsset(asset)) {
        console.warn(`Compound v2 does not support asset: ${asset}`)
        return null
      }

      const cTokenAddress = this.getCTokenAddress(asset)

      // Get user's cToken balance
      const cTokenBalance = await readContract(wagmiConfig, {
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })

      if (cTokenBalance === BigInt(0)) {
        return null
      }

      // Get exchange rate to convert cTokens to underlying tokens
      const exchangeRate = await readContract(wagmiConfig, {
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'exchangeRateStored',
      })

      // Calculate underlying token balance: cTokenBalance * exchangeRate / 1e18
      const underlyingBalance = (cTokenBalance * exchangeRate) / BigInt(10 ** 18)

      // Get current APY
      const apy = await this.getSupplyApy(asset)

      // Get asset symbol and decimals for display and calculations
      const [symbol, decimals] = await Promise.all([
        readContract(wagmiConfig, {
          address: asset,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        readContract(wagmiConfig, {
          address: asset,
          abi: ERC20_ABI,
          functionName: 'decimals',
        })
      ])

      // Calculate USD value
      const valueUSD = await priceService.calculateUSDValue(
        underlyingBalance,
        symbol,
        decimals
      )

      return {
        protocol: 'compound_v2',
        asset: asset,
        symbol: symbol,
        balance: underlyingBalance,
        apy,
        valueUSD,
      }
    } catch (error) {
      console.error('Error fetching Compound v2 user balance:', error)
      return null
    }
  }

  async supply(asset: Address, amount: bigint, _userAddress: Address): Promise<string> {
    try {
      if (!this.isSupportedAsset(asset)) {
        throw new Error(`Compound v2 does not support asset: ${asset}`)
      }

      const cTokenAddress = this.getCTokenAddress(asset)

      // First approve the cToken to spend underlying tokens
      const approveTx = await writeContract(wagmiConfig, {
        address: asset,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [cTokenAddress, amount],
      })

      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx })

      // Then mint cTokens
      const mintTx = await writeContract(wagmiConfig, {
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'mint',
        args: [amount],
      })

      return mintTx
    } catch (error) {
      console.error('Error supplying to Compound v2:', error)
      throw error
    }
  }

  async withdraw(asset: Address, amount: bigint, _userAddress: Address): Promise<string> {
    try {
      if (!this.isSupportedAsset(asset)) {
        throw new Error(`Compound v2 does not support asset: ${asset}`)
      }

      const cTokenAddress = this.getCTokenAddress(asset)

      // Redeem underlying tokens (not cTokens)
      const redeemTx = await writeContract(wagmiConfig, {
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'redeemUnderlying',
        args: [amount],
      })

      return redeemTx
    } catch (error) {
      console.error('Error withdrawing from Compound v2:', error)
      throw error
    }
  }

  async getProtocolData(): Promise<{
    name: string
    assets: Array<{
      symbol: string
      address: Address
      decimals: number
      supplyApy: number
      borrowApy: number
      utilization: number
      tvl: string
    }>
  } | null> {
    try {
      const assets = Object.keys(this.cTokenAddresses) as Address[]
      
      const assetData = await Promise.all(
        assets.map(async (asset) => {
          try {
            const cTokenAddress = this.getCTokenAddress(asset)
            
            const [supplyRatePerBlock, borrowRatePerBlock, totalSupply, totalBorrows, symbol, decimals] = await Promise.all([
              readContract(wagmiConfig, {
                address: cTokenAddress,
                abi: CTOKEN_ABI,
                functionName: 'supplyRatePerBlock',
              }).catch(() => BigInt(0)),
              readContract(wagmiConfig, {
                address: cTokenAddress,
                abi: CTOKEN_ABI,
                functionName: 'borrowRatePerBlock',
              }).catch(() => BigInt(0)),
              readContract(wagmiConfig, {
                address: cTokenAddress,
                abi: CTOKEN_ABI,
                functionName: 'totalSupply',
              }).catch(() => BigInt(0)),
              readContract(wagmiConfig, {
                address: cTokenAddress,
                abi: CTOKEN_ABI,
                functionName: 'totalBorrows',
              }).catch(() => BigInt(0)),
              readContract(wagmiConfig, {
                address: asset,
                abi: ERC20_ABI,
                functionName: 'symbol',
              }),
              readContract(wagmiConfig, {
                address: asset,
                abi: ERC20_ABI,
                functionName: 'decimals',
              }),
            ])

            // Convert rates to APY
            const BLOCKS_PER_YEAR = 365 * 24 * 60 * 60 / 12 // Assuming 12 second block time
            const supplyRatePerBlockNum = Number(supplyRatePerBlock) / 1e18
            const borrowRatePerBlockNum = Number(borrowRatePerBlock) / 1e18
            
            const supplyApy = (Math.pow(1 + supplyRatePerBlockNum, BLOCKS_PER_YEAR) - 1) * 100
            const borrowApy = (Math.pow(1 + borrowRatePerBlockNum, BLOCKS_PER_YEAR) - 1) * 100

            // Calculate utilization
            const totalSupplyNum = Number(totalSupply)
            const totalBorrowsNum = Number(totalBorrows)
            const utilization = totalSupplyNum > 0 ? (totalBorrowsNum / totalSupplyNum) * 100 : 0

            return {
              symbol,
              address: asset,
              decimals: Number(decimals),
              supplyApy,
              borrowApy,
              utilization,
              tvl: formatUnits(totalSupply, Number(decimals)),
            }
          } catch (error) {
            console.warn(`Failed to fetch data for Compound v2 market ${asset}:`, error)
            return {
              symbol: 'UNKNOWN',
              address: asset,
              decimals: 18,
              supplyApy: 0,
              borrowApy: 0,
              utilization: 0,
              tvl: '0',
            }
          }
        })
      )

      return {
        name: 'Compound v2',
        assets: assetData,
      }
    } catch (error) {
      console.error('Error fetching Compound v2 protocol data:', error)
      return null
    }
  }
}
