# Hedge Agent - Prediction Market Portfolio Protection

A production-ready DeFi application that extends Vitalik's vision of prediction markets as hedging tools. This agent-powered hedge tool connects to user portfolios and suggests hedges via prediction markets.

## 🎯 Core Features

✅ **Wallet Connection & Portfolio Reading**
- Connects to any Ethereum wallet via WalletConnect
- Reads ETH and ERC-20 token balances (USDC, USDT, DAI, WETH)
- Real-time portfolio valuation using CoinGecko API

✅ **Prediction Market Integration**
- Integrates with Polymarket subgraph for live market data
- Searches and filters markets by category, liquidity, and relevance
- Fetches real-time market prices and trading volume

✅ **AI-Powered Hedge Matching**
- Smart hedge engine that maps portfolio exposures to relevant markets
- ETH holdings → ETH price prediction markets
- Stablecoin holdings → inflation/interest rate markets
- Token holdings → specific asset price markets
- Configurable risk tolerance and hedge percentages

✅ **One-Click Hedge Execution**
- Automated approval handling for USDC transactions
- Direct integration with Polymarket router contracts
- Trade execution with slippage protection
- Position tracking and management

✅ **Advanced PnL Tracking**
- Real-time position monitoring with live market prices
- Unrealized and realized P&L calculations
- Portfolio-wide performance metrics
- Win rate, Sharpe ratio, and trade analytics
- Interactive charts showing cumulative returns

## 🏗️ Architecture

### Smart Contracts
- Integrates with existing Polymarket prediction market contracts
- USDC approval and routing through Polymarket router
- Position tracking via on-chain contract calls

### Backend Services
- **Portfolio Reader**: Reads wallet balances and calculates USD values
- **Polymarket Client**: GraphQL integration for market data
- **Hedge Engine**: AI-powered matching algorithm
- **Trade Executor**: Handles trade execution and approvals
- **PnL Tracker**: Real-time performance monitoring

### Frontend (Next.js 15)
- **HedgeDashboard**: Main dashboard with portfolio overview
- **WalletConnection**: Web3 wallet integration
- **PortfolioView**: Asset allocation with interactive charts
- **HedgeRecommendations**: AI suggestions with confidence scoring
- **ActivePositions**: Live position management
- **PnLDashboard**: Performance analytics and charts

## 🚀 Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Setup**
```bash
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Build for Production**
```bash
npm run build
npm start
```

## 💡 How It Works

1. **Connect Wallet**: User connects their Ethereum wallet
2. **Portfolio Scan**: System reads all token balances and calculates USD values
3. **Risk Analysis**: AI engine analyzes portfolio exposures and risks
4. **Market Discovery**: Searches Polymarket for relevant hedge opportunities
5. **Recommendations**: Presents ranked hedge suggestions with confidence scores
6. **Execution**: One-click hedge placement with automatic approvals
7. **Monitoring**: Real-time P&L tracking and position management

## 🎨 Key Components

### Hedge Matching Algorithm
- Maps ETH holdings to "ETH < $2000" type markets
- Maps stablecoins to inflation hedge markets
- Maps specific tokens to relevant price prediction markets
- Confidence scoring based on market liquidity and timing
- Risk-adjusted position sizing

### Trade Execution Flow
1. Check USDC allowance for Polymarket router
2. Approve additional USDC if needed
3. Execute market buy with slippage protection
4. Store position data locally for tracking
5. Monitor position via contract calls

### Real-time PnL Calculation
- Fetches current market prices every minute
- Calculates unrealized P&L for open positions
- Tracks realized P&L for closed positions
- Computes portfolio-wide performance metrics

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: Wagmi, Viem, WalletConnect
- **Styling**: Tailwind CSS, Lucide Icons
- **Charts**: Recharts for data visualization
- **Data**: Apollo Client for GraphQL
- **APIs**: Polymarket Subgraph, CoinGecko API

## 🛡️ Security Features

- Non-custodial: Users retain full control of funds
- Approval-based: Granular USDC approvals only
- Slippage protection on all trades
- Error boundaries for graceful failure handling
- No private key storage or handling

## 📊 Performance Metrics

The application tracks:
- Total portfolio P&L (realized + unrealized)
- Win rate percentage
- Average return per trade
- Sharpe ratio for risk-adjusted performance
- Best and worst performing trades
- Open vs closed position counts

## 🎯 Future Enhancements

- Cross-market hedging strategies
- Automated hedge execution based on risk triggers
- Integration with additional prediction market protocols
- Advanced portfolio risk analytics
- Mobile-responsive design improvements

## 🔗 Live Demo

Visit the application at: http://localhost:3001 (when running locally)

This implementation demonstrates the real utility of prediction markets beyond speculation - as practical hedging tools for portfolio risk management.