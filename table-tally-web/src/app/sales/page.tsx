"use client";
import { useEffect, useMemo, useState } from "react";
import { useUserColors } from "@/lib/userColors";
import { useSession, signOut } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CreateSKUDialog from "@/_components/CreateSKUDialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

function currency(n: string | number) {
  const num = typeof n === "number" ? n : Number(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

type EventOpt = { id: string; name: string };
type SKUOpt = { id: string; name: string; item_type: string };

function AddSaleDialog({
  token,
  apiBase,
  events,
  onCreated,
}: {
  token?: string;
  apiBase: string;
  events: EventOpt[];
  onCreated: (row: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [skus, setSkus] = useState<SKUOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [eventId, setEventId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [units, setUnits] = useState(1);
  const [priceUnit, setPriceUnit] = useState("0.00");
  const [costUnit, setCostUnit] = useState("0.00");
  const [isBundle, setIsBundle] = useState(false);
  const [notes, setNotes] = useState("");

  // ✅ this must live inside the component so it can use the setters
  function onSkuCreated(sku: any) {
    setSkus((prev) =>
      prev.find((s) => s.id === sku.id) ? prev : [...prev, sku]
    );
    setSkuId(sku.id);
    if (sku.default_price) setPriceUnit(String(sku.default_price));
    if (sku.default_cost) setCostUnit(String(sku.default_cost));
  }

  // load SKUs when dialog opens
  useEffect(() => {
    if (!open || !token) return;
    fetch(`${apiBase}/api/skus/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setSkus)
      .catch(() => setErr("Failed to load SKUs"));
  }, [open, token, apiBase]);

  const canSubmit = !!token && !!eventId && !!skuId && !!saleDate && units > 0;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase}/api/sales/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          sku_id: skuId,
          sale_date: saleDate, // YYYY-MM-DD
          units,
          price_unit: priceUnit || "0.00",
          cost_unit: costUnit || "0.00",
          is_bundle: isBundle,
          notes,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Create failed (${res.status}) ${text}`);
      }
      const row = await res.json();
      onCreated(row); // prepend into table
      setOpen(false); // close dialog
      // reset minimal fields for rapid entry
      setUnits(1);
      setPriceUnit("0.00");
      setCostUnit("0.00");
      setIsBundle(false);
      setNotes("");
    } catch (e: any) {
      setErr(e.message ?? "Failed to create sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Sale</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Sale</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">
            {err}
          </div>
        )}

        <div className="grid gap-3">
          {/* Event */}
          <div className="grid gap-1">
            <Label>Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SKU */}
          <div className="grid gap-1">
            <div className="flex items-center justify-between">
              <Label>SKU</Label>
              <CreateSKUDialog
                token={token}
                apiBase={apiBase}
                onCreated={onSkuCreated}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs"
                  >
                    New SKU
                  </Button>
                }
              />
            </div>
            <Select
              value={skuId}
              onValueChange={(v) => {
                setSkuId(v);
                const sku = skus.find((s) => s.id === v);
                if (sku) {
                  // optionally prefill defaults
                  // if (sku.default_price) setPriceUnit(String(sku.default_price));
                  // if (sku.default_cost) setCostUnit(String(sku.default_cost));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {skus.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{" "}
                    <span className="text-muted-foreground">
                      ({s.item_type})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Units */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Sale date</Label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Units</Label>
              <Input
                type="number"
                min={1}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Price / unit</Label>
              <Input
                inputMode="decimal"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label>Cost / unit</Label>
              <Input
                inputMode="decimal"
                value={costUnit}
                onChange={(e) => setCostUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Bundle + Notes */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_bundle"
              checked={isBundle}
              onCheckedChange={(v) => setIsBundle(Boolean(v))}
            />
            <Label htmlFor="is_bundle">Bundle</Label>
          </div>
          <div className="grid gap-1">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 3 keychain deal"
            />
          </div>
        </div>

        {/* Preview row math */}
        <div className="text-xs text-muted-foreground">
          Preview — Revenue: ${currency(Number(units) * Number(priceUnit))}
          {" · "}COGS: ${currency(Number(units) * Number(costUnit))}
          {" · "}Gross Profit: $
          {currency(Number(units) * (Number(priceUnit) - Number(costUnit)))}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesPage() {
  // Apply user color settings globally
  useUserColors();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  // filters
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [eventId, setEventId] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [type, setType] = useState("");
  const [bundle, setBundle] = useState("");

  type SaleRow = {
    id: string;
    event: { id: string; name: string };
    sku: { id: string; name: string; item_type: string };
    sale_date: string;
    units: number;
    price_unit: string;
    cost_unit: string;
    is_bundle: boolean;
    revenue: string;
    cogs: string;
    gross_margin_unit: string;
    gross_profit: string;
  };
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteEvent(id: string) {
  if (!token) return;
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/events/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delete failed (${res.status}) ${text}`);
    }

    setEvents(prev => prev.filter(e => e.id !== id));

    setEventId(prev => (prev === id ? "" : prev));
    await fetchSales();
  } catch (e: any) {
    alert(e.message || "Failed to delete event");
  }
}

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    fetch(`${API_BASE}/api/events/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setEvents)
      .catch(() => setError("Failed to load events"));
  }, [API_BASE, status, token]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (eventId) p.set("event", eventId);
    if (year) p.set("year", year);
    if (month) p.set("month", month);
    if (type) p.set("type", type);
    if (bundle) p.set("bundle", bundle);
    return p.toString();
  }, [eventId, year, month, type, bundle]);

  const fetchSales = async () => {
    if (status !== "authenticated" || !token) {
      setError("Not signed in");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/sales/${query ? `?${query}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Sales fetch failed (${res.status})`);
      setRows(await res.json());
    } catch (e: any) {
      setError(e.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    fetchSales();
  }, [query, status, token]);

  const [sortKey, setSortKey] = useState<keyof SaleRow | "gross_profit_num">(
    "sale_date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const withNums = rows.map((r) => ({
      ...r,
      gross_profit_num: Number(r.gross_profit),
    }));
    return withNums.sort((a: any, b: any) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "sale_date")
        return mul * a.sale_date.localeCompare(b.sale_date);
      if (sortKey === "units" || sortKey === "gross_profit_num")
        return mul * (a[sortKey] - b[sortKey]);
      return (
        mul * String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""))
      );
    });
  }, [rows, sortKey, sortDir]);

  const resetFilters = () => {
    setEventId("");
    setYear("");
    setMonth("");
    setType("");
    setBundle("");
  };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <div className="flex gap-2">
          <AddSaleDialog
            token={token}
            apiBase={API_BASE}
            events={events}
            onCreated={(row: any) => setRows((prev) => [row, ...prev])}
          />
          <Button
            variant="secondary"
            onClick={() => (location.href = "/login")}
          >
            Login
          </Button>
          <Button onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-6 border rounded-2xl p-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Event</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">All</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Year</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="YYYY"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Month</label>
          <input
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            placeholder="1-12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All</option>
            <option value="print">Print</option>
            <option value="keychain">Keychain</option>
            <option value="sticker">Sticker</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Bundle</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={bundle}
            onChange={(e) => setBundle(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="md:col-span-6 flex gap-2">
          <Button onClick={fetchSales} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </Button>
          <Button variant="secondary" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>


      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => setSortKey("sale_date")}
              >
                Date
              </TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => setSortKey("units")}
              >
                Units
              </TableHead>
              <TableHead className="text-right">Price/Unit</TableHead>
              <TableHead className="text-right">Cost/Unit</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">COGS</TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => setSortKey("gross_profit_num")}
              >
                Gross Profit
              </TableHead>
              <TableHead>Bundle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r: any) => {
              const gp = Number(r.gross_profit);
              return (
                <TableRow key={r.id} className={gp < 0 ? "bg-red-50" : ""}>
                  <TableCell>{r.sale_date}</TableCell>
                  <TableCell>{r.event.name}</TableCell>
                  <TableCell className="capitalize">
                    {r.sku.item_type}
                  </TableCell>
                  <TableCell>{r.sku.name}</TableCell>
                  <TableCell className="text-right">{r.units}</TableCell>
                  <TableCell className="text-right">${r.price_unit}</TableCell>
                  <TableCell className="text-right">${r.cost_unit}</TableCell>
                  <TableCell className="text-right">${r.revenue}</TableCell>
                  <TableCell className="text-right">${r.cogs}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      gp > 0 ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    ${r.gross_profit}
                  </TableCell>
                  <TableCell>{r.is_bundle ? "Y" : "N"}</TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-sm text-muted-foreground py-6"
                >
                  {token ? "No rows." : "Please sign in to view sales."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
