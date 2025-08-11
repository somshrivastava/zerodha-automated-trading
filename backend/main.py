from flask import Flask, request, jsonify
from flask_cors import CORS
import mock

import helper

app = Flask(__name__)
CORS(
    app,
    resources={r"/positions*": {"origins": "http://localhost:2000"}},
)

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return resp

@app.route('/positions')
def positions():
    return jsonify({
        "positions": mock.mock_positions
    })
    # return jsonify({
    #     "positions": helper.get_positions()
    # })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=2000)