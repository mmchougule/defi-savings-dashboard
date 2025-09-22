import { Address } from 'viem'

// Base Network Contract Addresses
export const BASE_CONTRACTS = {
  // Base native USDC contract
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
  
  // Base WETH contract  
  WETH: '0x4200000000000000000000000000000000000006' as Address,
  
  // BetBase protocol addresses (Base's prediction market platform)
  BETBASE_ROUTER: '0x....' as Address, // TBD - BetBase router address
  BETBASE_FACTORY: '0x....' as Address, // TBD - BetBase factory address
  
  // Moonwell (Compound fork on Base) for yield farming
  MOONWELL_COMPTROLLER: '0xfBb21d0380beE3312B33c4353c8936a0F13EF26C' as Address,
  
  // Base ecosystem tokens
  tokens: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    WETH: '0x4200000000000000000000000000000000000006' as Address,
    cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as Address,
    // Add other Base ecosystem tokens
  }
} as const

// Base Sepolia Testnet Contracts
export const BASE_SEPOLIA_CONTRACTS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Base Sepolia USDC
  WETH: '0x4200000000000000000000000000000000000006' as Address, // Base Sepolia WETH
  
  // Testnet prediction market contracts (for testing)
  TEST_MARKET_FACTORY: '0x....' as Address, // TBD
  TEST_ROUTER: '0x....' as Address, // TBD
} as const

// Base network configuration
export const BASE_NETWORK_CONFIG = {
  chainId: 8453,
  name: 'Base',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
}

export const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  name: 'Base Sepolia',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia-explorer.base.org',
}

// Common token decimals
export const TOKEN_DECIMALS = {
  USDC: 6,
  WETH: 18,
  cbETH: 18,
  ETH: 18,
} as const

// Gas optimization settings for Base
export const BASE_GAS_CONFIG = {
  // Base has lower gas costs than Ethereum mainnet
  gasMultiplier: 1.1, // 10% buffer
  maxFeePerGas: '0x59682F00', // 1.5 gwei
  maxPriorityFeePerGas: '0x3B9ACA00', // 1 gwei
}