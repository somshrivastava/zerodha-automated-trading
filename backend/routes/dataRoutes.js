/**
 * Data Routes
 * Handles option chain data, expiry dates, and mock data endpoints
 */

import express from "express";
import { optionChainService } from "../services/optionChainService.js";
import { mockDataService } from "../services/mockDataService.js";
import { DEFAULT_STRIKES } from "../config/constants.js";
import { formatErrorResponse } from "../utils/helpers.js";

const router = express.Router();

/**
 * Get option chain data for a specific expiry
 */
router.get("/option-chain", async (req, res) => {
  try {
    const { strikes = DEFAULT_STRIKES, expiry } = req.query;

    if (!expiry) {
      return res
        .status(400)
        .json(formatErrorResponse("Expiry date is required"));
    }

    const optionChainData = await optionChainService.getOptionChain(
      expiry,
      strikes
    );
    res.json(optionChainData);
  } catch (error) {
    console.error("Error fetching option chain:", error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to generate formatted option chain"));
  }
});

/**
 * Get available expiry dates
 */
router.get("/expiry-dates", async (req, res) => {
  try {
    const expiryData = await optionChainService.getExpiryDates();
    res.json(expiryData);
  } catch (error) {
    console.error("Error fetching expiry dates:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch expiry dates"));
  }
});

/**
 * Get available test scenarios
 */
router.get("/test-scenarios", (req, res) => {
  try {
    const scenarios = mockDataService.getTestScenarios();
    res.json(scenarios);
  } catch (error) {
    console.error("Error fetching test scenarios:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch test scenarios"));
  }
});

/**
 * Get mock option chain data for testing
 */
router.get("/mock-option-chain", (req, res) => {
  try {
    const { scenario = "no-adjustments", expiry } = req.query;

    if (!mockDataService.isAvailable()) {
      return res
        .status(404)
        .json(formatErrorResponse("Mock data not available"));
    }

    if (!expiry) {
      return res
        .status(400)
        .json(formatErrorResponse("Expiry date is required"));
    }

    const mockData = mockDataService.getMockOptionChain(scenario, expiry);
    if (!mockData) {
      return res
        .status(404)
        .json(
          formatErrorResponse(
            `Mock data not found for scenario: ${scenario}, expiry: ${expiry}`
          )
        );
    }

    res.json({
      scenario,
      expiry,
      data: mockData,
    });
  } catch (error) {
    console.error("Error fetching mock option chain:", error);
    res
      .status(500)
      .json(formatErrorResponse("Failed to fetch mock option chain"));
  }
});

/**
 * Get all mock scenarios data (used by option-chains page)
 */
router.get("/all-mock-data", (req, res) => {
  try {
    if (!mockDataService.isAvailable()) {
      return res
        .status(404)
        .json(formatErrorResponse("Mock data not available"));
    }

    const allMockData = mockDataService.getAllMockData();
    res.json(allMockData);
  } catch (error) {
    console.error("Error fetching all mock data:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch mock data"));
  }
});

export { router as dataRoutes };
