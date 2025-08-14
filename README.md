# Zerodha Automated Trading 📈

### Live Demo

The app is deployed and available at: [[YOUR_DEPLOYMENT_URL_HERE](https://your-deployment-url.com/)]

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Description

Zerodha Automated Trading is a comprehensive platform designed to automate trading strategies using the Zerodha Kite API. With this project, users can seamlessly execute trades, monitor positions, and manage portfolios programmatically, reducing manual intervention and increasing efficiency. The application features a modern Next.js frontend for intuitive user interaction and a robust Python backend that handles all trading logic, real-time data processing, and secure API communication. This setup empowers traders and developers to build, test, and deploy algorithmic trading strategies with ease.

## Features

- Automated trading using Zerodha Kite API
- Secure access token management
- Real-time order execution and monitoring
- Portfolio and position tracking
- Responsive UI for desktop and mobile
- Mock trading mode for testing strategies
- Easy configuration and extensibility

## Tech Stack

- Next.js (React, TypeScript)
- Python (Backend logic)
- Zerodha Kite Connect API
- RESTful API communication
- CSS Modules/PostCSS

## Installation

1. Clone the repository:

```sh
git clone https://github.com/somshrivastava/zerodha-automated-trading.git
cd zerodha-automated-trading
```

2. Install frontend dependencies:

```sh
cd frontend
npm install
```

3. Install backend dependencies:

```sh
cd ../backend
pip install -r requirements.txt
```

4. Set up Zerodha API credentials:

- Obtain your API key and secret from [Kite Developer](https://kite.trade/)
- Add your credentials to the backend configuration or environment variables

5. Run the app locally:

```sh
# Start backend (in one terminal)
cd backend
python main.py

# Start frontend (in another terminal)
cd ../frontend
npm run dev
```

## Usage

- Log in with your Zerodha account to generate an access token
- Configure and run your trading strategies
- Monitor trades and portfolio in real time
- Use mock mode for safe testing

**Example:**

```sh
npm run dev
# Open http://localhost:3000 in your browser
```

## License

This project is licensed under the MIT License.
