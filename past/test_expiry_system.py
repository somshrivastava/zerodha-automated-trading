#!/usr/bin/env python3
"""
Test script to verify the expiry-aware option chain simulator system.
"""

import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Ensure we're using simulate mode
os.environ['MOCK_DATA_MODE'] = 'simulate'

from api.trading_system import TradingSystem
from strategy.selector import find_best_options_by_delta

def test_expiry_system():
    print("=== Testing Expiry-Aware Option Chain System ===\n")
    
    trading_system = TradingSystem()
    underlying = 'NIFTY'
    
    print("1. Testing available expiries:")
    try:
        expiries = trading_system.get_available_expiries(underlying)
        print(f"Available expiries: {expiries}")
        
        weekly_expiry = expiries.get('weekly')
        monthly_expiry = expiries.get('monthly')
        
        print(f"Weekly expiry: {weekly_expiry}")
        print(f"Monthly expiry: {monthly_expiry}")
        
    except Exception as e:
        print(f"Error getting expiries: {e}")
        return
    
    print("\n2. Testing expiry-specific option chains:")
    
    # Test weekly expiry
    try:
        weekly_chain = trading_system.get_option_chain(underlying, weekly_expiry)
        weekly_strikes = list(weekly_chain.get('data', {}).get('oc', {}).keys())
        print(f"Weekly chain ({weekly_expiry}) has {len(weekly_strikes)} strikes")
        
        if weekly_strikes:
            sample_strike = weekly_strikes[0]
            sample_ce = weekly_chain['data']['oc'][sample_strike].get('ce', {})
            sample_symbol = sample_ce.get('tradingsymbol', 'N/A')
            print(f"Sample weekly symbol: {sample_symbol}")
        
    except Exception as e:
        print(f"Error getting weekly chain: {e}")
    
    # Test monthly expiry
    try:
        monthly_chain = trading_system.get_option_chain(underlying, monthly_expiry)
        monthly_strikes = list(monthly_chain.get('data', {}).get('oc', {}).keys())
        print(f"Monthly chain ({monthly_expiry}) has {len(monthly_strikes)} strikes")
        
        if monthly_strikes:
            sample_strike = monthly_strikes[0]
            sample_ce = monthly_chain['data']['oc'][sample_strike].get('ce', {})
            sample_symbol = sample_ce.get('tradingsymbol', 'N/A')
            print(f"Sample monthly symbol: {sample_symbol}")
        
    except Exception as e:
        print(f"Error getting monthly chain: {e}")
    
    print("\n3. Testing delta-based option finding with expiries:")
    
    try:
        # Test finding options with specific expiry
        weekly_ce_options = trading_system.find_options_by_delta(
            underlying, 0.15, option_type='CE', expiry=weekly_expiry  # Use 0.15 for weekly
        )
        print(f"Found {len(weekly_ce_options)} weekly CE options at 0.15 delta")
        
        if weekly_ce_options:
            option = weekly_ce_options[0]
            symbol = option.get('tradingsymbol')
            delta = option.get('greeks', {}).get('delta', 0)
            print(f"Best weekly CE: {symbol} (Delta: {delta:.3f})")
        
        monthly_pe_options = trading_system.find_options_by_delta(
            underlying, -0.3, option_type='PE', expiry=monthly_expiry  # Use -0.3 for PE
        )
        print(f"Found {len(monthly_pe_options)} monthly PE options at 0.3 delta")
        
        if monthly_pe_options:
            option = monthly_pe_options[0]
            symbol = option.get('tradingsymbol')
            delta = option.get('greeks', {}).get('delta', 0)
            print(f"Best monthly PE: {symbol} (Delta: {delta:.3f})")
            
    except Exception as e:
        print(f"Error finding options by delta: {e}")
    
    print("\n4. Testing enhanced selector with expiry support:")
    
    try:
        result = find_best_options_by_delta(
            trading_system=trading_system,
            underlying=underlying,
            sell_delta=0.15,  # Realistic weekly delta for SELL positions
            buy_delta=0.3,    # Realistic monthly delta for BUY positions
            quantity=25
        )
        
        print("Selector results:")
        for position_type, option in result.items():
            if position_type == 'expiries_used':
                print(f"Expiries used: {option}")
            elif option:
                symbol = option.get('tradingsymbol', 'N/A')
                delta = option.get('greeks', {}).get('delta', 0)
                print(f"{position_type}: {symbol} (Delta: {delta:.3f})")
            else:
                print(f"{position_type}: No option found")
                
    except Exception as e:
        print(f"Error testing selector: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_expiry_system()
