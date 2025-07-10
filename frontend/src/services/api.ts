/**
 * API service functions for the Options Calendar Strategy system
 */

import {
  StrategyConfig,
  DeployResponse,
  MonitoringResponse,
  TestScenario,
  ApiResponse,
} from "../types";
import { API_BASE_URL } from "../utils/constants";

// ============================================================================
// API SERVICE CLASS
// ============================================================================

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ====================================
  // STRATEGY MANAGEMENT
  // ====================================

  /**
   * Deploy a new strategy with the given configuration
   */
  async deployStrategy(
    config: StrategyConfig,
    testMode: boolean = false,
    scenario: string = "no-adjustments"
  ): Promise<DeployResponse> {
    let url = `${this.baseUrl}/start-strategy`;
    if (testMode) {
      url += `?testMode=true&scenario=${scenario}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Stop the active strategy
   */
  async stopStrategy(): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/stop-strategy`, {
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Monitor active strategy positions
   */
  async monitorStrategy(
    testMode: boolean = false,
    scenario: string = "no-adjustments"
  ): Promise<MonitoringResponse> {
    let url = `${this.baseUrl}/monitor-strategy`;
    if (testMode) {
      url += `?testMode=true&scenario=${scenario}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  // ====================================
  // DATA ENDPOINTS
  // ====================================

  /**
   * Fetch available option expiry dates
   */
  async getExpiryDates(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/expiry-dates`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch expiry dates: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Fetch option chain data for specific expiry
   */
  async getOptionChain(expiry: string, strikes: number = 10): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/option-chain?expiry=${expiry}&strikes=${strikes}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch option chain: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  // ====================================
  // TEST MODE ENDPOINTS
  // ====================================

  /**
   * Fetch available test scenarios
   */
  async getTestScenarios(): Promise<TestScenario> {
    const response = await fetch(`${this.baseUrl}/test-scenarios`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch test scenarios: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Fetch mock option chain data for testing
   */
  async getMockOptionChain(
    scenario: string = "no-adjustments",
    expiry: string = "weekly"
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/mock-option-chain?scenario=${scenario}&expiry=${expiry}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch mock option chain: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiService = new ApiService();

// ============================================================================
// CONVENIENCE FUNCTIONS (for backward compatibility)
// ============================================================================

export const deployStrategy = (
  config: StrategyConfig,
  testMode?: boolean,
  scenario?: string
) => apiService.deployStrategy(config, testMode, scenario);

export const stopStrategy = () => apiService.stopStrategy();

export const monitorStrategy = (testMode?: boolean, scenario?: string) =>
  apiService.monitorStrategy(testMode, scenario);

export const getExpiryDates = () => apiService.getExpiryDates();

export const getOptionChain = (expiry: string, strikes?: number) =>
  apiService.getOptionChain(expiry, strikes);

export const getTestScenarios = () => apiService.getTestScenarios();

export const getMockOptionChain = (scenario?: string, expiry?: string) =>
  apiService.getMockOptionChain(scenario, expiry);
