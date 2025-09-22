import { Address } from 'viem'
import { AaveV3Adapter } from './aave'
import { CompoundV3Adapter } from './compound'
import { CompoundV2Adapter } from './compoundV2'
import { MakerDSRAdapter } from './maker'
import { ProtocolBalance } from '@/types/contracts'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { STATIC_MODE, staticProtocolData, staticUserBalances, simulateNetworkDelay } from '../staticData'

export class ProtocolManager {
  private aave: AaveV3Adapter
  private compound: CompoundV3Adapter
  private compoundV2: CompoundV2Adapter
  private maker: MakerDSRAdapter

  constructor() {
    this.aave = new AaveV3Adapter()
    this.compound = new CompoundV3Adapter()
    this.compoundV2 = new CompoundV2Adapter()
    this.maker = new MakerDSRAdapter()
  }

  async getAllProtocolData() {
    try {
      // Use static data in development mode
      if (STATIC_MODE) {
        await simulateNetworkDelay(200)
        return {
          aave: {
            ...staticProtocolData.aave_v3,
            averageAPY: staticProtocolData.aave_v3.assets.reduce((sum, asset) => sum + asset.apy, 0) / staticProtocolData.aave_v3.assets.length,
            totalValueLocked: staticProtocolData.aave_v3.assets.reduce((sum, asset) => sum + asset.tvl, 0),
          },
          compound: {
            ...staticProtocolData.compound_v3,
            averageAPY: staticProtocolData.compound_v3.assets.reduce((sum, asset) => sum + asset.apy, 0) / staticProtocolData.compound_v3.assets.length,
            totalValueLocked: staticProtocolData.compound_v3.assets.reduce((sum, asset) => sum + asset.tvl, 0),
          },
          compoundV2: {
            ...staticProtocolData.compound_v2,
            averageAPY: staticProtocolData.compound_v2.assets.reduce((sum: number, asset: { apy: number }) => sum + asset.apy, 0) / staticProtocolData.compound_v2.assets.length,
            totalValueLocked: staticProtocolData.compound_v2.assets.reduce((sum: number, asset: { tvl: number }) => sum + asset.tvl, 0),
          },
          maker: {
            ...staticProtocolData.maker_dsr,
            averageAPY: staticProtocolData.maker_dsr.assets[0]?.apy || 0,
            totalValueLocked: staticProtocolData.maker_dsr.assets[0]?.tvl || 0,
          },
        }
      }

      const [aaveData, compoundData, compoundV2Data, makerData] = await Promise.all([
        this.aave.getProtocolData(),
        this.compound.getProtocolData(),
        this.compoundV2.getProtocolData(),
        this.maker.getProtocolData(),
      ])

      return {
        aave: {
          ...aaveData,
          averageAPY: aaveData ? aaveData.assets.reduce((sum, asset) => sum + asset.supplyApy, 0) / aaveData.assets.length : 0,
          totalValueLocked: aaveData ? aaveData.assets.reduce((sum, asset) => sum + parseFloat(asset.tvl), 0) : 0,
        },
        compound: {
          ...compoundData,
          averageAPY: compoundData ? compoundData.assets.reduce((sum, asset) => sum + asset.supplyApy, 0) / compoundData.assets.length : 0,
          totalValueLocked: compoundData ? compoundData.assets.reduce((sum, asset) => sum + parseFloat(asset.tvl), 0) : 0,
        },
        compoundV2: {
          ...compoundV2Data,
          averageAPY: compoundV2Data ? compoundV2Data.assets.reduce((sum, asset) => sum + asset.supplyApy, 0) / compoundV2Data.assets.length : 0,
          totalValueLocked: compoundV2Data ? compoundV2Data.assets.reduce((sum, asset) => sum + parseFloat(asset.tvl), 0) : 0,
        },
        maker: {
          ...makerData,
          averageAPY: makerData ? makerData.assets[0]?.supplyApy || 0 : 0,
          totalValueLocked: makerData ? parseFloat(makerData.assets[0]?.tvl || '0') : 0,
        },
      }
    } catch (error) {
      console.error('Error fetching all protocol data:', error)
      return null
    }
  }

  async getUserBalances(userAddress: Address): Promise<ProtocolBalance[]> {
    try {
      // Use static data in development mode
      if (STATIC_MODE) {
        await simulateNetworkDelay(300)
        return [...staticUserBalances] // Return copy of static data
      }

      const balances: ProtocolBalance[] = []

      // Get Aave balances for all supported assets
      const aaveAssets = [
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.USDT,
        CONTRACT_ADDRESSES.DAI,
        CONTRACT_ADDRESSES.WETH,
        CONTRACT_ADDRESSES.WBTC,
      ]

      for (const asset of aaveAssets) {
        const balance = await this.aave.getUserBalance(userAddress, asset as Address)
        if (balance) {
          balances.push(balance)
        }
      }

      // Get Compound v3 balances
      const compoundAssets = [
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.WETH,
      ]

      for (const asset of compoundAssets) {
        const balance = await this.compound.getUserBalance(userAddress, asset as Address)
        if (balance) {
          balances.push(balance)
        }
      }

      // Get Compound v2 balances
      const compoundV2Assets = [
        CONTRACT_ADDRESSES.USDC,
        CONTRACT_ADDRESSES.USDT,
        CONTRACT_ADDRESSES.DAI,
        CONTRACT_ADDRESSES.WETH,
        CONTRACT_ADDRESSES.WBTC,
      ]

      for (const asset of compoundV2Assets) {
        const balance = await this.compoundV2.getUserBalance(userAddress, asset as Address)
        if (balance) {
          balances.push(balance)
        }
      }

      // Get Maker DSR balance
      const makerBalance = await this.maker.getUserBalance(userAddress)
      if (makerBalance) {
        balances.push(makerBalance)
      }

      return balances
    } catch (error) {
      console.error('Error fetching user balances:', error)
      return []
    }
  }

  async deposit(
    protocol: string,
    asset: Address,
    amount: bigint,
    userAddress: Address
  ): Promise<string> {
    switch (protocol) {
      case 'aave_v3':
        return this.aave.supply(asset, amount, userAddress)
      case 'compound_v3':
        return this.compound.supply(asset, amount, userAddress)
      case 'compound_v2':
        return this.compoundV2.supply(asset, amount, userAddress)
      case 'maker_dsr':
        return this.maker.supply(amount, userAddress)
      default:
        throw new Error(`Unsupported protocol: ${protocol}`)
    }
  }

  async withdraw(
    protocol: string,
    asset: Address,
    amount: bigint,
    userAddress: Address
  ): Promise<string> {
    switch (protocol) {
      case 'aave_v3':
        return this.aave.withdraw(asset, amount, userAddress)
      case 'compound_v3':
        return this.compound.withdraw(asset, amount, userAddress)
      case 'compound_v2':
        return this.compoundV2.withdraw(asset, amount, userAddress)
      case 'maker_dsr':
        return this.maker.withdraw(amount, userAddress)
      default:
        throw new Error(`Unsupported protocol: ${protocol}`)
    }
  }

  getAdapter(protocol: string) {
    switch (protocol) {
      case 'aave_v3':
        return this.aave
      case 'compound_v3':
        return this.compound
      case 'compound_v2':
        return this.compoundV2
      case 'maker_dsr':
        return this.maker
      default:
        throw new Error(`Unsupported protocol: ${protocol}`)
    }
  }
}

export const protocolManager = new ProtocolManager()
export { AaveV3Adapter, CompoundV3Adapter, CompoundV2Adapter, MakerDSRAdapter }
export type { ProtocolBalance } from '@/types/contracts'