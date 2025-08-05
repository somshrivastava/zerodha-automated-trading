#!/usr/bin/env python3

from api.trading_system import TradingSystem

def main():
    print("=== Creating Test Data ===")
    trading_system = TradingSystem()
    
    # Place some test orders
    trading_system.place_order('NIFTY2580725500CE', 'SELL', 50)
    trading_system.place_order('NIFTY2580725400PE', 'BUY', 25)
    trading_system.place_order('NIFTY2580725600CE', 'BUY', 75)
    
    print("\n=== POSITIONS VIEW ===")
    positions = trading_system.get_positions()
    
    if not positions:
        print("No open positions")
    else:
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
    
    print("\n=== ORDER HISTORY VIEW ===")
    orders = trading_system.get_orders()
    
    if not orders:
        print("No orders found")
    else:
        # Sort orders by timestamp in descending order (latest first)
        sorted_orders = sorted(orders, key=lambda x: x.get('order_timestamp', ''), reverse=True)
        
        print(f"{'Timestamp':<20} {'Type':<6} {'Quantity':<10} {'Tradingsymbol':<20} {'Status':<10}")
        print("-" * 80)
        
        for order in sorted_orders:
            timestamp = order.get('order_timestamp', 'N/A')[:19]  # Format to YYYY-MM-DD HH:MM:SS
            transaction_type = order.get('transaction_type', 'N/A')
            quantity = order.get('quantity', 0)
            tradingsymbol = order.get('tradingsymbol', 'N/A')
            status = order.get('status', 'N/A')
            
            print(f"{timestamp:<20} {transaction_type:<6} {quantity:<10} {tradingsymbol:<20} {status:<10}")
        
        print("-" * 80)
        print(f"Total orders: {len(orders)}")

if __name__ == "__main__":
    main()
