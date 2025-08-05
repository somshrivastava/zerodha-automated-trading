#!/usr/bin/env python3
"""
Live monitoring script to show positions and check for adjustments
"""

import os
import time
import json
from datetime import datetime
from api.trading_system import TradingSystem

def monitor_positions():
    """Monitor current positions and show when adjustments would be needed"""
    print("🔍 Live Position Monitor")
    print("=" * 50)
    print("This will check your positions every 10 seconds")
    print("Press Ctrl+C to stop")
    print("=" * 50)
    
    iteration = 0
    
    try:
        while True:
            iteration += 1
            print(f"\n⏰ Check #{iteration} - {datetime.now().strftime('%H:%M:%S')}")
            
            # Initialize trading system
            trading_system = TradingSystem()
            positions = trading_system.get_positions()
            
            if not positions:
                print("📭 No positions found")
            else:
                print(f"📊 Found {len(positions)} positions:")
                
                for i, pos in enumerate(positions, 1):
                    symbol = pos['tradingsymbol']
                    quantity = pos['quantity']
                    avg_price = pos.get('average_price', 0)
                    
                    position_type = "🔴 SHORT" if quantity < 0 else "🟢 LONG"
                    print(f"\n  {i}. {symbol}")
                    print(f"     {position_type} {abs(quantity)} units @ ₹{avg_price}")
                    
                    # Show adjustment parameters
                    if quantity < 0:  # Short position
                        target = float(os.getenv('SELL_DELTA', '0.5'))
                        low = float(os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25'))
                        high = float(os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75'))
                        print(f"     Target Delta Range: {low:.2f} - {high:.2f}")
                    else:  # Long position
                        threshold = float(os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6'))
                        print(f"     Adjustment Threshold: {threshold:.2f}")
            
            print(f"\n💡 To trigger adjustments, run: python3 run_adjustments.py")
            print(f"🔄 To run continuous loop: python3 loop_runner.py")
            
            # Wait before next check
            for remaining in range(10, 0, -1):
                print(f"\\r⏳ Next check in {remaining} seconds...", end='', flush=True)
                time.sleep(1)
            print("\\r" + " " * 30 + "\\r", end='')  # Clear the countdown
            
    except KeyboardInterrupt:
        print("\\n\\n👋 Monitoring stopped by user")

def show_quick_test():
    """Show a quick way to test the adjustment system"""
    print("\\n🚀 Quick Test Options:")
    print("=" * 30)
    print("1. Check current positions: python3 run_adjustments.py")
    print("2. Run strategy (add positions): python3 run_strategy.py") 
    print("3. Start monitoring loop: python3 loop_runner.py")
    print("4. Monitor positions: python3 monitor_positions.py")
    print()
    print("💡 The loop_runner.py will:")
    print("   - Run strategy every 60 seconds") 
    print("   - Check for adjustments every 60 seconds")
    print("   - Stop after MAX_ITERATIONS (currently: {})".format(os.getenv('MAX_ITERATIONS', '10')))
    print()
    print("🔄 To see adjustments in action:")
    print("   1. Let loop_runner.py run for a few iterations")
    print("   2. It will create positions and then check if they need adjustments")
    print("   3. In mock mode, adjustments are based on simulated Greek values")

if __name__ == "__main__":
    show_quick_test()
    print("\\nStarting live monitoring...")
    time.sleep(2)
    monitor_positions()
