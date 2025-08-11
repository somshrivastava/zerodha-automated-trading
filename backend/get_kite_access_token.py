# pip install kiteconnect flask python-dotenv
import os, json, webbrowser, threading
from datetime import datetime
from urllib.parse import urlencode
from flask import Flask, request, Response
from kiteconnect import KiteConnect
from dotenv import load_dotenv

PORT = 8765
CALLBACK_PATH = "/kite/callback"
CALLBACK_URL = f"http://127.0.0.1:{PORT}{CALLBACK_PATH}"

load_dotenv()
API_KEY    = os.getenv("KITE_API_KEY")
API_SECRET = os.getenv("KITE_API_SECRET")

if not API_KEY or not API_SECRET:
    raise SystemExit("Set KITE_API_KEY and KITE_API_SECRET in your .env")

app = Flask(__name__)
kite = KiteConnect(api_key=API_KEY)

def save_tokens(access_token: str):
    # 1) Save to .env (overwrite or append)
    lines = []
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            lines = [ln for ln in f.read().splitlines() if not ln.startswith("KITE_ACCESS_TOKEN=")]
    lines.append(f"KITE_ACCESS_TOKEN={access_token}")
    with open(".env", "w") as f:
        f.write("\n".join(lines) + "\n")

    # 2) Save to a JSON cache (optional)
    payload = {
        "access_token": access_token,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open("kite_token.json", "w") as f:
        json.dump(payload, f, indent=2)

@app.get(CALLBACK_PATH)
def kite_callback():
    err = request.args.get("error")
    if err:
        return Response(f"Error from Kite: {err}", status=400)

    request_token = request.args.get("request_token")
    if not request_token:
        return Response("Missing request_token", status=400)

    try:
        data = kite.generate_session(request_token, api_secret=API_SECRET)
        access_token = data["access_token"]
        kite.set_access_token(access_token)
        save_tokens(access_token)
        msg = (
            "✅ Access token received and saved.\n"
            "You can close this tab and return to the terminal."
        )
        print("\n" + msg)
        return msg
    except Exception as e:
        print("Token exchange failed:", e)
        return Response(f"Token exchange failed: {e}", status=500)
    finally:
        # stop the server shortly after responding
        threading.Timer(1.5, shutdown_server).start()

def shutdown_server():
    func = request.environ.get("werkzeug.server.shutdown")
    if func:
        func()

if __name__ == "__main__":
    # Ensure your app’s redirect URL equals CALLBACK_URL
    print(f"Callback URL configured: {CALLBACK_URL}")
    # Build and open login URL
    login_url = kite.login_url()  # uses your app’s configured redirect
    print("Open this URL to login:\n", login_url)
    try:
        webbrowser.open(login_url)
    except Exception:
        pass

    # Run local server to catch redirect
    app.run(host="127.0.0.1", port=PORT, debug=False)