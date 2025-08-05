from typing import Dict, Tuple, Optional
from api.trading_system import TradingSystem

def find_best_options_by_delta(
    trading_system: TradingSystem,
    underlying: str,
    sell_delta: float,
    buy_delta: float,
    quantity: int,
    sell_expiry: Optional[str] = None,
    buy_expiry: Optional[str] = None
) -> Dict:
    """
    Find best options by delta for different expiries.
    
    Args:
        trading_system: Trading system instance
        underlying: Underlying symbol (e.g., 'NIFTY')
        sell_delta: Target delta for SELL positions (typically weekly expiry)
        buy_delta: Target delta for BUY positions (typically monthly expiry)
        quantity: Quantity for all positions
        sell_expiry: Specific expiry for SELL positions (weekly if None)
        buy_expiry: Specific expiry for BUY positions (monthly if None)
    
    Returns:
        Dict with sell_put, sell_call, buy_put, buy_call options
    """
    # Get available expiries if specific ones not provided
    if not sell_expiry or not buy_expiry:
        available_expiries = trading_system.get_available_expiries(underlying)
        if not sell_expiry:
            sell_expiry = available_expiries.get('weekly')  # Use weekly for sells
        if not buy_expiry:
            buy_expiry = available_expiries.get('monthly')  # Use monthly for buys
    
    # Find SELL options (typically weekly expiry for higher premiums)
    # For PUTs, use negative delta since PUT deltas are negative
    sell_puts = trading_system.find_options_by_delta(underlying, -sell_delta, option_type='PE', expiry=sell_expiry)
    sell_calls = trading_system.find_options_by_delta(underlying, sell_delta, option_type='CE', expiry=sell_expiry)
    
    # Find BUY options (typically monthly expiry for protection)
    # Use wider tolerance for BUY options and negative delta for PUTs
    buy_puts = trading_system.find_options_by_delta(underlying, -buy_delta, option_type='PE', tolerance=0.2, expiry=buy_expiry)
    buy_calls = trading_system.find_options_by_delta(underlying, buy_delta, option_type='CE', expiry=buy_expiry)
    
    return {
        "sell_put": sell_puts[0] if sell_puts else {},
        "sell_call": sell_calls[0] if sell_calls else {},
        "buy_put": buy_puts[0] if buy_puts else {},
        "buy_call": buy_calls[0] if buy_calls else {},
        "expiries_used": {
            "sell_expiry": sell_expiry,
            "buy_expiry": buy_expiry
        }
    }
