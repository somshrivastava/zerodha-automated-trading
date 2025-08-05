#!/usr/bin/env python3

import os
import json
from dotenv import load_dotenv
from api.trading_system import TradingSystem
from strategy.adjuster import adjust_positions

def demo_persistence_system():
    load_dotenv()
    
    print("🔄 Position Adjustment Persistence Demo")
    print("=" * 50)
    
    # Initialize trading system
    trading_system = TradingSystem()
    print(f"Trading system initialized in {os.getenv('MODE', 'mock')} mode\n")
    
    # Clean up any existing adjusted positions file
    if os.path.exists('adjusted_positions.json'):
        os.remove('adjusted_positions.json')
        print("🧹 Cleaned up previous adjusted_positions.json")
    
    print("📊 Creating test positions that need adjustment...")
    
    # Create positions that will trigger adjustments
    trading_system.place_order('NIFTY2580725600PE', 'SELL', 50)  # Delta -0.68 (outside SELL PUT range)
    trading_system.place_order('NIFTY2580725600PE', 'BUY', 25)   # Delta -0.68 (above BUY threshold)
    trading_system.place_order('NIFTY2580725500CE', 'SELL', 50)  # Delta +0.52 (OK, should not adjust)
    
    positions = trading_system.get_positions()
    print(f"Created {len(positions)} positions:")
    for pos in positions:
        symbol = pos.get('tradingsymbol')
        quantity = pos.get('quantity')
        print(f"  {symbol}: {quantity} units")
    
    print(f"\n🎯 Step 1: First adjustment run")
    print("Expected: SELL and BUY positions with -0.68 delta should be adjusted")
    adjust_positions(trading_system)
    
    # Show adjusted positions file
    print(f"\n📝 Persistence file after first run:")
    if os.path.exists('adjusted_positions.json'):
        with open('adjusted_positions.json', 'r') as f:
            data = json.load(f)
        for symbol, info in data.items():
            print(f"  {symbol}: target_delta={info['target_delta']:.3f}, last_adjusted={info['last_adjusted'][:19]}")
    else:
        print("  No adjusted_positions.json file found")
    
    print(f"\n🎯 Step 2: Second adjustment run (immediately after)")
    print("Expected: No adjustments due to persistence (cooldown period)")
    
    # Get current positions to simulate the new state
    current_positions = trading_system.get_positions()
    print(f"\nCurrent positions in system:")
    for pos in current_positions:
        symbol = pos.get('tradingsymbol')
        quantity = pos.get('quantity')
        print(f"  {symbol}: {quantity} units")
    
    adjust_positions(trading_system)
    
    print(f"\n🎯 Step 3: Simulating position closure")
    print("Expected: Closed positions should be cleaned up from persistence file")
    
    # Simulate closing all positions by creating an empty positions scenario
    print("Simulating all positions closed...")
    
    # Create a new trading system instance (simulating no positions)
    empty_trading_system = TradingSystem()
    adjust_positions(empty_trading_system)
    
    print(f"\n📝 Final persistence file state:")
    if os.path.exists('adjusted_positions.json'):
        with open('adjusted_positions.json', 'r') as f:
            final_data = json.load(f)
        if final_data:
            for symbol, info in final_data.items():
                print(f"  {symbol}: target_delta={info['target_delta']:.3f}")
        else:
            print("  ✅ File is empty - all closed positions cleaned up")
    
    print(f"\n✅ Persistence system demo completed!")
    print("\n🔍 Key Features Demonstrated:")
    print("  ✓ Positions are tracked after adjustment")
    print("  ✓ Recently adjusted positions are skipped (cooldown)")
    print("  ✓ Closed positions are automatically cleaned up")
    print("  ✓ Target deltas are preserved for comparison")

if __name__ == "__main__":
    demo_persistence_system()
