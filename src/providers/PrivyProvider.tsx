'use client'

import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth'

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
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'google', 'apple'],
      }}
    >
      {children}
    </PrivyProviderBase>
  )
}
