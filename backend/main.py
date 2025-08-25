from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import helper
import mock
import os
import requests
import json
import dotenv
dotenv.load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://zerodha-automated-trading.vercel.app"]}})

KITE_API_KEY = os.getenv("KITE_API_KEY")
KITE_API_SECRET = os.getenv("KITE_API_SECRET")
KITE_REDIRECT_URL = os.getenv("KITE_REDIRECT_URL")  # Add this to your .env

@app.route("/login")
def kite_login():
    try:
        kite = helper.get_kite()
        login_url = kite.login_url()
        return jsonify({"login_url": login_url})
    except Exception as e:
        return jsonify({"error": f"Kite API key not configured or error: {e}"}), 500

@app.route("/kite/callback")
def kite_callback():
    err = request.args.get("error")
    if err:
        return f"Error from Kite: {err}", 400
    request_token = request.args.get("request_token")
    if not request_token:
        return "Missing request_token", 400
    try:
        from kiteconnect import KiteConnect
        kite = KiteConnect(api_key=KITE_API_KEY)
        data = kite.generate_session(request_token, api_secret=KITE_API_SECRET)
        access_token = data["access_token"]
        with open("kite_token.json", "w") as f:
            json.dump({"access_token": access_token, "generated_at": datetime.now().isoformat()}, f)
        kite.set_access_token(access_token)
        # Always redirect to the URL from .env if set
        if KITE_REDIRECT_URL:
            from flask import redirect
            return redirect(KITE_REDIRECT_URL)
        return "Access token received and saved. You can close this tab.", 200
    except Exception as e:
        return f"Token exchange failed: {e}", 500

@app.after_request
def add_cors(resp):
    origin = resp.headers.get("Origin")
    allowed_origins = ["http://localhost:3000", "https://zerodha-automated-trading.vercel.app"]
    # If the request's Origin header matches an allowed origin, set it; else default to localhost
    req_origin = None
    try:
        from flask import request as flask_request
        req_origin = flask_request.headers.get("Origin")
    except Exception:
        pass
    if req_origin in allowed_origins:
        resp.headers["Access-Control-Allow-Origin"] = req_origin
    else:
        resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    resp.headers["Cache-Control"] = "no-cache"
    return resp

@app.get("/expiry_list")
def expiry_list():
    try:
        expiries = helper.get_expiry_list()
        return jsonify({"expiries": expiries})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch expiry list: {e}", "expiries": []}), 500

@app.get("/positions")
def positions():
    try:
        print("calling")
        positions = helper.get_positions()
        return jsonify({"positions": positions})
    except Exception as e:
        return jsonify({"error": f"Failed to fetch positions: {e}", "positions": []}), 500

@app.post("/send_telegram")
def send_telegram():
    body = request.get_json(silent=True) or {}
    telegram_bot_token = body.get("telegram_bot_token")
    telegram_chat_id = body.get("telegram_chat_id")
    message = body.get("message", "✅ Test message from Zerodha Automated Trading!")

    if not telegram_bot_token or not telegram_chat_id:
        return jsonify({"error": "telegram_bot_token and telegram_chat_id required"}), 400

    try:
        notify(message, telegram_bot_token, telegram_chat_id)
        return jsonify({"result": "Message sent"})
    except Exception as e:
        return jsonify({"error": f"Failed to send telegram message: {e}"}), 500

@app.post("/check_net_delta")
def check_net_delta():
    body = request.get_json(silent=True) or {}
    selected_symbols = body.get("selected_symbols", [])  # List of trading symbols
    target_delta = body.get("target_delta")
    condition_type = body.get("condition_type")  # "above" | "below"
    telegram_bot_token = body.get("telegram_bot_token")
    telegram_chat_id = body.get("telegram_chat_id")

    if not selected_symbols or not target_delta or condition_type not in ("above", "below"):
        return jsonify({"error": "selected_symbols, target_delta, and condition_type required"}), 400

    try:
        # Get live delta for each selected position
        net_delta = 0.0
        position_deltas = []
        
        for symbol in selected_symbols:
            try:
                delta = float(helper.get_delta_for_tradingsymbol(symbol))
                net_delta += delta
                position_deltas.append({"symbol": symbol, "delta": delta})
            except Exception as e:
                print(f"Failed to get delta for {symbol}: {e}")
                # Continue with other symbols
                
        target = float(target_delta)
        triggered = (net_delta > target) if condition_type == "above" else (net_delta < target)

        if triggered:
            msg = f"🚨 Net Delta Alert!\n\n"
            msg += f"Net delta has gone {condition_type} your target of {target:.3f}\n"
            msg += f"Current net delta: {net_delta:.3f}\n\n"
            msg += "Selected positions:\n"
            for pos in position_deltas:
                msg += f"• {pos['symbol']}: Δ={pos['delta']:.3f}\n"
                
            notify(msg, telegram_bot_token, telegram_chat_id)

        return jsonify({
            "net_delta": net_delta,
            "target_delta": target,
            "condition_type": condition_type,
            "triggered": triggered,
            "position_deltas": position_deltas,
            "checked_at": datetime.now(timezone.utc).isoformat(),
        })
        
    except Exception as e:
        return jsonify({"error": f"Failed to check net delta: {e}"}), 500

@app.post("/check_delta")
def check_delta():
    body = request.get_json(silent=True) or {}
    ts = body.get("tradingsymbol")
    ctype = body.get("conditionType")  # "above" | "below"
    cval = body.get("conditionValue")  # float

    telegram_bot_token = body.get("telegram_bot_token")
    telegram_chat_id = body.get("telegram_chat_id")

    if not ts or ctype not in ("above", "below") or cval is None:
        return jsonify({"error": "tradingsymbol, conditionType, conditionValue required"}), 400

    try:
        delta = float(helper.get_delta_for_tradingsymbol(ts))
    except Exception as e:
        return jsonify({"error": f"Failed to fetch delta for {ts}: {e}"}), 502

    threshold = float(cval)
    triggered = (delta > threshold) if ctype == "above" else (delta < threshold)

    msg = (
        f"{body['buy_or_sell']} {body['stock']} "
        f"{body['strike']} {body['option_type']} {body['expiry']}\n\n{body['tradingsymbol']}"
        f" has went {ctype} your target delta of {cval}. \n\nIt has a delta of {delta} currently."
    )

    if triggered:
        notify(msg, telegram_bot_token, telegram_chat_id)

    return jsonify({
        "tradingsymbol": ts,
        "delta": delta,
        "condition_type": ctype,
        "condition_value": threshold,
        "triggered": triggered,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    })

def notify(text: str, bot_token=None, chat_id=None):
    # Use provided token/chat_id, else fallback to env
    bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID")
    if not bot_token or not chat_id:
        print("Telegram bot token or chat id not provided")
        return

    api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        resp = requests.post(api_url, json=payload)
    except Exception as e:
        print(f"Failed to send Telegram message: {e}")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=2000)