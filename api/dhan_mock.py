import json
import os
from typing import Dict, List, Optional

class DhanMockAPI:
    def __init__(self):
        self.mock_data_path = os.path.join(os.path.dirname(__file__), '..', 'mock_data', 'dhan_option_chain.json')
        self.option_chain_data = self._load_mock_data()
    
    def _load_mock_data(self) -> Dict:
        try:
            with open(self.mock_data_path, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            print(f"Mock data file not found: {self.mock_data_path}")
            return {}
        except json.JSONDecodeError:
            print(f"Invalid JSON in mock data file: {self.mock_data_path}")
            return {}
    
    def get_option_chain(self, underlying: str) -> Optional[Dict]:
        return self.option_chain_data.get(underlying.upper())
    
    def get_ltp(self, symbol: str) -> Optional[float]:
        for underlying_symbol, underlying_data in self.option_chain_data.items():
            if 'data' not in underlying_data or 'oc' not in underlying_data['data']:
                continue
                
            for strike, strike_data in underlying_data['data']['oc'].items():
                for option_type in ['ce', 'pe']:
                    if option_type in strike_data:
                        option = strike_data[option_type]
                        if option.get('tradingsymbol') == symbol:
                            return option.get('last_price')
        
        return None
    
    def get_underlying_price(self, underlying: str) -> Optional[float]:
        data = self.get_option_chain(underlying)
        if data and 'data' in data:
            return data['data'].get('last_price')
        return None
    
    def get_options_by_delta(self, underlying: str, target_delta: float, option_type: str = None, tolerance: float = 0.05) -> List[Dict]:
        underlying_data = self.get_option_chain(underlying)
        if not underlying_data or 'data' not in underlying_data or 'oc' not in underlying_data['data']:
            return []
        
        matching_options = []
        for strike, strike_data in underlying_data['data']['oc'].items():
            for opt_type in ['ce', 'pe']:
                if option_type and opt_type != option_type.lower():
                    continue
                    
                if opt_type in strike_data:
                    option = strike_data[opt_type]
                    if 'greeks' in option and 'delta' in option['greeks']:
                        option_delta = abs(option['greeks']['delta'])
                        
                        if abs(option_delta - abs(target_delta)) <= tolerance:
                            option_with_meta = option.copy()
                            option_with_meta['strike'] = float(strike)
                            option_with_meta['option_type'] = opt_type.upper()
                            matching_options.append(option_with_meta)
        
        matching_options.sort(key=lambda x: abs(abs(x['greeks']['delta']) - abs(target_delta)))
        return matching_options
