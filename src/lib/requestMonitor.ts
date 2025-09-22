/**
 * Request monitoring to track API usage and prevent abuse
 */
class RequestMonitor {
  private requestCount = 0
  private startTime = Date.now()
  private readonly maxRequestsPerMinute = 50 // Conservative limit
  private requestHistory: number[] = []

  logRequest(endpoint: string) {
    const now = Date.now()
    this.requestCount++
    this.requestHistory.push(now)
    
    // Clean old requests (older than 1 minute)
    this.requestHistory = this.requestHistory.filter(
      time => now - time < 60000
    )

    // Log every 10 requests for monitoring
    if (this.requestCount % 10 === 0) {
      console.log(`📊 API Usage: ${this.requestCount} total requests, ${this.requestHistory.length} in last minute to ${endpoint}`)
    }

    // Warn if approaching limit
    if (this.requestHistory.length > this.maxRequestsPerMinute * 0.8) {
      console.warn(`⚠️  Approaching rate limit: ${this.requestHistory.length}/${this.maxRequestsPerMinute} requests per minute`)
    }

    // Error if over limit
    if (this.requestHistory.length > this.maxRequestsPerMinute) {
      throw new Error(`🚨 Rate limit exceeded: ${this.requestHistory.length}/${this.maxRequestsPerMinute} requests per minute`)
    }
  }

  getStats() {
    const now = Date.now()
    const uptime = (now - this.startTime) / 1000 / 60 // minutes
    
    return {
      totalRequests: this.requestCount,
      requestsLastMinute: this.requestHistory.length,
      averageRequestsPerMinute: this.requestCount / Math.max(uptime, 1),
      uptime: Math.round(uptime * 100) / 100,
    }
  }

  reset() {
    this.requestCount = 0
    this.startTime = Date.now()
    this.requestHistory = []
  }
}

export const requestMonitor = new RequestMonitor()

// Wrapper to monitor requests
export function withRequestMonitoring<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  requestMonitor.logRequest(endpoint)
  return fn()
}