#!/usr/bin/env python3
"""
Test script to simulate market movement and demonstrate adjustment system
"""

import os
import json
import time
from datetime import datetime
from api.trading_system import TradingSystem
from strategy.adjuster import adjust_positions

def simulate_market_movement():
    """Simulate market changes by updating mock option prices"""
    print("🎯 Simulating Market Movement...")
    
    # Load current positions
    trading_system = TradingSystem()
    positions = trading_system.get_positions()
    
    if not positions:
        print("No positions found. Please run the strategy first.")
        return
    
    print(f"Found {len(positions)} positions to simulate market changes for:")
    
    # Simulate price changes for each position
    for i, pos in enumerate(positions[:2]):  # Test first 2 positions only
        symbol = pos['tradingsymbol']
        current_qty = pos['quantity']
        
        print(f"\n📊 Position {i+1}: {symbol} ({current_qty} units)")
        
        # Simulate different scenarios
        scenarios = [
            {"price_change": 1.5, "description": "15% price increase"},
            {"price_change": 0.8, "description": "20% price decrease"},
            {"price_change": 1.2, "description": "20% price increase"},
        ]
        
        for j, scenario in enumerate(scenarios):
            print(f"\n  Scenario {j+1}: {scenario['description']}")
            
            # Get current delta (mock calculation)
            try:
                current_delta = trading_system.get_option_delta(symbol)
                print(f"    Current Delta: {current_delta:.3f}")
                
                # Simulate new delta after price change
                # In reality, delta changes with underlying price and time
                new_delta = current_delta * scenario['price_change']
                if abs(new_delta) > 1.0:
                    new_delta = 0.95 if new_delta > 0 else -0.95
                
                print(f"    New Delta (simulated): {new_delta:.3f}")
                
                # Check if adjustment would be needed
                target_delta = 0.5 if current_qty < 0 else 0.3  # SELL vs BUY target
                threshold_low = float(os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25'))
                threshold_high = float(os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75'))
                
                needs_adjustment = False
                if current_qty < 0:  # Short position
                    if abs(new_delta) < threshold_low or abs(new_delta) > threshold_high:
                        needs_adjustment = True
                else:  # Long position
                    buy_threshold = float(os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6'))
                    if abs(new_delta) > buy_threshold:
                        needs_adjustment = True
                
                if needs_adjustment:
                    print(f"    🔄 ADJUSTMENT NEEDED: Delta {new_delta:.3f} outside target range")
                    print(f"    📋 Action: Would roll to new strike closer to {target_delta:.1f} delta")
                else:
                    print(f"    ✅ NO ADJUSTMENT: Delta {new_delta:.3f} within acceptable range")
                    
            except Exception as e:
                print(f"    ❌ Could not calculate delta for {symbol}: {e}")
            
            time.sleep(0.5)  # Small delay for readability

def show_current_positions():
    """Show current positions with their theoretical deltas"""
    print("\n📈 Current Position Analysis:")
    print("=" * 50)
    
    trading_system = TradingSystem()
    positions = trading_system.get_positions()
    
    if not positions:
        print("No positions found.")
        return
    
    for pos in positions:
        symbol = pos['tradingsymbol']
        quantity = pos['quantity']
        avg_price = pos.get('average_price', 0)
        
        try:
            delta = trading_system.get_option_delta(symbol)
            position_type = "SHORT" if quantity < 0 else "LONG"
            
            print(f"\n{symbol}:")
            print(f"  Position: {position_type} {abs(quantity)} units @ ₹{avg_price}")
            print(f"  Current Delta: {delta:.3f}")
            
            # Determine target and thresholds
            if quantity < 0:  # Short position
                target = float(os.getenv('SELL_DELTA', '0.5'))
                low = float(os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25'))
                high = float(os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75'))
                print(f"  Target Range: {low:.2f} - {high:.2f} (target: {target:.2f})")
                
                if abs(delta) < low:
                    print(f"  Status: ⚠️  NEEDS ADJUSTMENT - Delta too low ({abs(delta):.3f} < {low})")
                elif abs(delta) > high:
                    print(f"  Status: ⚠️  NEEDS ADJUSTMENT - Delta too high ({abs(delta):.3f} > {high})")
                else:
                    print(f"  Status: ✅ OK - Delta within range")
            else:  # Long position
                threshold = float(os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6'))
                print(f"  Adjustment Threshold: {threshold:.2f}")
                
                if abs(delta) > threshold:
                    print(f"  Status: ⚠️  NEEDS ADJUSTMENT - Delta too high ({abs(delta):.3f} > {threshold})")
                else:
                    print(f"  Status: ✅ OK - Delta acceptable")
                    
        except Exception as e:
            print(f"\n{symbol}:")
            print(f"  Position: {quantity} units @ ₹{avg_price}")
            print(f"  Delta: ❌ Cannot calculate ({str(e)})")

def main():
    print("🚀 Delta Adjustment Testing & Simulation")
    print("=" * 50)
    
    # Show current positions first
    show_current_positions()
    
    print("\n" + "=" * 50)
    input("Press Enter to simulate market movements...")
    
    # Simulate market movement
    simulate_market_movement()
    
    print("\n" + "=" * 50)
    print("💡 To see real adjustments:")
    print("1. Run: python3 run_strategy.py  (to create more positions)")
    print("2. Run: python3 run_adjustments.py  (to check/apply adjustments)")
    print("3. Run: python3 loop_runner.py  (for continuous monitoring)")
    print("\n🔄 The loop_runner.py will automatically run both strategy and adjustments every 60 seconds!")

if __name__ == "__main__":
    main()
