#!/usr/bin/env python3
"""
Force adjustment scenarios by temporarily modifying delta values
"""

import os
import json
from api.trading_system import TradingSystem
from api.zerodha_mock import ZerodhaMockAPI

def create_adjustment_scenario():
    """Create a scenario where adjustments will be needed"""
    print("🎭 Creating Adjustment Scenario...")
    print("=" * 40)
    
    # Load current positions
    api = ZerodhaMockAPI()
    positions = api.get_positions()
    
    if not positions:
        print("❌ No positions found. Run the strategy first.")
        return
    
    print(f"📊 Current positions: {len(positions)}")
    for pos in positions[:2]:  # Show first 2
        print(f"  - {pos['tradingsymbol']}: {pos['quantity']} units")
    
    print("\n🔧 To see adjustments in action, you can:")
    print("\n1. **Wait for Market Movement** (Real scenario)")
    print("   - As market moves, option deltas change")
    print("   - When delta goes outside thresholds, adjustments trigger")
    
    print("\n2. **Modify Thresholds** (Testing scenario)")
    print("   - Current SELL range: 0.25 - 0.75")
    print("   - Current BUY threshold: 0.6")
    print("   - Make them stricter to force adjustments")
    
    print("\n3. **Run Continuous Loop** (Best for seeing changes)")
    print("   - python3 loop_runner.py")
    print("   - Runs every 60 seconds")
    print("   - Will show changes over time")
    
    print("\n📈 Current Delta Status:")
    trading_system = TradingSystem()
    
    # Check each position's delta status
    for pos in positions:
        symbol = pos['tradingsymbol']
        quantity = pos['quantity']
        
        try:
            # Try to get delta from the option chain
            delta = None
            available_expiries = trading_system.get_available_expiries('NIFTY')
            
            # Try weekly expiry first
            if available_expiries.get('weekly'):
                option_chain = trading_system.get_option_chain('NIFTY', available_expiries['weekly'])
                for strike_price, strike_data in option_chain.get('data', {}).get('oc', {}).items():
                    ce_data = strike_data.get('ce', {})
                    if ce_data.get('tradingsymbol') == symbol:
                        delta = ce_data.get('greeks', {}).get('delta', 0.0)
                        break
                    pe_data = strike_data.get('pe', {})
                    if pe_data.get('tradingsymbol') == symbol:
                        delta = pe_data.get('greeks', {}).get('delta', 0.0)
                        break
            
            if delta is not None:
                if quantity < 0:  # Short position
                    status = "✅ OK" if 0.25 <= abs(delta) <= 0.75 else "⚠️  NEEDS ADJUSTMENT"
                    print(f"  {symbol}: Delta {delta:.3f} {status}")
                else:  # Long position  
                    status = "✅ OK" if abs(delta) < 0.6 else "⚠️  NEEDS ADJUSTMENT"
                    print(f"  {symbol}: Delta {delta:.3f} {status}")
            else:
                print(f"  {symbol}: Delta calculation failed")
                
        except Exception as e:
            print(f"  {symbol}: Error calculating delta - {e}")

def show_testing_commands():
    """Show commands to test the adjustment system"""
    print("\n" + "="*50)
    print("🧪 **TESTING COMMANDS**")
    print("="*50)
    
    print("\n1. **Monitor in Real-time:**")
    print("   python3 monitor_positions.py")
    
    print("\n2. **Run Single Adjustment Check:**")
    print("   python3 run_adjustments.py")
    
    print("\n3. **Run Continuous Loop (Best Option):**")
    print("   python3 loop_runner.py")
    print("   (This runs strategy + adjustments every 60 seconds)")
    
    print("\n4. **Create More Positions (to see more activity):**")
    print("   python3 run_strategy.py")
    
    print("\n5. **Make Adjustments More Sensitive (for testing):**")
    print("   Edit .env file:")
    print("   ADJUSTMENT_THRESHOLD_LOW=0.4   # Make range tighter")
    print("   ADJUSTMENT_THRESHOLD_HIGH=0.6  # Make range tighter")
    print("   BUY_ADJUSTMENT_THRESHOLD=0.4   # Make more sensitive")
    
    print("\n🎯 **What You'll See:**")
    print("   - Position delta calculations")
    print("   - 'No adjustment needed' vs 'ADJUSTMENT NEEDED'")
    print("   - Actual rolling/closing of positions when thresholds hit")
    print("   - New positions opened at target deltas")

if __name__ == "__main__":
    create_adjustment_scenario()
    show_testing_commands()
