/**
 * Utility helper functions
 */

/**
 * Creates a delay for rate limiting API calls.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the specified delay
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Validates strategy configuration
 * @param {Object} config - Strategy configuration
 * @returns {Object} Validation result with isValid and errors
 */
export const validateStrategyConfig = (config) => {
  const errors = [];

  if (!config.weeklyExpiry) errors.push("weeklyExpiry is required");
  if (!config.monthlyExpiry) errors.push("monthlyExpiry is required");
  if (
    typeof config.sellLegDelta !== "number" ||
    config.sellLegDelta <= 0 ||
    config.sellLegDelta >= 1
  ) {
    errors.push("sellLegDelta must be a number between 0 and 1");
  }
  if (
    typeof config.buyLegDelta !== "number" ||
    config.buyLegDelta <= 0 ||
    config.buyLegDelta >= 1
  ) {
    errors.push("buyLegDelta must be a number between 0 and 1");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats error responses consistently
 * @param {string} message - Error message
 * @param {string} details - Detailed error information
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (message, details = null) => {
  const response = { error: message };
  if (details) response.details = details;
  return response;
};

/**
 * Formats success responses consistently
 * @param {string} status - Status message
 * @param {Object} data - Response data
 * @param {string} message - Optional message
 * @returns {Object} Formatted success response
 */
export const formatSuccessResponse = (status, data = null, message = null) => {
  const response = { status };
  if (data) response.data = data;
  if (message) response.message = message;
  return response;
};
