#!/usr/bin/env python3

import config
from api.trading_system import TradingSystem

def main():
    print("=" * 60)
    print("Delta-based Options Trading Bot - Day 1 Setup")
    print("=" * 60)
    
    print(f"\n1. Initializing Trading System (Mode: {config.MODE})")
    trading_system = TradingSystem()
    
    print(f"\n2. Loading option chain for {config.INDEX_SYMBOL}")
    option_chain = trading_system.get_option_chain(config.INDEX_SYMBOL)
    
    if option_chain and 'data' in option_chain:
        print(f"   ✓ Option chain loaded successfully")
        print(f"   ✓ Underlying price: ₹{option_chain['data'].get('last_price', 'N/A')}")
        
        options_count = 0
        if 'oc' in option_chain['data']:
            for strike_data in option_chain['data']['oc'].values():
                options_count += len([k for k in strike_data.keys() if k in ['ce', 'pe']])
        
        print(f"   ✓ Available options: {options_count}")
        
        print(f"\n3. Available Options:")
        if 'oc' in option_chain['data']:
            i = 1
            for strike, strike_data in option_chain['data']['oc'].items():
                for opt_type in ['ce', 'pe']:
                    if opt_type in strike_data:
                        option = strike_data[opt_type]
                        delta = option.get('greeks', {}).get('delta', 0)
                        ltp = option.get('last_price', 0)
                        symbol = option.get('tradingsymbol', f"{config.INDEX_SYMBOL}{strike.replace('.000000', '')}{opt_type.upper()}")
                        print(f"   {i}. {symbol} | Delta: {delta:+.2f} | LTP: ₹{ltp}")
                        i += 1
    else:
        print(f"   ✗ Failed to load option chain for {config.INDEX_SYMBOL}")
        return
    
    print(f"\n4. Finding options with target deltas:")
    print(f"   Sell Delta: {config.SELL_DELTA}")
    print(f"   Buy Delta: {config.BUY_DELTA}")
    
    sell_options = trading_system.find_options_by_delta(config.INDEX_SYMBOL, config.SELL_DELTA)
    buy_options = trading_system.find_options_by_delta(config.INDEX_SYMBOL, config.BUY_DELTA)
    
    print(f"   ✓ Found {len(sell_options)} options near sell delta ({config.SELL_DELTA})")
    print(f"   ✓ Found {len(buy_options)} options near buy delta ({config.BUY_DELTA})")
    
    print(f"\n5. Placing Mock Trades:")
    
    if sell_options:
        sell_option = sell_options[0]
        sell_response = trading_system.place_order(
            tradingsymbol=sell_option['tradingsymbol'],
            transaction_type='SELL',
            quantity=config.DEFAULT_QUANTITY,
            order_type='MARKET'
        )
        if sell_response.get('status') == 'success':
            delta = sell_option.get('greeks', {}).get('delta', 0)
            print(f"   ✓ Sell Order: {sell_option['tradingsymbol']} (Delta: {delta:+.2f}) - Order ID: {sell_response['data']['order_id']}")
    
    if buy_options:
        buy_option = buy_options[0]
        buy_response = trading_system.place_order(
            tradingsymbol=buy_option['tradingsymbol'],
            transaction_type='BUY',
            quantity=config.DEFAULT_QUANTITY,
            order_type='MARKET'
        )
        if buy_response.get('status') == 'success':
            delta = buy_option.get('greeks', {}).get('delta', 0)
            print(f"   ✓ Buy Order: {buy_option['tradingsymbol']} (Delta: {delta:+.2f}) - Order ID: {buy_response['data']['order_id']}")
    
    print(f"\n6. Current Positions:")
    positions = trading_system.get_positions()
    
    if positions:
        for position in positions:
            print(f"   {position['tradingsymbol']}: {position['quantity']:+d} shares @ ₹{position['average_price']:.2f}")
    else:
        print("   No open positions")
    
    print(f"\n7. Order History:")
    orders = trading_system.get_orders()
    
    if orders:
        for order in orders:
            timestamp = order['order_timestamp'][:19] if 'order_timestamp' in order else 'N/A'
            print(f"   {timestamp} | {order['transaction_type']} {order['quantity']} {order['tradingsymbol']} | Status: {order['status']}")
    else:
        print("   No orders found")
    
    print(f"\n" + "=" * 60)
    print("Day 1 Setup Complete! 🎉")
    print("Mock trading system is ready for strategy development.")
    print("=" * 60)

if __name__ == "__main__":
    main()
