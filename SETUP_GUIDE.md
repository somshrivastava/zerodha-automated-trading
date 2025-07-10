# Developer Setup Guide

## Getting Started

This guide will help you set up the Options Calendar Strategy trading system for development.

## Prerequisites

### Required Software

- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **Git**: [Download from git-scm.com](https://git-scm.com/)
- **Code Editor**: VS Code recommended with extensions:
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

### API Accounts (for live data)

- **Dhan API**: Sign up at [dhan.co](https://dhan.co) and get API credentials
- **Kite Connect** (optional): For order execution via Zerodha

---

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd zerodha-integration
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Edit `.env` with your API credentials:

```env
# Dhan API Credentials (required for live data)
DHAN_ACCESS_TOKEN=your_dhan_access_token_here
DHAN_CLIENT_ID=your_client_id_here

# Kite Connect Credentials (optional, for order execution)
KITE_API_KEY=your_kite_api_key_here
KITE_API_SECRET=your_kite_api_secret_here
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev  # or node index.js
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: See `API_DOCUMENTATION.md`

---

## Project Structure

```
zerodha-integration/
├── README.md                    # Project overview
├── API_DOCUMENTATION.md         # API reference
├── SETUP_GUIDE.md              # This file
│
├── backend/                     # Node.js API server
│   ├── index.js                # Main server with strategy logic
│   ├── kite.js                 # Kite Connect integration
│   ├── mockOptionChainData.json # Test scenarios
│   ├── package.json            # Dependencies
│   ├── .env.example            # Environment template
│   └── .env                    # Your API credentials (git-ignored)
│
└── frontend/                   # Next.js React app
    ├── src/
    │   └── pages/
    │       └── index.tsx       # Main trading interface
    ├── package.json           # Dependencies
    └── next.config.ts         # Next.js configuration
```

---

## Development Workflow

### Running Tests

The system includes comprehensive test scenarios for strategy validation:

1. **Start backend in test mode:**

   ```bash
   cd backend && node index.js
   ```

2. **Access frontend:** http://localhost:3000

3. **Enable test mode in UI:**
   - Check "Test Mode" checkbox
   - Select a scenario (e.g., "weekly-call-high")
   - Deploy strategy
   - Monitor for adjustments

### Available Test Scenarios

- `no-adjustments` - Normal conditions, no position changes
- `weekly-call-high` - Weekly call delta exceeds upper threshold
- `weekly-put-low` - Weekly put delta falls below lower threshold
- `monthly-call-high` - Monthly call delta triggers emergency exit
- `monthly-put-high` - Monthly put delta triggers emergency exit
- `multiple-adjustments` - Multiple positions need adjustment

### Making Code Changes

1. **Backend changes**: Server auto-restarts with nodemon (if using `npm run dev`)
2. **Frontend changes**: Hot reload automatically updates browser
3. **Mock data changes**: Restart backend to reload new test scenarios

### Debugging

#### Backend Debugging

- Check console logs in terminal running backend
- API responses visible in browser network tab
- Use Postman/curl to test endpoints directly

#### Frontend Debugging

- Open browser developer tools (F12)
- Check console for JavaScript errors
- Network tab shows API requests/responses

#### Common Issues

- **CORS errors**: Backend CORS is enabled for localhost
- **API credential errors**: Check `.env` file formatting
- **Port conflicts**: Backend uses port 4000, frontend uses 3000

---

## Code Style Guidelines

### Backend (Node.js)

- Use ES6+ modules (`import`/`export`)
- Async/await for asynchronous operations
- Descriptive function and variable names
- Comment complex business logic
- Handle errors gracefully with try/catch

### Frontend (React/TypeScript)

- Use TypeScript interfaces for type safety
- Functional components with hooks
- Separate API calls into dedicated functions
- Use meaningful state variable names
- Handle loading and error states

### General

- Use meaningful commit messages
- Comment complex algorithms
- Keep functions focused and small
- Use constants for magic numbers

---

## Adding New Features

### Adding a New Test Scenario

1. **Update mock data** (`backend/mockOptionChainData.json`):

   ```json
   {
     "scenarios": {
       "your-new-scenario": {
         "weekly": {
           /* option chain data */
         },
         "monthly": {
           /* option chain data */
         }
       }
     }
   }
   ```

2. **Add description** in backend (`index.js`):

   ```javascript
   app.get("/test-scenarios", (req, res) => {
     // Add to descriptions object
     "your-new-scenario": "Description of scenario behavior"
   });
   ```

3. **Test the scenario** in frontend test mode

### Adding a New API Endpoint

1. **Add route** in `backend/index.js`:

   ```javascript
   app.get("/your-endpoint", async (req, res) => {
     try {
       // Your logic here
       res.json({ result: "success" });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

2. **Update API documentation** in `API_DOCUMENTATION.md`

3. **Add frontend integration** if needed

### Modifying Strategy Logic

1. **Update strategy function** in `backend/index.js`
2. **Test with mock scenarios** to ensure correct behavior
3. **Update comments and documentation**
4. **Test edge cases** with different parameter combinations

---

## Deployment Considerations

### Environment Variables

- Never commit `.env` files
- Use environment-specific configurations
- Consider using services like AWS Parameter Store

### Security

- Implement API authentication in production
- Rate limiting for API endpoints
- Input validation and sanitization
- HTTPS in production

### Monitoring

- Add logging for production debugging
- Monitor API response times
- Track strategy performance metrics
- Set up alerts for system errors

### Performance

- Consider Redis for session storage
- Database for persistent strategy data
- Caching for frequently accessed data
- Connection pooling for external APIs

---

## Getting Help

### Resources

- **Options Trading**: Understand calendar spreads and Greeks
- **Node.js**: [Official documentation](https://nodejs.org/docs/)
- **React**: [React documentation](https://react.dev/)
- **Next.js**: [Next.js documentation](https://nextjs.org/docs)

### Common Questions

**Q: Can I paper trade before going live?**
A: Yes, use test mode with various scenarios to validate strategy behavior.

**Q: How do I add new option strategies?**
A: Modify the strategy logic in `executeWeeklyMonthlyStrategy()` function.

**Q: Can I backtest strategies?**
A: Currently not supported, but you can extend the mock data system for historical testing.

**Q: How do I deploy to production?**
A: Consider using services like Heroku, AWS, or DigitalOcean with proper environment configurations.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper tests
4. Update documentation if needed
5. Submit a pull request with clear description

Thank you for contributing to the Options Calendar Strategy system!
