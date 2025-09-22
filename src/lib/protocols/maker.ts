import { Address } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '@/config/wagmi'
import { MAKER_DSR_MANAGER_ABI, MAKER_POT_ABI, ERC20_ABI } from '@/constants/abis'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'
import { ProtocolBalance } from '@/types/contracts'
import { priceService } from '../priceService'

export class MakerDSRAdapter {
  private dsrManagerAddress = CONTRACT_ADDRESSES.MAKER_DSR_MANAGER
  private potAddress = CONTRACT_ADDRESSES.MAKER_POT
  private daiAddress = CONTRACT_ADDRESSES.DAI

  async getSupplyApy(): Promise<number> {
    try {
      const [dsr] = await Promise.all([
        readContract(wagmiConfig, {
          address: this.potAddress,
          abi: MAKER_POT_ABI,
          functionName: 'dsr',
        }),
        readContract(wagmiConfig, {
          address: this.potAddress,
          abi: MAKER_POT_ABI,
          functionName: 'chi',
        }),
        readContract(wagmiConfig, {
          address: this.potAddress,
          abi: MAKER_POT_ABI,
          functionName: 'rho',
        }),
      ])

      // DSR is in ray format (27 decimals)
      const RAY = BigInt('1000000000000000000000000000')
      const dsrPerSecond = Number(dsr) / Number(RAY) - 1
      
      // Convert to APY
      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
      const apy = (Math.pow(1 + dsrPerSecond, SECONDS_PER_YEAR) - 1) * 100

      return apy
    } catch (error) {
      console.error('Error fetching Maker DSR APY:', error)
      return 0
    }
  }

  async getUserBalance(userAddress: Address): Promise<ProtocolBalance | null> {
    try {
      // Get user's pie balance (internal DSR balance)
      const pieBalance = await readContract(wagmiConfig, {
        address: this.dsrManagerAddress,
        abi: MAKER_DSR_MANAGER_ABI,
        functionName: 'pieOf',
        args: [userAddress],
      })

      if (pieBalance === BigInt(0)) {
        return null
      }

      // Get chi to convert pie to DAI
      const chi = await readContract(wagmiConfig, {
        address: this.potAddress,
        abi: MAKER_POT_ABI,
        functionName: 'chi',
      })

      // Calculate DAI balance: pie * chi / ray
      const RAY = BigInt('1000000000000000000000000000')
      const daiBalance = (pieBalance * chi) / RAY

      // Get current APY
      const apy = await this.getSupplyApy()

      // Calculate USD value for DAI (18 decimals)
      const valueUSD = await priceService.calculateUSDValue(daiBalance, 'DAI', 18)

      return {
        protocol: 'maker_dsr',
        asset: this.daiAddress,
        symbol: 'DAI',
        balance: daiBalance,
        apy,
        valueUSD,
      }
    } catch (error) {
      console.error('Error fetching Maker DSR user balance:', error)
      return null
    }
  }

  async supply(amount: bigint, _userAddress: Address): Promise<string> {
    try {
      // First approve the DSR manager to spend DAI
      const approveTx = await writeContract(wagmiConfig, {
        address: this.daiAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [this.dsrManagerAddress, amount],
      })

      await waitForTransactionReceipt(wagmiConfig, { hash: approveTx })

      // Then join the DSR
      const joinTx = await writeContract(wagmiConfig, {
        address: this.dsrManagerAddress,
        abi: MAKER_DSR_MANAGER_ABI,
        functionName: 'join',
        args: [amount],
      })

      return joinTx
    } catch (error) {
      console.error('Error supplying to Maker DSR:', error)
      throw error
    }
  }

  async withdraw(amount: bigint, _userAddress: Address): Promise<string> {
    try {
      const exitTx = await writeContract(wagmiConfig, {
        address: this.dsrManagerAddress,
        abi: MAKER_DSR_MANAGER_ABI,
        functionName: 'exit',
        args: [amount],
      })

      return exitTx
    } catch (error) {
      console.error('Error withdrawing from Maker DSR:', error)
      throw error
    }
  }

  async withdrawAll(_userAddress: Address): Promise<string> {
    try {
      const exitAllTx = await writeContract(wagmiConfig, {
        address: this.dsrManagerAddress,
        abi: MAKER_DSR_MANAGER_ABI,
        functionName: 'exitAll',
      })

      return exitAllTx
    } catch (error) {
      console.error('Error withdrawing all from Maker DSR:', error)
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
      const [dsr] = await Promise.all([
        readContract(wagmiConfig, {
          address: this.potAddress,
          abi: MAKER_POT_ABI,
          functionName: 'dsr',
        }),
      ])

      // Calculate APY
      const RAY = BigInt('1000000000000000000000000000')
      const dsrPerSecond = Number(dsr) / Number(RAY) - 1
      const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
      const apy = (Math.pow(1 + dsrPerSecond, SECONDS_PER_YEAR) - 1) * 100

      return {
        name: 'Maker DSR',
        assets: [
          {
            symbol: 'DAI',
            address: this.daiAddress,
            decimals: 18,
            supplyApy: apy,
            borrowApy: 0, // DSR doesn't have borrowing
            utilization: 0,
            tvl: '0', // Would need additional contract calls to get total DAI in DSR
          },
        ],
      }
    } catch (error) {
      console.error('Error fetching Maker DSR protocol data:', error)
      return null
    }
  }
}