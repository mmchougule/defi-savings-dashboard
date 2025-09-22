import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'

// Get project IDs from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '380b8103643344f9aa330eae7aacb13c'

// Ethereum mainnet configuration for DeFi savings dashboard
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    coinbaseWallet({
      appName: 'DeFi Savings Dashboard',
      appLogoUrl: 'https://ethereum.org/favicon.ico',
    }),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'DeFi Savings Dashboard',
        description: 'Low-risk DeFi savings and yield optimization on Ethereum',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: ['https://ethereum.org/favicon.ico']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/BOuJT3bCIOT2Sq9TMp4gK'),
    [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
  },
  ssr: true,
})

// Ethereum mainnet configuration
export const ethereumConfig = {
  name: 'DeFi Savings Dashboard',
  description: 'Low-risk DeFi savings and yield optimization on Ethereum',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['https://ethereum.org/favicon.ico']
}