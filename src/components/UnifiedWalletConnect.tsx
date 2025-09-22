'use client'

import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from './ui/Button'
import { Wallet, LogOut, User, ExternalLink, ChevronDown } from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'

export function UnifiedWalletConnect() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [showOptions, setShowOptions] = useState(false)

  // If user is connected via any method, show connected state
  if (isConnected || (ready && authenticated)) {
    const displayAddress = address || wallets[0]?.address
    const displayName = user?.email?.address || user?.phone?.number || 'Connected'

    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
          <User className="h-4 w-4 text-gray-600" />
          <div className="text-sm">
            <p className="font-medium text-gray-900">
              {displayName}
            </p>
            <p className="text-xs text-gray-500">
              {displayAddress?.slice(0, 6)}...{displayAddress?.slice(-4)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            if (isConnected) {
              disconnect()
            } else {
              logout()
            }
          }}
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-red-500 hover:border-red-300"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-white">Loading wallet...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowOptions(!showOptions)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 text-lg px-8 py-3"
      >
        <Wallet className="h-5 w-5 mr-2" />
        Connect Wallet
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Connection Method</h3>
            
            {/* Privy Options */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick Connect (Privy)</div>
              <Button
                onClick={() => {
                  login()
                  setShowOptions(false)
                }}
                className="w-full justify-start bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0"
              >
                <User className="h-4 w-4 mr-2" />
                Email / Google / Apple
              </Button>
            </div>

            <div className="my-4 border-t border-gray-200"></div>

            {/* WalletConnect Options */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">External Wallets</div>
              <div className="space-y-2">
                <ConnectWallet />
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Privy creates a wallet automatically • External wallets connect directly
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
