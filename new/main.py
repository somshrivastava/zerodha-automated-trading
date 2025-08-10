from dotenv import load_dotenv
import os
from dhanhq import dhanhq
import pandas as pd
from kiteconnect import KiteConnect
from math import ceil
import re
from datetime import date, timedelta
import calendar
import time
import mock

MONTH_MAP = {"JAN":1,"FEB":2,"MAR":3,"APR":4,"MAY":5,"JUN":6,
             "JUL":7,"AUG":8,"SEP":9,"OCT":10,"NOV":11,"DEC":12}

RX_NUMERIC = re.compile(r'^([A-Z]+)(\d{2})(1[0-2]|0?[1-9])(3[01]|[12]\d|0?[1-9])(\d{3,})(CE|PE)$')
RX_MONTHLY = re.compile(r'^([A-Z]+)(\d{2})([A-Z]{3})(\d{3,})(CE|PE)$')

load_dotenv()

kite = KiteConnect(api_key=os.getenv("KITE_API_KEY"))
kite.set_access_token(os.getenv("KITE_ACCESS_TOKEN"))

api = dhanhq(client_id=os.getenv("DHAN_CLIENT_ID"), 
             access_token=os.getenv("DHAN_ACCESS_TOKEN"))

def get_expiry_list() -> list[str]:
    response = api.expiry_list(under_security_id=13, 
                               under_exchange_segment="IDX_I")

    expiry_list = response.get("data").get("data")

    return expiry_list

def get_option_chain(expiry: str) -> dict:
    response = api.option_chain(under_security_id=13, 
                                under_exchange_segment="IDX_I", 
                                expiry=expiry)

    option_chain = response.get("data").get("data")

    option_chain_strikes = option_chain.get("oc")

    formatted_option_chain = {
        "last_price": option_chain.get("last_price"),
        "chain": {}
    }

    for strike in option_chain_strikes.keys():
        call = option_chain_strikes.get(strike).get("ce")
        put = option_chain_strikes.get(strike).get("pe")
        formatted_option_chain["chain"][str(strike).split(".")[0]] = {
            "CE": {
                "greeks": call.get("greeks"),
                "implied_volatility": call.get("implied_volatility"),
                "last_price": call.get("last_price"),
                "open_interest": call.get("oi")
            },
            "PE": {
                "greeks": put.get("greeks"),
                "implied_volatility": put.get("implied_volatility"),
                "last_price": put.get("last_price"),
                "open_interest": put.get("oi")
            }
        }

    return formatted_option_chain

def get_option_closest_to_delta(option_chain: dict, target_delta: float, option_type: str) -> dict:
    chain = option_chain.get("chain", {})
    
    best = None
    best_diff = float('inf')
    
    for strike, options in chain.items():
        option = options.get(option_type)
        
        delta = option.get("greeks").get("delta")
        delta = float(delta)
                
        diff = abs(delta - target_delta)
        
        if diff < best_diff:
            best_diff = diff
            best = {
                "strike": float(strike),
                "option": option
            }
    
    if best is None:
        raise ValueError(f"No {option_type} option found with delta data")

    return best

def get_nifty_options():
    url = "https://api.kite.trade/instruments"
    df = pd.read_csv(url)
    nifty_opts = df[
        (df["name"] == "NIFTY") &
        (df["segment"] == "NFO-OPT")
    ].copy()
    nifty_opts.sort_values(by=["expiry", "strike"], inplace=True)
    nifty_opts.reset_index(drop=True, inplace=True)
    return nifty_opts

def find_nifty_option(expiry, strike, opt_type):
    df = get_nifty_options()
    match = df[
        (df["expiry"] == expiry) &
        (df["strike"] == strike) &
        (df["instrument_type"] == opt_type)
    ]
    if match.empty:
        raise ValueError("Contract not found in instruments list")
    return match.iloc[0]["tradingsymbol"]

