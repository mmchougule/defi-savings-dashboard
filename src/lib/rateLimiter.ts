/**
 * Rate limiter to prevent hammering the Alchemy RPC endpoint
 */
class RateLimiter {
  private queue: Array<() => void> = []
  private lastRequestTime = 0
  private isProcessing = false
  private readonly minInterval: number // Minimum time between requests in ms

  constructor(requestsPerSecond: number = 2) {
    this.minInterval = 1000 / requestsPerSecond // Convert to ms between requests
  }

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      
      if (timeSinceLastRequest < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastRequest
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      const nextTask = this.queue.shift()
      if (nextTask) {
        this.lastRequestTime = Date.now()
        await nextTask()
      }
    }

    this.isProcessing = false
  }

  clear() {
    this.queue = []
    this.isProcessing = false
  }

  getQueueLength() {
    return this.queue.length
  }
}

// Export a singleton instance
export const alchemyRateLimiter = new RateLimiter(2) // 2 requests per second max

// Wrapper function for Alchemy requests
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return alchemyRateLimiter.throttle(fn)
}