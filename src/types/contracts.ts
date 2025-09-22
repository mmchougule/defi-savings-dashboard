import { Address } from 'viem'

export interface ProtocolConfig {
  name: string
  displayName: string
  description: string
  icon: string
  website: string
  contracts: {
    [key: string]: Address
  }
  supportedAssets: SupportedAsset[]
}

export interface SupportedAsset {
  symbol: string
  name: string
  address: Address
  decimals: number
  icon: string
  supplyApy?: number
  borrowApy?: number
  tvl?: string
  utilization?: number
}

export interface ProtocolBalance {
  protocol: string
  asset: Address
  symbol: string
  balance: bigint
  apy: number
  valueUSD: number
}

export interface TransactionStatus {
  hash: Address
  status: 'pending' | 'success' | 'failed'
  type: 'deposit' | 'withdraw'
  protocol: string
  asset: string
  amount: string
  timestamp: number
}

export interface ProtocolData {
  name: string
  totalSupply: bigint
  totalBorrow: bigint
  supplyApy: number
  borrowApy: number
  utilization: number
  tvl: string
  assets: SupportedAsset[]
}