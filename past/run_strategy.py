#!/usr/bin/env python3

import config
from api.trading_system import TradingSystem
from strategy.selector import find_best_options_by_delta
from strategy.executor import run_delta_trade
from utils.logger import log_trade

def main():
    trading_system = TradingSystem()
    
    options = find_best_options_by_delta(
        trading_system=trading_system,
        underlying=config.INDEX_SYMBOL,
        sell_delta=config.SELL_DELTA,
        buy_delta=config.BUY_DELTA,
        quantity=config.DEFAULT_QUANTITY
    )
    
    # Check if all required options are found
    required_options = ['sell_put', 'sell_call', 'buy_put', 'buy_call']
    missing_options = []
    
    for option_type in required_options:
        if not options.get(option_type) or 'tradingsymbol' not in options[option_type]:
            missing_options.append(option_type)
    
    if missing_options:
        print(f"Warning: Could not find suitable options for: {', '.join(missing_options)}")
        return
    
    try:
        # Get current positions to check for existing trades
        current_positions = trading_system.get_positions()
        
        def position_exists(symbol: str, transaction_type: str, quantity: int) -> bool:
            for pos in current_positions:
                if pos.get('tradingsymbol') == symbol:
                    pos_qty = pos.get('quantity', 0)
                    if transaction_type == 'SELL' and pos_qty == -quantity:
                        return True
                    elif transaction_type == 'BUY' and pos_qty == quantity:
                        return True
            return False
        
        # Execute the delta trade with all 4 options, checking for existing positions
        sell_put_exists = position_exists(options['sell_put']['tradingsymbol'], 'SELL', config.DEFAULT_QUANTITY)
        sell_call_exists = position_exists(options['sell_call']['tradingsymbol'], 'SELL', config.DEFAULT_QUANTITY)
        buy_put_exists = position_exists(options['buy_put']['tradingsymbol'], 'BUY', config.DEFAULT_QUANTITY)
        buy_call_exists = position_exists(options['buy_call']['tradingsymbol'], 'BUY', config.DEFAULT_QUANTITY)
        
        if sell_put_exists:
            print(f"✓ Position already exists for {options['sell_put']['tradingsymbol']}, skipping trade.")
        else:
            sell_put_response = trading_system.place_order(
                tradingsymbol=options['sell_put']['tradingsymbol'],
                transaction_type='SELL',
                quantity=config.DEFAULT_QUANTITY
            )
        
        if sell_call_exists:
            print(f"✓ Position already exists for {options['sell_call']['tradingsymbol']}, skipping trade.")
        else:
            sell_call_response = trading_system.place_order(
                tradingsymbol=options['sell_call']['tradingsymbol'],
                transaction_type='SELL',
                quantity=config.DEFAULT_QUANTITY
            )
        
        if buy_put_exists:
            print(f"✓ Position already exists for {options['buy_put']['tradingsymbol']}, skipping trade.")
        else:
            buy_put_response = trading_system.place_order(
                tradingsymbol=options['buy_put']['tradingsymbol'],
                transaction_type='BUY',
                quantity=config.DEFAULT_QUANTITY
            )
        
        if buy_call_exists:
            print(f"✓ Position already exists for {options['buy_call']['tradingsymbol']}, skipping trade.")
        else:
            buy_call_response = trading_system.place_order(
                tradingsymbol=options['buy_call']['tradingsymbol'],
                transaction_type='BUY',
                quantity=config.DEFAULT_QUANTITY
            )
        
        # Print trade execution results only for executed orders
        sell_put_delta = options['sell_put']['greeks']['delta']
        sell_call_delta = options['sell_call']['greeks']['delta']
        buy_put_delta = options['buy_put']['greeks']['delta']
        buy_call_delta = options['buy_call']['greeks']['delta']
        
        if not sell_put_exists:
            print(f"SELL {options['sell_put']['tradingsymbol']} (Delta: {sell_put_delta:+.2f}) - Order ID: {sell_put_response['data']['order_id']}")
            log_trade(
                symbol=options['sell_put']['tradingsymbol'],
                delta=sell_put_delta,
                transaction_type='SELL',
                quantity=config.DEFAULT_QUANTITY,
                order_id=sell_put_response['data']['order_id']
            )
        
        if not sell_call_exists:
            print(f"SELL {options['sell_call']['tradingsymbol']} (Delta: {sell_call_delta:+.2f}) - Order ID: {sell_call_response['data']['order_id']}")
            log_trade(
                symbol=options['sell_call']['tradingsymbol'],
                delta=sell_call_delta,
                transaction_type='SELL',
                quantity=config.DEFAULT_QUANTITY,
                order_id=sell_call_response['data']['order_id']
            )
        
        if not buy_put_exists:
            print(f"BUY {options['buy_put']['tradingsymbol']} (Delta: {buy_put_delta:+.2f}) - Order ID: {buy_put_response['data']['order_id']}")
            log_trade(
                symbol=options['buy_put']['tradingsymbol'],
                delta=buy_put_delta,
                transaction_type='BUY',
                quantity=config.DEFAULT_QUANTITY,
                order_id=buy_put_response['data']['order_id']
            )
        
        if not buy_call_exists:
            print(f"BUY {options['buy_call']['tradingsymbol']} (Delta: {buy_call_delta:+.2f}) - Order ID: {buy_call_response['data']['order_id']}")
            log_trade(
                symbol=options['buy_call']['tradingsymbol'],
                delta=buy_call_delta,
                transaction_type='BUY',
                quantity=config.DEFAULT_QUANTITY,
                order_id=buy_call_response['data']['order_id']
            )
        
    except Exception as e:
        print(f"Warning: Order execution failed - {e}")
        return

if __name__ == "__main__":
    main()
