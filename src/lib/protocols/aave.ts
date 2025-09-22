import { Address, formatUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { 
  AAVE_V3_POOL_ABI, 
  AAVE_V3_DATA_PROVIDER_ABI, 
  ATOKEN_ABI,
  ERC20_ABI 
} from '@/constants/abis'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { ProtocolBalance } from '@/types/contracts'
import { priceService } from '../priceService'
import { safeTransaction, validateTransactionInputs, logError } from '../errorHandling'
import { optimizedRpcCall } from '../rpcConfig'
import { withRateLimit } from '../rateLimiter'

// Official Aave SDK integration
import { evmAddress } from '@aave/react'

export class AaveV3Adapter {
  private poolAddress = CONTRACT_ADDRESSES.AAVE_V3_POOL
  private dataProviderAddress = CONTRACT_ADDRESSES.AAVE_V3_POOL_DATA_PROVIDER

  /**
   * Get Aave market address for official SDK integration
   */
  getMarketAddress(): Address {
    return this.poolAddress
  }

  /**
   * Convert Address to EvmAddress for Aave SDK compatibility
   */
  toEvmAddress(address: Address) {
    return evmAddress(address)
  }

  async getSupplyApy(asset: Address): Promise<number> {
    try {
      const cacheKey = `aave_apy_${asset}`
      
      return await optimizedRpcCall(
        cacheKey,
        async () => {
          return await withRateLimit(async () => {
            // Use Pool contract to get reserve data which includes liquidityRate
            const reserveData = await readContract(wagmiConfig, {
              address: this.poolAddress,
              abi: AAVE_V3_POOL_ABI,
              functionName: 'getReserveData',
              args: [asset],
            })

            // Convert liquidityRate to APY (rate is in ray format - 27 decimals)
            const RAY = BigInt('1000000000000000000000000000')
            const liquidityRate = reserveData.currentLiquidityRate // From tuple structure
            const apy = Number(liquidityRate) / Number(RAY) * 100

            // Debug logging
            console.log(`Aave v3 ${asset}:`, {
              rawRate: liquidityRate.toString(),
              apy: apy.toFixed(4) + '%'
            })

            return apy
          })
        },
        5 * 60 * 1000 // Cache for 5 minutes (longer cache)
      )
    } catch (error) {
      console.error('Error fetching Aave supply APY:', error)
      return 0
    }
  }

  async getUserBalance(userAddress: Address, asset: Address): Promise<ProtocolBalance | null> {
    try {
      // Get aToken address from Pool contract's reserve data
      const reserveData = await readContract(wagmiConfig, {
        address: this.poolAddress,
        abi: AAVE_V3_POOL_ABI,
        functionName: 'getReserveData',
        args: [asset],
      })

      const aTokenAddress = reserveData.aTokenAddress // From tuple structure

      // Get user's aToken balance
      const aTokenBalance = await readContract(wagmiConfig, {
        address: aTokenAddress,
        abi: ATOKEN_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      })

      if (aTokenBalance === BigInt(0)) {
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
        aTokenBalance,
        symbol,
        decimals
      )

      return {
        protocol: 'aave_v3',
        asset: asset,
        symbol: symbol,
        balance: aTokenBalance,
        apy,
        valueUSD,
      }
    } catch (error) {
      console.error('Error fetching Aave user balance:', error)
      return null
    }
  }

  async supply(asset: Address, amount: bigint, userAddress: Address): Promise<string> {
    // Validate inputs
    const validationError = validateTransactionInputs({ amount, userAddress, assetAddress: asset })
    if (validationError) {
      logError(validationError, { protocol: 'aave_v3', action: 'supply', userAddress })
      throw new Error(validationError.userMessage)
    }

    const result = await safeTransaction(
      async () => {
        // First approve the pool to spend tokens
        const approveTx = await writeContract(wagmiConfig, {
          address: asset,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [this.poolAddress, amount],
        })

        await waitForTransactionReceipt(wagmiConfig, { hash: approveTx })

        // Then supply to the pool
        const supplyTx = await writeContract(wagmiConfig, {
          address: this.poolAddress,
          abi: AAVE_V3_POOL_ABI,
          functionName: 'supply',
          args: [asset, amount, userAddress, 0], // 0 for referral code
        })

        return supplyTx
      },
      { protocol: 'aave_v3', action: 'supply', userAddress }
    )

    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error.userMessage)
    }
  }

  async withdraw(asset: Address, amount: bigint, userAddress: Address): Promise<string> {
    // Validate inputs
    const validationError = validateTransactionInputs({ amount, userAddress, assetAddress: asset })
    if (validationError) {
      logError(validationError, { protocol: 'aave_v3', action: 'withdraw', userAddress })
      throw new Error(validationError.userMessage)
    }

    const result = await safeTransaction(
      async () => {
        const withdrawTx = await writeContract(wagmiConfig, {
          address: this.poolAddress,
          abi: AAVE_V3_POOL_ABI,
          functionName: 'withdraw',
          args: [asset, amount, userAddress],
        })

        return withdrawTx
      },
      { protocol: 'aave_v3', action: 'withdraw', userAddress }
    )

    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error.userMessage)
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
      const assets = [
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.USDT,
        CONTRACT_ADDRESSES.DAI,
        CONTRACT_ADDRESSES.WETH,
        CONTRACT_ADDRESSES.WBTC,
      ]

      const assetData = await Promise.all(
        assets.map(async (asset) => {
          // Get reserve data from Pool contract
          const reserveData = await readContract(wagmiConfig, {
            address: this.poolAddress,
            abi: AAVE_V3_POOL_ABI,
            functionName: 'getReserveData',
            args: [asset],
          })

          // Get additional data from Data Provider for liquidity info
          const dataProviderReserveData = await readContract(wagmiConfig, {
            address: this.dataProviderAddress,
            abi: AAVE_V3_DATA_PROVIDER_ABI,
            functionName: 'getReserveData',
            args: [asset],
          })

          const symbol = await readContract(wagmiConfig, {
            address: asset,
            abi: ERC20_ABI,
            functionName: 'symbol',
          })

          const decimals = await readContract(wagmiConfig, {
            address: asset,
            abi: ERC20_ABI,
            functionName: 'decimals',
          })

          const RAY = BigInt('1000000000000000000000000000')
          const supplyApy = Number(reserveData.currentLiquidityRate) / Number(RAY) * 100
          const borrowApy = Number(reserveData.currentVariableBorrowRate) / Number(RAY) * 100

          // Use data provider data for liquidity calculations
          const totalLiquidity = dataProviderReserveData[0] + dataProviderReserveData[1] + dataProviderReserveData[2]
          const utilization = totalLiquidity > 0 
            ? Number((dataProviderReserveData[1] + dataProviderReserveData[2]) * BigInt(100) / totalLiquidity)
            : 0

          return {
            symbol,
            address: asset,
            decimals: Number(decimals),
            supplyApy,
            borrowApy,
            utilization,
            tvl: formatUnits(totalLiquidity, Number(decimals)),
          }
        })
      )

      return {
        name: 'Aave v3',
        assets: assetData,
      }
    } catch (error) {
      console.error('Error fetching Aave protocol data:', error)
      return null
    }
  }
}