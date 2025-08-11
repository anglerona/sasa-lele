"use client";

import { SKUOpt } from "@/lib/types";

function parseNum(val: string) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export default function AvgCostByType({ skus }: { skus: SKUOpt[] }) {
  // Calculate average cost/unit for each item type
  const avgCostByType: Record<string, { sum: number, count: number }> = {};
  (skus || []).forEach(sku => {
    const type = sku.item_type || "Unknown";
    const cost = parseNum(String((sku as any).default_cost ?? 0));
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
    <div className="mb-6">
      <h3 className="font-semibold text-base mb-1">Average Cost/Unit by Item Type</h3>
      <div className="flex flex-wrap gap-4">
        {avgCostRows.map(row => (
          <div key={row.type} className="text-sm bg-muted rounded px-3 py-1">
            <span className="font-medium">{row.type}:</span> ${row.avg.toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
