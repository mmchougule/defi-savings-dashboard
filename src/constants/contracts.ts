import { Address } from 'viem'
import { ProtocolConfig } from '@/types/contracts'

// Ethereum Mainnet Contract Addresses
export const CONTRACT_ADDRESSES = {
  // Aave v3 (Ethereum Mainnet)
  AAVE_V3_POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as Address,
  AAVE_V3_POOL_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as Address,
  AAVE_V3_PRICE_ORACLE: '0x54586bE62E3c3580375aE3723C145253060Ca0C2' as Address,
  
  // Compound v3 (Ethereum Mainnet)
  COMPOUND_V3_USDC: '0xc3d688B66703497DAA19211EEdff47f25384cdc3' as Address,
  COMPOUND_V3_WETH: '0xA17581A9E3356d9A858b789D68B4d866e593aE94' as Address,
  
  // Compound v2 cTokens (Ethereum Mainnet)
  CUSDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563' as Address,
  CUSDT: '0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9' as Address,
  CDAI: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643' as Address,
  CETH: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5' as Address,
  CWBTC: '0xccF4429DB6322D5C611ee964527D42E5d685DD6a' as Address,
  
  // Maker DSR (Ethereum Mainnet)
  MAKER_DSR_MANAGER: '0x373238337Bfe1146fb49989fc222523f83081dDb' as Address,
  MAKER_POT: '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7' as Address,
  
  // ERC20 Tokens (Ethereum Mainnet) - Proper EIP-55 checksummed addresses
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as Address,
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address,
}

// Aave v3 aTokens (Ethereum Mainnet)
export const AAVE_V3_ATOKENS = {
  aUSDC: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c' as Address,
  aUSDT: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a' as Address,
  aDAI: '0x018008bfb33d285247A21d44E50697654f754e63' as Address,
  aWETH: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8' as Address,
  aWBTC: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8' as Address,
}

// Protocol configurations
export const PROTOCOLS: Record<string, ProtocolConfig> = {
  AAVE_V3: {
    name: 'aave_v3',
    displayName: 'Aave v3',
    description: 'Decentralized lending and borrowing protocol',
    icon: '/icons/aave.svg',
    website: 'https://aave.com',
    contracts: {
      pool: CONTRACT_ADDRESSES.AAVE_V3_POOL,
      dataProvider: CONTRACT_ADDRESSES.AAVE_V3_POOL_DATA_PROVIDER,
      priceOracle: CONTRACT_ADDRESSES.AAVE_V3_PRICE_ORACLE,
    },
    supportedAssets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: CONTRACT_ADDRESSES.USDC,
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: CONTRACT_ADDRESSES.USDT,
        decimals: 6,
        icon: '/icons/usdt.svg',
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: CONTRACT_ADDRESSES.DAI,
        decimals: 18,
        icon: '/icons/dai.svg',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: CONTRACT_ADDRESSES.WETH,
        decimals: 18,
        icon: '/icons/weth.svg',
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: CONTRACT_ADDRESSES.WBTC,
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
    ],
  },
  COMPOUND_V3: {
    name: 'compound_v3',
    displayName: 'Compound v3',
    description: 'Capital efficient money markets',
    icon: '/icons/compound.svg',
    website: 'https://compound.finance',
    contracts: {
      usdc: CONTRACT_ADDRESSES.COMPOUND_V3_USDC,
      weth: CONTRACT_ADDRESSES.COMPOUND_V3_WETH,
    },
    supportedAssets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: CONTRACT_ADDRESSES.USDC,
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: CONTRACT_ADDRESSES.WETH,
        decimals: 18,
        icon: '/icons/weth.svg',
      },
    ],
  },
  COMPOUND_V2: {
    name: 'compound_v2',
    displayName: 'Compound v2',
    description: 'Traditional cToken lending protocol',
    icon: '/icons/compound.svg',
    website: 'https://compound.finance',
    contracts: {
      cUSDC: CONTRACT_ADDRESSES.CUSDC,
      cUSDT: CONTRACT_ADDRESSES.CUSDT,
      cDAI: CONTRACT_ADDRESSES.CDAI,
      cETH: CONTRACT_ADDRESSES.CETH,
      cWBTC: CONTRACT_ADDRESSES.CWBTC,
    },
    supportedAssets: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: CONTRACT_ADDRESSES.USDC,
        decimals: 6,
        icon: '/icons/usdc.svg',
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: CONTRACT_ADDRESSES.USDT,
        decimals: 6,
        icon: '/icons/usdt.svg',
      },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: CONTRACT_ADDRESSES.DAI,
        decimals: 18,
        icon: '/icons/dai.svg',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: CONTRACT_ADDRESSES.WETH,
        decimals: 18,
        icon: '/icons/weth.svg',
      },
      {
        symbol: 'WBTC',
        name: 'Wrapped Bitcoin',
        address: CONTRACT_ADDRESSES.WBTC,
        decimals: 8,
        icon: '/icons/wbtc.svg',
      },
    ],
  },
  MAKER_DSR: {
    name: 'maker_dsr',
    displayName: 'Maker DSR',
    description: 'Dai Savings Rate from MakerDAO',
    icon: '/icons/maker.svg',
    website: 'https://makerdao.com',
    contracts: {
      dsrManager: CONTRACT_ADDRESSES.MAKER_DSR_MANAGER,
      pot: CONTRACT_ADDRESSES.MAKER_POT,
    },
    supportedAssets: [
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        address: CONTRACT_ADDRESSES.DAI,
        decimals: 18,
        icon: '/icons/dai.svg',
      },
    ],
  },
}