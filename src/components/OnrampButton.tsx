'use client'

import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from './ui/Button'
import { CreditCard, Apple, Smartphone, DollarSign } from 'lucide-react'

interface OnrampButtonProps {
  asset?: string
  amount?: string
  className?: string
}

export function OnrampButton({ asset = 'DAI', amount = '100', className }: OnrampButtonProps) {
  const { user, ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [isLoading, setIsLoading] = useState(false)

  const handleFundWallet = async () => {
    if (!wallets[0]?.address) {
      console.error('No wallet address available')
      return
    }

    setIsLoading(true)
    try {
      // For now, we'll show a message about onramp functionality
      // The actual fundWallet method needs to be implemented based on Privy's onramp docs
      alert(`Onramp functionality: Buy ${amount} ${asset} with Apple Pay/Card\n\nWallet: ${wallets[0].address}\n\nThis would open Privy's onramp modal in a real implementation.`)
    } catch (error) {
      console.error('Error funding wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // If Privy is not ready or not configured, show a fallback message
  if (!ready) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need {asset}? 
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Loading onramp options...
          </p>
        </div>
      </div>
    )
  }

  if (!authenticated || !wallets[0]) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Need {asset}? Connect Wallet First
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please connect your wallet to access onramp functionality
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Need {asset}? Buy with Card or Apple Pay
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Get {asset} instantly with your card, Apple Pay, or Google Pay
        </p>
      </div>

      <Button
        onClick={handleFundWallet}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 h-12 text-lg font-semibold"
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Apple className="h-5 w-5" />
            <span>Buy {asset} with Apple Pay</span>
          </div>
        )}
      </Button>

      <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <Apple className="h-4 w-4" />
          <span>Apple Pay</span>
        </div>
        <div className="flex items-center space-x-1">
          <CreditCard className="h-4 w-4" />
          <span>Card</span>
        </div>
        <div className="flex items-center space-x-1">
          <Smartphone className="h-4 w-4" />
          <span>Google Pay</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Instant Funding</p>
            <p className="text-blue-600">
              Your {asset} will arrive in your wallet within minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
