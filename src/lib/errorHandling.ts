import { BaseError, ContractFunctionRevertedError } from 'viem'

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
}

export interface DeFiError {
  type: ErrorType
  message: string
  originalError?: unknown
  userMessage: string
  recoverable: boolean
  retryable: boolean
}

/**
 * Parse and categorize errors from DeFi transactions and interactions
 */
export function parseError(error: unknown): DeFiError {
  // Handle user rejection
  const errorObj = error as { cause?: { code?: number }; message?: string }
  if (errorObj?.cause?.code === 4001 || errorObj?.message?.includes('User rejected')) {
    return {
      type: ErrorType.USER_REJECTED,
      message: 'Transaction was rejected by user',
      originalError: error,
      userMessage: 'Transaction cancelled. You can try again when ready.',
      recoverable: true,
      retryable: true,
    }
  }

  // Handle contract function reverted errors
  if (error instanceof ContractFunctionRevertedError) {
    const revertReason = error.data?.errorName || error.reason
    
    // Common DeFi error patterns
    if (revertReason?.includes('insufficient') || revertReason?.includes('balance')) {
      return {
        type: ErrorType.INSUFFICIENT_FUNDS,
        message: `Insufficient funds: ${revertReason}`,
        originalError: error,
        userMessage: 'You don\'t have enough tokens for this transaction.',
        recoverable: true,
        retryable: false,
      }
    }

    if (revertReason?.includes('allowance') || revertReason?.includes('approve')) {
      return {
        type: ErrorType.INSUFFICIENT_ALLOWANCE,
        message: `Insufficient allowance: ${revertReason}`,
        originalError: error,
        userMessage: 'Please approve the token spending first.',
        recoverable: true,
        retryable: true,
      }
    }

    return {
      type: ErrorType.CONTRACT_ERROR,
      message: `Contract error: ${revertReason || 'Transaction reverted'}`,
      originalError: error,
      userMessage: 'Transaction failed. Please check your inputs and try again.',
      recoverable: true,
      retryable: true,
    }
  }

  // Handle base errors (network issues, etc.)
  if (error instanceof BaseError) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection issue',
        originalError: error,
        userMessage: 'Network error. Please check your connection and try again.',
        recoverable: true,
        retryable: true,
      }
    }

    if (error.message.includes('chain') || error.message.includes('unsupported')) {
      return {
        type: ErrorType.UNSUPPORTED_CHAIN,
        message: 'Unsupported chain or network',
        originalError: error,
        userMessage: 'Please switch to Ethereum mainnet to continue.',
        recoverable: true,
        retryable: false,
      }
    }
  }

  // Handle wallet connection errors
  if (errorObj?.message?.includes('wallet') || errorObj?.message?.includes('connect')) {
    return {
      type: ErrorType.WALLET_NOT_CONNECTED,
      message: 'Wallet not connected',
      originalError: error,
      userMessage: 'Please connect your wallet to continue.',
      recoverable: true,
      retryable: true,
    }
  }

  // Default fallback
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: errorObj?.message || 'An unknown error occurred',
    originalError: error,
    userMessage: 'Something went wrong. Please try again.',
    recoverable: true,
    retryable: true,
  }
}

/**
 * Enhanced error logger with context
 */
export function logError(error: DeFiError, context: { 
  protocol?: string
  action?: string
  userAddress?: string
  additional?: Record<string, unknown>
} = {}) {
  console.error('DeFi Error:', {
    type: error.type,
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    stack: error.originalError?.stack,
  })
}

/**
 * Retry function with exponential backoff for retryable errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const parsedError = parseError(error)
      
      // Don't retry if error is not retryable
      if (!parsedError.retryable || attempt === maxRetries) {
        throw error
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Safe transaction wrapper with comprehensive error handling
 */
export async function safeTransaction<T>(
  transactionFn: () => Promise<T>,
  context: {
    protocol: string
    action: string
    userAddress?: string
  }
): Promise<{ success: true; data: T } | { success: false; error: DeFiError }> {
  try {
    const result = await retryWithBackoff(transactionFn, 2, 1000)
    return { success: true, data: result }
  } catch (error) {
    const parsedError = parseError(error)
    logError(parsedError, context)
    return { success: false, error: parsedError }
  }
}

/**
 * Validate transaction inputs before execution
 */
export function validateTransactionInputs(params: {
  amount?: bigint
  userAddress?: string
  assetAddress?: string
}): DeFiError | null {
  if (!params.userAddress) {
    return {
      type: ErrorType.WALLET_NOT_CONNECTED,
      message: 'No user address provided',
      userMessage: 'Please connect your wallet first.',
      recoverable: true,
      retryable: true,
    }
  }

  if (params.amount !== undefined && params.amount <= 0n) {
    return {
      type: ErrorType.CONTRACT_ERROR,
      message: 'Invalid amount: must be greater than 0',
      userMessage: 'Please enter a valid amount greater than 0.',
      recoverable: true,
      retryable: false,
    }
  }

  if (params.assetAddress && params.assetAddress === '0x0000000000000000000000000000000000000000') {
    return {
      type: ErrorType.CONTRACT_ERROR,
      message: 'Invalid asset address',
      userMessage: 'Invalid token selected.',
      recoverable: true,
      retryable: false,
    }
  }

  return null
}