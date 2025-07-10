/**
 * Strategy Service
 * Handles the execution and management of the weekly-monthly calendar spread strategy
 */

import { DEFAULT_STRIKES, API_DELAY_MS } from "../config/constants.js";
import { optionChainService } from "./optionChainService.js";
import { delay } from "../utils/helpers.js";

class StrategyService {
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
   * @returns {Promise<Object>} Strategy positions with entry details
   */
  async executeWeeklyMonthlyStrategy(config) {
    const {
      weeklyExpiry,
      monthlyExpiry,
      sellLegDelta,
      buyLegDelta,
      testMode = false,
      scenario = "no-adjustments",
    } = config;

    console.log("Starting Weekly-Monthly Calendar Strategy...");
    if (testMode) {
      console.log(`Test mode enabled with scenario: ${scenario}`);
    }

    try {
      // Get option chains for both expiries
      const weeklyOptionChain = await optionChainService.getOptionChain(
        weeklyExpiry,
        DEFAULT_STRIKES,
        testMode,
        scenario
      );

      // Wait for Dhan API rate limiting (skip in test mode)
      if (!testMode) {
        await delay(API_DELAY_MS);
      }

      const monthlyOptionChain = await optionChainService.getOptionChain(
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
      const weeklyCallSell = this.findOptionByDelta(
        weeklyCalls,
        sellLegDelta,
        "sell"
      );
      const weeklyPutSell = this.findOptionByDelta(
        weeklyPuts,
        sellLegDelta,
        "sell"
      );
      const monthlyCallBuy = this.findOptionByDelta(
        monthlyCalls,
        buyLegDelta,
        "buy"
      );
      const monthlyPutBuy = this.findOptionByDelta(
        monthlyPuts,
        buyLegDelta,
        "buy"
      );

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
  findOptionByDelta(optionChain, targetDelta, type) {
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
}

// Create singleton instance
export const strategyService = new StrategyService();
