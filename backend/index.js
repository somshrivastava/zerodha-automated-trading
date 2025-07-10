/**
 * Options Calendar Strategy Trading System - Backend Server
 *
 * This server implements a weekly-monthly calendar spread strategy where:
 * - Weekly options (shorter expiry) are sold to collect premium
 * - Monthly options (longer expiry) are bought for protection
 * - Profit comes from faster time decay on weekly options
 * - Risk is managed through automated delta-based adjustments
 *
 * The system supports both live trading (via Dhan API) and test mode
 * with predefined market scenarios for strategy validation.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Configuration and utilities
import { PORT, validateEnvVars } from "./config/constants.js";

// Route handlers
import { strategyRoutes } from "./routes/strategyRoutes.js";
import { dataRoutes } from "./routes/dataRoutes.js";

// Initialize environment variables
dotenv.config();

// Validate required environment variables
validateEnvVars();

// ============================================================================
// SERVER SETUP
// ============================================================================

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ============================================================================
// ROUTES
// ============================================================================

// Strategy management routes
app.use("/", strategyRoutes);

// Data access routes
app.use("/", dataRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log(
    `⚡ Options Calendar Strategy Server running at http://localhost:${PORT}`
  );
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🧪 Mock data: ${process.env.MOCK_DATA_AVAILABLE || "checking..."}`
  );
});
