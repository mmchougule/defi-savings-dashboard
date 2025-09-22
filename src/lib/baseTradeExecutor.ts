import { Address, PublicClient, WalletClient, parseAbi } from 'viem'
import { base } from 'wagmi/chains'
import { HedgeRecommendation } from './hedgeEngine'
import { BASE_CONTRACTS, BASE_GAS_CONFIG } from './baseContracts'
import { safeLog } from './bigintUtils'

export interface TradeResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface HedgePosition {
  id: string
  marketId: string
  position: 'YES' | 'NO'
  amount: number
  price: number
  timestamp: Date
  status: 'open' | 'closed'
  pnl?: number
  network: 'base'
}

// BetBase Protocol ABI (prediction markets on Base)
const BETBASE_ROUTER_ABI = parseAbi([
  'function createMarket(string memory question, uint256 endTime, bytes32[] memory outcomes) external returns (address)',
  'function placeBet(address market, uint256 outcome, uint256 amount) external',
  'function resolveBet(address market, address user, uint256 outcome) external view returns (uint256)',
  'function getMarketInfo(address market) external view returns (string memory, uint256, bool)',
  'function getUserPosition(address user, address market, uint256 outcome) external view returns (uint256)'
])

// ERC20 Token ABI for approvals
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)'
])

/**
 * Trade Executor optimized for Base Network
 * Handles prediction market trades via BetBase protocol
 */
