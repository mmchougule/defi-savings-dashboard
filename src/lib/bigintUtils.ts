/**
 * Utility functions for handling BigInt serialization/deserialization
 */

/**
 * JSON replacer function to handle BigInt serialization
 */
export function bigintReplacer(key: string, value: any): any {
  if (typeof value === 'bigint') {
    return {
      __type: 'bigint',
      value: value.toString()
    }
  }
  return value
}

/**
 * JSON reviver function to handle BigInt deserialization
 */
export function bigintReviver(key: string, value: any): any {
  if (typeof value === 'object' && value !== null && value.__type === 'bigint') {
    return BigInt(value.value)
  }
  return value
}

/**
 * Safe JSON.stringify that handles BigInt values
 */
export function safeBigintStringify(obj: any): string {
  return JSON.stringify(obj, bigintReplacer)
}

/**
 * Safe JSON.parse that handles BigInt values
 */
export function safeBigintParse<T = any>(str: string): T {
  return JSON.parse(str, bigintReviver)
}

/**
 * Convert BigInt values in an object to strings for logging
 */
export function bigintToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  if (Array.isArray(obj)) {
    return obj.map(bigintToString)
  }
  if (obj && typeof obj === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = bigintToString(value)
    }
    return result
  }
  return obj
}

/**
 * Safe console.log that converts BigInt values to strings
 */
export function safeLog(message: string, obj?: any): void {
  if (obj !== undefined) {
    console.log(message, bigintToString(obj))
  } else {
    console.log(message)
  }
}
