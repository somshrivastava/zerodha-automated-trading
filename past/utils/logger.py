import os
import csv
from datetime import datetime

def log_trade(symbol: str, delta: float, transaction_type: str, quantity: int, order_id: str) -> None:
    logs_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    log_file = os.path.join(logs_dir, 'trade_log.csv')
    
    file_exists = os.path.exists(log_file)
    
    with open(log_file, 'a', newline='') as csvfile:
        writer = csv.writer(csvfile)
        
        if not file_exists:
            writer.writerow(['timestamp', 'symbol', 'delta', 'transaction_type', 'quantity', 'order_id'])
        
        timestamp = datetime.now().isoformat()
        writer.writerow([timestamp, symbol, delta, transaction_type, quantity, order_id])
