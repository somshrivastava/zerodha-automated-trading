/**
 * Test Mode Controls Component
 *
 * Displays and manages test mode toggle and scenario selection.
 * This component is prominently displayed to make test mode functionality clear to users.
 */

import React from "react";
import { TestScenario } from "../types";
import { Select, FormField } from "./UI/FormField";

interface TestModeControlsProps {
  testMode: boolean;
  onTestModeChange: (testMode: boolean) => void;
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  availableScenarios: TestScenario | null;
}

export const TestModeControls: React.FC<TestModeControlsProps> = ({
  testMode,
  onTestModeChange,
  scenario,
  onScenarioChange,
  availableScenarios,
}) => {
  const scenarioOptions = availableScenarios
    ? [
        { value: "no-adjustments", label: "No Adjustments (Default)" },
        ...availableScenarios.scenarios
          .filter((s) => s !== "no-adjustments")
          .map((s) => ({
            value: s,
            label: availableScenarios.descriptions[s] || s,
          })),
      ]
    : [{ value: "no-adjustments", label: "No Adjustments (Default)" }];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-800">
          Test Mode Configuration
        </h2>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            testMode
              ? "bg-blue-100 text-blue-800 border border-blue-300"
              : "bg-gray-100 text-gray-600 border border-gray-300"
          }`}
        >
          {testMode ? "TEST MODE" : "LIVE MODE"}
        </div>
      </div>

      <FormField
        label="Enable Test Mode"
        helpText="Use mock data instead of live market data for testing different scenarios"
      >
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="testMode"
            checked={testMode}
            onChange={(e) => onTestModeChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor="testMode"
            className="text-sm font-medium text-blue-700"
          >
            Use test mode with mock scenarios
          </label>
        </div>
      </FormField>

      {testMode && (
        <div className="mt-4">
          <Select
            label="Test Scenario"
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            options={scenarioOptions}
            helpText="Select market scenario to simulate for testing purposes"
          />
        </div>
      )}

      {!testMode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Live Mode:</strong> All trades will use real market data and
            execute actual orders. Make sure you have reviewed your strategy
            configuration carefully.
          </p>
        </div>
      )}
    </div>
  );
};
