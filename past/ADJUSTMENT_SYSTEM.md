# Delta-Based Position Adjustment System with Persistence

## 📁 Files Created

- `strategy/adjuster.py` - Core adjustment logic with persistence
- `run_adjustments.py` - CLI script to run adjustments
- `demo_adjustments.py` - Demonstration script
- `demo_persistence.py` - Persistence system demonstration
- `adjusted_positions.json` - Persistence file (auto-created)
- Updated `.env` with adjustment thresholds

## ⚙️ Configuration (.env)

```
# Adjustment thresholds
ADJUSTMENT_THRESHOLD_HIGH=0.75
ADJUSTMENT_THRESHOLD_LOW=0.25
BUY_ADJUSTMENT_THRESHOLD=0.6
```

## 🔄 Persistence System (NEW)

### Persistence File: `adjusted_positions.json`

```json
{
  "NIFTY2580725400PE": {
    "target_delta": -0.31,
    "last_adjusted": "2025-08-03T17:18:12.374319"
  }
}
```

### Key Features:

- **Cooldown Period**: 1 hour minimum between adjustments for same symbol
- **Delta Tolerance**: 5% tolerance for target delta comparison
- **Auto Cleanup**: Removes closed positions from tracking
- **Skip Logic**: Prevents unnecessary re-adjustments

## 🔄 Persistence Workflow

1. **Load History**: Read `adjusted_positions.json` for previously adjusted positions
2. **Clean Closed**: Remove positions no longer in portfolio from tracking
3. **Check Cooldown**: Skip adjustment if position adjusted within 1 hour AND still within 5% of target delta
4. **Execute Adjustment**: If needed, exit old position and enter new one
5. **Update Tracking**: Record new symbol, target delta, and timestamp
6. **Save History**: Write updated tracking data back to JSON file

## 🎯 Adjustment Rules

### SELL Positions

- **CALL Options**: Delta must be between [0.25, 0.75]
- **PUT Options**: Delta must be between [-0.75, -0.25]
- **Action**: If outside range → Exit + Re-enter at target delta (0.5 for calls, -0.5 for puts)

### BUY Positions

- **Any Option**: |Delta| must be < 0.6
- **Action**: If |delta| ≥ 0.6 → Exit + Re-enter at target delta (0.3 for calls, -0.3 for puts)

## 🚀 Usage

### CLI Script (Enhanced with Persistence Info)

```bash
python3 run_adjustments.py
```

### Persistence Demonstration

```bash
python3 demo_persistence.py
```

### Programmatic Usage

```python
from api.trading_system import TradingSystem
from strategy.adjuster import adjust_positions

trading_system = TradingSystem()
adjust_positions(trading_system)
```

### Demo Script

```bash
python3 demo_adjustments.py
```

## 🔄 How It Works

1. **Fetch Positions**: Gets all open positions using `trading_system.get_positions()`
2. **Check Deltas**: Retrieves current delta for each position from option chain
3. **Evaluate Rules**: Applies threshold rules based on position type (BUY/SELL) and option type (CE/PE)
4. **Execute Adjustments**:
   - Exit current position (opposite transaction type)
   - Find new option at target delta using `find_options_by_delta()`
   - Enter new position with same transaction type
5. **Log Trades**: All adjustments logged to `logs/trade_log.csv`

## 📊 Example Scenarios

### Scenario 1: SELL PUT with extreme delta

- Position: SELL 50 NIFTY2580725600PE (Delta: -0.68)
- Issue: -0.68 < -0.25 (outside acceptable range)
- Action: Exit → Re-enter SELL NIFTY2580725500PE (Delta: -0.48)
- **Persistence**: Tracked in `adjusted_positions.json`, subsequent runs skip if within tolerance

### Scenario 2: BUY position with high delta

- Position: BUY 50 NIFTY2580725600PE (Delta: -0.68)
- Issue: |0.68| > 0.6 threshold
- Action: Exit → Re-enter BUY NIFTY2580725400PE (Delta: -0.31)
- **Persistence**: Recorded with 1-hour cooldown to prevent re-adjustment

### Scenario 3: Persistence Prevention

- Position: NIFTY2580725400PE recently adjusted to -0.31 delta
- Current Delta: -0.32 (within 5% tolerance of -0.31 target)
- Last Adjusted: 30 minutes ago (within 1-hour cooldown)
- **Result**: ✅ Skipped - "recently adjusted to target, skipping"

## ✅ Key Features

### Core Functionality

- **Automatic Detection**: Monitors all open positions for delta drift
- **Smart Re-entry**: Uses existing `find_options_by_delta()` logic
- **Complete Logging**: All adjustments tracked in trade log

### Persistence Benefits (NEW)

- **Prevents Over-Adjustment**: Won't re-adjust recently modified positions
- **Intelligent Cooldown**: 1-hour minimum between adjustments per symbol
- **Delta Tolerance**: 5% tolerance prevents micro-adjustments
- **Auto-Cleanup**: Removes closed positions from tracking automatically
- **Audit Trail**: Full history of adjustments with timestamps
- **Error Handling**: Graceful handling of missing options or failed orders
- **Mock/Live Compatible**: Works with both mock and live trading modes
- **Safety Confirmation**: Prompts user in live mode before executing adjustments

## 🛡️ Safety Features

- Confirmation prompt in live mode
- Comprehensive error handling and logging
- Position validation before adjustment
- No hardcoded instrument names - always uses dynamic selection
- Preserves existing trade history (append-only logging)
