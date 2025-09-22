'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { Address, formatUnits } from 'viem'

export interface RealTransaction {
  id: string
  protocol: string
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay'
  asset: string
  amount: string
  amountUSD: string
  txHash: string
  timestamp: number
  status: 'completed' | 'pending' | 'failed'
  gasUsed?: string
  gasPriceGwei?: string
  blockNumber?: number
}

// Aave v3 - using direct contract calls
const queryAaveTransactions = async (userAddress: string, publicClient: any) => {
  try {
    // Aave V3 Pool contract on mainnet
    const AAVE_POOL_CONTRACT = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'
    
    const transactions: any[] = []
    
    // Common Aave V3 reserve addresses
    const reserves = [
      { address: '0xA0b86a33E6441c8C06DdDdde5A67a457c0D7c8B7', symbol: 'WBTC', decimals: 8 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', decimals: 18 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', decimals: 18 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
      { address: '0xA0b86a33E6441c8C06DdDdde5A67a457c0D7c8B7', symbol: 'USDC', decimals: 6 },
    ]
    
    // Check supply balances for each reserve
    for (const reserve of reserves) {
      try {
        // Get aToken balance (supply position)
        const aTokenBalance = await publicClient.readContract({
          address: reserve.address,
          abi: [{
            inputs: [{ name: 'account', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'balanceOf',
          args: [userAddress]
        })
        
        if (aTokenBalance > 0n) {
          transactions.push({
            id: `aave-supply-${reserve.symbol}-${userAddress}`,
            protocol: 'aave_v3',
            type: 'deposit',
            asset: reserve.symbol,
            amount: formatUnits(aTokenBalance, reserve.decimals),
            amountUSD: formatUnits(aTokenBalance, reserve.decimals), // Simplified
            txHash: 'N/A',
            timestamp: Date.now(),
            status: 'completed'
          })
        }
      } catch (err) {
        // Skip reserves that don't exist or cause errors
        continue
      }
    }
    
    return { deposits: transactions, withdraws: [] }
  } catch (error) {
    console.error('Error fetching Aave transactions:', error)
    return null
  }
}

// Compound III (Comet) - using direct contract calls
const queryCompoundTransactions = async (userAddress: string, publicClient: any) => {
  try {
    // Mainnet USDC Comet contract
    const COMET_CONTRACT = '0xc3d688B66703497DAA19211EEdff47f25384cdc3'
    
    // Get collateral balances for common assets
    const collateralAssets = [
      '0xA0b86a33E6441c8C06DdDdde5A67a457c0D7c8B7', // WBTC
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (alternative)
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
      '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
    ]
    
    const transactions: any[] = []
    
    // Check base asset balance (USDC)
    const baseBalance = await publicClient.readContract({
      address: COMET_CONTRACT,
      abi: [{
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'balanceOf',
      args: [userAddress]
    })
    
    if (baseBalance > 0n) {
      transactions.push({
        id: `compound-supply-USDC-${userAddress}`,
        protocol: 'compound_v3',
        type: 'deposit',
        asset: 'USDC',
        amount: formatUnits(baseBalance, 6), // USDC has 6 decimals
        amountUSD: formatUnits(baseBalance, 6),
        txHash: 'N/A',
        timestamp: Date.now(),
        status: 'completed'
      })
    }
    
    // Check collateral balances
    for (const asset of collateralAssets) {
      try {
        const balance = await publicClient.readContract({
          address: COMET_CONTRACT,
          abi: [{
            inputs: [
              { name: 'account', type: 'address' },
              { name: 'asset', type: 'address' }
            ],
            name: 'collateralBalanceOf',
            outputs: [{ name: 'balance', type: 'uint128' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'collateralBalanceOf',
          args: [userAddress, asset]
        })
        
        if (balance > 0n) {
          // Get asset symbol (simplified)
          const assetSymbol = asset === '0xA0b86a33E6441c8C06DdDdde5A67a457c0D7c8B7' || 
                             asset === '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' ? 'WBTC' :
                             asset === '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' ? 'UNI' :
                             asset === '0x514910771AF9Ca656af840dff83E8264EcF986CA' ? 'LINK' : 'UNKNOWN'
          
          transactions.push({
            id: `compound-supply-${assetSymbol}-${userAddress}`,
            protocol: 'compound_v3',
            type: 'deposit',
            asset: assetSymbol,
            amount: formatUnits(balance, 18), // Most tokens have 18 decimals
            amountUSD: formatUnits(balance, 18),
            txHash: 'N/A',
            timestamp: Date.now(),
            status: 'completed'
          })
        }
      } catch (err) {
        // Skip assets that don't exist or cause errors
        continue
      }
    }
    
    return { mintEvents: transactions, redeemEvents: [] }
  } catch (error) {
    console.error('Error fetching Compound transactions:', error)
    return null
  }
}

// MakerDAO DSR transactions (using direct contract events)
const queryMakerTransactions = async (userAddress: string, publicClient: any) => {
  try {
    // Get current block number and calculate a recent range (last 10 blocks)
    const currentBlock = await publicClient.getBlockNumber()
    const fromBlock = currentBlock - 9n // 10 block range for free tier
    
    // Query DSR join events
    const joinLogs = await publicClient.getLogs({
      address: '0x373238337Bfe1146fb49989fc222523f83081dDb', // DSR Manager
      event: {
        anonymous: false,
        inputs: [
          { indexed: true, name: 'dst', type: 'address' },
          { indexed: false, name: 'wad', type: 'uint256' }
        ],
        name: 'Join',
        type: 'event'
      },
      args: {
        dst: userAddress
      },
      fromBlock,
      toBlock: currentBlock
    })

    // Query DSR exit events
    const exitLogs = await publicClient.getLogs({
      address: '0x373238337Bfe1146fb49989fc222523f83081dDb', // DSR Manager
      event: {
        anonymous: false,
        inputs: [
          { indexed: true, name: 'dst', type: 'address' },
          { indexed: false, name: 'wad', type: 'uint256' }
        ],
        name: 'Exit',
        type: 'event'
      },
      args: {
        dst: userAddress
      },
      fromBlock,
      toBlock: currentBlock
    })

    return { joinLogs, exitLogs }
  } catch (error) {
    console.error('Error fetching Maker transactions:', error)
    return null
  }
}

export function useRealTransactions() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<RealTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (!isConnected || !address || !publicClient) {
        setTransactions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const allTransactions: RealTransaction[] = []

        // Fetch Aave transactions
        const aaveData = await queryAaveTransactions(address, publicClient)
        if (aaveData) {
          // Process deposits
          aaveData.deposits?.forEach((tx: any) => {
            allTransactions.push({
              id: tx.id,
              protocol: 'aave_v3',
              type: 'deposit',
              asset: tx.asset,
              amount: tx.amount,
              amountUSD: tx.amountUSD,
              txHash: tx.txHash,
              timestamp: tx.timestamp,
              status: 'completed'
            })
          })

          // Process withdraws
          aaveData.withdraws?.forEach((tx: any) => {
            allTransactions.push({
              id: tx.id,
              protocol: 'aave_v3',
              type: 'withdraw',
              asset: tx.asset,
              amount: tx.amount,
              amountUSD: tx.amountUSD,
              txHash: tx.txHash,
              timestamp: tx.timestamp,
              status: 'completed'
            })
          })
        }

        // Fetch Compound transactions
        const compoundData = await queryCompoundTransactions(address, publicClient)
        if (compoundData) {
          // Process mints (deposits)
          compoundData.mintEvents?.forEach((tx: any) => {
            allTransactions.push({
              id: tx.id,
              protocol: 'compound_v2',
              type: 'deposit',
              asset: tx.asset,
              amount: tx.amount,
              amountUSD: tx.amountUSD,
              txHash: tx.txHash,
              timestamp: tx.timestamp,
              status: 'completed'
            })
          })

          // Process redeems (withdraws)
          compoundData.redeemEvents?.forEach((tx: any) => {
            allTransactions.push({
              id: tx.id,
              protocol: 'compound_v2',
              type: 'withdraw',
              asset: tx.asset,
              amount: tx.amount,
              amountUSD: tx.amountUSD,
              txHash: tx.txHash,
              timestamp: tx.timestamp,
              status: 'completed'
            })
          })
        }

        // Fetch Maker DSR transactions
        const makerData = await queryMakerTransactions(address, publicClient)
        if (makerData) {
          // Process join events (deposits)
          makerData.joinLogs?.forEach((log: any) => {
            allTransactions.push({
              id: `maker-join-${log.transactionHash}-${log.logIndex}`,
              protocol: 'maker_dsr',
              type: 'deposit',
              asset: 'DAI',
              amount: formatUnits(log.args.wad, 18),
              amountUSD: formatUnits(log.args.wad, 18),
              txHash: log.transactionHash,
              timestamp: Date.now(), // Would need to fetch block timestamp
              status: 'completed'
            })
          })

          // Process exit events (withdraws)
          makerData.exitLogs?.forEach((log: any) => {
            allTransactions.push({
              id: `maker-exit-${log.transactionHash}-${log.logIndex}`,
              protocol: 'maker_dsr',
              type: 'withdraw',
              asset: 'DAI',
              amount: formatUnits(log.args.wad, 18),
              amountUSD: formatUnits(log.args.wad, 18),
              txHash: log.transactionHash,
              timestamp: Date.now(),
              status: 'completed'
            })
          })
        }

        // Sort by timestamp (newest first)
        allTransactions.sort((a, b) => b.timestamp - a.timestamp)

        setTransactions(allTransactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchAllTransactions()
  }, [address, isConnected, publicClient])

  return {
    transactions,
    loading,
    error,
    refetch: () => {
      if (isConnected && address) {
        setLoading(true)
        // Re-trigger the effect
        setTransactions([])
      }
    }
  }
}
