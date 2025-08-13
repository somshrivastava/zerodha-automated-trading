"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

type ConditionType = "above" | "below" | null;

type Position = {
  tradingsymbol: string; // must be present in /positions
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

  const DeltaTriggerCell = (row: Position) => {
    const activeAbove = row.conditionType === "above";
    const activeBelow = row.conditionType === "below";

    const btnStyle = (active: boolean, color: string) => ({
      backgroundColor: active ? color : "transparent",
      border: `1px solid ${color}`,
      color: active ? "white" : color,
      width: "28px",
      height: "28px",
      padding: 0,
    });

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        <Button
          aria-label="Above"
          label="↑"
          style={btnStyle(activeAbove, "#0f766e")}
          className="p-button-sm p-button-rounded"
          onClick={() =>
            updateRow(row.tradingsymbol, {
              conditionType: activeAbove ? null : "above",
            })
          }
        />
        <Button
          aria-label="Below"
          label="↓"
          style={btnStyle(activeBelow, "#b91c1c")}
          className="p-button-sm p-button-rounded"
          onClick={() =>
            updateRow(row.tradingsymbol, {
              conditionType: activeBelow ? null : "below",
            })
          }
        />
        <InputNumber
          value={row.conditionValue ?? null}
          onValueChange={(e) =>
            updateRow(row.tradingsymbol, {
              conditionValue: e.value as number | null,
            })
          }
          min={0}
          max={1}
          step={0.01}
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          inputStyle={{ width: "60px", textAlign: "center" }}
          style={{ width: "60px" }}
          placeholder="0.00"
        />
      </div>
    );
  };

  const StatusCell = (row: Position) => {
    const isOn = !!row.isRunning;
    const disabled = !isOn && !canStart(row);
    const label = isOn ? "End" : "Start";
    const color = isOn ? "#b91c1c" : "#0f766e";
    const reading = lastReading[row.tradingsymbol];

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <Button
          label={label}
          className="p-button-sm"
          style={{
            backgroundColor: color,
            border: `1px solid ${color}`,
            color: "white",
          }}
          disabled={disabled}
          onClick={() => (isOn ? stop(row) : start(row))}
        />
        {reading?.delta !== undefined && (
          <small style={{ opacity: 0.7 }}>
            Δ {reading.delta.toFixed(2)} {reading.triggered ? "• hit" : ""}{" "}
          </small>
        )}
      </div>
    );
  };

  const tableValue = useMemo(() => positions, [positions]);

  const sendText = async () => {
    const payload = { text: "Hello from the UI!" };
    const res = await fetch(`${API_BASE}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Notify failed:", await res.text());
    } else {
      console.log("Telegram notified!");
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <DataTable value={tableValue} stripedRows>
        {/* <Column field="tradingsymbol" header="Symbol" sortable /> */}
        <Column field="stock" header="Stock" sortable />
        <Column field="option_type" header="Type" sortable />
        <Column field="buy_or_sell" header="Buy/Sell" sortable />
        <Column field="expiry" header="Expiry" sortable />
        <Column field="strike" header="Strike" sortable />
        <Column
          header="Delta"
          body={(r: Position) =>
            r.greeks?.delta != null ? r.greeks.delta.toFixed(2) : ""
          }
          sortable
        />
        <Column
          header="Theta"
          body={(r: Position) =>
            r.greeks?.theta != null ? r.greeks.theta.toFixed(2) : ""
          }
          sortable
        />
        <Column field="pnl" header="PnL" sortable />
        <Column header="Δ Trigger" body={DeltaTriggerCell} />
        <Column header="Status" body={StatusCell} />
      </DataTable>
    </main>
  );
}
