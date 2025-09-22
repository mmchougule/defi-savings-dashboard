'use client'

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@privy-io/wagmi'

// Create a query client
const queryClient = new QueryClient()

// Create wagmi config with Privy
const config = getDefaultConfig({
  appName: 'DeFi Savings Dashboard',
  appUrl: 'https://defi-savings-dashboard.vercel.app',
  chains: [mainnet],
  walletFeatures: {
    onramp: true, // Enable onramp functionality
  },
})

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // If no Privy App ID is configured, render children without Privy
  if (!privyAppId || privyAppId === 'your-privy-app-id-here') {
    console.warn('Privy App ID not configured. Onramp functionality will be disabled.')
    return <>{children}</>
  }

  return (
    <PrivyProviderBase
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url.com/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'google', 'apple'],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  )
}
