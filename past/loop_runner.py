#!/usr/bin/env python3

import os
import sys
import time
from datetime import datetime
from dotenv import load_dotenv
from api.trading_system import TradingSystem
import run_strategy
import run_adjustments

def main():
    load_dotenv()
    
    print("🔄 Daily Loop Runner")
    print("=" * 40)
    
    # Safety check for real mode
    mode = os.getenv('MODE', 'mock').lower()
    if mode == 'real':
        print("❌ WARNING: Cannot run loop in REAL mode. Exiting immediately.")
        return
    
    print(f"Running in {mode.upper()} mode")
    
    # Get configuration
    max_iterations = int(os.getenv('MAX_ITERATIONS', '10'))
    print(f"Max iterations: {max_iterations}")
    
    # Initialize trading system
    try:
        trading_system = TradingSystem()
        print(f"Trading system initialized successfully\n")
    except Exception as e:
        print(f"Error initializing trading system: {e}")
        sys.exit(1)
    
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        current_time = datetime.now().strftime("%H:%M:%S")
        
        print(f"🔄 Loop {iteration}/{max_iterations} - {current_time}")
        print("-" * 30)
        
        try:
            # Run strategy
            print("📈 Running strategy...")
            run_strategy.main()
            
            print("\n⚡ Running adjustments...")
            run_adjustments.main()
            
            print(f"✅ Loop {iteration} completed successfully")
            
        except Exception as e:
            print(f"❌ Error in loop {iteration}: {e}")
        
        # Check if we've reached max iterations
        if iteration >= max_iterations:
            print(f"\n🏁 Reached maximum iterations ({max_iterations}). Stopping.")
            break
        
        print(f"\n😴 Sleeping for 60 seconds...")
        print("=" * 40)
        time.sleep(60)
    
    print(f"\n🎯 Loop runner completed after {iteration} iterations")

if __name__ == "__main__":
    main()
