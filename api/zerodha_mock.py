import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

class ZerodhaMockAPI:
    def __init__(self):
        self.orders = []
        self.positions = []
    
    def place_order(self, tradingsymbol: str, transaction_type: str, quantity: int, 
                   order_type: str = "MARKET", price: float = None, product: str = "MIS") -> Dict:
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
            'exchange': 'NSE',
            'validity': 'DAY',
            'variety': 'regular',
            'tag': None
        }
        
        self.orders.append(order)
        self._update_positions(order)
        
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
        
        existing_position = None
        for position in self.positions:
            if position.get('tradingsymbol') == tradingsymbol:
                existing_position = position
                break
        
        if existing_position:
            if transaction_type == 'BUY':
                existing_position['quantity'] += quantity
            else:
                existing_position['quantity'] -= quantity
            
            existing_position['last_price'] = order['average_price']
            
            if existing_position['quantity'] == 0:
                self.positions.remove(existing_position)
        else:
            if transaction_type == 'BUY':
                position_qty = quantity
            else:
                position_qty = -quantity
            
            if position_qty != 0:
                self.positions.append({
                    'tradingsymbol': tradingsymbol,
                    'quantity': position_qty,
                    'average_price': order['average_price'],
                    'last_price': order['average_price']
                })
    
    def get_positions(self) -> List[Dict]:
        return self.positions.copy()
    
    def get_orders(self) -> List[Dict]:
        return self.orders.copy()
