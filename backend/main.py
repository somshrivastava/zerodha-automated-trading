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
dotenv.load_dotenv()
from kiteconnect import KiteConnect

dotenv.load_dotenv()
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

KITE_API_KEY = os.getenv("KITE_API_KEY")
KITE_API_SECRET = os.getenv("KITE_API_SECRET")

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
        return "Access token received and saved. You can close this tab.", 200
    except Exception as e:
        return f"Token exchange failed: {e}", 500

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    resp.headers["Cache-Control"] = "no-cache"
    return resp

@app.get("/positions")
def positions():
    # Use your mock for now (or swap to helper.get_positions())
    return jsonify({ "positions": mock.mock_positions })
    # return jsonify({"positions": helper.get_positions()})

@app.post("/check_delta")
def check_delta():
    body = request.get_json(silent=True) or {}
    ts = body.get("tradingsymbol")
    ctype = body.get("conditionType")  # "above" | "below"
    cval = body.get("conditionValue")  # float

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
        notify(msg)

    return jsonify({
        "tradingsymbol": ts,
        "delta": delta,
        "condition_type": ctype,
        "condition_value": threshold,
        "triggered": triggered,
        "checked_at": datetime.now(timezone.utc).isoformat(),
    })

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

def notify(text: str):
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "HTML" 
    }

    resp = requests.post(API_URL, json=payload)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=2000)
