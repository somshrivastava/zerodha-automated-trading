/**
 * Strategy Routes
 * Handles strategy deployment, monitoring, and management endpoints
 */

import express from "express";
import { strategyService } from "../services/strategyService.js";
import { monitoringService } from "../services/monitoringService.js";
import {
  validateStrategyConfig,
  formatErrorResponse,
} from "../utils/helpers.js";

const router = express.Router();

// Global state for active strategy (in production, use a database)
let activeStrategyConfig = null;

/**
 * Start/Deploy a new trading strategy
 */
router.post("/start-strategy", async (req, res) => {
  try {
    // Validate configuration
    const validation = validateStrategyConfig(req.body);
    if (!validation.isValid) {
      return res
        .status(400)
        .json(
          formatErrorResponse(
            "Invalid strategy configuration",
            validation.errors
          )
        );
    }

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
    const positions = await strategyService.executeWeeklyMonthlyStrategy(
      activeStrategyConfig
    );

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
      .json(formatErrorResponse("Failed to start strategy", err.message));
  }
});

/**
 * Stop the active trading strategy
 */
router.post("/stop-strategy", (req, res) => {
  activeStrategyConfig = null;
  res.json({ status: "stopped" });
});

/**
 * Monitor active strategy positions
 */
router.get("/monitor-strategy", async (req, res) => {
  try {
    if (!activeStrategyConfig || !activeStrategyConfig.positions) {
      return res
        .status(404)
        .json(formatErrorResponse("No active strategy positions found"));
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
    }

    const monitoringData = await monitoringService.monitorPositions(
      activeStrategyConfig.positions,
      configForMonitoring
    );

    // Log any adjustments found
    if (monitoringData.adjustments && monitoringData.adjustments.length > 0) {
      console.log(
        `Adjustments needed: ${monitoringData.adjustments.length} positions require action`
      );
    }

    res.json({
      status: "monitoring",
      config: activeStrategyConfig,
      currentDeltas: monitoringData.currentDeltas,
      adjustments: monitoringData.adjustments,
      timestamp: monitoringData.timestamp,
      testMode: configForMonitoring.testMode || false,
      scenario: configForMonitoring.scenario || "no-adjustments",
    });
  } catch (err) {
    console.error("Monitor strategy error:", err);
    res
      .status(500)
      .json(formatErrorResponse("Failed to monitor strategy", err.message));
  }
});

export { router as strategyRoutes, activeStrategyConfig };
