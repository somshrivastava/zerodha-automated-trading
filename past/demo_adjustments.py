#!/usr/bin/env python3

import os
from dotenv import load_dotenv
from api.trading_system import TradingSystem
from strategy.adjuster import adjust_positions

def demo_adjustment_logic():
    load_dotenv()
    
    print("🔄 Delta Adjustment Logic Demo")
    print("=" * 50)
    
    # Initialize trading system
    trading_system = TradingSystem()
    print(f"Trading system initialized in {os.getenv('MODE', 'mock')} mode\n")
    
    # Show available options
    print("📊 Available Options (with deltas):")
    option_chain = trading_system.get_option_chain('NIFTY')
    for strike, data in option_chain.get('data', {}).get('oc', {}).items():
        ce_symbol = data.get('ce', {}).get('tradingsymbol', 'N/A')
        pe_symbol = data.get('pe', {}).get('tradingsymbol', 'N/A')
        ce_delta = data.get('ce', {}).get('greeks', {}).get('delta', 0)
        pe_delta = data.get('pe', {}).get('greeks', {}).get('delta', 0)
        print(f"  {strike}: CE={ce_symbol} (δ={ce_delta:+.3f}), PE={pe_symbol} (δ={pe_delta:+.3f})")
    
    print(f"\n⚙️  Adjustment Thresholds:")
    print(f"  SELL positions: Outside [{os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25')}, {os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75')}] range")
    print(f"  BUY positions: |delta| >= {os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6')}")
    
    # Demo 1: SELL position with delta outside range
    print(f"\n🎯 Demo 1: SELL position needing adjustment")
    print("Creating SELL position with delta -0.68 (outside threshold range)...")
    trading_system.place_order('NIFTY2580725600PE', 'SELL', 50)
    
    # Get positions and run adjustment
    positions = trading_system.get_positions()
    print(f"Position created: {positions[0].get('tradingsymbol')} - {positions[0].get('quantity')} units")
    
    print("Running adjustment logic...")
    adjust_positions(trading_system)
    
    # Demo 2: BUY position with high delta
    print(f"\n🎯 Demo 2: BUY position needing adjustment")
    print("Creating BUY position with |delta| = 0.68 (above 0.6 threshold)...")
    trading_system.place_order('NIFTY2580725600PE', 'BUY', 25)
    
    positions = trading_system.get_positions()
    for pos in positions:
        if pos.get('quantity') > 0:  # Find the BUY position
            print(f"Position created: {pos.get('tradingsymbol')} - {pos.get('quantity')} units")
            break
    
    print("Running adjustment logic...")
    adjust_positions(trading_system)
    
    # Show final trade log
    print(f"\n📝 Recent Trade Log:")
    import subprocess
    result = subprocess.run(['tail', '-8', 'logs/trade_log.csv'], capture_output=True, text=True)
    if result.stdout:
        lines = result.stdout.strip().split('\n')
        for line in lines[-8:]:  # Show last 8 trades
            parts = line.split(',')
            if len(parts) >= 5:
                symbol = parts[1]
                delta = parts[2]
                action = parts[3]
                qty = parts[4]
                print(f"  {action} {qty} {symbol} (δ={delta})")
    
    print(f"\n✅ Adjustment logic demo completed!")

if __name__ == "__main__":
    demo_adjustment_logic()
