#!/usr/bin/env python3
"""
Mock Loop Runner - Simulates live trading session using mock option chain data.

This script runs a continuous loop that:
1. Updates market data using simulate_market_step()
2. Executes trading strategy on the new data
3. Waits for configured interval before next cycle
"""

import os
import time
from dotenv import load_dotenv
from mock.mock_simulator import simulate_market_step
from run_strategy import main as run_strategy_main

def main():
    """Run the mock trading loop simulation."""
    
    # Load environment variables
    load_dotenv()
    
    # Get loop interval from environment (default to 3 seconds)
    loop_interval = float(os.getenv('MOCK_LOOP_INTERVAL', '3'))
    
    print("🚀 Mock Trading Simulation Started")
    print("=" * 50)
    print(f"📊 Loop interval: {loop_interval} seconds")
    print(f"🎯 Strategy: Delta-based options trading")
    print(f"⚡ Mode: Mock simulation")
    print("=" * 50)
    print("Press Ctrl+C to stop the simulation")
    print()
    
    tick_count = 0
    
    try:
        while True:
            tick_count += 1
            
            print(f"🔄 Tick {tick_count}: Market updated and strategy executed", end=" - ")
            
            try:
                # Step 1: Simulate market movement
                simulate_market_step()
                
                # Step 2: Run trading strategy on updated data
                run_strategy_main()
                
                print("✅ Success")
                
            except Exception as e:
                print(f"❌ Error: {e}")
            
            # Wait for the configured interval
            time.sleep(loop_interval)
            
    except KeyboardInterrupt:
        print(f"\n\n🛑 Simulation stopped by user after {tick_count} ticks")
        print("📊 Mock trading session completed")

if __name__ == "__main__":
    main()
