import { Address, formatUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { COMPOUND_V3_COMET_ABI, ERC20_ABI } from '@/constants/abis'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { ProtocolBalance } from '@/types/contracts'
import { priceService } from '../priceService'

export class CompoundV3Adapter {
  private usdcCometAddress = CONTRACT_ADDRESSES.COMPOUND_V3_USDC
  private wethCometAddress = CONTRACT_ADDRESSES.COMPOUND_V3_WETH

  private getCometAddress(asset: Address): Address {
    if (asset === CONTRACT_ADDRESSES.USDC) {
      return this.usdcCometAddress
    } else if (asset === CONTRACT_ADDRESSES.WETH) {
      return this.wethCometAddress
    }
    throw new Error(`Unsupported asset: ${asset}`)
  }

  private isSupportedAsset(asset: Address): boolean {
    return asset === CONTRACT_ADDRESSES.USDC || asset === CONTRACT_ADDRESSES.WETH
  }

  async getSupplyApy(asset: Address): Promise<number> {
    try {
      // Check if asset is supported before proceeding
      if (!this.isSupportedAsset(asset)) {
        console.warn(`Compound v3 does not support asset: ${asset}`)
        return 0
      }

      const cometAddress = this.getCometAddress(asset)
      
      const supplyRate = await readContract(wagmiConfig, {
        address: cometAddress,
        abi: COMPOUND_V3_COMET_ABI,
        functionName: 'getSupplyRate',
      })

      // Convert supply rate to APY
      // Compound v3 returns rate per second with 18 decimals
      // But we need to convert to per-block rate first
      const BLOCKS_PER_YEAR = 2102400 // ~15 second block time on Ethereum
      const ratePerSecond = Number(supplyRate) / 1e18
      const ratePerBlock = ratePerSecond * 15 // Convert per-second to per-block (15 second blocks)
      const apy = (Math.pow(1 + ratePerBlock, BLOCKS_PER_YEAR) - 1) * 100

      // Debug logging
      console.log(`Compound v3 ${asset}:`, {
        rawRate: supplyRate.toString(),
        ratePerSecond,
        ratePerBlock,
        apy: apy.toFixed(4) + '%'
      })

      return apy
    } catch (error) {
      console.error('Error fetching Compound supply APY:', error)
      return 0
    }
  }

  async getUserBalance(userAddress: Address, asset: Address): Promise<ProtocolBalance | null> {
    try {
      // Check if asset is supported before proceeding
      if (!this.isSupportedAsset(asset)) {
        console.warn(`Compound v3 does not support asset: ${asset}`)
        return null
      }

      const cometAddress = this.getCometAddress(asset)

      // Get user's balance
      const balance = await readContract(wagmiConfig, {
        address: cometAddress,
        abi: COMPOUND_V3_COMET_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })

      if (balance === BigInt(0)) {
        return null
      }

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
        balance,
        symbol,
        decimals
      )

      return {
        protocol: 'compound_v3',
        asset: asset,
        symbol: symbol,
        balance,
        apy,
        valueUSD,
      }
    } catch (error) {
      console.error('Error fetching Compound user balance:', error)
      return null
    }
  }

  async supply(asset: Address, amount: bigint, _userAddress: Address): Promise<string> {
    try {
      // Check if asset is supported before proceeding
      if (!this.isSupportedAsset(asset)) {
        throw new Error(`Compound v3 does not support asset: ${asset}`)
      }

      const cometAddress = this.getCometAddress(asset)

      // First approve the comet to spend tokens
      const approveTx = await writeContract(wagmiConfig, {
        address: asset,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [cometAddress, amount],
      })

      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx })

      // Then supply to the comet
      const supplyTx = await writeContract(wagmiConfig, {
        address: cometAddress,
        abi: COMPOUND_V3_COMET_ABI,
        functionName: 'supply',
        args: [asset, amount],
      })

      return supplyTx
    } catch (error) {
      console.error('Error supplying to Compound:', error)
      throw error
    }
  }

  async withdraw(asset: Address, amount: bigint, _userAddress: Address): Promise<string> {
    try {
      // Check if asset is supported before proceeding
      if (!this.isSupportedAsset(asset)) {
        throw new Error(`Compound v3 does not support asset: ${asset}`)
      }

      const cometAddress = this.getCometAddress(asset)

      const withdrawTx = await writeContract(wagmiConfig, {
        address: cometAddress,
        abi: COMPOUND_V3_COMET_ABI,
        functionName: 'withdraw',
        args: [asset, amount],
      })

      return withdrawTx
    } catch (error) {
      console.error('Error withdrawing from Compound:', error)
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
      const markets = [
        { asset: CONTRACT_ADDRESSES.USDC, comet: this.usdcCometAddress },
        { asset: CONTRACT_ADDRESSES.WETH, comet: this.wethCometAddress },
      ]

      const assetData = await Promise.all(
        markets.map(async ({ asset, comet }) => {
          try {
            const [supplyRate, borrowRate, utilization, totalSupply, , symbol, decimals] = await Promise.all([
              readContract(wagmiConfig, {
                address: comet,
                abi: COMPOUND_V3_COMET_ABI,
                functionName: 'getSupplyRate',
              }).catch(() => BigInt(0)), // Fallback to 0 if function fails
              readContract(wagmiConfig, {
                address: comet,
                abi: COMPOUND_V3_COMET_ABI,
                functionName: 'getBorrowRate',
              }).catch(() => BigInt(0)), // Fallback to 0 if function fails
              readContract(wagmiConfig, {
                address: comet,
                abi: COMPOUND_V3_COMET_ABI,
                functionName: 'getUtilization',
              }).catch(() => BigInt(0)), // Fallback to 0 if function fails
              readContract(wagmiConfig, {
                address: comet,
                abi: COMPOUND_V3_COMET_ABI,
                functionName: 'totalSupply',
              }).catch(() => BigInt(0)), // Fallback to 0 if function fails
              readContract(wagmiConfig, {
                address: comet,
                abi: COMPOUND_V3_COMET_ABI,
                functionName: 'totalBorrow',
              }).catch(() => BigInt(0)), // Fallback to 0 if function fails
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
          const BLOCKS_PER_YEAR = 2102400 // ~15 second block time on Ethereum
          const supplyRatePerSecond = Number(supplyRate) / 1e18
          const borrowRatePerSecond = Number(borrowRate) / 1e18
          const supplyRatePerBlock = supplyRatePerSecond * 15 // Convert per-second to per-block
          const borrowRatePerBlock = borrowRatePerSecond * 15 // Convert per-second to per-block
          
          const supplyApy = (Math.pow(1 + supplyRatePerBlock, BLOCKS_PER_YEAR) - 1) * 100
          const borrowApy = (Math.pow(1 + borrowRatePerBlock, BLOCKS_PER_YEAR) - 1) * 100

            return {
              symbol,
              address: asset,
              decimals: Number(decimals),
              supplyApy,
              borrowApy,
              utilization: Number(utilization) / 1e16, // Convert from 1e18 to percentage
              tvl: formatUnits(totalSupply, Number(decimals)),
            }
          } catch (error) {
            console.warn(`Failed to fetch data for Compound market ${asset}:`, error)
            // Return default values for failed markets
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
        name: 'Compound v3',
        assets: assetData,
      }
    } catch (error) {
      console.error('Error fetching Compound protocol data:', error)
      return null
    }
  }
}