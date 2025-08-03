/**
 * Position Display Component for showing strategy positions and monitoring results
 */

import React from "react";
import { StrategyPositions, Position } from "../types";
import { Button } from "./UI/Button";
import { Alert } from "./UI/Alert";
import { CSS_CLASSES } from "../utils/constants";

interface PositionDisplayProps {
  positions: StrategyPositions;
  onMonitor?: () => void;
  onStop?: () => void;
  isMonitoring?: boolean;
  monitoringResults?: string | null;
  testMode?: boolean;
}

export const PositionDisplay: React.FC<PositionDisplayProps> = ({
  positions,
  onMonitor,
  onStop,
  isMonitoring = false,
  monitoringResults,
  testMode = false,
}) => {
  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  const formatPosition = (position: Position | null, label: string) => {
    if (!position) {
      return {
        label,
        strike: "N/A",
        delta: "N/A",
        price: "N/A",
        action: "N/A",
        expiry: "N/A",
      };
    }

    return {
      label,
      strike: position.strike,
      delta: position.delta.toFixed(3),
      price: position.price.toFixed(2),
      action: position.type.toUpperCase(),
      expiry: position.expiry,
    };
  };

  const positionRows = [
    formatPosition(positions.weeklyCallSell, "Weekly Call Sell"),
    formatPosition(positions.weeklyPutSell, "Weekly Put Sell"),
    formatPosition(positions.monthlyCallBuy, "Monthly Call Buy"),
    formatPosition(positions.monthlyPutBuy, "Monthly Put Buy"),
  ];

  const getRowColor = (action: string) => {
    if (action === "N/A") return "bg-gray-50";
    return action === "SELL" ? "bg-red-50" : "bg-green-50";
  };

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className={CSS_CLASSES.card + " mt-6"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Strategy Positions
          </h2>
          <div className="text-sm text-gray-600 mt-1">
            Deployed at: {new Date(positions.entryTime).toLocaleString()}
          </div>
          {testMode && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🧪 Test Mode
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          {onMonitor && (
            <Button
              onClick={onMonitor}
              loading={isMonitoring}
              variant="secondary"
            >
              {isMonitoring ? "Monitoring..." : "Monitor Positions"}
            </Button>
          )}

          {onStop && (
            <Button onClick={onStop} variant="danger">
              Stop Strategy
            </Button>
          )}
        </div>
      </div>

      {/* Monitoring Results */}
      {monitoringResults && (
        <div className="mb-6">
          <Alert type="info">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {monitoringResults}
            </div>
          </Alert>
        </div>
      )}

      {/* Positions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Position Type
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Strike
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Delta
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Price
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Action
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                Expiry
              </th>
            </tr>
          </thead>
          <tbody>
            {positionRows.map((row, index) => (
              <tr key={index} className={getRowColor(row.action)}>
                <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">
                  {row.label}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                  {row.strike}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                  {row.delta}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                  ₹{row.price}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.action === "SELL"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {row.action}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900">
                  {row.expiry}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategy Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Short Positions
          </h3>
          <div className="text-sm text-blue-700">
            <div>
              Weekly Call: Strike {positions.weeklyCallSell?.strike || "N/A"}
            </div>
            <div>
              Weekly Put: Strike {positions.weeklyPutSell?.strike || "N/A"}
            </div>
            <div className="mt-1 text-xs">
              Collecting premium from time decay
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            Long Positions
          </h3>
          <div className="text-sm text-green-700">
            <div>
              Monthly Call: Strike {positions.monthlyCallBuy?.strike || "N/A"}
            </div>
            <div>
              Monthly Put: Strike {positions.monthlyPutBuy?.strike || "N/A"}
            </div>
            <div className="mt-1 text-xs">Protection against large moves</div>
          </div>
        </div>
      </div>
    </div>
  );
};
