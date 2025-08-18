"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Card } from "primereact/card";

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
  conditionType?: ConditionType;
  conditionValue?: number | null;
  /** NEW: put running state on the row so the table re-renders reliably */
  isRunning?: boolean;
};

type CheckDeltaResponse = {
  tradingsymbol: string;
  delta: number;
  condition_type: "above" | "below";
  condition_value: number;
  triggered: boolean;
  checked_at: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:2000";

export default function Home() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [lastReading, setLastReading] = useState<
    Record<string, { delta?: number; checked_at?: string; triggered?: boolean }>
  >({});
  const [isConnected, setIsConnected] = useState(true); // Track connection status

  // hold setInterval timers per symbol
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Load positions
  useEffect(() => {
    fetch(`${API_BASE}/positions`)
      .then((r) => r.json())
      .then((data) => {
        const arr: Position[] = Array.isArray(data)
          ? data
          : data.positions || [];
        setPositions(
          arr.map((p) => ({
            ...p,
            conditionType: null,
            conditionValue: null,
            isRunning: false,
          }))
        );
      })
      .catch((e) => console.error("positions error", e));
  }, []);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearInterval(t));
      timersRef.current = {};
    };
  }, []);

  const updateRow = (ts: string, patch: Partial<Position>) => {
    setPositions((prev) =>
      prev.map((p) => (p.tradingsymbol === ts ? { ...p, ...patch } : p))
    );
  };

  const canStart = (row: Position) =>
    !!row.tradingsymbol &&
    row.conditionType !== null &&
    row.conditionValue != null;

  const callCheckDelta = async (row: Position) => {
    try {
      const res = await fetch(`${API_BASE}/check_delta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: CheckDeltaResponse = await res.json();

      setLastReading((prev) => ({
        ...prev,
        [row.tradingsymbol]: {
          delta: data.delta,
          checked_at: data.checked_at,
          triggered: data.triggered,
        },
      }));

      if (data.triggered) {
        console.log(
          `[TRIGGER] ${data.tradingsymbol} Δ=${data.delta.toFixed(2)} ${
            data.condition_type
          } ${data.condition_value}`
        );
        stop(row); // stop immediately if triggered
      }
    } catch (e) {
      console.error("check_delta error", e);
    }
  };

  const start = (row: Position) => {
    if (!canStart(row) || row.isRunning) return;

    // Flip button instantly by updating the row itself
    updateRow(row.tradingsymbol, { isRunning: true });

    // Fire once immediately
    callCheckDelta(row);

    // Then every 5s
    const timer = setInterval(() => {
      // read latest row snapshot (in case condition changed)
      const latest =
        positions.find((p) => p.tradingsymbol === row.tradingsymbol) || row;
      callCheckDelta(latest);
    }, 10000);
    timersRef.current[row.tradingsymbol] = timer;
  };

  const stop = (row: Position) => {
    const timer = timersRef.current[row.tradingsymbol];
    if (timer) {
      clearInterval(timer);
      delete timersRef.current[row.tradingsymbol];
    }

    // was: setRunning(...)
    updateRow(row.tradingsymbol, { isRunning: false });

    // Clear the delta display for that row
    setLastReading((prev) => {
      const updated = { ...prev };
      delete updated[row.tradingsymbol];
      return updated;
    });
  };

  // Calculate summary metrics
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const activePositions = positions.filter((p) => p.pnl !== 0).length;
  const runningMonitors = positions.filter((p) => p.isRunning).length;

  // Consolidated cell renderers
  const BadgeCell = (value: string) => (
    <span className={`position-badge ${value.toLowerCase()}`}>{value}</span>
  );

  const GreeksCell = (
    value: number | undefined,
    formatter: (val: number) => string
  ) => {
    if (value == null) return <span className="text-gray-400 text-sm">—</span>;
    return <span className="font-mono text-sm">{formatter(value)}</span>;
  };

  const SummaryCard = ({
    title,
    value,
    className,
    subtitle,
  }: {
    title: string;
    value: string | number;
    className?: string;
    subtitle?: string;
  }) => (
    <Card className="summary-card">
      <div className="p-6">
        <div className="summary-card-title">{title}</div>
        <div className={`summary-card-value ${className || ""}`}>{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-2">{subtitle}</div>
        )}
      </div>
    </Card>
  );

  const PnLCell = (rowData: Position) => {
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
  };

  const DeltaCell = (rowData: Position) => {
    const delta = rowData.greeks?.delta;
    const reading = lastReading[rowData.tradingsymbol];
    const displayDelta = reading?.delta ?? delta;

    return (
      <div className="flex flex-col items-start">
        {GreeksCell(displayDelta, (val) => val.toFixed(3))}
        {reading?.triggered && (
          <span className="text-xs text-orange-600 font-semibold mt-1 uppercase tracking-wide">
            Triggered
          </span>
        )}
      </div>
    );
  };

  const DeltaTriggerCell = (rowData: Position) => {
    const directions = [
      {
        type: "above" as const,
        icon: "↑",
        severity: "success" as const,
      },
      {
        type: "below" as const,
        icon: "↓",
        severity: "danger" as const,
      },
    ];

    return (
      <div className="flex items-center justify-start space-x-2">
        {directions.map(({ type, icon, severity }) => {
          const isActive = rowData.conditionType === type;
          return (
            <Button
              key={type}
              size="small"
              outlined={!isActive}
              severity={isActive ? severity : "secondary"}
              label={icon}
              className="btn-base monitor-arrow-btn"
              onClick={() =>
                updateRow(rowData.tradingsymbol, {
                  conditionType: isActive ? null : type,
                })
              }
            />
          );
        })}
      </div>
    );
  };

  const DeltaThresholdCell = (rowData: Position) => {
    return (
      <div className="flex justify-start">
        <InputNumber
          value={rowData.conditionValue ?? null}
          onValueChange={(e) =>
            updateRow(rowData.tradingsymbol, {
              conditionValue: e.value as number | null,
            })
          }
          min={0}
          max={1}
          step={0.01}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          size="small"
          className="threshold-input"
          placeholder="0.00"
        />
      </div>
    );
  };

  const StatusCell = (rowData: Position) => {
    const isRunning = !!rowData.isRunning;
    const disabled = !isRunning && !canStart(rowData);
    const reading = lastReading[rowData.tradingsymbol];

    return (
      <div className="flex items-center justify-start space-x-2">
        <Button
          size="small"
          label={isRunning ? "Stop" : "Start"}
          severity={isRunning ? "danger" : "success"}
          className="btn-base status-action-btn"
          disabled={disabled}
          onClick={() => (isRunning ? stop(rowData) : start(rowData))}
        />
        {reading?.delta !== undefined && (
          <div className="delta-reading-compact">
            <div className="font-mono text-xs">
              Δ {reading.delta.toFixed(3)}
            </div>
            {reading.checked_at && (
              <div className="text-[9px] text-gray-400">
                {new Date(reading.checked_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const tableValue = useMemo(() => positions, [positions]);

  // Summary data configuration
  const summaryData = [
    {
      title: "Total P&L",
      value: `₹${Math.abs(totalPnL).toLocaleString("en-IN")}`,
      className:
        totalPnL > 0
          ? "status-positive"
          : totalPnL < 0
          ? "status-negative"
          : "status-neutral",
      subtitle: totalPnL !== 0 ? (totalPnL > 0 ? "Profit" : "Loss") : undefined,
    },
    {
      title: "Active Positions",
      value: activePositions,
      className: "text-gray-900",
      subtitle: "Open contracts",
    },
    {
      title: "Running Monitors",
      value: runningMonitors,
      className: "text-blue-600",
      subtitle: "Active alerts",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards with login button */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Portfolio Overview
          </h2>
          <Button
            label="Connect Kite"
            icon="pi pi-link"
            className="btn-base kite-login-btn"
            // onClick={handleKiteLogin}
            outlined={isConnected}
            severity={isConnected ? "success" : "secondary"}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryData.map((card, index) => (
            <SummaryCard key={index} {...card} />
          ))}
        </div>
      </div>

      {/* Main Table with responsive columns */}
      <Card className="overflow-hidden">
        <div className="p-4">
          <DataTable
            value={tableValue}
            className="w-full"
            paginator={positions.length > 10}
            rows={10}
            emptyMessage="No positions found. Connect your trading account to view positions."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            rowsPerPageOptions={[10, 25, 50]}
            scrollable={false}
            responsiveLayout="scroll"
          >
            <Column
              field="stock"
              header="Stock"
              sortable
              className="font-semibold"
              style={{ minWidth: "80px" }}
            />
            <Column
              header="Type"
              body={(rowData: Position) => BadgeCell(rowData.option_type)}
              style={{ minWidth: "50px" }}
            />
            <Column
              header="Side"
              body={(rowData: Position) => BadgeCell(rowData.buy_or_sell)}
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
              body={DeltaCell}
              sortable
              style={{ minWidth: "70px" }}
            />
            <Column
              header="Theta"
              body={(r: Position) =>
                GreeksCell(r.greeks?.theta, (val) => val.toFixed(2))
              }
              sortable
              style={{ minWidth: "70px" }}
            />
            <Column
              header="P&L"
              body={PnLCell}
              sortable
              style={{ minWidth: "90px" }}
            />
            <Column
              header="Monitor"
              body={DeltaTriggerCell}
              style={{ minWidth: "90px" }}
            />
            <Column
              header="Threshold"
              body={DeltaThresholdCell}
              style={{ minWidth: "90px" }}
            />
            <Column
              header="Status"
              body={StatusCell}
              style={{ minWidth: "120px" }}
            />
          </DataTable>
        </div>
      </Card>
    </div>
  );
}
