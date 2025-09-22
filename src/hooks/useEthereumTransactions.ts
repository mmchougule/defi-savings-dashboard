'use client'

import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { Address } from 'viem'

interface EthereumTransaction {
  hash: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  gasUsed: string
  timeStamp: string
  isError: string
  methodId: string
  functionName: string
  contractAddress: string
  input: string
  type: string
  tokenName?: string
  tokenSymbol?: string
  tokenDecimal?: string
}

interface TokenTransfer {
  blockNumber: string
  timeStamp: string
  hash: string
  nonce: string
  blockHash: string
  from: string
  contractAddress: string
  to: string
  value: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  transactionIndex: string
  gas: string
  gasPrice: string
  gasUsed: string
  cumulativeGasUsed: string
  input: string
  confirmations: string
}

interface EtherscanResponse<T> {
  status: string
  message: string
  result: T
}

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || 'YourApiKeyToken'
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api'

async function fetchEthereumTransactions(address: Address): Promise<EthereumTransaction[]> {
  const url = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`
  
  const response = await fetch(url)
  const data: EtherscanResponse<EthereumTransaction[]> = await response.json()
  
  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`)
  }
  
  return data.result
}

async function fetchTokenTransfers(address: Address): Promise<TokenTransfer[]> {
  const url = `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`
  
  const response = await fetch(url)
  const data: EtherscanResponse<TokenTransfer[]> = await response.json()
  
  if (data.status !== '1') {
    throw new Error(`Etherscan API error: ${data.message}`)
  }
  
  return data.result
}

export function useEthereumTransactions() {
  const { address, isConnected } = useAccount()

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['ethereumTransactions', address],
    queryFn: () => address ? fetchEthereumTransactions(address) : [],
    enabled: isConnected && !!address,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Consider stale after 10 seconds
  })

  const { data: tokenTransfers = [], isLoading: tokenTransfersLoading } = useQuery({
    queryKey: ['tokenTransfers', address],
    queryFn: () => address ? fetchTokenTransfers(address) : [],
    enabled: isConnected && !!address,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 10 * 1000, // Consider stale after 10 seconds
  })

  // Combine and format transactions
  const allTransactions = [
    ...transactions.map(tx => ({
      hash: tx.hash,
      type: 'eth_transfer',
      asset: 'ETH',
      amount: (parseInt(tx.value) / 1e18).toFixed(6),
      status: tx.isError === '0' ? 'success' : 'failed',
      timestamp: parseInt(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      functionName: tx.functionName,
    })),
    ...tokenTransfers.map(tx => ({
      hash: tx.hash,
      type: 'token_transfer',
      asset: tx.tokenSymbol,
      amount: (parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(6),
      status: 'success', // Token transfers don't have isError field
      timestamp: parseInt(tx.timeStamp) * 1000,
      from: tx.from,
      to: tx.to,
      contractAddress: tx.contractAddress,
      tokenName: tx.tokenName,
    }))
  ].sort((a, b) => b.timestamp - a.timestamp)

  return {
    transactions: allTransactions,
    isLoading: transactionsLoading || tokenTransfersLoading,
    refetch: () => {
      // This will be handled by the query invalidation
    }
  }
}
