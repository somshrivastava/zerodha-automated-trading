/**
 * Options Calendar Strategy Trading System - Backend Server
 *
 * This server implements a weekly-monthly calendar spread strategy where:
 * - Weekly options (shorter expiry) are sold to collect premium
 * - Monthly options (longer expiry) are bought for protection
 * - Profit comes from faster time decay on weekly options
 * - Risk is managed through automated delta-based adjustments
 *
 * The system supports both live trading (via Dhan/Kite APIs) and test mode
 * with predefined market scenarios for strategy validation.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";

dotenv.config();

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

const PORT = 4000;
const API_DELAY_MS = 2500; // Delay between API calls to respect Dhan rate limits
const DEFAULT_STRIKES = 10; // Number of strikes to fetch around ATM

// ============================================================================
// SERVER SETUP
// ============================================================================

const app = express();
app.use(express.json());
app.use(cors());

// Global state for active strategy (in production, use a database)
let activeStrategyConfig = null;

// ============================================================================
// MOCK DATA LOADING
// ============================================================================

/**
 * Load mock option chain data for testing scenarios.
 * This data simulates different market conditions to test strategy behavior
 * without requiring live market data or risking real money.
 */
let mockData = null;
try {
  const mockDataPath = path.join(process.cwd(), "mockOptionChainData.json");
  mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));
  console.log("Mock data loaded successfully");
} catch (error) {
  console.log("Mock data not loaded:", error.message);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a delay for rate limiting API calls.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the specified delay
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// OPTION CHAIN FUNCTIONS
// ============================================================================

/**
 * Fetches option chain data from Dhan API or returns mock data for testing.
 *
 * @param {string} expiry - Expiry date in YYYY-MM-DD format
 * @param {number} strikes - Number of strikes to fetch around ATM (default: 10)
 * @param {boolean} testMode - Whether to use mock data instead of live API
 * @param {string} scenario - Test scenario name for mock data
 * @returns {Promise<Object>} Formatted option chain data
 */
async function getOptionChain(
  expiry,
  strikes = DEFAULT_STRIKES,
  testMode = false,
  scenario = "no-adjustments"
) {
  // If test mode is enabled and mock data is available, return mock data
  if (testMode && mockData) {
    console.log(`Using mock data for scenario: ${scenario}, expiry: ${expiry}`);

    // Determine if this is weekly or monthly based on expiry date
    const expiryDate = new Date(expiry);
    const dayOfMonth = expiryDate.getDate();
    const isWeekly = dayOfMonth <= 15; // Days 1-15 are weekly, 16+ are monthly
    const expiryType = isWeekly ? "weekly" : "monthly";

    if (
      mockData.scenarios[scenario] &&
      mockData.scenarios[scenario][expiryType]
    ) {
      return mockData.scenarios[scenario][expiryType];
    } else {
      console.warn(
        `Mock scenario ${scenario} not found for ${expiryType}, using no-adjustments`
      );
      return mockData.scenarios["no-adjustments"][expiryType];
    }
  }

  try {
    const response = await axios.post(
      "https://api.dhan.co/v2/optionchain",
      {
        UnderlyingScrip: 13,
        UnderlyingSeg: "IDX_I",
        Expiry: expiry,
      },
      {
        headers: {
          "access-token": process.env.DHAN_ACCESS_TOKEN,
          "client-id": process.env.DHAN_CLIENT_ID,
          "Content-Type": "application/json",
        },
      }
    );

    const formattedData = formatOptionChainAroundPrice(
      response.data,
      parseInt(strikes)
    );

    return formattedData;
  } catch (error) {
    console.error(
      "Error fetching option chain:",
      error.response?.data || error.message
    );
    throw error; // Re-throw the error instead of returning undefined
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

app.post("/start-strategy", async (req, res) => {
  try {
    activeStrategyConfig = req.body;

    // Check for test mode in query parameters
    const testMode = req.query.testMode === "true";
    const scenario = req.query.scenario || "no-adjustments";

    if (testMode) {
      activeStrategyConfig.testMode = true;
      activeStrategyConfig.scenario = scenario;
      console.log(`Starting strategy in test mode with scenario: ${scenario}`);
    }

    // Execute the weekly-monthly calendar strategy
    const positions = await executeWeeklyMonthlyStrategy(activeStrategyConfig);

    // Store positions globally (in a real app, use a database)
    activeStrategyConfig.positions = positions;

    res.json({
      status: "started",
      config: activeStrategyConfig,
      positions: positions,
      message: testMode
        ? `Weekly-Monthly Calendar Strategy started in TEST MODE with scenario: ${scenario}`
        : "Weekly-Monthly Calendar Strategy started successfully",
    });
  } catch (err) {
    console.error("Start strategy error:", err);
    res
      .status(500)
      .json({ error: "Failed to start strategy", details: err.message });
  }
});

app.post("/stop-strategy", (req, res) => {
  activeStrategyConfig = null;
  res.json({ status: "stopped" });
});

app.get("/option-chain", async (req, res) => {
  try {
    const { strikes = DEFAULT_STRIKES, expiry } = req.query;

    if (!expiry) {
      return res.status(400).json({ error: "Expiry date is required" });
    }

    const optionChainData = await getOptionChain(expiry, strikes);
    res.json(optionChainData);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to generate formatted option chain" });
  }
});

app.get("/expiry-dates", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.dhan.co/v2/optionchain/expirylist",
      {
        UnderlyingScrip: 13,
        UnderlyingSeg: "IDX_I",
      },
      {
        headers: {
          "access-token": process.env.DHAN_ACCESS_TOKEN,
          "client-id": process.env.DHAN_CLIENT_ID,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching expiry dates:", error.response.data);
    res.status(500).json({ error: "Failed to fetch expiry dates" });
  }
});

// ============================================================================
// UTILITY FUNCTIONS FOR OPTION CHAIN FORMATTING
// ============================================================================

// Function to format option chain data around current price
function formatOptionChainAroundPrice(optionChainData, strikesAboveBelow = 10) {
  const { last_price, oc } = optionChainData.data;

  // Convert option chain object to array with strike prices as numbers
  const optionArray = Object.entries(oc).map(([strike, data]) => ({
    strike: parseFloat(strike),
    call: data.ce,
    put: data.pe,
  }));

  // Sort by strike price
  optionArray.sort((a, b) => a.strike - b.strike);

  // Find the closest strike to current price
  let closestIndex = 0;
  let minDiff = Math.abs(optionArray[0].strike - last_price);

  for (let i = 1; i < optionArray.length; i++) {
    const diff = Math.abs(optionArray[i].strike - last_price);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  // Get strikes around the current price
  const startIndex = Math.max(0, closestIndex - strikesAboveBelow);
  const endIndex = Math.min(
    optionArray.length,
    closestIndex + strikesAboveBelow + 1
  );

  const filteredOptions = optionArray.slice(startIndex, endIndex);

  // Format the data for better readability
  const formattedOptions = filteredOptions.map((option) => ({
    strike: option.strike,
    call: {
      ltp: option.call.last_price,
      bid: option.call.top_bid_price,
      ask: option.call.top_ask_price,
      volume: option.call.volume,
      oi: option.call.oi,
      iv: option.call.implied_volatility,
      delta: option.call.greeks.delta,
      gamma: option.call.greeks.gamma,
      theta: option.call.greeks.theta,
      vega: option.call.greeks.vega,
    },
    put: {
      ltp: option.put.last_price,
      bid: option.put.top_bid_price,
      ask: option.put.top_ask_price,
      volume: option.put.volume,
      oi: option.put.oi,
      iv: option.put.implied_volatility,
      delta: option.put.greeks.delta,
      gamma: option.put.greeks.gamma,
      theta: option.put.greeks.theta,
      vega: option.put.greeks.vega,
    },
  }));

  return {
    underlying_price: last_price,
    closest_strike: optionArray[closestIndex].strike,
    total_strikes_shown: formattedOptions.length,
    option_chain: formattedOptions,
  };
}

// ============================================================================
// STRATEGY EXECUTION FUNCTIONS
// ============================================================================

/**
 * Executes the Weekly-Monthly Calendar Strategy.
 *
 * Calendar Spread Strategy Overview:
 * 1. SELL weekly options (calls & puts) with ~0.5 delta - collect premium
 * 2. BUY monthly options (calls & puts) with ~0.3 delta - hedge risk
 * 3. Profit from faster time decay on weekly options vs monthly
 * 4. Monitor deltas and adjust positions when they breach thresholds
 *
 * @param {Object} config - Strategy configuration
 * @param {string} config.weeklyExpiry - Weekly expiry date (YYYY-MM-DD)
 * @param {string} config.monthlyExpiry - Monthly expiry date (YYYY-MM-DD)
 * @param {number} config.sellLegDelta - Target delta for weekly options to sell (~0.5)
 * @param {number} config.buyLegDelta - Target delta for monthly options to buy (~0.3)
 * @param {number} config.exitSellLower - Lower delta threshold for sell exit (~0.3)
 * @param {number} config.exitSellUpper - Upper delta threshold for sell exit (~0.7)
 * @param {number} config.exitBuyDelta - Delta threshold for buy position exit (~0.7)
 * @param {boolean} config.testMode - Use mock data instead of live market
 * @param {string} config.scenario - Test scenario for mock data
 * @returns {Promise<Object>} Strategy positions with entry details
 */
async function executeWeeklyMonthlyStrategy(config) {
  const {
    weeklyExpiry,
    monthlyExpiry,
    sellLegDelta,
    buyLegDelta,
    exitSellLower,
    exitSellUpper,
    exitBuyDelta,
    testMode = false,
    scenario = "no-adjustments",
  } = config;

  console.log("Starting Weekly-Monthly Calendar Strategy...");
  if (testMode) {
    console.log(`Test mode enabled with scenario: ${scenario}`);
  }

  try {
    // Get option chains for both expiries
    const weeklyOptionChain = await getOptionChain(
      weeklyExpiry,
      DEFAULT_STRIKES,
      testMode,
      scenario
    );

    // Wait for Dhan API rate limiting (skip in test mode)
    if (!testMode) {
      await delay(API_DELAY_MS);
    }

    const monthlyOptionChain = await getOptionChain(
      monthlyExpiry,
      DEFAULT_STRIKES,
      testMode,
      scenario
    );

    // Extract calls and puts from option chain
    const weeklyCalls = weeklyOptionChain.option_chain.map((option) => ({
      strike: option.strike,
      delta: option.call.delta,
      price: option.call.ltp,
      expiry: weeklyExpiry,
    }));

    const weeklyPuts = weeklyOptionChain.option_chain.map((option) => ({
      strike: option.strike,
      delta: Math.abs(option.put.delta), // Convert negative delta to positive
      price: option.put.ltp,
      expiry: weeklyExpiry,
    }));

    const monthlyCalls = monthlyOptionChain.option_chain.map((option) => ({
      strike: option.strike,
      delta: option.call.delta,
      price: option.call.ltp,
      expiry: monthlyExpiry,
    }));

    const monthlyPuts = monthlyOptionChain.option_chain.map((option) => ({
      strike: option.strike,
      delta: Math.abs(option.put.delta), // Convert negative delta to positive
      price: option.put.ltp,
      expiry: monthlyExpiry,
    }));

    // Find options closest to target deltas
    const weeklyCallSell = findOptionByDelta(weeklyCalls, sellLegDelta, "sell");
    const weeklyPutSell = findOptionByDelta(weeklyPuts, sellLegDelta, "sell");

    const monthlyCallBuy = findOptionByDelta(monthlyCalls, buyLegDelta, "buy");
    const monthlyPutBuy = findOptionByDelta(monthlyPuts, buyLegDelta, "buy");
    const positions = {
      weeklyCallSell,
      weeklyPutSell,
      monthlyCallBuy,
      monthlyPutBuy,
      entryTime: new Date(),
    };

    return positions;
  } catch (error) {
    console.error("Error executing strategy:", error);
    throw error;
  }
}

/**
 * Finds the best option strike based on target delta.
 * Uses absolute delta values and finds the closest match to target.
 *
 * @param {Array} optionChain - Array of option data with delta values
 * @param {number} targetDelta - Desired delta value (0.0 to 1.0)
 * @param {string} type - Position type: "buy" or "sell"
 * @returns {Object|null} Best matching option or null if none found
 */
function findOptionByDelta(optionChain, targetDelta, type) {
  if (!optionChain || !Array.isArray(optionChain)) {
    throw new Error("Invalid option chain data");
  }

  let bestOption = null;
  let smallestDiff = Infinity;

  for (const option of optionChain) {
    if (option.delta && typeof option.delta === "number") {
      const diff = Math.abs(option.delta - targetDelta);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestOption = {
          strike: option.strike,
          delta: option.delta,
          price: option.price || option.ltp,
          type: type,
          expiry: option.expiry,
        };
      }
    }
  }

  return bestOption;
}

/**
 * Monitors active strategy positions and determines required adjustments.
 *
 * Position Adjustment Logic:
 * - SELL positions: Adjust if delta < exitSellLower OR delta > exitSellUpper
 * - BUY positions: Adjust if absolute delta > exitBuyDelta (emergency exit)
 *
 * @param {Object} positions - Current strategy positions
 * @param {Object} config - Strategy configuration including exit thresholds
 * @returns {Promise<Object>} Monitoring data with current deltas and adjustments
 */
async function monitorPositions(positions, config) {
  try {
    const { testMode = false, scenario = "no-adjustments" } = config;

    if (testMode) {
      console.log(`Monitoring with test mode using scenario: ${scenario}`);
    }

    // Get option chains for both expiries
    const weeklyOptionChain = await getOptionChain(
      config.weeklyExpiry,
      DEFAULT_STRIKES,
      testMode,
      scenario
    );

    // Wait for Dhan API rate limiting (skip in test mode)
    if (!testMode) {
      await delay(API_DELAY_MS);
    }

    const monthlyOptionChain = await getOptionChain(
      config.monthlyExpiry,
      DEFAULT_STRIKES,
      testMode,
      scenario
    );

    // Check current deltas
    const currentWeeklyCall = findCurrentOptionData(
      weeklyOptionChain.option_chain,
      positions.weeklyCallSell.strike,
      "call"
    );
    const currentWeeklyPut = findCurrentOptionData(
      weeklyOptionChain.option_chain,
      positions.weeklyPutSell.strike,
      "put"
    );
    const currentMonthlyCall = findCurrentOptionData(
      monthlyOptionChain.option_chain,
      positions.monthlyCallBuy.strike,
      "call"
    );
    const currentMonthlyPut = findCurrentOptionData(
      monthlyOptionChain.option_chain,
      positions.monthlyPutBuy.strike,
      "put"
    );

    const adjustments = [];

    // Check sell positions for exit conditions
    if (
      currentWeeklyCall &&
      (currentWeeklyCall.delta <= config.exitSellLower ||
        currentWeeklyCall.delta >= config.exitSellUpper)
    ) {
      adjustments.push({
        type: "ADJUST_SELL",
        position: "weeklyCallSell",
        reason: `Delta ${currentWeeklyCall.delta} breached exit levels`,
        action: "EXIT_AND_REENTER",
      });
    }

    if (
      currentWeeklyPut &&
      (currentWeeklyPut.delta <= config.exitSellLower ||
        currentWeeklyPut.delta >= config.exitSellUpper)
    ) {
      adjustments.push({
        type: "ADJUST_SELL",
        position: "weeklyPutSell",
        reason: `Delta ${currentWeeklyPut.delta} breached exit levels`,
        action: "EXIT_AND_REENTER",
      });
    }

    // Check buy positions for exit conditions
    if (currentMonthlyCall && currentMonthlyCall.delta >= config.exitBuyDelta) {
      adjustments.push({
        type: "ADJUST_BUY",
        position: "monthlyCallBuy",
        reason: `Delta ${currentMonthlyCall.delta} reached exit level`,
        action: "EXIT_BOTH_AND_REENTER",
      });
    }

    if (currentMonthlyPut && currentMonthlyPut.delta >= config.exitBuyDelta) {
      adjustments.push({
        type: "ADJUST_BUY",
        position: "monthlyPutBuy",
        reason: `Delta ${currentMonthlyPut.delta} reached exit level`,
        action: "EXIT_BOTH_AND_REENTER",
      });
    }

    return {
      currentDeltas: {
        weeklyCall: currentWeeklyCall?.delta,
        weeklyPut: currentWeeklyPut?.delta,
        monthlyCall: currentMonthlyCall?.delta,
        monthlyPut: currentMonthlyPut?.delta,
      },
      adjustments,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error monitoring positions:", error);
    throw error;
  }
}

// Helper function to find current option data by strike
function findCurrentOptionData(optionChain, strike, optionType) {
  if (!optionChain || !Array.isArray(optionChain)) {
    return null;
  }

  // First try to find exact strike
  let option = optionChain.find((option) => option.strike === strike);

  // If exact strike not found, find the closest one
  if (!option) {
    let closestOption = null;
    let minDiff = Infinity;

    for (const opt of optionChain) {
      const diff = Math.abs(opt.strike - strike);
      if (diff < minDiff) {
        minDiff = diff;
        closestOption = opt;
      }
    }

    if (closestOption) {
      option = closestOption;
    }
  }

  if (!option) {
    return null;
  }

  // Return the appropriate option type (call or put)
  if (optionType === "call") {
    return {
      strike: option.strike,
      delta: option.call.delta,
      price: option.call.ltp,
    };
  } else if (optionType === "put") {
    return {
      strike: option.strike,
      delta: Math.abs(option.put.delta), // Convert negative delta to positive
      price: option.put.ltp,
    };
  }

  return null;
}

// Monitor strategy positions
app.get("/monitor-strategy", async (req, res) => {
  try {
    if (!activeStrategyConfig || !activeStrategyConfig.positions) {
      return res
        .status(404)
        .json({ error: "No active strategy positions found" });
    }

    // Check for test mode override in query parameters
    const testModeOverride = req.query.testMode === "true";
    const scenarioOverride = req.query.scenario;

    // Use override parameters if provided, otherwise use config values
    const configForMonitoring = { ...activeStrategyConfig };
    if (testModeOverride) {
      configForMonitoring.testMode = true;
      configForMonitoring.scenario =
        scenarioOverride || activeStrategyConfig.scenario || "no-adjustments";
      console.log(
        `Monitoring with test mode override, scenario: ${configForMonitoring.scenario}`
      );
    }

    const monitoringData = await monitorPositions(
      activeStrategyConfig.positions,
      configForMonitoring
    );

    res.json({
      status: "monitoring",
      config: activeStrategyConfig,
      currentDeltas: monitoringData.currentDeltas,
      adjustments: monitoringData.adjustments,
      timestamp: monitoringData.timestamp,
      testMode: configForMonitoring.testMode || false,
      scenario: configForMonitoring.scenario || "live",
    });
  } catch (err) {
    console.error("Monitor strategy error:", err);
    res
      .status(500)
      .json({ error: "Failed to monitor strategy", details: err.message });
  }
});

// Add endpoint to list available test scenarios
app.get("/test-scenarios", (req, res) => {
  if (!mockData) {
    return res.status(404).json({ error: "Mock data not available" });
  }

  const scenarios = Object.keys(mockData.scenarios);
  res.json({
    scenarios,
    descriptions: {
      "no-adjustments":
        "Normal market conditions, no position adjustments needed",
      "weekly-call-high": "Weekly call delta rises above exit threshold",
      "weekly-put-low": "Weekly put delta falls below exit threshold",
      "monthly-call-high": "Monthly call delta rises above exit threshold",
      "monthly-put-high":
        "Monthly put delta rises above exit threshold (emergency exit)",
      "multiple-adjustments":
        "Multiple positions breach exit conditions simultaneously",
    },
  });
});

// Add endpoint to get mock option chain data
app.get("/mock-option-chain", (req, res) => {
  if (!mockData) {
    return res.status(404).json({ error: "Mock data not available" });
  }

  const scenario = req.query.scenario || "no-adjustments";
  const expiry = req.query.expiry || "weekly"; // 'weekly' or 'monthly'

  if (!mockData.scenarios[scenario]) {
    return res.status(404).json({ error: `Scenario '${scenario}' not found` });
  }

  if (!mockData.scenarios[scenario][expiry]) {
    return res.status(404).json({
      error: `Expiry '${expiry}' not found for scenario '${scenario}'`,
    });
  }

  res.json({
    scenario,
    expiry,
    data: mockData.scenarios[scenario][expiry],
  });
});

// Add endpoint to get all mock scenarios data
app.get("/all-mock-data", (req, res) => {
  if (!mockData) {
    return res.status(404).json({ error: "Mock data not available" });
  }

  res.json(mockData);
});

app.listen(PORT, () => {
  console.log(`⚡ Server running at http://localhost:${PORT}`);
});
