"use client";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

type Position = {
  tradingsymbol: string;
  stock: string;
  option_type: "CE" | "PE";
  buy_or_sell: "BUY" | "SELL" | "NONE";
  expiry: string;
  strike: number;
  pnl: number;
  greeks?: { delta?: number; theta?: number };
  // new fields (UI state per row)
  conditionType?: "above" | "below" | null;
  conditionValue?: number | null;
};

export default function Home() {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    fetch("http://localhost:2000/positions")
      .then((res) => res.json())
      .then((data) => {
        const arr: Position[] = Array.isArray(data)
          ? data
          : data.positions || [];
        // seed per-row UI fields
        setPositions(
          arr.map((p) => ({ ...p, conditionType: null, conditionValue: null }))
        );
      })
      .catch(console.error);
  }, []);

  const updateRow = (ts: string, patch: Partial<Position>) => {
    setPositions((prev) =>
      prev.map((p) => (p.tradingsymbol === ts ? { ...p, ...patch } : p))
    );
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
          style={btnStyle(activeAbove, "#0f766e")} // teal
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
          style={btnStyle(activeBelow, "#b91c1c")} // red
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

  return (
    <main style={{ padding: "2rem" }}>
      <DataTable value={positions} stripedRows>
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

        {/* New, re-implemented column */}
        <Column header="Δ Trigger" body={DeltaTriggerCell} />
      </DataTable>
    </main>
  );
}