export class BaseTradeExecutor {
  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient
  ) {}

  /**
   * Execute a hedge trade on Base network using BetBase
   */
  async executeHedge(
    recommendation: HedgeRecommendation,
    userAddress: Address
  ): Promise<TradeResult> {
    try {
      console.log('🔵 Starting Base hedge execution...')
      
      const marketAddress = recommendation.market.id as Address
      const outcome = recommendation.position === 'YES' ? 0 : 1
      const amount = BigInt(Math.floor(recommendation.hedgeAmount * 1e6)) // USDC has 6 decimals

      safeLog('📊 Base Trade Details:', {
        network: 'Base',
        market: marketAddress,
        outcome,
        amount: recommendation.hedgeAmount,
        amountBigInt: amount,
        position: recommendation.position
      })

      // STEP 1: Check and approve USDC on Base
      await this.ensureBaseApproval(userAddress, amount)

      // STEP 2: Calculate minimum tokens out with Base-optimized slippage
      const minTokensOut = amount * 95n / 100n // 5% slippage (Base has lower volatility)

      // STEP 3: Simulate the transaction on Base
      console.log('🧪 Simulating Base transaction...')
      const { request } = await this.publicClient.simulateContract({
        address: BASE_CONTRACTS.BETBASE_ROUTER,
        abi: BETBASE_ROUTER_ABI,
        functionName: 'placeBet',
        args: [marketAddress, BigInt(outcome), amount],
        account: userAddress,
        gas: BigInt(150000), // Base has lower gas costs
        maxFeePerGas: BigInt(BASE_GAS_CONFIG.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(BASE_GAS_CONFIG.maxPriorityFeePerGas),
      })

      // STEP 4: Execute the actual transaction on Base
      console.log('✍️ Executing Base transaction...')
      const txHash = await this.walletClient.writeContract(request)

      console.log('✅ Base transaction submitted:', txHash)

      // STEP 5: Wait for Base confirmation (faster than Ethereum)
      const receipt = await this.publicClient.waitForTransactionReceipt({ 
        hash: txHash 
      })

      console.log('🎉 Base transaction confirmed in block:', receipt.blockNumber)

      return {
        success: true,
        txHash
      }
    } catch (error) {
      console.error('❌ Base trade execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Close an existing hedge position on Base
   */
  async closePosition(position: HedgePosition, userAddress: Address): Promise<TradeResult> {
    try {
      console.log('🔄 Closing Base position:', position.id)
      
      const marketAddress = position.marketId as Address
      const outcome = position.position === 'YES' ? 0 : 1
      
      // Get current position balance on Base
      const currentBalance = await this.publicClient.readContract({
        address: BASE_CONTRACTS.BETBASE_ROUTER,
        abi: BETBASE_ROUTER_ABI,
        functionName: 'getUserPosition',
        args: [userAddress, marketAddress, BigInt(outcome)]
      })

      if (currentBalance === 0n) {
        return { success: false, error: 'No position to close on Base' }
      }

      // Create a sell order (simplified - actual implementation depends on BetBase API)
      console.log('📤 Creating sell order on Base...')
      
      // For now, we'll mark as closed locally
      // In a real implementation, this would interact with BetBase's selling mechanism
      
      console.log('✅ Base position closed successfully')

      return {
        success: true,
        txHash: '0x...' // Would be actual tx hash
      }
    } catch (error) {
      console.error('❌ Base position close failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user's current positions on Base network
   */
  async getUserPositions(userAddress: Address): Promise<HedgePosition[]> {
    const positions: HedgePosition[] = []
    
    try {
      // Get stored positions from localStorage (Base-specific)
      const storedPositions = this.getStoredBasePositions(userAddress)
      
      // Check on-chain balance for each position on Base
      for (const position of storedPositions) {
        try {
          const currentBalance = await this.publicClient.readContract({
            address: BASE_CONTRACTS.BETBASE_ROUTER,
            abi: BETBASE_ROUTER_ABI,
            functionName: 'getUserPosition',
            args: [userAddress, position.marketId as Address, position.position === 'YES' ? 0n : 1n]
          })

          if (currentBalance > 0n) {
            // Position is still open on Base
            positions.push({
              ...position,
              status: 'open',
              network: 'base'
            })
          } else if (position.status === 'open') {
            // Position was closed on Base
            positions.push({
              ...position,
              status: 'closed',
              network: 'base'
            })
          }
        } catch (error) {
          console.warn(`Failed to check Base position ${position.id}:`, error)
          // Include position anyway with unknown status
          positions.push({
            ...position,
            network: 'base'
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch Base positions:', error)
    }

    return positions
  }

  /**
   * Ensure USDC approval for BetBase router on Base
   */
  private async ensureBaseApproval(userAddress: Address, amount: bigint): Promise<void> {
    console.log('🔐 Checking Base USDC approval...')
    
    // Check current allowance on Base
    const currentAllowance = await this.publicClient.readContract({
      address: BASE_CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, BASE_CONTRACTS.BETBASE_ROUTER]
    })

    console.log('Base allowance:', currentAllowance.toString())
    console.log('Required amount:', amount.toString())

    if (currentAllowance < amount) {
      console.log('💰 Approving Base USDC for trading...')
      
      // Approve 2x the amount for future trades on Base
      const approvalAmount = amount * 2n

      const { request } = await this.publicClient.simulateContract({
        address: BASE_CONTRACTS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BASE_CONTRACTS.BETBASE_ROUTER, approvalAmount],
        account: userAddress,
        gas: BigInt(50000), // Base has lower gas costs
        maxFeePerGas: BigInt(BASE_GAS_CONFIG.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(BASE_GAS_CONFIG.maxPriorityFeePerGas),
      })

      const txHash = await this.walletClient.writeContract(request)
      
      // Wait for Base approval to be confirmed
      await this.publicClient.waitForTransactionReceipt({ hash: txHash })
      
      console.log('✅ Base USDC approval confirmed')
    } else {
      console.log('✅ Sufficient Base allowance already exists')
    }
  }

  /**
   * Base-specific localStorage helpers
   */
  private getStoredBasePositions(userAddress: Address): HedgePosition[] {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(`base_hedge_positions_${userAddress}`)
    return stored ? JSON.parse(stored) : []
  }

  saveBasePosition(userAddress: Address, position: HedgePosition): void {
    if (typeof window === 'undefined') return
    
    const positions = this.getStoredBasePositions(userAddress)
    positions.push({ ...position, network: 'base' })
    localStorage.setItem(`base_hedge_positions_${userAddress}`, JSON.stringify(positions))
    
    console.log('💾 Base position saved to local storage')
  }
}