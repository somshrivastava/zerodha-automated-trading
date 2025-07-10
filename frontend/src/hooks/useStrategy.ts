/**
 * Custom hook for managing strategy state and API interactions
 */

import { useState, useEffect } from "react";
import { StrategyConfig, StrategyPositions, TestScenario } from "../types";
import { apiService } from "../services/api";
import { DEFAULT_STRATEGY_CONFIG, DEFAULT_TEST_MODE } from "../utils/constants";

export const useStrategy = () => {
  // ====================================
  // STATE MANAGEMENT
  // ====================================

  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_STRATEGY_CONFIG);
  const [positions, setPositions] = useState<StrategyPositions | null>(null);
  const [expiryDates, setExpiryDates] = useState<string[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  // Test mode state
  const [testMode, setTestMode] = useState(DEFAULT_TEST_MODE.testMode);
  const [scenario, setScenario] = useState(DEFAULT_TEST_MODE.scenario);
  const [availableScenarios, setAvailableScenarios] =
    useState<TestScenario | null>(null);

  // ====================================
  // API FUNCTIONS
  // ====================================

  /**
   * Load initial data (expiry dates and test scenarios)
   */
  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      const [expiryData, scenarioData] = await Promise.allSettled([
        apiService.getExpiryDates(),
        apiService.getTestScenarios(),
      ]);

      // Handle expiry dates
      if (expiryData.status === "fulfilled") {
        setExpiryDates(expiryData.value);
      } else {
        console.error("Failed to fetch expiry dates:", expiryData.reason);
      }

      // Handle test scenarios (optional)
      if (scenarioData.status === "fulfilled") {
        setAvailableScenarios(scenarioData.value);
      }
      // Silently fail for test scenarios as they're optional
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Deploy strategy with current configuration
   */
  const deployStrategy = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      setIsDeploying(true);

      const result = await apiService.deployStrategy(
        config,
        testMode,
        scenario
      );

      if (result.positions) {
        setPositions(result.positions);
      }

      const message = testMode
        ? `Strategy deployed in TEST MODE with scenario: ${scenario}!`
        : "Strategy deployed successfully!";

      return { success: true, message };
    } catch (error) {
      const message =
        error instanceof Error
          ? `Failed to start strategy: ${error.message}`
          : "Error starting strategy. Please check your connection.";

      console.error("Error deploying strategy:", error);
      return { success: false, message };
    } finally {
      setIsDeploying(false);
    }
  };

  /**
   * Stop the active strategy
   */
  const stopStrategy = async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      await apiService.stopStrategy();
      setPositions(null);
      return { success: true, message: "Strategy stopped successfully!" };
    } catch (error) {
      const message =
        error instanceof Error
          ? `Failed to stop strategy: ${error.message}`
          : "Error stopping strategy. Please check your connection.";

      console.error("Error stopping strategy:", error);
      return { success: false, message };
    }
  };

  // ====================================
  // INITIALIZATION
  // ====================================

  useEffect(() => {
    loadInitialData();
  }, []);

  // ====================================
  // RETURN VALUES
  // ====================================

  return {
    // State
    config,
    setConfig,
    positions,
    setPositions,
    expiryDates,
    isLoading,
    isDeploying,

    // Test mode
    testMode,
    setTestMode,
    scenario,
    setScenario,
    availableScenarios,

    // Actions
    deployStrategy,
    stopStrategy,
    loadInitialData,
  };
};
