# Onramp Setup Guide

## What's Been Added

✅ **Privy Integration**: Added Privy SDK for easy wallet creation and onramp functionality
✅ **Apple Pay Support**: Users can buy crypto with Apple Pay, Google Pay, or debit cards
✅ **Automatic Wallet Creation**: No need for users to have existing wallets
✅ **Smart Onramp Button**: Shows when users don't have sufficient balance

## How to Test Onramp Functionality

### 1. **Current State (Without Privy Setup)**
- The app works normally with existing wallet connections
- Onramp button shows "Connect Wallet First" message
- No onramp functionality until Privy is configured

### 2. **To Enable Full Onramp Functionality**

#### Step 1: Get Privy App ID
1. Go to [https://dashboard.privy.io/](https://dashboard.privy.io/)
2. Create a new app or use existing one
3. Copy your App ID (looks like `clx1234567890abcdef`)

#### Step 2: Set Environment Variable
Create `.env.local` file in project root:
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-actual-app-id-here
```

#### Step 3: Test the Flow
1. Start the app: `npm run dev`
2. Click "Connect Wallet" - now uses Privy
3. Sign in with email/Google/Apple
4. Try to deposit more than your balance
5. Onramp button appears with "Buy with Apple Pay" option

### 3. **Testing Scenarios**

#### Scenario 1: User with No Wallet
1. Click "Connect Wallet"
2. Choose email/Google/Apple login
3. Privy creates embedded wallet automatically
4. User can now use onramp to fund wallet

#### Scenario 2: User with Insufficient Balance
1. Connect existing wallet
2. Try to deposit 100 DAI when you have 0 DAI
3. Onramp button appears
4. Click "Buy DAI with Apple Pay"
5. Complete purchase through Privy's onramp

#### Scenario 3: User with Sufficient Balance
1. Connect wallet with DAI balance
2. Deposit works normally
3. No onramp button shown

## Features

### 🍎 **Apple Pay Integration**
- Native Apple Pay support on iOS/macOS
- Seamless checkout experience
- No additional setup required

### 💳 **Card Payments**
- Debit/credit card support
- Google Pay integration
- Multiple payment providers (MoonPay, Coinbase)

### 🔐 **Security**
- Non-custodial wallets
- User controls private keys
- Secure authentication

### 🚀 **User Experience**
- One-click wallet creation
- Instant funding
- No crypto knowledge required

## Current Limitations

- **Mainnet Only**: Onramp only works on Ethereum mainnet
- **Privy App ID Required**: Need to configure environment variable
- **Dependency Conflicts**: Using `--legacy-peer-deps` for now

## Next Steps

1. **Get Privy App ID** from dashboard
2. **Set environment variable**
3. **Test onramp flow**
4. **Deploy with proper configuration**

The onramp functionality is ready to test once you have a Privy App ID!
