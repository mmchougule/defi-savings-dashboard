/**
 * Hook to fetch Aave user positions using official @aave/react SDK
 * Based on: https://aave.com/docs/developers/aave-v3/markets/positions
 */

import { 
  useUserSupplies, 
  useUserBorrows, 
  useUserMarketState,
  evmAddress,
  type EvmAddress 
} from "@aave/react"
import { Address } from "viem"
import { markets, defaultMarket } from "@/lib/aave/markets"

export interface AaveUserPosition {
  // Supply positions
  supplies: any[] // MarketUserReserveSupplyPosition[]
  supplyLoading: boolean
  supplyError: Error | null
  
  // Borrow positions  
  borrows: any[] // MarketUserReserveBorrowPosition[]
  borrowLoading: boolean
  borrowError: Error | null
  
  // Account health
  accountHealth: {
    healthFactor: string | null
    netWorth: string
    eModeEnabled: boolean
  } | null
  healthLoading: boolean
  healthError: Error | null
}

/**
 * Fetch comprehensive Aave user positions and account health
 */
export function useAavePositions(userAddress?: Address): AaveUserPosition {
  // Convert Address to EvmAddress format required by Aave SDK
  const aaveUser = userAddress ? evmAddress(userAddress) : undefined

  // Fetch user supplies using official Aave SDK
  const { 
    data: supplies = [], 
    loading: supplyLoading, 
    error: supplyError 
  } = useUserSupplies({
    markets,
    user: aaveUser as EvmAddress,
  })

  // Fetch user borrows using official Aave SDK
  const { 
    data: borrows = [], 
    loading: borrowLoading, 
    error: borrowError 
  } = useUserBorrows({
    markets,
    user: aaveUser as EvmAddress,
  })

  // Fetch account health for default market
  const { 
    data: accountHealth, 
    loading: healthLoading, 
    error: healthError 
  } = useUserMarketState({
    market: defaultMarket.market,
    user: aaveUser as EvmAddress,
    chainId: defaultMarket.chainId,
  })

  return {
    supplies,
    supplyLoading,
    supplyError,
    borrows,
    borrowLoading,
    borrowError,
    accountHealth,
    healthLoading,
    healthError,
  }
}

/**
 * Hook to fetch only user supplies
 */
export function useAaveSupplies(userAddress?: Address) {
  const aaveUser = userAddress ? evmAddress(userAddress) : undefined
  
  return useUserSupplies({
    markets,
    user: aaveUser as EvmAddress,
  })
}

/**
 * Hook to fetch only user borrows
 */
export function useAaveBorrows(userAddress?: Address) {
  const aaveUser = userAddress ? evmAddress(userAddress) : undefined
  
  return useUserBorrows({
    markets,
    user: aaveUser as EvmAddress,
  })
}

/**
 * Hook to fetch account health for a specific user
 */
export function useAaveAccountHealth(userAddress?: Address) {
  const aaveUser = userAddress ? evmAddress(userAddress) : undefined
  
  return useUserMarketState({
    market: defaultMarket.market,
    user: aaveUser as EvmAddress,
    chainId: defaultMarket.chainId,
  })
}
