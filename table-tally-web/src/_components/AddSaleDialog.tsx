"use client";
import { useEffect, useState } from "react";
import { EventOpt, SKUOpt as SKUOptBase } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import CreateSKUDialog from "@/_components/CreateSKUDialog";

type SKUOpt = SKUOptBase & {
  default_price?: string | number | null;
  default_cost?: string | number | null;
};

function currency(n: string | number) {
  const num = typeof n === "number" ? n : Number(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

// Normalize whatever the API returns into a clean array of SKUs
function normalizeSkus(data: any): SKUOpt[] {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : [];
  if (!Array.isArray(arr)) return [];
  // Ensure minimal shape and strings for ids
  return arr.filter(Boolean).map((s: any) => ({
    id: String(s.id),
    name: String(s.name ?? ""),
    item_type: String(s.item_type ?? "other"),
    default_price: s.default_price ?? null,
    default_cost: s.default_cost ?? null,
  }));
}

export default function AddSaleDialog({
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

  // form
  const [eventId, setEventId] = useState("");
  const [skuId, setSkuId] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [units, setUnits] = useState(1);
  const [priceUnit, setPriceUnit] = useState("0.00");
  const [costUnit, setCostUnit] = useState("0.00");
  const [isBundle, setIsBundle] = useState(false);
  const [notes, setNotes] = useState("");

  // When a SKU is created in the dialog, push it + prefill defaults
  function onSkuCreated(sku: SKUOpt) {
    setSkus((prev) =>
      prev.find((s) => s.id === sku.id) ? prev : [...prev, sku]
    );
    setSkuId(sku.id);
    if (sku.default_price != null) setPriceUnit(String(sku.default_price));
    if (sku.default_cost != null) setCostUnit(String(sku.default_cost));
  }

  // Load SKUs when dialog opens
  useEffect(() => {
    if (!open || !token) return;

    async function loadSkus() {
      try {
        const res = await fetch(`${apiBase}/api/skus/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If server returns HTML (e.g., 500 page), this will throw on .json()
        const data = await res.json().catch(() => null);
        console.log("[AddSaleDialog] /api/skus response:", res.status, data);

        if (!res.ok || !data) {
          setErr(`Failed to load SKUs (${res.status})`);
          setSkus([]); // keep it an array no matter what
          return;
        }

        // Normalize to array
        const arr = Array.isArray(data)
          ? data
          : Array.isArray((data as any).results)
          ? (data as any).results
          : [];

        setSkus(arr);
        setErr(null);
      } catch (e) {
        console.error("[AddSaleDialog] loadSkus error:", e);
        setErr("Failed to load SKUs");
        setSkus([]); // always an array
      }
    }

    loadSkus();
  }, [open, token, apiBase]);

  // Prefill price/cost if user selects a SKU and inputs are still defaults
  useEffect(() => {
    if (!skuId) return;
    const sku = skus.find((s) => s.id === skuId);
    if (!sku) return;
    if (
      (priceUnit === "" || priceUnit === "0.00") &&
      sku.default_price != null
    ) {
      setPriceUnit(String(sku.default_price));
    }
    if ((costUnit === "" || costUnit === "0.00") && sku.default_cost != null) {
      setCostUnit(String(sku.default_cost));
    }
  }, [skuId, skus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional: set today's date when opening if empty
  useEffect(() => {
    if (open && !saleDate) {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      setSaleDate(`${y}-${m}-${d}`);
    }
  }, [open, saleDate]);

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
      if (!res.ok)
        throw new Error(`Create failed (${res.status}) ${await res.text()}`);
      const row = await res.json();
      onCreated(row);
      setOpen(false);
      // light reset (keep date & event for speed)
      setSkuId("");
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
            <Select value={skuId} onValueChange={(v) => setSkuId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select SKU" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(skus) && skus.length > 0 ? (
                  skus.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{" "}
                      <span className="text-muted-foreground">
                        ({s.item_type})
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No SKUs available
                  </div>
                )}
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
