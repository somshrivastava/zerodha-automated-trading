import { useState, useEffect } from "react";

interface OptionData {
  ltp: number;
  bid: number;
  ask: number;
  volume: number;
  oi: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface OptionChainRow {
  strike: number;
  call: OptionData;
  put: OptionData;
}

interface ScenarioData {
  underlying_price: number;
  closest_strike: number;
  total_strikes_shown: number;
  option_chain: OptionChainRow[];
}

interface MockData {
  scenarios: {
    [key: string]: {
      weekly: ScenarioData;
      monthly: ScenarioData;
    };
  };
}

export default function OptionChains() {
  const [mockData, setMockData] = useState<MockData | null>(null);
  const [selectedScenario, setSelectedScenario] = useState("no-adjustments");
  const [selectedExpiry, setSelectedExpiry] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMockData();
  }, []);

  const fetchMockData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/all-mock-data");
      if (response.ok) {
        const data = await response.json();
        setMockData(data);
      } else {
        console.error("Failed to fetch mock data");
      }
    } catch (error) {
      console.error("Error fetching mock data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-900";
  };

  const getStrikeRowClass = (strike: number, closestStrike: number) => {
    if (strike === closestStrike) {
      return "bg-blue-50 border-blue-200 text-gray-900";
    }
    return "bg-white hover:bg-gray-50 text-gray-900";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">Fetching option chain data...</p>
        </div>
      </div>
    );
  }

  if (!mockData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">Failed to load option chain data</p>
        </div>
      </div>
    );
  }

  const scenarios = Object.keys(mockData.scenarios);
  const currentData = mockData.scenarios[selectedScenario]?.[selectedExpiry];

  if (!currentData) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data</h2>
          <p className="text-gray-600">
            No data available for selected scenario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          {/* Header */}
          <div className="mb-6">
            {/* Navigation */}
            <div className="mb-4">
              <a
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Strategy
              </a>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Option Chain Viewer
            </h1>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Scenario
                </label>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario} value={scenario}>
                      {scenario.replace(/-/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Type
                </label>
                <select
                  value={selectedExpiry}
                  onChange={(e) =>
                    setSelectedExpiry(e.target.value as "weekly" | "monthly")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Market Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-600">Underlying Price:</span>
                <span className="ml-2 font-semibold text-lg text-gray-900">
                  {formatNumber(currentData.underlying_price)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Closest Strike:</span>
                <span className="ml-2 font-semibold text-lg text-gray-900">
                  {currentData.closest_strike}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Strikes:</span>
                <span className="ml-2 font-semibold text-lg text-gray-900">
                  {currentData.total_strikes_shown}
                </span>
              </div>
            </div>
          </div>

          {/* Option Chain Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {/* Call side headers */}
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Gamma
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Vega
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Theta
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Delta
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    IV
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Call LTP
                  </th>

                  {/* Strike */}
                  <th className="border border-gray-300 px-4 py-3 text-xs font-semibold text-gray-900 bg-blue-100">
                    Strike
                  </th>

                  {/* Put side headers */}
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Put LTP
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    IV
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Delta
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Theta
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Vega
                  </th>
                  <th className="border border-gray-300 px-2 py-3 text-xs font-semibold text-gray-900">
                    Gamma
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.option_chain.map((option, index) => (
                  <tr
                    key={option.strike}
                    className={getStrikeRowClass(
                      option.strike,
                      currentData.closest_strike
                    )}
                  >
                    {/* Call side data */}
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.call.gamma, 5)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.call.vega, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-red-600">
                      {formatNumber(option.call.theta, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.call.delta, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.call.iv, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center font-semibold text-gray-900">
                      {formatNumber(option.call.ltp, 2)}
                    </td>

                    {/* Strike */}
                    <td className="border border-gray-300 px-4 py-2 text-sm font-bold text-center bg-blue-50 text-gray-900">
                      {option.strike}
                    </td>

                    {/* Put side data */}
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center font-semibold text-gray-900">
                      {formatNumber(option.put.ltp, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.put.iv, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.put.delta, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-red-600">
                      {formatNumber(option.put.theta, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.put.vega, 2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-xs text-center text-gray-900">
                      {formatNumber(option.put.gamma, 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Legend:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• LTP: Last Traded Price</div>
              <div>• IV: Implied Volatility (%)</div>
              <div>• Delta: Price sensitivity to underlying movement</div>
              <div>• Gamma: Rate of change of delta</div>
              <div>• Theta: Time decay (negative values indicate decay)</div>
              <div>• Vega: Sensitivity to volatility changes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
