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
    
    def get_option_chain(self, underlying: str) -> Optional[Dict]:
        return self.dhan_api.get_option_chain(underlying)
    
    def get_ltp(self, symbol: str) -> Optional[float]:
        return self.dhan_api.get_ltp(symbol)
    
    def get_underlying_price(self, underlying: str) -> Optional[float]:
        return self.dhan_api.get_underlying_price(underlying)
    
    def place_order(self, tradingsymbol: str, transaction_type: str, quantity: int, 
                   order_type: str = "MARKET", price: float = None, product: str = "MIS") -> Dict:
        return self.zerodha_api.place_order(tradingsymbol, transaction_type, quantity, order_type, price, product)
    
    def get_positions(self) -> List[Dict]:
        return self.zerodha_api.get_positions()
    
    def get_orders(self) -> List[Dict]:
        return self.zerodha_api.get_orders()
    
    def find_options_by_delta(self, underlying: str, target_delta: float, option_type: str = None, tolerance: float = 0.05) -> List[Dict]:
        return self.dhan_api.get_options_by_delta(underlying, target_delta, option_type, tolerance)
