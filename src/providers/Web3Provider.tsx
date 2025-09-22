'use client'

import { ReactNode } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { wagmiConfig } from '../config/wagmi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never consider stale
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 1, // Minimal retries
      retryDelay: 5000, // 5 second delay
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      refetchInterval: false, // Disable auto-refetch globally
    },
    mutations: {
      retry: 1,
    },
  },
})

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={mainnet}
          config={{
            appearance: {
              mode: 'auto',
              theme: 'default',
              name: 'DeFi Savings Dashboard',
              logo: 'https://avatars.githubusercontent.com/u/37784886',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}