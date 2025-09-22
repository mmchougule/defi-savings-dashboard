import { http, fallback } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

// Ethereum mainnet RPC URLs (primary focus)
const MAINNET_RPC_URLS = [
  process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/BOuJT3bCIOT2Sq9TMp4gK',
  'https://ethereum.publicnode.com',
  'https://rpc.ankr.com/eth',
]

const SEPOLIA_RPC_URLS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
]

// Create fallback transports for better reliability
export const optimizedTransports = {
  [mainnet.id]: fallback(
    MAINNET_RPC_URLS.map(url => http(url, {
      batch: true,
      timeout: 10000,
      retryCount: 2,
      retryDelay: 1000,
    }))
  ),
  [sepolia.id]: fallback(
    SEPOLIA_RPC_URLS.map(url => http(url, {
      batch: true,
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
    }))
  ),
}

// Batch configuration for reducing RPC calls
export const batchConfig = {
  multicall: {
    batchSize: 1024,
    wait: 16, // 16ms batching delay
  },
}

// Conservative rate limiting for Alchemy
export const rateLimitConfig = {
  maxRequestsPerSecond: 2, // Very conservative - 2 requests per second max
  maxConcurrentRequests: 2, // Only 2 concurrent requests
  batchDelay: 500, // 500ms delay between batches
}

// Custom error handling for RPC calls
export class RpcError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'RpcError'
  }
}

// RPC call wrapper with retry logic and error handling
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (error instanceof RpcError && [400, 404, 422].includes(error.code || 0)) {
        throw error
      }
      
      if (attempt === maxRetries) {
        break
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }
  
  throw lastError!
}

// Request deduplication to prevent duplicate calls
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>()
  
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }
    
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
  
  clear(): void {
    this.pendingRequests.clear()
  }
}

export const requestDeduplicator = new RequestDeduplicator()

// Cache for frequently accessed data
class DataCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  
  set(key: string, data: unknown, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })
  }
  
  get(key: string): unknown | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Clean expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const dataCache = new DataCache()

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  dataCache.cleanup()
}, 5 * 60 * 1000)

// Optimized RPC call function
export async function optimizedRpcCall<T>(
  key: string,
  fn: () => Promise<T>,
  cacheTtl: number = 60000,
  enableDeduplication: boolean = true
): Promise<T> {
  // Check cache first
  const cached = dataCache.get(key)
  if (cached !== null) {
    return cached
  }
  
  // Deduplicate if enabled
  const execute = enableDeduplication 
    ? () => requestDeduplicator.dedupe(key, fn)
    : fn
  
  // Execute with retry logic
  const result = await withRetry(execute, 3, 1000)
  
  // Cache the result
  dataCache.set(key, result, cacheTtl)
  
  return result
}