import { formatUnits } from 'viem'

export interface InterestData {
  principal: bigint
  currentBalance: bigint
  apy: number
  timeElapsed: number // in seconds
  projectedEarnings24h: number // in USD
  projectedEarnings30d: number // in USD
  projectedEarnings1y: number // in USD
  currentEarnings: number // in USD
}

export interface AccrualCalculation {
  balance: bigint
  earnings: bigint
  earningsUSD: number
  apy: number
  dailyRate: number
  projections: {
    daily: number
    monthly: number
    yearly: number
  }
}

export class InterestCalculator {
  /**
   * Calculate compound interest accrual for DeFi positions
   */
  static calculateAccrual(
    principal: bigint,
    apy: number,
    timeElapsedSeconds: number,
    decimals: number,
    tokenPriceUSD: number = 0
  ): AccrualCalculation {
    // Convert APY to decimal
    const apyDecimal = apy / 100

    // Calculate compound interest
    // A = P(1 + r/n)^(nt) where n = 365.25 * 24 * 3600 (compounding per second)
    const timeElapsedYears = timeElapsedSeconds / (365.25 * 24 * 3600)
    const compoundFactor = Math.pow(1 + apyDecimal, timeElapsedYears)
    
    const principalFormatted = parseFloat(formatUnits(principal, decimals))
    const currentBalance = principalFormatted * compoundFactor
    const earnings = currentBalance - principalFormatted
    
    // Convert back to bigint
    const currentBalanceBigInt = BigInt(Math.floor(currentBalance * Math.pow(10, decimals)))
    const earningsBigInt = currentBalanceBigInt - principal

    // Calculate daily rate for projections
    const dailyRate = Math.pow(1 + apyDecimal, 1/365.25) - 1

    // Calculate projections
    const projections = {
      daily: principalFormatted * dailyRate * tokenPriceUSD,
      monthly: principalFormatted * (Math.pow(1 + apyDecimal, 1/12) - 1) * tokenPriceUSD,
      yearly: principalFormatted * apyDecimal * tokenPriceUSD,
    }

    return {
      balance: currentBalanceBigInt,
      earnings: earningsBigInt,
      earningsUSD: earnings * tokenPriceUSD,
      apy,
      dailyRate: dailyRate * 100,
      projections,
    }
  }

  /**
   * Calculate real-time APY based on current rates
   */
  static calculateRealTimeAPY(
    supplyRate: bigint,
    rateDecimals: number = 27 // Ray format for Aave
  ): number {
    // Convert rate to decimal
    const rateDecimal = parseFloat(formatUnits(supplyRate, rateDecimals))
    
    // Convert to APY (compound interest formula)
    // APY = (1 + rate)^365.25 - 1 for daily compounding
    // For protocols that compound continuously, use e^rate - 1
    const apy = (Math.pow(1 + rateDecimal / 365.25, 365.25) - 1) * 100
    
    return Math.max(0, apy) // Ensure non-negative
  }

  /**
   * Calculate time-weighted returns for portfolio tracking
   */
  static calculateTimeWeightedReturn(
    positions: Array<{
      principal: bigint
      currentBalance: bigint
      timeHeld: number // in seconds
      decimals: number
    }>
  ): {
    totalReturn: number
    annualizedReturn: number
    totalPrincipal: number
    totalCurrent: number
  } {
    let totalPrincipal = 0
    let totalCurrent = 0
    let weightedReturn = 0

    for (const position of positions) {
      const principal = parseFloat(formatUnits(position.principal, position.decimals))
      const current = parseFloat(formatUnits(position.currentBalance, position.decimals))
      const timeYears = position.timeHeld / (365.25 * 24 * 3600)
      
      const positionReturn = timeYears > 0 ? (current - principal) / principal : 0
      const weight = principal
      
      totalPrincipal += principal
      totalCurrent += current
      weightedReturn += positionReturn * weight
    }

    const overallReturn = totalPrincipal > 0 ? (totalCurrent - totalPrincipal) / totalPrincipal : 0
    const avgTimeYears = positions.reduce((sum, pos) => 
      sum + (pos.timeHeld / (365.25 * 24 * 3600)), 0) / positions.length
    
    const annualizedReturn = avgTimeYears > 0 ? 
      Math.pow(1 + overallReturn, 1 / avgTimeYears) - 1 : 0

    return {
      totalReturn: overallReturn * 100,
      annualizedReturn: annualizedReturn * 100,
      totalPrincipal,
      totalCurrent,
    }
  }

  /**
   * Calculate optimal yield strategy suggestions
   */
  static suggestOptimalYield(
    protocols: Array<{
      name: string
      apy: number
      tvl: number
      riskScore: number // 1-10, 1 being safest
      gasEstimate: number // in USD
    }>,
    amount: number, // in USD
    riskTolerance: number = 5 // 1-10, 5 being moderate
  ): Array<{
    protocol: string
    allocation: number // percentage
    expectedYield: number // in USD
    riskAdjustedYield: number
    reasoning: string
  }> {
    // Filter protocols by risk tolerance
    const suitableProtocols = protocols.filter(p => p.riskScore <= riskTolerance)
    
    if (suitableProtocols.length === 0) {
      return []
    }

    // Calculate risk-adjusted yields
    const rankedProtocols = suitableProtocols.map(protocol => {
      const netYield = (amount * protocol.apy / 100) - protocol.gasEstimate
      const riskAdjustment = 1 - (protocol.riskScore - 1) / 20 // Reduce yield based on risk
      const riskAdjustedYield = netYield * riskAdjustment
      
      return {
        ...protocol,
        netYield,
        riskAdjustedYield,
      }
    }).sort((a, b) => b.riskAdjustedYield - a.riskAdjustedYield)

    // Suggest allocation strategy
    const suggestions = rankedProtocols.slice(0, 3).map((protocol, index) => {
      let allocation: number
      let reasoning: string

      if (amount < 1000) {
        // Small amounts: single protocol to minimize gas
        allocation = index === 0 ? 100 : 0
        reasoning = index === 0 ? 
          'Optimal single protocol for small amount to minimize gas costs' :
          'Excluded to minimize gas costs'
      } else if (amount < 10000) {
        // Medium amounts: 70/30 split
        allocation = index === 0 ? 70 : (index === 1 ? 30 : 0)
        reasoning = index === 0 ? 
          'Primary allocation to highest yield protocol' :
          index === 1 ? 'Secondary allocation for diversification' :
          'Excluded for focused strategy'
      } else {
        // Large amounts: diversified approach
        const allocations = [50, 30, 20]
        allocation = allocations[index] || 0
        reasoning = index === 0 ? 
          'Primary allocation with best risk-adjusted yield' :
          'Diversification across top-performing protocols'
      }

      return {
        protocol: protocol.name,
        allocation,
        expectedYield: (amount * allocation / 100 * protocol.apy / 100),
        riskAdjustedYield: protocol.riskAdjustedYield,
        reasoning,
      }
    })

    return suggestions.filter(s => s.allocation > 0)
  }

  /**
   * Calculate impermanent loss for liquidity positions (if needed for LP tokens)
   */
  static calculateImpermanentLoss(
    initialPriceRatio: number,
    currentPriceRatio: number
  ): number {
    const ratio = currentPriceRatio / initialPriceRatio
    const impermanentLoss = 2 * Math.sqrt(ratio) / (1 + ratio) - 1
    return Math.abs(impermanentLoss) * 100
  }
}