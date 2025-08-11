"use client";
import { useMemo, useState } from "react";
import { SaleRow } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesTable({ rows, signedIn }: { rows: SaleRow[]; signedIn: boolean }) {
  const [sortKey, setSortKey] = useState<keyof SaleRow | "gross_profit_num">("sale_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");


  // Group rows by bundle_id so that rows from the same bundle are together
  const sorted = useMemo(() => {
    type RowWithNum = SaleRow & { gross_profit_num: number; bundle_id?: string };
    const withNums: RowWithNum[] = rows.map((r) => ({ ...r, gross_profit_num: Number(r.gross_profit) }));
    // First, sort as before
    withNums.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "sale_date") return mul * a.sale_date.localeCompare(b.sale_date);
      if (sortKey === "units" || sortKey === "gross_profit_num") return mul * (a[sortKey] - b[sortKey]);
      return mul * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
    });
    // Then, group by bundle_id (bundled rows together, non-bundled after)
    const bundles: Record<string, RowWithNum[]> = {};
    const nonBundles: RowWithNum[] = [];
    for (const row of withNums) {
      if (row.bundle_id) {
        if (!bundles[row.bundle_id]) bundles[row.bundle_id] = [];
        bundles[row.bundle_id].push(row);
      } else {
        nonBundles.push(row);
      }
    }
    // Flatten: all bundles (grouped), then non-bundles
    return [
      ...Object.values(bundles).flat(),
      ...nonBundles
    ];
  }, [rows, sortKey, sortDir]);


  // Assign alternating colors to bundles, keeping all rows from the same bundle together
  const bundleColorMap: Record<string, string> = {};
  let bundleColorList = ['bg-blue-50', 'bg-green-50'];
  let bundleIndex = 0;
  let seenBundles: string[] = [];
  for (const row of sorted) {
    if (row.bundle_id && !bundleColorMap[row.bundle_id]) {
      bundleColorMap[row.bundle_id] = bundleColorList[bundleIndex % bundleColorList.length];
      seenBundles.push(row.bundle_id);
      bundleIndex++;
    }
  }

  return (
    <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "var(--tt-border)", color: "var(--tt-text)" }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={()=>setSortKey("sale_date")}>Date</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right cursor-pointer" onClick={()=>setSortKey("units")}>Units</TableHead>
            <TableHead className="text-right">Price/Unit</TableHead>
            <TableHead className="text-right">Cost/Unit</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">COGS</TableHead>
            <TableHead className="text-right cursor-pointer" onClick={()=>setSortKey("gross_profit_num")}>Gross Profit</TableHead>
            <TableHead>Bundle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r: any) => {
            const gp = Number(r.gross_profit);
            let rowClass = gp < 0 ? "tt-row-neg" : "tt-row-pos";
            if (r.bundle_id) {
              rowClass += ` ${bundleColorMap[r.bundle_id]}`;
            }
            return (
              <TableRow key={r.id} className={rowClass}>
                <TableCell>{r.sale_date}</TableCell>
                <TableCell>{r.event.name}</TableCell>
                <TableCell className="capitalize">{r.sku.item_type}</TableCell>
                <TableCell>{r.sku.name}</TableCell>
                <TableCell className="text-right">{r.units}</TableCell>
                <TableCell className="text-right">${r.price_unit}</TableCell>
                <TableCell className="text-right">${r.cost_unit}</TableCell>
                <TableCell className="text-right">${r.revenue}</TableCell>
                <TableCell className="text-right">${r.cogs}</TableCell>
                <TableCell className={`text-right font-medium ${gp > 0 ? "text-emerald-700" : "text-red-700"}`}>${r.gross_profit}</TableCell>
                <TableCell>{r.is_bundle ? "Y" : "N"}</TableCell>
              </TableRow>
            );
          })}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-6">
                {signedIn ? "No rows." : "Please sign in to view sales."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
