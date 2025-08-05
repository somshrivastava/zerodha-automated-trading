#!/usr/bin/env python3

import os
import sys
from dotenv import load_dotenv
from api.trading_system import TradingSystem
from strategy.adjuster import adjust_positions

def main():
    load_dotenv()
    
    print("Delta-Based Options Position Adjuster")
    print("=" * 40)
    
    # Initialize trading system
    try:
        trading_system = TradingSystem()
        print(f"Trading system initialized in {os.getenv('MODE', 'mock')} mode")
    except Exception as e:
        print(f"Error initializing trading system: {e}")
        sys.exit(1)
    
    # Display current thresholds
    print(f"\nAdjustment Parameters:")
    print(f"  SELL Delta Target: {os.getenv('SELL_DELTA', '0.5')}")
    print(f"  BUY Delta Target: {os.getenv('BUY_DELTA', '0.3')}")
    print(f"  SELL Adjustment Range: [{os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25')}, {os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75')}]")
    print(f"  BUY Adjustment Threshold: {os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6')}")
    
    # Show persistence information
    import json
    adjusted_positions_file = 'adjusted_positions.json'
    if os.path.exists(adjusted_positions_file):
        try:
            with open(adjusted_positions_file, 'r') as f:
                adjusted_data = json.load(f)
            if adjusted_data:
                print(f"\nRecently Adjusted Positions:")
                for symbol, info in adjusted_data.items():
                    last_adjusted = info.get('last_adjusted', 'Unknown')[:19]  # Show date/time only
                    target_delta = info.get('target_delta', 0)
                    print(f"  {symbol}: target_delta={target_delta:.3f}, adjusted={last_adjusted}")
            else:
                print(f"\nNo recently adjusted positions found.")
        except:
            print(f"\nCould not read adjusted positions history.")
    else:
        print(f"\nNo adjustment history found (first run).")
    
    print()
    
    # Get current positions
    try:
        positions = trading_system.get_positions()
        if not positions:
            print("No open positions found. Nothing to adjust.")
            return
            
        print(f"Found {len(positions)} open positions:")
        for pos in positions:
            symbol = pos.get('tradingsymbol', 'N/A')
            quantity = pos.get('quantity', 0)
            if quantity != 0:
                print(f"  {symbol}: {quantity} units")
        print()
        
    except Exception as e:
        print(f"Error fetching positions: {e}")
        sys.exit(1)
    
    # Ask for confirmation in live mode
    if os.getenv('MODE', 'mock').lower() == 'live':
        response = input("WARNING: Running in LIVE mode. Continue with adjustments? (y/N): ")
        if response.lower() != 'y':
            print("Adjustment cancelled.")
            return
    
    # Execute adjustments
    try:
        print("Starting position adjustments...")
        adjust_positions(trading_system)
        print("\nAdjustment process completed.")
        
    except Exception as e:
        print(f"Error during adjustment process: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
