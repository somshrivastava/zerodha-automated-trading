/**
 * Monitoring Service
 * Handles monitoring of active strategy positions and determines required adjustments
 */

import { DEFAULT_STRIKES, API_DELAY_MS } from "../config/constants.js";
import { optionChainService } from "./optionChainService.js";
import { delay } from "../utils/helpers.js";

class MonitoringService {
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
  async monitorPositions(positions, config) {
    try {
      const { testMode = false, scenario = "no-adjustments" } = config;

      if (testMode) {
        console.log(`Monitoring with test mode using scenario: ${scenario}`);
      }

      // Get option chains for both expiries
      const weeklyOptionChain = await optionChainService.getOptionChain(
        config.weeklyExpiry,
        DEFAULT_STRIKES,
        testMode,
        scenario
      );

      // Wait for Dhan API rate limiting (skip in test mode)
      if (!testMode) {
        await delay(API_DELAY_MS);
      }

      const monthlyOptionChain = await optionChainService.getOptionChain(
        config.monthlyExpiry,
        DEFAULT_STRIKES,
        testMode,
        scenario
      );

      // Check current deltas
      const currentWeeklyCall = this.findCurrentOptionData(
        weeklyOptionChain.option_chain,
        positions.weeklyCallSell.strike,
        "call"
      );
      const currentWeeklyPut = this.findCurrentOptionData(
        weeklyOptionChain.option_chain,
        positions.weeklyPutSell.strike,
        "put"
      );
      const currentMonthlyCall = this.findCurrentOptionData(
        monthlyOptionChain.option_chain,
        positions.monthlyCallBuy.strike,
        "call"
      );
      const currentMonthlyPut = this.findCurrentOptionData(
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
      if (
        currentMonthlyCall &&
        currentMonthlyCall.delta >= config.exitBuyDelta
      ) {
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

  /**
   * Helper function to find current option data by strike
   * @param {Array} optionChain - Option chain data
   * @param {number} strike - Strike price to find
   * @param {string} optionType - "call" or "put"
   * @returns {Object|null} Option data or null if not found
   */
  findCurrentOptionData(optionChain, strike, optionType) {
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
}

// Create singleton instance
export const monitoringService = new MonitoringService();
