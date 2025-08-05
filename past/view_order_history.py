#!/usr/bin/env python3

from api.trading_system import TradingSystem

def main():
    trading_system = TradingSystem()
    
    orders = trading_system.get_orders()
    
    if not orders:
        print("No orders found")
        return
    
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
