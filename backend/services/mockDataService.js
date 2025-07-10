/**
 * Mock Data Service
 * Handles loading and serving mock option chain data for testing scenarios
 */

import fs from "fs";
import path from "path";

class MockDataService {
  constructor() {
    this.mockData = null;
    this.loadMockData();
  }

  /**
   * Load mock option chain data for testing scenarios.
   * This data simulates different market conditions to test strategy behavior
   * without requiring live market data or risking real money.
   */
  loadMockData() {
    try {
      const mockDataPath = path.join(process.cwd(), "mockOptionChainData.json");
      this.mockData = JSON.parse(fs.readFileSync(mockDataPath, "utf8"));
      console.log("Mock data loaded successfully");
    } catch (error) {
      console.log("Mock data not loaded:", error.message);
    }
  }

  /**
   * Check if mock data is available
   * @returns {boolean} True if mock data is loaded
   */
  isAvailable() {
    return this.mockData !== null;
  }

  /**
   * Get mock option chain data for a specific scenario and expiry
   * @param {string} scenario - Test scenario name
   * @param {string} expiry - Expiry date
   * @returns {Object|null} Mock option chain data or null if not found
   */
  getMockOptionChain(scenario = "no-adjustments", expiry) {
    if (!this.mockData) return null;

    // Determine if this is weekly or monthly based on expiry date
    const expiryDate = new Date(expiry);
    const dayOfMonth = expiryDate.getDate();
    const isWeekly = dayOfMonth <= 15; // Days 1-15 are weekly, 16+ are monthly
    const expiryType = isWeekly ? "weekly" : "monthly";

    const scenarioData = this.mockData.scenarios[scenario];
    if (!scenarioData) {
      console.warn(
        `Scenario "${scenario}" not found in mock data. Available scenarios:`,
        Object.keys(this.mockData.scenarios)
      );
      return null;
    }

    return scenarioData[expiryType] || null;
  }

  /**
   * Get all available test scenarios
   * @returns {Object} Available scenarios and their descriptions
   */
  getTestScenarios() {
    if (!this.mockData) {
      return {
        scenarios: ["no-adjustments"],
        descriptions: {
          "no-adjustments": "No Adjustments (Default)",
        },
      };
    }

    return {
      scenarios: Object.keys(this.mockData.scenarios),
      descriptions: this.mockData.descriptions || {},
    };
  }

  /**
   * Get all mock data
   * @returns {Object|null} All mock data or null if not available
   */
  getAllMockData() {
    return this.mockData;
  }
}

// Create singleton instance
export const mockDataService = new MockDataService();
