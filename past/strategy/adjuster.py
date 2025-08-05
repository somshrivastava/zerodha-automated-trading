import os
import json
from typing import List, Dict
from datetime import datetime, timedelta
from api.trading_system import TradingSystem
from utils.logger import log_trade

ADJUSTED_POSITIONS_FILE = 'adjusted_positions.json'
ADJUSTMENT_COOLDOWN_HOURS = 1  # Minimum hours between adjustments for same symbol

def _load_adjusted_positions() -> Dict:
    """Load previously adjusted positions from JSON file."""
    try:
        if os.path.exists(ADJUSTED_POSITIONS_FILE):
            with open(ADJUSTED_POSITIONS_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load adjusted positions file: {e}")
    return {}

def _save_adjusted_positions(adjusted_positions: Dict) -> None:
    """Save adjusted positions to JSON file."""
    try:
        with open(ADJUSTED_POSITIONS_FILE, 'w') as f:
            json.dump(adjusted_positions, f, indent=2)
    except Exception as e:
        print(f"Warning: Could not save adjusted positions file: {e}")

def _is_recently_adjusted(symbol: str, current_delta: float, target_delta: float, adjusted_positions: Dict) -> bool:
    """Check if a position was recently adjusted and is still within target range."""
    if symbol not in adjusted_positions:
        return False
    
    record = adjusted_positions[symbol]
    
    # Check if adjustment was recent (within cooldown period)
    try:
        last_adjusted = datetime.fromisoformat(record['last_adjusted'])
        if datetime.now() - last_adjusted < timedelta(hours=ADJUSTMENT_COOLDOWN_HOURS):
            # Check if current delta is still close to target
            delta_tolerance = 0.05  # 5% tolerance
            if abs(current_delta - target_delta) <= delta_tolerance:
                return True
    except (KeyError, ValueError):
        pass
    
    return False

def _update_adjusted_position(symbol: str, target_delta: float, adjusted_positions: Dict) -> None:
    """Update the adjusted positions record for a symbol."""
    adjusted_positions[symbol] = {
        'target_delta': target_delta,
        'last_adjusted': datetime.now().isoformat()
    }

def _cleanup_closed_positions(current_symbols: List[str], adjusted_positions: Dict) -> Dict:
    """Remove symbols from adjusted positions that are no longer in current positions."""
    return {symbol: data for symbol, data in adjusted_positions.items() if symbol in current_symbols}

def adjust_positions(trading_system: TradingSystem) -> None:
    positions = trading_system.get_positions()
    
    # Load previously adjusted positions
    adjusted_positions = _load_adjusted_positions()
    current_symbols = [pos.get('tradingsymbol', '') for pos in positions if pos.get('quantity', 0) != 0]
    
    # Clean up closed positions from the adjusted positions tracker
    adjusted_positions = _cleanup_closed_positions(current_symbols, adjusted_positions)
    
    sell_delta_target = float(os.getenv('SELL_DELTA', '0.5'))
    buy_delta_target = float(os.getenv('BUY_DELTA', '0.3'))
    adjustment_threshold_high = float(os.getenv('ADJUSTMENT_THRESHOLD_HIGH', '0.75'))
    adjustment_threshold_low = float(os.getenv('ADJUSTMENT_THRESHOLD_LOW', '0.25'))
    buy_adjustment_threshold = float(os.getenv('BUY_ADJUSTMENT_THRESHOLD', '0.6'))
    
    underlying = os.getenv('INDEX_SYMBOL', 'NIFTY')
    
    print(f"Checking {len(positions)} positions for delta adjustments...")
    if adjusted_positions:
        print(f"Found {len(adjusted_positions)} previously adjusted positions to consider...")
    
    adjustments_made = 0
    
    for position in positions:
        symbol = position.get('tradingsymbol', '')
        quantity = position.get('quantity', 0)
        
        if quantity == 0:
            continue
            
        current_delta = _get_position_delta(trading_system, symbol, underlying)
        if current_delta is None:
            print(f"Could not get delta for {symbol}, skipping...")
            continue
            
        abs_quantity = abs(quantity)
        is_short = quantity < 0
        is_long = quantity > 0
        
        print(f"Position: {symbol}, Quantity: {quantity}, Current Delta: {current_delta:.3f}")
        
        adjustment_needed = False
        new_target_delta = None
        new_transaction_type = None
        
        if is_short:  # SELL position
            # For SELL positions, check if delta is outside acceptable range
            # For positive deltas (calls): should be between low and high thresholds
            # For negative deltas (puts): should be between -high and -low thresholds
            if current_delta >= 0:  # CALL option
                if current_delta >= adjustment_threshold_high or current_delta <= adjustment_threshold_low:
                    new_target_delta = sell_delta_target
                    new_transaction_type = 'SELL'
                    
                    # Check if recently adjusted to this target
                    if _is_recently_adjusted(symbol, current_delta, new_target_delta, adjusted_positions):
                        print(f"  → SELL CALL recently adjusted to target {new_target_delta:.3f}, skipping")
                        continue
                    
                    adjustment_needed = True
                    print(f"  → SELL CALL delta {current_delta:.3f} outside range [{adjustment_threshold_low}, {adjustment_threshold_high}]")
            else:  # PUT option
                if current_delta <= -adjustment_threshold_high or current_delta >= -adjustment_threshold_low:
                    new_target_delta = -sell_delta_target  # Target negative delta for puts
                    new_transaction_type = 'SELL'
                    
                    # Check if recently adjusted to this target
                    if _is_recently_adjusted(symbol, current_delta, new_target_delta, adjusted_positions):
                        print(f"  → SELL PUT recently adjusted to target {new_target_delta:.3f}, skipping")
                        continue
                    
                    adjustment_needed = True
                    print(f"  → SELL PUT delta {current_delta:.3f} outside range [{-adjustment_threshold_high}, {-adjustment_threshold_low}]")
                
        elif is_long:  # BUY position
            if abs(current_delta) >= buy_adjustment_threshold:
                # Determine target delta based on option type
                new_target_delta = buy_delta_target if current_delta >= 0 else -buy_delta_target
                new_transaction_type = 'BUY'
                
                # Check if recently adjusted to this target
                if _is_recently_adjusted(symbol, current_delta, new_target_delta, adjusted_positions):
                    print(f"  → BUY position recently adjusted to target {new_target_delta:.3f}, skipping")
                    continue
                
                adjustment_needed = True
                print(f"  → BUY position delta {abs(current_delta):.3f} above threshold {buy_adjustment_threshold}")
        
        if adjustment_needed:
            success = _execute_adjustment(
                trading_system, 
                symbol, 
                abs_quantity, 
                current_delta,
                new_target_delta,
                new_transaction_type,
                underlying,
                adjusted_positions
            )
            if success:
                adjustments_made += 1
        else:
            print(f"  → No adjustment needed")
    
    # Save updated adjusted positions
    _save_adjusted_positions(adjusted_positions)
    
    print(f"\nAdjustment summary: {adjustments_made} positions adjusted")

def _get_position_delta(trading_system: TradingSystem, symbol: str, underlying: str) -> float:
    """Get delta for a position by searching across all available expiries."""
    try:
        # Get available expiries
        available_expiries = trading_system.get_available_expiries(underlying)
        all_expiries = [available_expiries.get('weekly'), available_expiries.get('monthly')]
        
        # Remove None values
        all_expiries = [exp for exp in all_expiries if exp]
        
        # Search each expiry for the symbol
        for expiry in all_expiries:
            option_chain = trading_system.get_option_chain(underlying, expiry)
            
            # Navigate the option chain structure: data.oc.{strike}.ce/pe
            for strike_price, strike_data in option_chain.get('data', {}).get('oc', {}).items():
                
                # Check CE options
                ce_data = strike_data.get('ce', {})
                if ce_data.get('tradingsymbol') == symbol:
                    return ce_data.get('greeks', {}).get('delta', 0.0)
                
                # Check PE options
                pe_data = strike_data.get('pe', {})
                if pe_data.get('tradingsymbol') == symbol:
                    return pe_data.get('greeks', {}).get('delta', 0.0)
        
        return None
        
    except Exception as e:
        print(f"Error getting delta for {symbol}: {e}")
        return None

def _execute_adjustment(
    trading_system: TradingSystem,
    old_symbol: str,
    quantity: int,
    old_delta: float,
    target_delta: float,
    transaction_type: str,
    underlying: str,
    adjusted_positions: Dict
) -> bool:
    print(f"  → Executing adjustment for {old_symbol}")
    
    # Step 1: Exit current position
    exit_transaction = 'BUY' if transaction_type == 'SELL' else 'SELL'
    
    try:
        exit_order = trading_system.place_order(old_symbol, exit_transaction, quantity)
        print(f"    ✓ Exited position: {exit_transaction} {quantity} {old_symbol}")
        log_trade(old_symbol, old_delta, exit_transaction, quantity, exit_order.get('order_id', 'N/A'))
        
    except Exception as e:
        print(f"    ✗ Failed to exit position {old_symbol}: {e}")
        return False
    
    # Step 2: Find new option at target delta with appropriate expiry
    option_type = 'CE' if old_symbol.endswith('CE') else 'PE'
    
    try:
        # Get available expiries
        available_expiries = trading_system.get_available_expiries(underlying)
        
        # Choose expiry based on transaction type:
        # SELL positions use weekly expiry (higher premiums)
        # BUY positions use monthly expiry (better protection)
        if transaction_type == 'SELL':
            target_expiry = available_expiries.get('weekly')
            print(f"    → Using weekly expiry {target_expiry} for SELL position")
        else:  # BUY
            target_expiry = available_expiries.get('monthly')
            print(f"    → Using monthly expiry {target_expiry} for BUY position")
        
        # For puts, we want to find options with the absolute value of target delta
        search_delta = abs(target_delta) if option_type == 'PE' else target_delta
        new_options = trading_system.find_options_by_delta(
            underlying, 
            search_delta, 
            option_type=option_type,
            expiry=target_expiry
        )
        
        if not new_options:
            print(f"    ✗ No options found at target delta {search_delta} for {option_type} with expiry {target_expiry}")
            return False
            
        new_option = new_options[0]
        new_symbol = new_option.get('tradingsymbol')
        new_delta = new_option.get('greeks', {}).get('delta', 0.0)
        
        # Step 3: Enter new position
        new_order = trading_system.place_order(new_symbol, transaction_type, quantity)
        print(f"    ✓ Entered new position: {transaction_type} {quantity} {new_symbol} (Delta: {new_delta:.3f}, Expiry: {target_expiry})")
        log_trade(new_symbol, new_delta, transaction_type, quantity, new_order.get('order_id', 'N/A'))
        
        # Step 4: Update adjusted positions tracker
        _update_adjusted_position(new_symbol, new_delta, adjusted_positions)
        print(f"    ✓ Recorded adjustment: {new_symbol} → target delta {new_delta:.3f}")
        
        return True
        
    except Exception as e:
        print(f"    ✗ Failed to enter new position: {e}")
        return False
