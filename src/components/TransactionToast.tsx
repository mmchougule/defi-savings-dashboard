'use client'

import { useEffect, useState } from 'react'
import { TransactionStatus } from '@/types/contracts'

interface TransactionToastProps {
  transaction: TransactionStatus
  onClose: () => void
}

export function TransactionToast({ transaction, onClose }: TransactionToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto close after 5 seconds for success/failed, keep pending open
    if (transaction.status !== 'pending') {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Allow fade out animation
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [transaction.status, onClose])

  const getStatusConfig = () => {
    switch (transaction.status) {
      case 'pending':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ),
          title: 'Transaction Pending',
        }
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ),
          title: 'Transaction Successful',
        }
      case 'failed':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
          title: 'Transaction Failed',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm w-full border rounded-lg p-4 shadow-lg transition-all duration-300 z-50 ${
        config.bg
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.text}`}>
          {config.icon}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${config.text}`}>
            {config.title}
          </p>
          <p className={`mt-1 text-sm ${config.text} opacity-75`}>
            {transaction.type === 'deposit' ? 'Deposited' : 'Withdrew'} {transaction.amount} {transaction.asset}
          </p>
          <div className="mt-2 flex text-sm">
            <a
              href={`https://etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium underline ${config.text} hover:opacity-75`}
            >
              View on Etherscan
            </a>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex ${config.text} hover:opacity-75`}
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}