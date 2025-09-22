'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from './ui/Button'
import { Wallet, LogOut, User } from 'lucide-react'

export function PrivyWalletConnect() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()

  if (!ready) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <Button
        onClick={login}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 text-lg px-8 py-3"
      >
        <Wallet className="h-5 w-5 mr-2" />
        Connect Wallet → Deposit
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
        <User className="h-4 w-4 text-gray-600" />
        <div className="text-sm">
          <p className="font-medium text-gray-900">
            {user?.email?.address || user?.phone?.number || 'Connected'}
          </p>
          <p className="text-xs text-gray-500">
            {wallets[0]?.address?.slice(0, 6)}...{wallets[0]?.address?.slice(-4)}
          </p>
        </div>
      </div>
      <Button
        onClick={logout}
        variant="outline"
        size="sm"
        className="text-gray-600 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4 mr-1" />
        Disconnect
      </Button>
    </div>
  )
}
