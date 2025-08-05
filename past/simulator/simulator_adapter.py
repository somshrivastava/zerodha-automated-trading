from simulator.option_chain_simulator import OptionChainSimulator
from typing import Dict, Optional

# Global simulator instance for persistence across calls
_simulators = {}

def get_simulated_option_chain(underlying: str, expiry: str = None) -> Dict:
    """
    Get simulated option chain data for the given underlying and expiry.
    Creates a new simulator if one doesn't exist, or uses existing one.
    """
    global _simulators
    
    if underlying not in _simulators:
        # Initialize with reasonable spot price based on underlying
        if underlying.upper() == 'NIFTY':
            spot_price = 25000.0
        elif underlying.upper() == 'BANKNIFTY':
            spot_price = 51000.0
        else:
            spot_price = 25000.0  # Default
        
        _simulators[underlying] = OptionChainSimulator(underlying, spot_price)
    
    # No need to tick - simulator generates fresh data each time
    
    # Return chain for specific expiry or error if not provided
    return _simulators[underlying].get_option_chain(expiry)

def get_available_expiries(underlying: str) -> Dict:
    """Get available expiry dates for an underlying."""
    global _simulators
    
    if underlying not in _simulators:
        # Initialize simulator if it doesn't exist
        get_simulated_option_chain(underlying)
    
    return _simulators[underlying].get_available_expiries()
