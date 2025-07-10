# Options Calendar Strategy Trading System

A comprehensive system for deploying and monitoring weekly-monthly options calendar spread strategies with real-time position tracking and automated adjustment logic.

## Overview

This system implements a **Calendar Spread Strategy** where:

- **Weekly Options**: Sell call and put options with ~0.5 delta (shorter expiry)
- **Monthly Options**: Buy call and put options with ~0.3 delta (longer expiry)
- **Profit Mechanism**: Time decay benefits the sold positions more than bought positions
- **Risk Management**: Automated adjustments when deltas breach predefined thresholds

## Architecture

```
├── backend/           # Node.js API server
│   ├── index.js      # Main server with strategy logic
│   ├── kite.js       # Kite Connect API integration
│   └── mockOptionChainData.json  # Test scenarios
└── frontend/         # Next.js React application
    └── src/pages/index.tsx  # Strategy configuration UI
```

## Features

- **Strategy Deployment**: Configure and deploy calendar spread strategies
- **Real-time Monitoring**: Track position deltas and P&L
- **Test Mode**: Simulate strategies with predefined market scenarios
- **Automated Adjustments**: Exit and re-enter positions based on delta thresholds
- **Multiple Scenarios**: Test different market conditions (high volatility, trending markets, etc.)

## Quick Start

### Prerequisites

- Node.js 18+
- Dhan API credentials (for live data)
- Kite Connect API credentials (optional, for order execution)

### Setup

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd zerodha-integration

   # Backend setup
   cd backend
   npm install
   cp .env.example .env  # Configure your API credentials

   # Frontend setup
   cd ../frontend
   npm install
   ```

2. **Configure Environment Variables**

   ```bash
   # backend/.env
   DHAN_ACCESS_TOKEN=your_dhan_token
   DHAN_CLIENT_ID=your_dhan_client_id
   KITE_API_KEY=your_kite_api_key
   KITE_API_SECRET=your_kite_secret
   ```

3. **Start the Application**

   ```bash
   # Terminal 1: Start backend
   cd backend && npm start

   # Terminal 2: Start frontend
   cd frontend && npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Strategy Parameters

| Parameter       | Description                                  | Default | Range   |
| --------------- | -------------------------------------------- | ------- | ------- |
| `sellLegDelta`  | Target delta for weekly options to sell      | 0.5     | 0.3-0.7 |
| `buyLegDelta`   | Target delta for monthly options to buy      | 0.3     | 0.2-0.4 |
| `exitSellLower` | Lower delta threshold for sell position exit | 0.25    | 0.1-0.4 |
| `exitSellUpper` | Upper delta threshold for sell position exit | 0.75    | 0.6-0.9 |
| `exitBuyDelta`  | Delta threshold for buy position exit        | 0.7     | 0.6-0.8 |

## Test Scenarios

The system includes predefined test scenarios to validate strategy behavior:

- **no-adjustments**: Normal market conditions, no position adjustments needed
- **weekly-call-high**: Weekly call delta rises above exit threshold
- **weekly-put-low**: Weekly put delta falls below exit threshold
- **monthly-call-high**: Monthly call delta rises above exit threshold
- **monthly-put-high**: Monthly put delta rises above exit threshold (emergency exit)
- **multiple-adjustments**: Multiple positions breach exit conditions simultaneously

## API Endpoints

### Strategy Management

- `POST /start-strategy` - Deploy a new strategy
- `POST /stop-strategy` - Stop active strategy
- `GET /monitor-strategy` - Get current position status and adjustments

### Data Endpoints

- `GET /expiry-dates` - Available option expiry dates
- `GET /option-chain` - Option chain data for given expiry
- `GET /test-scenarios` - Available test scenarios

### Test Mode

Add `?testMode=true&scenario=<scenario_name>` to any endpoint to use mock data instead of live market data.

## Risk Warnings

⚠️ **This is a trading system that can result in financial losses. Use at your own risk.**

- Always test strategies in paper trading mode first
- Understand the risks of options trading
- Monitor positions actively during market hours
- Have proper risk management and position sizing
- Consider market conditions and volatility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details