def place_order(tradingsymbol: str, buy_or_sell: str, is_gtt=True):
    inst = f"NFO:{tradingsymbol}"
    ltp_data = kite.ltp(inst)
    ltp = ltp_data[inst]["last_price"]        
    
    if is_gtt:
        trigger_price = ltp
        limit_price = trigger_price + (trigger_price * 0.0026) 

        return kite.place_gtt(
            trigger_type=kite.GTT_TYPE_SINGLE,
            tradingsymbol=tradingsymbol,
            exchange=kite.EXCHANGE_NFO,
            trigger_values=[limit_price],
            last_price=ltp,
            orders=[{
                "transaction_type": kite.TRANSACTION_TYPE_BUY if buy_or_sell == "buy" else kite.TRANSACTION_TYPE_SELL,
                "quantity": 75,
                "order_type": kite.ORDER_TYPE_LIMIT,
                "price": limit_price,
                "product": kite.PRODUCT_NRML
            }]
        )
    else:
        return kite.place_order(
            variety=kite.VARIETY_REGULAR,
            exchange=kite.EXCHANGE_NFO,
            tradingsymbol=tradingsymbol,
            transaction_type=kite.TRANSACTION_TYPE_BUY,
            quantity=75,
            product=kite.PRODUCT_NRML,
            order_type=kite.ORDER_TYPE_MARKET,
            price=0,
        )

def last_thursday(year, month):
    last_day = calendar.monthrange(year, month)[1]
    d = date(year, month, last_day)
    while d.weekday() != 3:  # Thursday
        d -= timedelta(days=1)
    return d

def parse_kite_option_symbol(ts):
    m = RX_NUMERIC.match(ts)
    if m:
        stock, yy, mm, dd, strike, opt = m.groups()
        return {
            "stock": stock,
            "strike": int(strike),
            "expiry": f"{2000+int(yy):04d}-{int(mm):02d}-{int(dd):02d}",
            "option_type": opt
        }
    m = RX_MONTHLY.match(ts)
    if m:
        stock, yy, mmm, strike, opt = m.groups()
        expiry = last_thursday(2000+int(yy), MONTH_MAP[mmm])
        return {
            "stock": stock,
            "strike": int(strike),
            "expiry": expiry.strftime("%Y-%m-%d"),
            "option_type": opt
        }
    raise ValueError(f"Unrecognized tradingsymbol: {ts}")


def get_positions():
    out = []
    positions = kite.positions()
    for p in positions["net"]:
        ts = p["tradingsymbol"]
        parsed = parse_kite_option_symbol(ts)
        out.append({
            "stock": parsed["stock"],
            "strike": parsed["strike"],
            "expiry": parsed["expiry"],
            "quantity": p.get("quantity"),
            "average_price": p.get("average_price"),
            "last_price": p.get("last_price"),
            "value": p.get("value"),
            "pnl": p.get("pnl"),
            "option_type": parsed["option_type"]
        })
    return out

WEEKLY_DELTA = 0.5
MONTHLY_DELTA = 0.3

def get_weekly_and_monthly_expiry():
    expiry_list = get_expiry_list()  
    expiry_list.sort()
    
    weekly_expiry = expiry_list[0]      
    monthly_expiry = expiry_list[2]    
    
    return weekly_expiry, monthly_expiry

def select_entry_legs():
    weekly_expiry, monthly_expiry = get_weekly_and_monthly_expiry()

    weekly_option_chain = get_option_chain(weekly_expiry)

    time.sleep(2.5)

    monthly_option_chain = get_option_chain(monthly_expiry)

    weekly_call = get_option_closest_to_delta(weekly_option_chain,  WEEKLY_DELTA, "CE")  # ~+0.5
    weekly_put  = get_option_closest_to_delta(weekly_option_chain, -WEEKLY_DELTA, "PE")  # ~-0.5

    monthly_call = get_option_closest_to_delta(monthly_option_chain,  MONTHLY_DELTA, "CE")  # ~+0.3
    monthly_put  = get_option_closest_to_delta(monthly_option_chain, -MONTHLY_DELTA, "PE")  # ~-0.3

    return {
        "weekly_call": weekly_call,
        "weekly_put": weekly_put,
        "monthly_call": monthly_call,
        "monthly_put": monthly_put,
        "weekly_expiry": weekly_expiry,
        "monthly_expiry": monthly_expiry
    }

def map_to_tradingsymbols(legs_info):
    symbols = {}
    symbols["weekly_call"] = find_nifty_option(
        legs_info["weekly_expiry"], legs_info["weekly_call"]["strike"], "CE")
    symbols["weekly_put"] = find_nifty_option(
        legs_info["weekly_expiry"], legs_info["weekly_put"]["strike"], "PE")

    symbols["monthly_call"] = find_nifty_option(
        legs_info["monthly_expiry"], legs_info["monthly_call"]["strike"], "CE")
    symbols["monthly_put"] = find_nifty_option(
        legs_info["monthly_expiry"], legs_info["monthly_put"]["strike"], "PE")

    return symbols

