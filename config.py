import os
from dotenv import load_dotenv

load_dotenv()

MODE = os.getenv('MODE', 'mock')
DHAN_CLIENT_ID = os.getenv('DHAN_CLIENT_ID')
DHAN_ACCESS_TOKEN = os.getenv('DHAN_ACCESS_TOKEN')
KITE_API_KEY = os.getenv('KITE_API_KEY')
KITE_ACCESS_TOKEN = os.getenv('KITE_ACCESS_TOKEN')
INDEX_SYMBOL = os.getenv('INDEX_SYMBOL', 'NIFTY')
SELL_DELTA = float(os.getenv('SELL_DELTA', 0.5))
BUY_DELTA = float(os.getenv('BUY_DELTA', 0.3))
DEFAULT_QUANTITY = int(os.getenv('DEFAULT_QUANTITY', 50))
