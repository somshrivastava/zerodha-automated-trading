/**
 * Options Calendar Strategy - Main Application Page
 *
 * This page orchestrates the entire options trading strategy interface,
 * using modular components for better maintainability and reusability.
 */

import React, { useState } from "react";
import { useStrategy, useMonitoring } from "../hooks";
import {
  StrategyForm,
  PositionDisplay,
  TestModeControls,
  LoadingSpinner,
  Alert,
} from "../components";

export default function Home() {
  // ====================================
  // HOOKS AND STATE
  // ====================================

  const {
    config,
    setConfig,
    positions,
    expiryDates,
    isLoading,
    isDeploying,
    testMode,
    setTestMode,
    scenario,
    setScenario,
    availableScenarios,
    deployStrategy,
    stopStrategy,
  } = useStrategy();

  const { monitorPositions, isMonitoring } = useMonitoring();

  // Local state for UI
  const [alertMessage, setAlertMessage] = useState<{
    type: "info" | "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [monitoringResults, setMonitoringResults] = useState<string | null>(
    null
  );

  // ====================================
  // EVENT HANDLERS
  // ====================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await deployStrategy();

    setAlertMessage({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    // Auto-hide success messages
    if (result.success) {
      setTimeout(() => setAlertMessage(null), 5000);
    }
  };

  const handleMonitor = async () => {
    const result = await monitorPositions(positions, testMode, scenario);

    if (result.success) {
      setMonitoringResults(result.message);
      setAlertMessage({
        type: "info",
        message: "Position monitoring completed successfully!",
      });
    } else {
      setAlertMessage({
        type: "error",
        message: result.message,
      });
    }

    // Auto-hide messages
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleStop = async () => {
    const result = await stopStrategy();

    setAlertMessage({
      type: result.success ? "success" : "error",
      message: result.message,
    });

    if (result.success) {
      setMonitoringResults(null);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  // ====================================
  // LOADING STATE
  // ====================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading application data..." />
      </div>
    );
  }

  // ====================================
  // RENDER
  // ====================================

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Options Calendar Strategy
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Deploy and monitor weekly-monthly calendar spread strategies
          </p>

          {/* Navigation */}
          <div className="flex justify-center space-x-4">
            <a
              href="/option-chains"
              className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Option Chain
            </a>
          </div>
        </div>

        {/* Alert Messages */}
        {alertMessage && (
          <div className="mb-6">
            <Alert
              type={alertMessage.type}
              onClose={() => setAlertMessage(null)}
            >
              {alertMessage.message}
            </Alert>
          </div>
        )}

        {/* Strategy Configuration Form */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Strategy Configuration
          </h2>

          <StrategyForm
            config={config}
            onConfigChange={setConfig}
            onSubmit={handleSubmit}
            expiryDates={expiryDates}
            isDeploying={isDeploying}
          />
        </div>

        {/* Test Mode Controls */}
        <TestModeControls
          testMode={testMode}
          onTestModeChange={setTestMode}
          scenario={scenario}
          onScenarioChange={setScenario}
          availableScenarios={availableScenarios}
        />

        {/* Position Display */}
        {positions && (
          <PositionDisplay
            positions={positions}
            onMonitor={handleMonitor}
            onStop={handleStop}
            isMonitoring={isMonitoring}
            monitoringResults={monitoringResults}
            testMode={testMode}
          />
        )}

        {/* Help Section */}
        {!positions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-blue-800 mb-3">
              Getting Started
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>1. Configure your strategy</strong> - Set expiry dates,
                delta targets, and exit thresholds
              </p>
              <p>
                <strong>2. Enable test mode</strong> - Use mock data to test
                different market scenarios
              </p>
              <p>
                <strong>3. Deploy strategy</strong> - Execute the calendar
                spread with your parameters
              </p>
              <p>
                <strong>4. Monitor positions</strong> - Track deltas and receive
                adjustment recommendations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
