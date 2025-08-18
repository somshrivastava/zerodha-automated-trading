# Zerodha Automated Trading 📈

### Live Demo

The app is deployed and available at: [https://zerodha-automated-trading.vercel.app/](https://zerodha-automated-trading.vercel.app/)

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Description

Zerodha Automated Trading is a professional options delta monitoring and automated trading alert system built for options traders. It provides real-time delta tracking, customizable alert conditions, and automated monitoring of options positions. The platform integrates with Zerodha Kite API to fetch live positions and Greeks data, enabling traders to set precise delta thresholds and receive automated alerts when conditions are met.

## Features

- **Real-time Delta Monitoring**: Track delta values for all options positions in real-time
- **Customizable Alert Conditions**: Set "above" or "below" delta thresholds for each position
- **Automated Position Fetching**: Seamlessly integrate with Zerodha Kite API for live data
- **Professional Dashboard**: Clean, responsive interface with portfolio overview
- **Portfolio Analytics**: View total P&L, active positions, and running monitors
- **Alert History**: Track when delta conditions are triggered with timestamps
- **Multi-Position Monitoring**: Monitor multiple positions simultaneously
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Tech Stack

**Frontend:**

- Next.js 14 (React 18)
- TypeScript
- PrimeReact UI Components
- Tailwind CSS

**Backend:**

- Python FastAPI
- Zerodha Kite Connect API
- RESTful API architecture

**Development:**

- Modern ES6+ JavaScript
- CSS-in-JS and utility-first CSS
- Responsive design principles

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

4. Set up environment variables:

Create a `.env.local` file in the frontend directory:

```sh
NEXT_PUBLIC_API_BASE=http://localhost:2000
```

Create a `.env` file in the backend directory:

```sh
KITE_API_KEY=your_zerodha_api_key
KITE_ACCESS_TOKEN=your_access_token
```

5. Run the backend server:

```sh
cd backend
python main.py
```

6. Run the frontend development server:

```sh
cd frontend
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Getting Started

1. **Connect to Zerodha**: Click the "Connect Kite" button to authenticate with your Zerodha account
2. **View Positions**: Your options positions will automatically load in the dashboard
3. **Set Delta Alerts**: For each position, configure monitoring conditions:
   - Click the arrow buttons (↑ ↓) to set "above" or "below" conditions
   - Enter your desired delta threshold value (0.00 to 1.00)
   - Click "Start" to begin monitoring

### Monitoring Features

- **Portfolio Overview**: View total P&L, active positions, and running monitors
- **Real-time Updates**: Delta values update every 10 seconds when monitoring is active
- **Alert Triggers**: Automatic alerts when delta conditions are met
- **Position Management**: Start/stop monitoring individual positions

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /positions` - Fetch all current options positions
- `POST /check_delta` - Check delta value against conditions
- `GET /health` - Health check endpoint

### Example API Response

```json
{
  "tradingsymbol": "NIFTY2441550000CE",
  "delta": 0.4234,
  "condition_type": "above",
  "condition_value": 0.3,
  "triggered": true,
  "checked_at": "2024-01-15T10:30:00Z"
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
