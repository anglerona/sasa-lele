"use client";

import { useState } from "react";
import { SKUOpt } from "@/lib/types";

// Use default_cost from SKUOpt as cost for this component
type SKUOptWithCost = SKUOpt & { cost?: number | string; default_cost?: number | string };
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

function parseNum(val: string) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}
type BundleCalculatorProps = {
  skus: SKUOpt[];
};

export default function BundleCalculator({ skus }: BundleCalculatorProps) {
  // Map skus to include a 'cost' property for local use (from default_cost) and force id to string
  const skusWithCost: SKUOptWithCost[] = (skus || []).map((sku) => ({ ...sku, id: String(sku.id), cost: (sku as any).default_cost ?? "" }));
  // Set initial skuId to first SKU if available
  const [rows, setRows] = useState([
    { skuId: skusWithCost[0]?.id || "", units: 1, cost: skusWithCost[0]?.cost || "" },
  ]);
  const [bundlePrice, setBundlePrice] = useState("");
  const [showResult, setShowResult] = useState(false);

  function addRow() {
    setRows([...rows, { skuId: "", units: 1, cost: "" }]);
  }
  function updateRow(idx: number, key: string, value: string | number | Record<string, any>) {
    setRows(rows => rows.map((r, i) => {
      if (i !== idx) return r;
      if (typeof value === 'object' && value !== null) return { ...r, ...value };
      return { ...r, [key]: value };
    }));
  }
  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  // Calculate total cost, total units, and profit/loss
  const totalCost = rows.reduce((sum, r) => sum + parseNum(String(r.cost)) * parseNum(String(r.units)), 0);
  const totalUnits = rows.reduce((sum, r) => sum + parseNum(String(r.units)), 0);
  const price = parseNum(bundlePrice);
  const profit = price - totalCost;
  const profitPerUnit = totalUnits ? profit / totalUnits : 0;

  // Calculate average cost/unit for each item type
  const avgCostByType: Record<string, { sum: number, count: number }> = {};
  skusWithCost.forEach(sku => {
    const type = sku.item_type || "Unknown";
    const cost = parseNum(String(sku.cost ?? sku.default_cost ?? 0));
    if (!avgCostByType[type]) avgCostByType[type] = { sum: 0, count: 0 };
    if (cost > 0) {
      avgCostByType[type].sum += cost;
      avgCostByType[type].count += 1;
    }
  });
  const avgCostRows = Object.entries(avgCostByType).map(([type, { sum, count }]) => ({
    type,
    avg: count > 0 ? (sum / count) : 0
  }));

  return (
    <Card className="p-4 w-full mt-8">
      <h2 className="font-semibold text-lg mb-2">Bundle Deal Calculator</h2>
      <div className="mb-4">
        <h3 className="font-semibold text-base mb-1">Average Cost/Unit by Item Type</h3>
        <div className="flex flex-wrap gap-4">
          {avgCostRows.map(row => (
            <div key={row.type} className="text-sm bg-muted rounded px-3 py-1">
              <span className="font-medium">{row.type}:</span> ${row.avg.toFixed(2)}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => {
          // Force ids to string for matching
          const skuIdStr = String(row.skuId ?? "");
          const selectedSku = skusWithCost.find(s => String(s.id) === skuIdStr);
          console.log('row', i, 'skuId:', skuIdStr, 'selectedSku:', selectedSku);
          return (
            <div key={i} className="flex gap-2 items-end">
              <Select
                value={skuIdStr}
                onValueChange={v => {
                  const sku = skusWithCost.find(s => s.id === v);
                  updateRow(i, '', {
                    ...row,
                    skuId: v,
                    cost: sku && sku.default_cost != null ? String(sku.default_cost) : ''
                  });
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {skusWithCost.map(sku => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.name} <span className="text-muted-foreground">({sku.item_type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-20"
                type="number"
                min={1}
                placeholder="Units"
                value={row.units}
                onChange={e => updateRow(i, "units", e.target.value)}
              />
              <Input
                className="w-24"
                type="number"
                min={0}
                step={0.01}
                placeholder="Cost/unit"
                value={row.cost}
                onChange={e => updateRow(i, "cost", e.target.value)}
                disabled={!!selectedSku}
              />
              <Button variant="ghost" onClick={() => removeRow(i)} disabled={rows.length === 1}>Remove</Button>
            </div>
          );
        })}
        <Button variant="secondary" onClick={addRow}>Add SKU</Button>
      </div>
      <div className="mt-4">
        <Input
          className="w-40"
          type="number"
          min={0}
          step={0.01}
          placeholder="Bundle Price"
          value={bundlePrice}
          onChange={e => setBundlePrice(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => setShowResult(true)} disabled={totalUnits === 0}>Calculate</Button>
  <Button variant="ghost" onClick={() => { setShowResult(false); setBundlePrice(""); setRows([{ skuId: "", units: 1, cost: "" }]); }}>Reset</Button>
      </div>
      {showResult && (
        <div className="mt-4 border-t pt-4 space-y-2">
          <div>Total Cost: <span className="font-semibold">${totalCost.toFixed(2)}</span></div>
          <div>Total Units: <span className="font-semibold">{totalUnits}</span></div>
          <div>Bundle Price: <span className="font-semibold">${price.toFixed(2)}</span></div>
          <div className={profit >= 0 ? "text-emerald-700" : "text-red-700"}>
            {profit >= 0 ? "Profit" : "Loss"}: <span className="font-semibold">${profit.toFixed(2)}</span>
          </div>
          <div>Profit/Loss per Unit: <span className="font-semibold">${profitPerUnit.toFixed(2)}</span></div>
        </div>
      )}
    </Card>
  );
}
