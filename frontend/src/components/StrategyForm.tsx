/**
 * Strategy Configuration Form Component
 */

import React from "react";
import { StrategyConfig } from "../types";
import { Input, Select } from "./UI/FormField";
import { Button } from "./UI/Button";

interface StrategyFormProps {
  config: StrategyConfig;
  onConfigChange: (config: StrategyConfig) => void;
  onSubmit: (e: React.FormEvent) => void;
  expiryDates: string[];
  isDeploying: boolean;
}

export const StrategyForm: React.FC<StrategyFormProps> = ({
  config,
  onConfigChange,
  onSubmit,
  expiryDates,
  isDeploying,
}) => {
  // ====================================
  // HELPER FUNCTIONS
  // ====================================

  const updateConfig = (
    field: keyof StrategyConfig,
    value: string | number
  ) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const expiryOptions = [
    { value: "", label: "Select expiry date" },
    ...expiryDates.map((date) => ({ value: date, label: date })),
  ];

  // ====================================
  // RENDER
  // ====================================

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      {/* Basic Settings */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Basic Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Weekly Expiry"
            value={config.weeklyExpiry}
            onChange={(e) => updateConfig("weeklyExpiry", e.target.value)}
            options={expiryOptions}
            required
            helpText="Shorter expiry for selling options"
          />

          <Select
            label="Monthly Expiry"
            value={config.monthlyExpiry}
            onChange={(e) => updateConfig("monthlyExpiry", e.target.value)}
            options={expiryOptions}
            required
            helpText="Longer expiry for buying options"
          />
        </div>
      </div>

      {/* Delta Configuration */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Delta Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Sell Leg Delta"
            type="number"
            step="0.01"
            min="0.1"
            max="0.9"
            value={config.sellLegDelta}
            onChange={(e) =>
              updateConfig("sellLegDelta", parseFloat(e.target.value) || 0)
            }
            required
            helpText="Target delta for weekly options to sell (~0.5)"
          />

          <Input
            label="Buy Leg Delta"
            type="number"
            step="0.01"
            min="0.1"
            max="0.9"
            value={config.buyLegDelta}
            onChange={(e) =>
              updateConfig("buyLegDelta", parseFloat(e.target.value) || 0)
            }
            required
            helpText="Target delta for monthly options to buy (~0.3)"
          />
        </div>
      </div>

      {/* Exit Rules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exit Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Exit Sell if ≤"
            type="number"
            step="0.01"
            min="0.1"
            max="0.9"
            value={config.exitSellLower}
            onChange={(e) =>
              updateConfig("exitSellLower", parseFloat(e.target.value) || 0)
            }
            required
            helpText="Lower threshold for sell position exit"
          />

          <Input
            label="Exit Sell if ≥"
            type="number"
            step="0.01"
            min="0.1"
            max="0.9"
            value={config.exitSellUpper}
            onChange={(e) =>
              updateConfig("exitSellUpper", parseFloat(e.target.value) || 0)
            }
            required
            helpText="Upper threshold for sell position exit"
          />

          <Input
            label="Exit Buy if Delta ≥"
            type="number"
            step="0.01"
            min="0.1"
            max="0.9"
            value={config.exitBuyDelta}
            onChange={(e) =>
              updateConfig("exitBuyDelta", parseFloat(e.target.value) || 0)
            }
            required
            helpText="Emergency exit threshold for buy positions"
          />
        </div>
      </div>

      {/* Deploy Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button type="submit" loading={isDeploying} className="w-full">
          {isDeploying ? "Deploying Strategy..." : "Deploy Strategy"}
        </Button>
      </div>
    </form>
  );
};
