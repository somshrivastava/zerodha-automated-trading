#!/usr/bin/env python3
"""
Demo version of run_mock_loop.py - runs for limited iterations to show functionality
"""

import os
import time
from dotenv import load_dotenv
from mock.mock_simulator import simulate_market_step
from run_strategy import main as run_strategy_main

def demo():
    """Run a limited demo of the mock loop."""
    
    # Load environment variables
    load_dotenv()
    loop_interval = float(os.getenv('MOCK_LOOP_INTERVAL', '3'))
    
    print("🚀 Mock Trading Simulation Demo")
    print("=" * 50)
    print(f"📊 Loop interval: {loop_interval} seconds")
    print(f"🎯 Strategy: Delta-based options trading")
    print(f"⚡ Mode: Mock simulation")
    print("=" * 50)
    print("Running 3 iterations for demonstration...")
    print()
    
    for tick_count in range(1, 4):
        print(f"🔄 Tick {tick_count}: Market updated and strategy executed", end=" - ")
        
        try:
            # Step 1: Simulate market movement
            simulate_market_step()
            
            # Step 2: Run trading strategy on updated data
            run_strategy_main()
            
            print("✅ Success")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Wait for the configured interval (except on last iteration)
        if tick_count < 3:
            print(f"⏳ Waiting {loop_interval} seconds...")
            time.sleep(loop_interval)
            print()
    
    print()
    print("🏁 Demo completed - 3 iterations finished")
    print("💡 To run continuously: python3 run_mock_loop.py")

if __name__ == "__main__":
    demo()
