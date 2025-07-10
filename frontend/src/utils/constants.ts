/**
 * Frontend constants and configuration
 */

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_BASE_URL = "http://localhost:4000";

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_STRATEGY_CONFIG = {
  weeklyExpiry: "2025-07-10", // Default weekly expiry
  monthlyExpiry: "2025-07-24", // Default monthly expiry
  sellLegDelta: 0.5, // Target delta for weekly sells
  buyLegDelta: 0.3, // Target delta for monthly buys
  exitSellLower: 0.25, // Lower exit threshold for sells
  exitSellUpper: 0.75, // Upper exit threshold for sells
  exitBuyDelta: 0.7, // Emergency exit threshold for buys
};

export const DEFAULT_TEST_MODE = {
  testMode: false,
  scenario: "no-adjustments",
};

// ============================================================================
// CSS CLASSES (Reusable Tailwind combinations)
// ============================================================================

export const CSS_CLASSES = {
  input:
    "w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500",
  label: "block text-sm font-medium text-gray-700 mb-2",
  button: {
    primary:
      "w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors",
    secondary:
      "px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors",
    danger:
      "px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors",
  },
  card: "bg-white rounded-lg shadow-lg border border-gray-200 p-6",
  alert: {
    info: "bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md",
    success:
      "bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md",
    warning:
      "bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md",
    error: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md",
  },
};
