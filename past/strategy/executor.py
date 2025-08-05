from typing import Dict
from api.trading_system import TradingSystem

def run_delta_trade(
    trading_system: TradingSystem,
    options: Dict,
    quantity: int
) -> None:
    sell_put_response = trading_system.place_order(
        tradingsymbol=options['sell_put']['tradingsymbol'],
        transaction_type='SELL',
        quantity=quantity
    )
    
    sell_call_response = trading_system.place_order(
        tradingsymbol=options['sell_call']['tradingsymbol'],
        transaction_type='SELL',
        quantity=quantity
    )
    
    buy_put_response = trading_system.place_order(
        tradingsymbol=options['buy_put']['tradingsymbol'],
        transaction_type='BUY',
        quantity=quantity
    )
    
    buy_call_response = trading_system.place_order(
        tradingsymbol=options['buy_call']['tradingsymbol'],
        transaction_type='BUY',
        quantity=quantity
    )
    
    sell_put_delta = options['sell_put']['greeks']['delta']
    sell_call_delta = options['sell_call']['greeks']['delta']
    buy_put_delta = options['buy_put']['greeks']['delta']
    buy_call_delta = options['buy_call']['greeks']['delta']
    
    print(f"SELL {options['sell_put']['tradingsymbol']} (Delta: {sell_put_delta:+.2f}) - Order ID: {sell_put_response['data']['order_id']}")
    print(f"SELL {options['sell_call']['tradingsymbol']} (Delta: {sell_call_delta:+.2f}) - Order ID: {sell_call_response['data']['order_id']}")
    print(f"BUY {options['buy_put']['tradingsymbol']} (Delta: {buy_put_delta:+.2f}) - Order ID: {buy_put_response['data']['order_id']}")
    print(f"BUY {options['buy_call']['tradingsymbol']} (Delta: {buy_call_delta:+.2f}) - Order ID: {buy_call_response['data']['order_id']}")
