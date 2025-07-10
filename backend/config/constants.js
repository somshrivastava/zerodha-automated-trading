/**
 * Backend configuration constants
 */

export const PORT = 4000;
export const API_DELAY_MS = 2500; // Delay between API calls to respect Dhan rate limits
export const DEFAULT_STRIKES = 10; // Number of strikes to fetch around ATM

// Dhan API configuration
export const DHAN_CONFIG = {
  BASE_URL: "https://api.dhan.co/v2",
  INSTRUMENT_ENDPOINT: "/instrument/IDX_I",
  OPTION_CHAIN_ENDPOINT: "/optionchain/expirylist",
  UNDERLYING_SCRIP: 13,
  UNDERLYING_SEG: "IDX_I",
};

// Environment variables validation
export const validateEnvVars = () => {
  const required = ["DHAN_ACCESS_TOKEN", "DHAN_CLIENT_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(", ")}`
    );
  }
};
