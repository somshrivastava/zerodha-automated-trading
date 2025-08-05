import random
import math
from datetime import datetime, timedelta
from typing import Dict, List

class OptionChainSimulator:
    def __init__(self, underlying: str, spot_price: float):
        self.underlying = underlying
        self.spot_price = spot_price
        self.expiry_chains = {}
        self._generate_expiries()
        self.generate_all_chains()
    
    def _generate_expiries(self) -> None:
        """Generate realistic weekly and monthly expiries."""
        today = datetime.now()
        
        # Find next Thursday (weekly expiry)
        days_until_thursday = (3 - today.weekday()) % 7
        if days_until_thursday == 0 and today.hour >= 15:  # After 3 PM Thursday
            days_until_thursday = 7
        
        weekly_expiry = today + timedelta(days=days_until_thursday)
        
        # Find last Thursday of next month (monthly expiry)
        next_month = today.replace(day=1) + timedelta(days=32)
        next_month = next_month.replace(day=1)
        
        # Find last Thursday of next month
        last_day = (next_month.replace(month=next_month.month % 12 + 1, day=1) - timedelta(days=1))
        
        # Find the last Thursday
        monthly_expiry = last_day
        while monthly_expiry.weekday() != 3:  # Thursday is 3
            monthly_expiry -= timedelta(days=1)
        
        # Store expiries with date strings
        self.weekly_expiry = weekly_expiry.strftime("%Y-%m-%d")
        self.monthly_expiry = monthly_expiry.strftime("%Y-%m-%d")
        
        # Initialize chains for both expiries
        self.expiry_chains[self.weekly_expiry] = {}
        self.expiry_chains[self.monthly_expiry] = {}
    
    def _calculate_time_factor(self, expiry_str: str) -> float:
        """Calculate time factor for Greeks calculation based on expiry."""
        expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
        days_to_expiry = (expiry_date - datetime.now()).days
        
        # Time factor for option pricing (normalized)
        if days_to_expiry <= 7:  # Weekly
            return 0.3  # Lower time value
        else:  # Monthly
            return 0.8  # Higher time value
    
    def _generate_chain_for_expiry(self, expiry: str) -> Dict:
        """Generate option chain for a specific expiry."""
        time_factor = self._calculate_time_factor(expiry)
        
        # Generate strikes around current spot (typically ±20% range)
        strikes = []
        base_strike = round(self.spot_price / 50) * 50  # Round to nearest 50
        
        for i in range(-20, 21):  # 41 strikes total
            strike = base_strike + (i * 50)
            if strike > 0:
                strikes.append(strike)
        
        chain = {}
        
        # Determine if this is weekly or monthly based on time factor
        is_weekly = time_factor < 0.5
        
        for strike in strikes:
            # Calculate moneyness
            moneyness = strike / self.spot_price
            
            # Calculate realistic delta based on moneyness and expiry type
            if is_weekly:
                # Weekly options - more concentrated around ATM
                if moneyness < 0.9:  # Deep ITM calls, OTM puts
                    call_delta = 0.8 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 0.95:  # ITM calls, slightly OTM puts  
                    call_delta = 0.65 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.05:  # ATM options
                    call_delta = 0.5 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.1:  # Slightly OTM calls, ITM puts
                    call_delta = 0.35 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                else:  # Deep OTM calls, deep ITM puts
                    call_delta = 0.2 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
            else:
                # Monthly options - wider spread of deltas
                if moneyness < 0.80:  # Deep ITM calls, Deep OTM puts
                    call_delta = 0.9 + random.uniform(-0.03, 0.03)
                    put_delta = call_delta - 1.0
                elif moneyness < 0.88:  # ITM calls, OTM puts  
                    call_delta = 0.75 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 0.94:  # Slightly ITM calls, slightly OTM puts
                    call_delta = 0.6 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 0.98:  # Near ATM calls
                    call_delta = 0.5 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.02:  # ATM options
                    call_delta = 0.45 + random.uniform(-0.05, 0.05)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.06:  # Slightly OTM calls, slightly ITM puts
                    call_delta = 0.35 + random.uniform(-0.03, 0.03)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.12:  # OTM calls, ITM puts
                    call_delta = 0.25 + random.uniform(-0.03, 0.03)
                    put_delta = call_delta - 1.0
                elif moneyness < 1.20:  # More OTM calls, more ITM puts  
                    call_delta = 0.15 + random.uniform(-0.02, 0.02)
                    put_delta = call_delta - 1.0
                else:  # Deep OTM calls, deep ITM puts
                    call_delta = 0.08 + random.uniform(-0.02, 0.02)
                    put_delta = call_delta - 1.0
            
            # Ensure deltas are within realistic bounds
            call_delta = max(0.01, min(0.99, call_delta))
            put_delta = max(-0.99, min(-0.01, put_delta))
            
            # Calculate prices based on intrinsic + time value
            call_intrinsic = max(0, self.spot_price - strike)
            put_intrinsic = max(0, strike - self.spot_price)
            
            call_time_value = abs(call_delta) * self.spot_price * 0.02 * time_factor
            put_time_value = abs(put_delta) * self.spot_price * 0.02 * time_factor
            
            call_price = call_intrinsic + call_time_value
            put_price = put_intrinsic + put_time_value
            
            # Format expiry for symbol (YYMMDD)
            expiry_date = datetime.strptime(expiry, "%Y-%m-%d")
            expiry_formatted = expiry_date.strftime("%y%m%d")
            
            # Create option data
            chain[str(strike)] = {
                "ce": {
                    "tradingsymbol": f"{self.underlying}{expiry_formatted}{int(strike)}CE",
                    "ltp": round(call_price, 2),
                    "strike": strike,
                    "expiry": expiry,
                    "option_type": "CE",
                    "greeks": {
                        "delta": round(call_delta, 4),
                        "gamma": round(0.001 * time_factor, 6),
                        "theta": round(-0.5 * time_factor, 4),
                        "vega": round(0.1 * time_factor, 4)
                    }
                },
                "pe": {
                    "tradingsymbol": f"{self.underlying}{expiry_formatted}{int(strike)}PE",
                    "ltp": round(put_price, 2),
                    "strike": strike,
                    "expiry": expiry,
                    "option_type": "PE",
                    "greeks": {
                        "delta": round(put_delta, 4),
                        "gamma": round(0.001 * time_factor, 6),
                        "theta": round(-0.5 * time_factor, 4),
                        "vega": round(0.1 * time_factor, 4)
                    }
                }
            }
        
        return chain
    
    def generate_all_chains(self) -> None:
        """Generate option chains for all expiries."""
        for expiry in self.expiry_chains.keys():
            self.expiry_chains[expiry] = self._generate_chain_for_expiry(expiry)
    
    def get_option_chain(self, expiry: str = None) -> Dict:
        """
        Get option chain for specific expiry or all expiries.
        
        Args:
            expiry: Specific expiry date (YYYY-MM-DD) or None for all
        
        Returns:
            Option chain data in Dhan API format
        """
        if expiry:
            if expiry not in self.expiry_chains:
                # Try to generate the chain if expiry is valid but not cached
                try:
                    self.expiry_chains[expiry] = self._generate_chain_for_expiry(expiry)
                except:
                    return {"data": {"oc": {}}}
            
            return {
                "data": {
                    "oc": self.expiry_chains[expiry]
                }
            }
        else:
            # Return all expiries combined (legacy support)
            combined_chain = {}
            for expiry_date, chain in self.expiry_chains.items():
                combined_chain.update(chain)
            
            return {
                "data": {
                    "oc": combined_chain
                }
            }
    
    def get_available_expiries(self) -> Dict[str, str]:
        """
        Return available expiries with weekly/monthly categorization.
        
        Returns:
            Dict with 'weekly' and 'monthly' keys
        """
        return {
            "weekly": self.weekly_expiry,
            "monthly": self.monthly_expiry
        }
    
    def find_options_by_delta(
        self, 
        target_delta: float, 
        option_type: str = 'CE', 
        expiry: str = None
    ) -> List[Dict]:
        """
        Find options closest to target delta for specific expiry.
        
        Args:
            target_delta: Target delta value
            option_type: 'CE' or 'PE'
            expiry: Specific expiry or None for weekly
        
        Returns:
            List of options sorted by delta proximity
        """
        if not expiry:
            expiry = self.weekly_expiry  # Default to weekly
        
        if expiry not in self.expiry_chains:
            return []
        
        options = []
        chain = self.expiry_chains[expiry]
        
        for strike, strike_data in chain.items():
            option_data = strike_data.get(option_type.lower(), {})
            if option_data:
                current_delta = option_data.get('greeks', {}).get('delta', 0)
                delta_diff = abs(current_delta - target_delta)
                
                option_data['_delta_diff'] = delta_diff
                options.append(option_data)
        
        # Sort by delta proximity
        options.sort(key=lambda x: x['_delta_diff'])
        
        # Remove the temporary delta_diff field
        for option in options:
            option.pop('_delta_diff', None)
        
        return options[:10]  # Return top 10 matches
