/**
 * Custom hook for monitoring strategy positions
 */

import { useState, useCallback } from "react";
import { MonitoringResponse, StrategyPositions } from "../types";
import { apiService } from "../services/api";

export const useMonitoring = () => {
  // ====================================
  // STATE MANAGEMENT
  // ====================================

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringData, setMonitoringData] =
    useState<MonitoringResponse | null>(null);
  const [monitoringError, setMonitoringError] = useState<string | null>(null);

  // ====================================
  // MONITORING FUNCTIONS
  // ====================================

  /**
   * Monitor strategy positions and check for adjustments
   */
  const monitorPositions = useCallback(
    async (
      positions: StrategyPositions | null,
      testMode: boolean = false,
      scenario: string = "no-adjustments"
    ): Promise<{
      success: boolean;
      message: string;
      data?: MonitoringResponse;
    }> => {
      try {
        if (!positions) {
          return {
            success: false,
            message:
              "No active strategy positions found. Deploy a strategy first.",
          };
        }

        setIsMonitoring(true);
        setMonitoringError(null);

        const data = await apiService.monitorStrategy(testMode, scenario);
        setMonitoringData(data);

        // Format monitoring results message
        let message = `Monitoring Results:\n\n`;
        message += `Current Deltas:\n`;

        if (data.currentDeltas) {
          message += `• Weekly Call Sell: ${
            data.currentDeltas.weeklyCallSell?.toFixed(3) || "N/A"
          }\n`;
          message += `• Weekly Put Sell: ${
            data.currentDeltas.weeklyPutSell?.toFixed(3) || "N/A"
          }\n`;
          message += `• Monthly Call Buy: ${
            data.currentDeltas.monthlyCallBuy?.toFixed(3) || "N/A"
          }\n`;
          message += `• Monthly Put Buy: ${
            data.currentDeltas.monthlyPutBuy?.toFixed(3) || "N/A"
          }\n\n`;
        }

        if (data.adjustments && data.adjustments.length > 0) {
          message += `⚠️ ADJUSTMENTS NEEDED:\n`;
          data.adjustments.forEach((adj, index) => {
            message += `${index + 1}. ${adj.position}: ${adj.reason} (${
              adj.action
            })\n`;
          });
        } else {
          message += `✅ No adjustments needed - all positions within thresholds`;
        }

        if (testMode) {
          message += `\n\n🧪 Test Mode: ${scenario}`;
        }

        return { success: true, message, data };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `Failed to monitor strategy: ${error.message}`
            : "Error monitoring strategy. Please check your connection.";

        setMonitoringError(errorMessage);
        console.error("Error monitoring strategy:", error);

        return { success: false, message: errorMessage };
      } finally {
        setIsMonitoring(false);
      }
    },
    []
  );

  /**
   * Clear monitoring data and errors
   */
  const clearMonitoringData = useCallback(() => {
    setMonitoringData(null);
    setMonitoringError(null);
  }, []);

  /**
   * Get monitoring summary for display
   */
  const getMonitoringSummary = useCallback(() => {
    if (!monitoringData) return null;

    const { currentDeltas, adjustments } = monitoringData;

    return {
      deltas: currentDeltas,
      adjustmentsCount: adjustments?.length || 0,
      hasAdjustments: (adjustments?.length || 0) > 0,
      adjustments: adjustments || [],
      timestamp: monitoringData.timestamp,
      testMode: monitoringData.testMode,
      scenario: monitoringData.scenario,
    };
  }, [monitoringData]);

  // ====================================
  // RETURN VALUES
  // ====================================

  return {
    // State
    isMonitoring,
    monitoringData,
    monitoringError,

    // Actions
    monitorPositions,
    clearMonitoringData,

    // Computed
    getMonitoringSummary,
  };
};
