'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { Button } from './ui/Button'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    // Open the modal using the AppKit instance
    if (typeof window !== 'undefined') {
      // @ts-expect-error - AppKit is available globally
      window.modal?.open()
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={handleConnect}>
      Connect Wallet
    </Button>
  )
}