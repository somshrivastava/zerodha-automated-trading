/**
 * Option Chain Service
 * Handles fetching and formatting option chain data from Dhan API
 */

import axios from "axios";
import { DHAN_CONFIG, DEFAULT_STRIKES } from "../config/constants.js";
import { mockDataService } from "./mockDataService.js";

class OptionChainService {
  /**
   * Fetches option chain data from Dhan API or returns mock data for testing.
   * @param {string} expiry - Expiry date in YYYY-MM-DD format
   * @param {number} strikes - Number of strikes to fetch around ATM
   * @param {boolean} testMode - Whether to use mock data instead of live API
   * @param {string} scenario - Test scenario name for mock data
   * @returns {Promise<Object>} Formatted option chain data
   */
  async getOptionChain(
    expiry,
    strikes = DEFAULT_STRIKES,
    testMode = false,
    scenario = "no-adjustments"
  ) {
    // If test mode is enabled and mock data is available, return mock data
    if (testMode && mockDataService.isAvailable()) {
      console.log(
        `Using mock data for scenario: ${scenario}, expiry: ${expiry}`
      );

      const mockData = mockDataService.getMockOptionChain(scenario, expiry);
      if (mockData) {
        return mockData;
      } else {
        console.warn(
          `Mock scenario ${scenario} not found, using no-adjustments`
        );
        return mockDataService.getMockOptionChain("no-adjustments", expiry);
      }
    }

    try {
      const response = await axios.post(
        `${DHAN_CONFIG.BASE_URL}/optionchain`,
        {
          UnderlyingScrip: DHAN_CONFIG.UNDERLYING_SCRIP,
          UnderlyingSeg: DHAN_CONFIG.UNDERLYING_SEG,
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

      const formattedData = this.formatOptionChainAroundPrice(
        response.data,
        parseInt(strikes)
      );

      return formattedData;
    } catch (error) {
      console.error(
        "Error fetching option chain:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Formats option chain data around current price
   * @param {Object} optionChainData - Raw option chain data from API
   * @param {number} strikesAboveBelow - Number of strikes to show above/below current price
   * @returns {Object} Formatted option chain data
   */
  formatOptionChainAroundPrice(optionChainData, strikesAboveBelow = 10) {
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
        ltp: option.call?.ltp || 0,
        bid: option.call?.bid || 0,
        ask: option.call?.ask || 0,
        volume: option.call?.volume || 0,
        oi: option.call?.oi || 0,
        iv: option.call?.iv || 0,
        delta: option.call?.delta || 0,
        gamma: option.call?.gamma || 0,
        theta: option.call?.theta || 0,
        vega: option.call?.vega || 0,
      },
      put: {
        ltp: option.put?.ltp || 0,
        bid: option.put?.bid || 0,
        ask: option.put?.ask || 0,
        volume: option.put?.volume || 0,
        oi: option.put?.oi || 0,
        iv: option.put?.iv || 0,
        delta: option.put?.delta || 0,
        gamma: option.put?.gamma || 0,
        theta: option.put?.theta || 0,
        vega: option.put?.vega || 0,
      },
    }));

    return {
      underlying_price: last_price,
      closest_strike: optionArray[closestIndex].strike,
      total_strikes_shown: formattedOptions.length,
      option_chain: formattedOptions,
    };
  }

  /**
   * Fetch available expiry dates from Dhan API
   * @returns {Promise<Object>} Expiry dates data
   */
  async getExpiryDates() {
    try {
      const response = await axios.post(
        `${DHAN_CONFIG.BASE_URL}${DHAN_CONFIG.OPTION_CHAIN_ENDPOINT}`,
        {
          UnderlyingScrip: DHAN_CONFIG.UNDERLYING_SCRIP,
          UnderlyingSeg: DHAN_CONFIG.UNDERLYING_SEG,
        },
        {
          headers: {
            "access-token": process.env.DHAN_ACCESS_TOKEN,
            "client-id": process.env.DHAN_CLIENT_ID,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching expiry dates:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

// Create singleton instance
export const optionChainService = new OptionChainService();
