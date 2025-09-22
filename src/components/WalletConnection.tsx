'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
          <Wallet className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Disconnect</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wallet</h3>
      <div className="space-y-2">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Wallet className="h-5 w-5" />
            <span>Connect with {connector.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}