def place_entry_orders(symbols):
    place_order(symbols["weekly_call"], "sell", is_gtt=True)
    place_order(symbols["weekly_put"], "sell", is_gtt=True)
    place_order(symbols["monthly_call"], "buy", is_gtt=True)
    place_order(symbols["monthly_put"], "buy", is_gtt=True)

def run_entry_logic():
    legs_info = select_entry_legs()
    symbols = map_to_tradingsymbols(legs_info)
    place_entry_orders(symbols)

def get_active_legs_from_positions(mock_positions=None):
    positions = kite.positions()["net"]
    if mock_positions is not None:
        positions = mock_positions["net"]
    active_legs = {}

    for p in positions:
        ts = p["tradingsymbol"]
        try:
            parsed = parse_kite_option_symbol(ts)
        except ValueError:
            continue  

        key = None
        if parsed["option_type"] == "CE":
            if parsed["expiry"] == get_weekly_and_monthly_expiry()[0]:
                key = "weekly_call"
            else:
                key = "monthly_call"
        elif parsed["option_type"] == "PE":
            if parsed["expiry"] == get_weekly_and_monthly_expiry()[0]:
                key = "weekly_put"
            else:
                key = "monthly_put"

        if key:
            active_legs[key] = {
                "tradingsymbol": ts,
                "expiry": parsed["expiry"],
                "strike": parsed["strike"],
                "option_type": parsed["option_type"]
            }

    return active_legs

def get_leg_delta(expiry, strike, option_type):
    oc = get_option_chain(expiry)
    leg_data = oc["chain"].get(str(int(strike)), {}).get(option_type, {})
    return float(leg_data.get("greeks", {}).get("delta", 0.0))

legs = get_active_legs_from_positions(map_to_tradingsymbols(select_entry_legs))

for leg in legs:
    print(get_leg_delta(leg["expiry"], leg["strike"], leg["option_type"]))

def monitor_positions():
    active_legs = get_active_legs_from_positions(mock.mock_positions)

    for leg_name, details in active_legs.items():
        print(details)
        time.sleep(3)
        delta = get_leg_delta(details["expiry"], details["strike"], details["option_type"])
        print(f"{leg_name}: delta={delta:.2f}")

        # Weekly legs adjustment
        if leg_name in ["weekly_call", "weekly_put"]:
            if delta <= 0.25 or delta >= 0.75:
                print(f"Adjusting {leg_name} at delta {delta:.2f}")
                # adjust_weekly_leg(leg_name, details)

        # Monthly legs adjustment (trigger both if one hits)
        if leg_name in ["monthly_call", "monthly_put"] and delta >= 0.70:
            print(f"Adjusting BOTH monthly legs because {leg_name} hit delta {delta:.2f}")
            # adjust_monthly_legs(active_legs)
            break

def adjust_weekly_leg(leg_name, details):
    print(f"Adjusting {leg_name}: exiting {details['tradingsymbol']} and re-entering at 0.50 delta")

    # Exit current position
    place_order(details["tradingsymbol"], "buy")

    # Determine target delta sign
    target_delta = 0.5 if details["option_type"] == "CE" else -0.5

    # Find new strike
    time.sleep(2.5)
    weekly_option = get_option_chain(details["expiry"])
    new_leg = get_option_closest_to_delta(weekly_option, target_delta, details["option_type"])
    new_ts = find_nifty_option(details["expiry"], new_leg["strike"], details["option_type"])

    # Enter new position (SELL)
    place_order(new_ts, "sell")

def adjust_monthly_legs(active_legs):
    print("Adjusting monthly legs: exiting both and re-entering at 0.30 delta")

    monthly_call = active_legs.get("monthly_call")
    monthly_put  = active_legs.get("monthly_put")

    if not monthly_call or not monthly_put:
        print("Error: Missing one of the monthly legs")
        return

    monthly_expiry = monthly_call["expiry"]

    # Exit both
    place_order(monthly_call["tradingsymbol"], "sell")
    place_order(monthly_put["tradingsymbol"], "sell")

    # Find new strikes
    time.sleep(2.5)
    monthly_option = get_option_chain(monthly_expiry)

    call_leg = get_option_closest_to_delta(monthly_option, 0.3, "CE")
    put_leg  = get_option_closest_to_delta(monthly_option, -0.3, "PE")

    call_ts = find_nifty_option(monthly_expiry, call_leg["strike"], "CE")
    put_ts  = find_nifty_option(monthly_expiry, put_leg["strike"], "PE")

    # Enter new positions (BUY)
    place_order(call_ts, "buy")
    place_order(put_ts, "buy")