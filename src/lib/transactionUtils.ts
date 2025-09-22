/**
 * Transaction utilities for safe BigInt handling with OnchainKit
 */

import { bigintToString } from './bigintUtils'

export interface TransactionCall {
  to: `0x${string}`
  data: `0x${string}`
  value: `0x${string}`
}

/**
 * Transform transaction calls to ensure safe serialization for OnchainKit
 */
export function safeTransactionCalls(calls: any[]): any[] {
  return calls.map(call => ({
    to: call.to as `0x${string}`,
    data: call.data as `0x${string}`,
    // Ensure value is always a hex string
    value: (typeof call.value === 'bigint' 
      ? `0x${call.value.toString(16)}` 
      : call.value === "0x0" || call.value === "0" || call.value === "" 
        ? "0x0" 
        : call.value) as `0x${string}`
  }))
}

/**
 * Safe logging for transaction calls that may contain BigInt values
 */
export function logTransactionCalls(calls: TransactionCall[], message: string = 'Transaction calls'): void {
  console.log(message, bigintToString(calls))
}

/**
 * Validate transaction calls before passing to OnchainKit
 */
export function validateTransactionCalls(calls: TransactionCall[]): boolean {
  for (const call of calls) {
    // Check required fields
    if (!call.to || !call.data) {
      console.error('Invalid transaction call: missing to or data', call)
      return false
    }

    // Check if value is properly formatted
    if (typeof call.value === 'bigint') {
      console.warn('Transaction call contains BigInt value, converting to hex:', call)
    }

    // Validate addresses (should be checksummed)
    if (!/^0x[a-fA-F0-9]{40}$/.test(call.to)) {
      console.error('Invalid to address format:', call.to)
      return false
    }

    // Validate data is hex
    if (!/^0x[a-fA-F0-9]*$/.test(call.data)) {
      console.error('Invalid data format (not hex):', call.data)
      return false
    }
  }

  return true
}

/**
 * Helper to create a safe transaction call
 */
export function createTransactionCall(
  to: string,
  data: string,
  value: bigint | string = "0x0"
): TransactionCall {
  return {
    to: to as `0x${string}`,
    data: data as `0x${string}`,
    value: (typeof value === 'bigint' ? `0x${value.toString(16)}` : value) as `0x${string}`
  }
}
