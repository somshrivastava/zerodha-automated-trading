import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

class ZerodhaMockAPI:
    def __init__(self):
        self.positions_file = os.path.join('data', 'positions.json')
        self.orders_file = os.path.join('data', 'orders.json')
        
        self.orders = self._load_json(self.orders_file)
        self.positions = self._load_json(self.positions_file)
    
    def _load_json(self, filepath: str) -> List:
        """Load JSON data from file, return empty list if file doesn't exist or is invalid."""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
        return []
    
    def _save_json(self, filepath: str, data: List) -> None:
        """Save data to JSON file."""
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        except IOError as e:
            print(f"Warning: Could not save {filepath}: {e}")
    
    def place_order(self, tradingsymbol: str, transaction_type: str, quantity: int, 
                   order_type: str = "MARKET", price: float = None, product: str = "NRML") -> Dict:
        order_id = str(uuid.uuid4()).replace('-', '')[:16]
        
        order = {
            'order_id': order_id,
            'tradingsymbol': tradingsymbol,
            'transaction_type': transaction_type.upper(),
            'quantity': quantity,
            'order_type': order_type,
            'price': price if price else 0.0,
            'product': product,
            'status': 'COMPLETE',
            'status_message': 'Order completed successfully',
            'order_timestamp': datetime.now().isoformat(),
            'exchange_timestamp': datetime.now().isoformat(),
            'filled_quantity': quantity,
            'pending_quantity': 0,
            'cancelled_quantity': 0,
            'average_price': price if price else 100.0,
            'exchange': 'NFO',
            'validity': 'DAY',
            'variety': 'regular',
            'tag': None
        }
        
        self.orders.append(order)
        self._update_positions(order)
        
        # Save both files after updating
        self._save_json(self.orders_file, self.orders)
        self._save_json(self.positions_file, self.positions)
        
        print(f"Mock order placed: {transaction_type} {quantity} {tradingsymbol} - Order ID: {order_id}")
        return {
            "status": "success",
            "data": {
                "order_id": order_id
            }
        }
    
    def _update_positions(self, order: Dict):
        tradingsymbol = order['tradingsymbol']
        transaction_type = order['transaction_type']
        quantity = order['filled_quantity']
        price = order['average_price']
        
        existing_position = None
        for position in self.positions:
            if position.get('tradingsymbol') == tradingsymbol:
                existing_position = position
                break
        
        if existing_position:
            current_qty = existing_position['quantity']
            current_avg_price = existing_position['average_price']
            
            if transaction_type == 'BUY':
                new_qty = current_qty + quantity
                if new_qty != 0:
                    new_avg_price = ((current_qty * current_avg_price) + (quantity * price)) / new_qty
                else:
                    new_avg_price = price
            else:  # SELL
                new_qty = current_qty - quantity
                if new_qty != 0:
                    new_avg_price = current_avg_price  # Keep same avg price for sells
                else:
                    new_avg_price = price
            
            if new_qty == 0:
                self.positions.remove(existing_position)
            else:
                existing_position['quantity'] = new_qty
                existing_position['average_price'] = new_avg_price
                existing_position['last_price'] = price
        else:
            if transaction_type == 'BUY':
                position_qty = quantity
            else:  # SELL
                position_qty = -quantity
            
            if position_qty != 0:
                self.positions.append({
                    'tradingsymbol': tradingsymbol,
                    'exchange': 'NFO',
                    'product': 'NRML',
                    'quantity': position_qty,
                    'average_price': price,
                    'last_price': price
                })
    
    def get_positions(self) -> List[Dict]:
        return self.positions.copy()
    
    def get_orders(self) -> List[Dict]:
        return self.orders.copy()
