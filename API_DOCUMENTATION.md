# API Documentation

## Overview

The Options Calendar Strategy API provides endpoints for deploying, monitoring, and managing weekly-monthly calendar spread strategies.

## Base URL

```
http://localhost:4000
```

## Authentication

Currently no authentication required. In production, implement proper API key or token-based authentication.

---

## Strategy Management Endpoints

### Deploy Strategy

Deploy a new calendar spread strategy.

**Endpoint:** `POST /start-strategy`

**Query Parameters:**

- `testMode` (boolean, optional): Use mock data instead of live market data
- `scenario` (string, optional): Test scenario name when in test mode

**Request Body:**

```json
{
  "weeklyExpiry": "2025-07-10",
  "monthlyExpiry": "2025-07-24",
  "sellLegDelta": 0.5,
  "buyLegDelta": 0.3,
  "exitSellLower": 0.25,
  "exitSellUpper": 0.75,
  "exitBuyDelta": 0.7
}
```

**Response:**

```json
{
  "status": "started",
  "config": {
    /* strategy config */
  },
  "positions": {
    "weeklyCallSell": {
      "strike": 25500,
      "delta": 0.52,
      "price": 75.5,
      "type": "sell",
      "expiry": "2025-07-10"
    },
    "weeklyPutSell": {
      /* similar structure */
    },
    "monthlyCallBuy": {
      /* similar structure */
    },
    "monthlyPutBuy": {
      /* similar structure */
    },
    "entryTime": "2025-07-09T10:30:00.000Z"
  },
  "message": "Strategy started successfully"
}
```

### Stop Strategy

Stop the active strategy.

**Endpoint:** `POST /stop-strategy`

**Response:**

```json
{
  "status": "stopped"
}
```

### Monitor Strategy

Get current position status and required adjustments.

**Endpoint:** `GET /monitor-strategy`

**Query Parameters:**

- `testMode` (boolean, optional): Override to test mode
- `scenario` (string, optional): Test scenario for monitoring

**Response:**

```json
{
  "status": "monitoring",
  "config": {
    /* active strategy config */
  },
  "currentDeltas": {
    "weeklyCallSell": 0.65,
    "weeklyPutSell": 0.35,
    "monthlyCallBuy": 0.42,
    "monthlyPutBuy": 0.38
  },
  "adjustments": [
    {
      "type": "ADJUST_SELL",
      "position": "weeklyCallSell",
      "reason": "Delta 0.65 breached exit levels",
      "action": "EXIT_AND_REENTER"
    }
  ],
  "timestamp": "2025-07-09T10:35:00.000Z",
  "testMode": false,
  "scenario": "live"
}
```

---

## Data Endpoints

### Get Expiry Dates

Fetch available option expiry dates.

**Endpoint:** `GET /expiry-dates`

**Response:**

```json
{
  "data": ["2025-07-10", "2025-07-17", "2025-07-24", "2025-07-31"]
}
```

### Get Option Chain

Fetch option chain data for a specific expiry.

**Endpoint:** `GET /option-chain`

**Query Parameters:**

- `expiry` (string, required): Expiry date in YYYY-MM-DD format
- `strikes` (number, optional): Number of strikes around ATM (default: 10)

**Response:**

```json
{
  "underlying_price": 25476.1,
  "closest_strike": 25500,
  "total_strikes_shown": 10,
  "option_chain": [
    {
      "strike": 25450,
      "call": {
        "ltp": 81.05,
        "bid": 81.1,
        "ask": 81.8,
        "volume": 167757000,
        "oi": 4192725,
        "iv": 11.7,
        "delta": 0.52,
        "gamma": 0.00228,
        "theta": -31.66,
        "vega": 5.84
      },
      "put": {
        "ltp": 43.5,
        "bid": 43.3,
        "ask": 43.8,
        "volume": 285742650,
        "oi": 6067575,
        "iv": 9.2,
        "delta": -0.43,
        "gamma": 0.00289,
        "theta": -18.71,
        "vega": 5.81
      }
    }
  ]
}
```

---

## Test Mode Endpoints

### Get Test Scenarios

List available test scenarios for mock data.

**Endpoint:** `GET /test-scenarios`

**Response:**

```json
{
  "scenarios": [
    "no-adjustments",
    "weekly-call-high",
    "weekly-put-low",
    "monthly-call-high",
    "monthly-put-high",
    "multiple-adjustments"
  ],
  "descriptions": {
    "no-adjustments": "Normal market conditions, no position adjustments needed",
    "weekly-call-high": "Weekly call delta rises above exit threshold",
    "weekly-put-low": "Weekly put delta falls below exit threshold",
    "monthly-call-high": "Monthly call delta rises above exit threshold",
    "monthly-put-high": "Monthly put delta rises above exit threshold (emergency exit)",
    "multiple-adjustments": "Multiple positions breach exit conditions simultaneously"
  }
}
```

### Get Mock Option Chain

Get mock option chain data for testing.

**Endpoint:** `GET /mock-option-chain`

**Query Parameters:**

- `scenario` (string, optional): Test scenario name (default: "no-adjustments")
- `expiry` (string, optional): "weekly" or "monthly" (default: "weekly")

**Response:** Same format as `/option-chain` but with mock data.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error description",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Resource Not Found
- `500` - Internal Server Error

---

## Strategy Parameters Guide

### Delta Values

- **sellLegDelta (0.3-0.7)**: Target delta for weekly options to sell

  - Lower values = farther OTM, less premium but safer
  - Higher values = closer to ATM, more premium but riskier

- **buyLegDelta (0.2-0.4)**: Target delta for monthly options to buy
  - Lower values = farther OTM, cheaper protection
  - Higher values = closer to ATM, more expensive but better protection

### Exit Thresholds

- **exitSellLower/Upper**: Delta bounds for sell position adjustments

  - If delta falls below Lower OR rises above Upper → adjust position

- **exitBuyDelta**: Emergency exit threshold for buy positions
  - If absolute delta exceeds this value → exit both legs and re-enter

### Recommended Ranges

- Conservative: sellLeg=0.4, buyLeg=0.25, exits=0.2/0.6/0.6
- Moderate: sellLeg=0.5, buyLeg=0.3, exits=0.25/0.75/0.7
- Aggressive: sellLeg=0.6, buyLeg=0.35, exits=0.3/0.8/0.8
