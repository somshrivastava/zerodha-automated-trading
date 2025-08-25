"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";

type ConditionType = "above" | "below" | null;

type Position = {
  tradingsymbol: string;
  stock: string;
  option_type: "CE" | "PE";
  buy_or_sell: "BUY" | "SELL" | "NONE";
  expiry: string;
  strike: number;
  pnl: number;
  greeks?: { delta?: number; theta?: number };
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://zerodha-automated-trading.onrender.com";

export default function StrategyPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  // Use Position[] for selection, not string[]
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [telegramBotToken, setTelegramBotToken] = useState<string>("");
  const [telegramChatId, setTelegramChatId] = useState<string>("");
  const [targetDelta, setTargetDelta] = useState<number | null>(null);
  const [conditionType, setConditionType] = useState<ConditionType>("above");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [netDelta, setNetDelta] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Telegram settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTelegramBotToken(localStorage.getItem("telegramBotToken") || "");
      setTelegramChatId(localStorage.getItem("telegramChatId") || "");
    }
  }, []);
  useEffect(() => {
    if (telegramBotToken)
      localStorage.setItem("telegramBotToken", telegramBotToken);
  }, [telegramBotToken]);
  useEffect(() => {
    if (telegramChatId) localStorage.setItem("telegramChatId", telegramChatId);
  }, [telegramChatId]);

  // Load positions
  useEffect(() => {
    fetch(`${API_BASE}/positions`)
      .then((r) => r.json())
      .then((data) => {
        const arr: Position[] = Array.isArray(data)
          ? data
          : data.positions || [];
        setPositions(arr);
      })
      .catch((e) => console.error("positions error", e));
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Net delta monitoring with live updates
  const checkNetDelta = async () => {
    // Use selectedPositions to get tradingsymbols
    const selectedSymbols = selectedPositions.map((p) => p.tradingsymbol);
    if (selectedSymbols.length === 0 || targetDelta === null || !conditionType)
      return;

    try {
      const res = await fetch(`${API_BASE}/check_net_delta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_symbols: selectedSymbols,
          target_delta: targetDelta,
          condition_type: conditionType,
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setNetDelta(data.net_delta);

      if (data.triggered) {
        const msg = `[NET DELTA TRIGGER] Net Δ=${data.net_delta.toFixed(3)} ${
          data.condition_type
        } ${data.target_delta}`;
        setNotification(msg); // Show notification in UI
        stopMonitoring(); // Stop monitoring when triggered
      }
    } catch (e) {
      console.error("check_net_delta error", e);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);

    // Check immediately
    checkNetDelta();

    // Then check every 10 seconds
    intervalRef.current = setInterval(() => {
      checkNetDelta();
    }, 10000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setNetDelta(null);
  };

  const sendTelegramNotification = async (
    selected: Position[],
    net: number
  ) => {
    const msg =
      `Net delta alert!\n\n` +
      `Selected positions:\n` +
      selected
        .map(
          (p) => `${p.tradingsymbol} (Δ=${(p.greeks?.delta ?? 0).toFixed(3)})`
        )
        .join("\n") +
      `\n\nNet delta: ${net.toFixed(3)}`;
    try {
      await fetch(`${API_BASE}/send_telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          message: msg,
        }),
      });
    } catch (e) {
      // ignore
    }
  };

  // Telegram test button
  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      alert("Please enter both Telegram Bot Token and Chat ID.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/send_telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: telegramBotToken,
          telegram_chat_id: telegramChatId,
          message: "✅ Test message from Zerodha Automated Trading!",
        }),
      });
      if (res.ok) {
        alert("Test message sent!");
      } else {
        const data = await res.json();
        alert("Failed to send test message: " + (data.error || res.statusText));
      }
    } catch (e) {
      alert("Error sending test message.");
    }
  };

  // Kite login
  const handleKiteLogin = async () => {
    try {
      const redirect_uri = window.location.origin;
      const res = await fetch(
        `${API_BASE}/login?redirect_uri=${encodeURIComponent(redirect_uri)}`
      );
      const data = await res.json();
      if (data.login_url) {
        window.location.href = data.login_url;
      } else {
        alert("Failed to get Kite login URL.");
      }
    } catch (e) {
      alert("Error connecting to backend for Kite login.");
    }
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="space-y-8">
      {/* Notification UI */}
      {notification && (
        <div className="fixed top-4 left-1/2 z-50 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-800 px-6 py-3 rounded shadow-lg flex items-center gap-4 min-w-[320px] max-w-[90vw]">
          <span className="font-semibold">Notification:</span>
          <span className="flex-1">{notification}</span>
          <button
            className="ml-2 text-green-700 hover:text-green-900 font-bold"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
      {/* Header row: Clean and simple like the main page */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div className="flex flex-row items-end gap-4">
          <span className="flex flex-col">
            <label
              htmlFor="telegram-bot-token"
              className="text-xs font-medium mb-1 text-gray-600"
            >
              Telegram Bot Token
            </label>
            <InputText
              id="telegram-bot-token"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="Enter bot token"
              className="w-full md:w-64"
              style={{ fontSize: 14 }}
            />
          </span>
          <span className="flex flex-col">
            <label
              htmlFor="telegram-chat-id"
              className="text-xs font-medium mb-1 text-gray-600"
            >
              Chat ID
            </label>
            <InputText
              id="telegram-chat-id"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Enter chat ID"
              className="w-full md:w-48"
              style={{ fontSize: 14 }}
            />
          </span>
          <span className="flex flex-col">
            <label className="text-xs font-medium mb-1 text-gray-600 invisible">
              &nbsp;
            </label>
            <Button
              label="Test Telegram"
              icon="pi pi-send"
              className="btn-base"
              severity="info"
              type="button"
              outlined={true}
              onClick={handleTestTelegram}
            />
          </span>
        </div>
        <span className="flex flex-col">
          <label className="text-xs font-medium mb-1 text-gray-600 invisible">
            &nbsp;
          </label>
          <Button
            label="Connect Kite"
            icon="pi pi-link"
            className="btn-base"
            onClick={handleKiteLogin}
            outlined
            severity="secondary"
          />
        </span>
      </div>

      {/* Strategy controls row */}
      <div className="flex flex-row items-end gap-4 mb-2">
        <span className="flex flex-col">
          <label
            htmlFor="target-delta"
            className="text-xs font-medium mb-1 text-gray-600"
          >
            Target Delta
          </label>
          <InputText
            id="target-delta"
            value={targetDelta === null ? "" : String(targetDelta)}
            onChange={(e) => {
              const val = e.target.value;
              setTargetDelta(val === "" ? null : Number(val));
            }}
            placeholder="0.00"
            className="w-full md:w-64"
            style={{ fontSize: 14 }}
            inputMode="decimal"
            type="number"
            step="0.01"
            min={-10}
            max={10}
          />
        </span>
        <span className="flex flex-col">
          <label className="text-xs font-medium mb-1 text-gray-600">
            Condition
          </label>
          <Dropdown
            value={conditionType}
            options={[
              { label: "Above", value: "above" },
              { label: "Below", value: "below" },
            ]}
            onChange={(e) => setConditionType(e.value)}
            className="w-full md:w-32"
          />
        </span>
        <span className="flex flex-col">
          <label className="text-xs font-medium mb-1 text-gray-600 invisible">
            &nbsp;
          </label>
          {!isMonitoring ? (
            <Button
              label="Start"
              icon="pi pi-play"
              className="btn-base"
              severity="success"
              type="button"
              disabled={
                !targetDelta ||
                !conditionType ||
                selectedPositions.length === 0 ||
                !telegramBotToken ||
                !telegramChatId
              }
              onClick={startMonitoring}
            />
          ) : (
            <Button
              label="Stop"
              icon="pi pi-stop"
              className="btn-base"
              severity="danger"
              type="button"
              onClick={stopMonitoring}
            />
          )}
        </span>
      </div>

      {/* Positions Table */}
      <Card className="overflow-hidden">
        <div className="p-4">
          <DataTable
            value={positions}
            className="w-full"
            selectionMode={"multiple"}
            paginator={positions.length > 10}
            rows={10}
            emptyMessage="No positions found. Connect your trading account to view positions"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            rowsPerPageOptions={[10, 25, 50]}
            scrollable={false}
            selection={selectedPositions}
            onSelectionChange={(e) => setSelectedPositions(e.value)}
            dataKey="tradingsymbol"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              field="stock"
              header="Stock"
              sortable
              className="font-semibold"
              style={{ minWidth: "80px" }}
            />
            <Column
              header="Type"
              body={(rowData: Position) => (
                <span
                  className={`position-badge ${rowData.option_type.toLowerCase()}`}
                >
                  {rowData.option_type}
                </span>
              )}
              style={{ minWidth: "50px" }}
            />
            <Column
              header="Side"
              body={(rowData: Position) => (
                <span
                  className={`position-badge ${rowData.buy_or_sell.toLowerCase()}`}
                >
                  {rowData.buy_or_sell}
                </span>
              )}
              style={{ minWidth: "50px" }}
            />
            <Column
              field="strike"
              header="Strike"
              sortable
              className="font-mono"
              style={{ minWidth: "80px" }}
              body={(rowData: Position) =>
                rowData.strike.toLocaleString("en-IN")
              }
            />
            <Column
              field="expiry"
              header="Expiry"
              sortable
              className="text-sm"
              style={{ minWidth: "80px" }}
              body={(rowData: Position) => {
                const date = new Date(rowData.expiry);
                return date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                });
              }}
            />
            <Column
              header="Delta"
              body={(rowData: Position) => (
                <span className="font-mono text-sm">
                  {rowData.greeks?.delta != null ? (
                    rowData.greeks.delta.toFixed(3)
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </span>
              )}
              sortable
              style={{ minWidth: "70px" }}
            />
            <Column
              header="Theta"
              body={(rowData: Position) => (
                <span className="font-mono text-sm">
                  {rowData.greeks?.theta != null ? (
                    rowData.greeks.theta.toFixed(2)
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </span>
              )}
              sortable
              style={{ minWidth: "70px" }}
            />
            <Column
              header="P&L"
              body={(rowData: Position) => {
                const isPositive = rowData.pnl > 0;
                const isNegative = rowData.pnl < 0;
                return (
                  <span
                    className={`font-mono ${
                      isPositive
                        ? "status-positive"
                        : isNegative
                        ? "status-negative"
                        : "status-neutral"
                    }`}
                  >
                    ₹
                    {Math.abs(rowData.pnl).toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                );
              }}
              sortable
              style={{ minWidth: "90px" }}
            />
          </DataTable>
        </div>
      </Card>
    </div>
  );
}
