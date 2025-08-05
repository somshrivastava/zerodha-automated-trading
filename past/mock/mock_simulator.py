"""
Mock Simulator - Market Data Simulation

This module provides functions to simulate market movements and update option chain data.
"""

import random
import time
from datetime import datetime

def simulate_market_step():
    """
    Simulate one step of market movement.
    
    This function simulates:
    - Underlying price movements
    - Option price updates
    - Greeks recalculation
    - Market volatility changes
    """
    
    # Import simulator here to avoid circular imports
    from simulator.simulator_adapter import _simulators
    
    # Simulate underlying price movement (-1% to +1%)
    price_movement_percent = random.uniform(-1.0, 1.0)
    
    # Update all active simulators
    for underlying, simulator in _simulators.items():
        # Calculate new spot price
        old_price = simulator.spot_price
        new_price = old_price * (1 + price_movement_percent / 100)
        
        # Update simulator's spot price
        simulator.spot_price = new_price
        
        # Regenerate option chains with new underlying price
        simulator.generate_all_chains()
        
        print(f"📈 {underlying}: {old_price:.2f} → {new_price:.2f} ({price_movement_percent:+.2f}%)")
    
    # If no simulators exist yet, just log the movement
    if not _simulators:
        print(f"📈 Market simulation: {price_movement_percent:+.2f}% movement ready")
    
    # Brief processing delay to simulate real market data processing
    time.sleep(0.05)
