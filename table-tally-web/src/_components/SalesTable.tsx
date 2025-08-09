"use client";
import { useMemo, useState } from "react";
import { SaleRow } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesTable({ rows, signedIn }: { rows: SaleRow[]; signedIn: boolean }) {
  const [sortKey, setSortKey] = useState<keyof SaleRow | "gross_profit_num">("sale_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const withNums = rows.map((r) => ({ ...r, gross_profit_num: Number(r.gross_profit) }));
    return withNums.sort((a: any, b: any) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "sale_date") return mul * a.sale_date.localeCompare(b.sale_date);
      if (sortKey === "units" || sortKey === "gross_profit_num") return mul * (a[sortKey] - b[sortKey]);
      return mul * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
    });
  }, [rows, sortKey, sortDir]);

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
            return (
              <TableRow key={r.id} className={gp < 0 ? "tt-row-neg" : "tt-row-pos"}>
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
