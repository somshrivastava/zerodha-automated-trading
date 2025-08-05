#!/usr/bin/env python3

from api.trading_system import TradingSystem

def main():
    trading_system = TradingSystem()
    
    positions = trading_system.get_positions()
    
    if not positions:
        print("No open positions")
        return
    
    print(f"{'Tradingsymbol':<20} {'Quantity':<10} {'Avg Price':<12} {'Last Price':<12} {'PnL':<10}")
    print("-" * 70)
    
    total_pnl = 0.0
    
    for position in positions:
        tradingsymbol = position.get('tradingsymbol', 'N/A')
        quantity = position.get('quantity', 0)
        avg_price = position.get('average_price', 0.0)
        last_price = position.get('last_price', 0.0)
        
        pnl = (last_price - avg_price) * quantity
        total_pnl += pnl
        
        print(f"{tradingsymbol:<20} {quantity:<10} {avg_price:<12.2f} {last_price:<12.2f} {pnl:<10.2f}")
    
    print("-" * 70)
    print(f"{'Total PnL:':<55} {total_pnl:<10.2f}")

if __name__ == "__main__":
    main()
