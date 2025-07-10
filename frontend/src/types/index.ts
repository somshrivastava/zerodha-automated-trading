/**
 * TypeScript type definitions for the Options Calendar Strategy system
 */

// ============================================================================
// STRATEGY CONFIGURATION TYPES
// ============================================================================

export interface StrategyConfig {
  weeklyExpiry: string; // Weekly option expiry date
  monthlyExpiry: string; // Monthly option expiry date
  sellLegDelta: number; // Target delta for weekly options to sell
  buyLegDelta: number; // Target delta for monthly options to buy
  exitSellLower: number; // Lower delta threshold for sell position exit
  exitSellUpper: number; // Upper delta threshold for sell position exit
  exitBuyDelta: number; // Delta threshold for buy position emergency exit
}

// ============================================================================
// POSITION TYPES
// ============================================================================

export interface Position {
  strike: number; // Option strike price
  delta: number; // Current delta value
  price: number; // Option premium/price
  type: string; // Position type: "buy" or "sell"
  expiry: string; // Option expiry date
}

export interface StrategyPositions {
  weeklyCallSell: Position | null; // Weekly call option sold
  weeklyPutSell: Position | null; // Weekly put option sold
  monthlyCallBuy: Position | null; // Monthly call option bought
  monthlyPutBuy: Position | null; // Monthly put option bought
  entryTime: string; // Strategy entry timestamp
  config?: StrategyConfig; // Strategy configuration used (optional)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  status: string;
  data?: T;
  error?: string;
  details?: string;
}

export interface DeployResponse {
  status: string;
  config: StrategyConfig;
  positions: StrategyPositions;
  message: string;
}

export interface MonitoringResponse {
  status: string;
  config: StrategyConfig;
  currentDeltas: {
    weeklyCallSell: number;
    weeklyPutSell: number;
    monthlyCallBuy: number;
    monthlyPutBuy: number;
  };
  adjustments: Adjustment[];
  timestamp: string;
  testMode: boolean;
  scenario: string;
}

export interface Adjustment {
  type: string;
  position: string;
  reason: string;
  action: string;
}

// ============================================================================
// TEST MODE TYPES
// ============================================================================

export interface TestScenario {
  scenarios: string[];
  descriptions: Record<string, string>;
}
