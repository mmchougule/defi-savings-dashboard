'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount, useReadContract } from 'wagmi'
import { Address, formatUnits } from 'viem'
import { CONTRACT_ADDRESSES } from '@/constants/contracts'

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export function useTokenBalance(tokenAddress: Address) {
  const { address, isConnected } = useAccount()

  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: false, // Disable auto-refetch to prevent excessive calls
      staleTime: 2 * 60 * 1000, // 2 minutes stale time
      gcTime: 10 * 60 * 1000, // 10 minutes cache time
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  })

  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: isConnected && !!address,
      staleTime: 5 * 60 * 1000, // 5 minutes for static data like decimals
      gcTime: 30 * 60 * 1000, // 30 minutes cache time for static data
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  })

  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: isConnected && !!address,
      staleTime: 5 * 60 * 1000, // 5 minutes for static data like symbol
      gcTime: 30 * 60 * 1000, // 30 minutes cache time for static data
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  })

  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0'

  return {
    balance: formattedBalance,
    rawBalance: balance,
    decimals,
    symbol,
    isLoading: balanceLoading || decimalsLoading || symbolLoading,
  }
}

// Specific hooks for common tokens
export function useUSDCBalance() {
  return useTokenBalance(CONTRACT_ADDRESSES.USDC)
}

export function useDAIBalance() {
  return useTokenBalance(CONTRACT_ADDRESSES.DAI)
}

export function useWETHBalance() {
  return useTokenBalance(CONTRACT_ADDRESSES.WETH)
}
