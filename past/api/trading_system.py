from typing import Dict, List, Optional
from .dhan_mock import DhanMockAPI
from .zerodha_mock import ZerodhaMockAPI
import config

class TradingSystem:
    def __init__(self):
        self.mode = config.MODE
        
        if self.mode == 'mock':
            self.dhan_api = DhanMockAPI()
            self.zerodha_api = ZerodhaMockAPI()
            print(f"Trading system initialized in {self.mode} mode")
        else:
            raise NotImplementedError(f"Mode '{self.mode}' not implemented yet")
    
    def get_option_chain(self, underlying: str, expiry: str = None) -> Optional[Dict]:
        # Check if we should use simulator instead of mock JSON data
        if self.mode == 'mock' and getattr(config, 'MOCK_DATA_MODE', None) == 'simulate':
            from simulator.simulator_adapter import get_simulated_option_chain
            return get_simulated_option_chain(underlying, expiry)
        else:
            # For static mock mode, ignore expiry parameter for backward compatibility
            return self.dhan_api.get_option_chain(underlying)
    
    def get_available_expiries(self, underlying: str) -> list:
        """Get available expiry dates for an underlying."""
        if self.mode == 'mock' and getattr(config, 'MOCK_DATA_MODE', None) == 'simulate':
            from simulator.simulator_adapter import get_available_expiries
            return get_available_expiries(underlying)
        else:
            # For static mock mode, return a default expiry
            return ['2024-08-08']  # Default weekly expiry
    
    def get_ltp(self, symbol: str) -> Optional[float]:
        return self.dhan_api.get_ltp(symbol)
    
    def get_underlying_price(self, underlying: str) -> Optional[float]:
        return self.dhan_api.get_underlying_price(underlying)
    
    def place_order(self, tradingsymbol: str, transaction_type: str, quantity: int, 
                   order_type: str = "MARKET", price: float = None, product: str = "NRML") -> Dict:
        return self.zerodha_api.place_order(tradingsymbol, transaction_type, quantity, order_type, price, product)
    
    def get_positions(self) -> List[Dict]:
        return self.zerodha_api.get_positions()
    
    def get_orders(self) -> List[Dict]:
        return self.zerodha_api.get_orders()
    
    def find_options_by_delta(self, underlying: str, target_delta: float, option_type: str = None, 
                             tolerance: float = 0.05, expiry: str = None) -> List[Dict]:
        # For simulated mode, we need to handle expiry-specific queries
        if self.mode == 'mock' and getattr(config, 'MOCK_DATA_MODE', None) == 'simulate':
            # If no expiry specified, get the first available expiry (weekly)
            if expiry is None:
                available_expiries = self.get_available_expiries(underlying)
                if isinstance(available_expiries, dict):
                    expiry = available_expiries.get('weekly')  # Default to weekly
                elif isinstance(available_expiries, list) and available_expiries:
                    expiry = available_expiries[0]  # Use first available
                else:
                    return []
            
            # Get option chain for specific expiry
            chain = self.get_option_chain(underlying, expiry)
            if not chain or not chain.get('data'):
                return []
            
            return self._find_options_by_delta_from_chain(chain, target_delta, option_type, tolerance)
        else:
            # Static mock mode - use existing logic
            return self.dhan_api.get_options_by_delta(underlying, target_delta, option_type, tolerance)
    
    def _find_options_by_delta_from_chain(self, chain: Dict, target_delta: float, 
                                        option_type: str = None, tolerance: float = 0.05) -> List[Dict]:
        """Extract options matching delta criteria from option chain."""
        matching_options = []
        
        if 'data' not in chain or 'oc' not in chain['data']:
            return matching_options
        
        for strike, strike_data in chain['data']['oc'].items():
            for opt_type in ['ce', 'pe']:
                # Filter by option type if specified
                if option_type and opt_type.upper() != option_type.upper():
                    continue
                
                option_data = strike_data.get(opt_type, {})
                if not option_data:
                    continue
                
                option_delta = option_data.get('greeks', {}).get('delta', 0)
                
                # Check if delta matches within tolerance
                if abs(option_delta - target_delta) <= tolerance:
                    matching_options.append(option_data)
        
        # Sort by delta proximity to target
        matching_options.sort(key=lambda x: abs(x.get('greeks', {}).get('delta', 0) - target_delta))
        return matching_options
