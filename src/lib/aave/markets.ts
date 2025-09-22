/**
 * Aave V3 Markets Configuration for official @aave/react SDK
 * Based on: https://aave.com/docs/developers/aave-v3/markets/positions
 */

import { evmAddress, chainId } from "@aave/react"

// Ethereum Mainnet Aave V3 Market
export const ethereumMainnetMarket = evmAddress("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2")

// Market configurations for different chains
export const markets = [
  {
    market: ethereumMainnetMarket,
    chainId: chainId(1), // Ethereum Mainnet
  },
]

// Default market for single market operations
export const defaultMarket = {
  market: ethereumMainnetMarket,
  chainId: chainId(1),
}
