"use client";
import CreateEventDialog from "@/_components/CreateEventDialog";
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

interface BundleSkuRow {
  skuId: string;
  units: number;
  priceUnit: string;
  costUnit: string;
}

function currency(n: string | number) {
  const num = typeof n === "number" ? n : Number(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

// Normalize whatever the API returns into a clean array of SKUs


export default function AddSaleDialog({
  token,
  apiBase,
  events,
  onCreated,
}: {
  token?: string;
  apiBase: string;
  events: EventOpt[];
  onCreated: (row: unknown) => void;
}) {
  // DEBUG: show at top of dialog
  const debugInfo = `DEBUG: token=${String(!!token)}, apiBase=${String(apiBase)}`;
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
  // Multi-SKU bundle state
  const [bundleSkus, setBundleSkus] = useState<BundleSkuRow[]>([
    { skuId: "", units: 1, priceUnit: "", costUnit: "" },
  ]);
  // Gift state for non-bundle
  const [isGift, setIsGift] = useState(false);
  const [bundleSize, setBundleSize] = useState(2);
  const [bundlePrice, setBundlePrice] = useState("");
  // bundleId is always auto-generated on save
  const [bundleId, setBundleId] = useState("");
  const [notes, setNotes] = useState("");

  // When bundlePrice is set, distribute it evenly across all bundle SKUs by units
  useEffect(() => {
    if (!isBundle) return;
    const totalUnits = bundleSkus.reduce((sum: number, row: BundleSkuRow) => sum + Number(row.units), 0);
    if (bundlePrice && totalUnits > 0) {
      const perUnit = (Number(bundlePrice) / totalUnits).toFixed(2);
      const newSkus = bundleSkus.map((row: BundleSkuRow) => ({
        ...row,
        priceUnit: (Number(perUnit) * Number(row.units)).toFixed(2)
      }));
      // Only update if priceUnit values actually changed
      const changed = newSkus.some((row, i) => row.priceUnit !== bundleSkus[i].priceUnit);
      if (changed) setBundleSkus(newSkus);
    }
  }, [bundlePrice, isBundle, bundleSkus]);

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
          : Array.isArray((data as { results?: unknown[] }).results)
          ? (data as { results: unknown[] }).results
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

  // Prefill price/cost for single SKU
  useEffect(() => {
    if (!isBundle && skuId) {
      const sku = skus.find((s) => s.id === skuId);
      if (!sku) return;
      if ((priceUnit === "" || priceUnit === "0.00") && sku.default_price != null && !isGift) {
        setPriceUnit(String(sku.default_price));
      }
      if ((costUnit === "" || costUnit === "0.00") && sku.default_cost != null) {
        setCostUnit(String(sku.default_cost));
      }
    }
  }, [skuId, skus, isBundle, isGift]);

  // If isGift is checked for non-bundle, set priceUnit to 0.00
  useEffect(() => {
    if (!isBundle) {
      if (isGift) {
        setPriceUnit("0.00");
      }
    }
  }, [isGift, isBundle]);

  // Prefill price/cost for bundle SKUs
  useEffect(() => {
    if (!isBundle) return;
    setBundleSkus((prev) =>
      prev.map((row) => {
        if (!row.skuId) return row;
        const sku = skus.find((s) => s.id === row.skuId);
        return {
          ...row,
          priceUnit:
            (row.priceUnit === "" || row.priceUnit === "0.00") && sku?.default_price != null
              ? String(sku.default_price)
              : row.priceUnit,
          costUnit:
            (row.costUnit === "" || row.costUnit === "0.00") && sku?.default_cost != null
              ? String(sku.default_cost)
              : row.costUnit,
        };
      })
    );
  }, [skus, isBundle]);

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

  const canSubmit = !!token && !!eventId && !!saleDate && (
    (!isBundle && !!skuId && units > 0) ||
    (isBundle && bundleSkus.every((row) => !!row.skuId && row.units > 0))
  );

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);
    try {
      if (isBundle) {
        // Calculate bundle size and price
        const totalUnits = bundleSkus.reduce((sum, row) => sum + Number(row.units), 0);
        const bundle_price = bundlePrice || bundleSkus.reduce((sum, row) => sum + Number(row.priceUnit) * Number(row.units), 0).toFixed(2);
  // Always generate a unique bundle_id on save
  const bundle_id = `BNDL-${Date.now().toString(36)}-${Math.floor(Math.random()*1000000)}`;
        // POST each SKU as a SaleLine
        const results = [];
        for (const row of bundleSkus) {
          const payload: Record<string, unknown> = {
            event_id: eventId,
            sku_id: row.skuId,
            sale_date: saleDate,
            units: row.units,
            price_unit: row.priceUnit || "0.00",
            cost_unit: row.costUnit || "0.00",
            is_bundle: true,
            bundle_size: totalUnits,
            bundle_price,
            bundle_id,
            notes,
          };
          const res = await fetch(`${apiBase}/api/sales/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Create failed (${res.status}) ${await res.text()}`);
          results.push(await res.json());
        }
        onCreated(results);
        setOpen(false);
  setBundleSkus([{ skuId: "", units: 1, priceUnit: "0.00", costUnit: "0.00" }]);
  setBundleSize(2);
  setBundlePrice("");
  setBundleId("");
  setNotes("");
      } else {
  let payload: Record<string, unknown> = {
          event_id: eventId,
          sku_id: skuId,
          sale_date: saleDate, // YYYY-MM-DD
          units,
          price_unit: priceUnit || "0.00",
          cost_unit: costUnit || "0.00",
          is_bundle: false,
          is_gift: isGift,
          notes,
        };
        const res = await fetch(`${apiBase}/api/sales/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed (${res.status}) ${await res.text()}`);
        const row = await res.json();
        onCreated(row);
        setOpen(false);
        setSkuId("");
        setUnits(1);
        setPriceUnit("0.00");
        setCostUnit("0.00");
        setNotes("");
        setIsGift(false);
      }
      setIsBundle(false);
  } catch (e: unknown) {
      if (typeof e === "object" && e && "message" in e) {
        setErr((e as { message?: string }).message ?? "Failed to create sale");
      } else {
        setErr("Failed to create sale");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Sale</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Sale</DialogTitle>
        </DialogHeader>

        {err && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">
            {err}
          </div>
        )}

        <div className="grid gap-3">
          {/* Create Event and Create SKU buttons */}
          <div className="flex gap-2 mb-2">
            <CreateEventDialog
              token={token}
              apiBase={apiBase}
              onCreated={() => {}}
              trigger={<Button type="button" variant="outline" className="h-8 px-2 text-xs">New Event</Button>}
            />
            <CreateSKUDialog
              token={token}
              apiBase={apiBase}
              onCreated={onSkuCreated}
              trigger={<Button type="button" variant="outline" className="h-8 px-2 text-xs">New SKU</Button>}
            />
          </div>
          {/* Event */}
          <div className="grid gap-1">
            <Label>Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(events) ? events : []).filter(e => e && typeof e === 'object' && 'id' in e && 'name' in e).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SKU(s) */}
          <div className="grid gap-1">
            {/* Bundle + Notes (move New SKU button here) */}
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="is_bundle"
                checked={isBundle}
                onCheckedChange={(v) => {
                  setIsBundle(Boolean(v));
                  if (!v) {
                    setBundleSkus([{ skuId: "", units: 1, priceUnit: "0.00", costUnit: "0.00" }]);
                    setBundleSize(2);
                    setBundlePrice("");
                    setBundleId("");
                  }
                }}
              />
              <Label htmlFor="is_bundle">Bundle</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label>{isBundle ? "Bundle SKUs" : "SKU"}</Label>
            </div>
            {!isBundle ? (
              <div className="flex flex-col gap-2">
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
                {/* Gift checkbox for non-bundle */}
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    id="is_gift"
                    checked={isGift}
                    onCheckedChange={v => setIsGift(Boolean(v))}
                  />
                  <Label htmlFor="is_gift" className="text-xs">Gift</Label>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 border rounded p-2 bg-muted/30">
                {bundleSkus.map((row, idx) => (
                  <div key={idx} className="border-b pb-2 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                      <div>
                        <Label>SKU</Label>
                        <Select
                          value={row.skuId}
                          onValueChange={(v) => {
                            setBundleSkus((prev) => prev.map((r, i) => {
                              if (i !== idx) return r;
                              const sku = skus.find((s) => s.id === v);
                              return {
                                ...r,
                                skuId: v,
                                costUnit: sku && sku.default_cost != null ? String(sku.default_cost) : r.costUnit
                              };
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select SKU" />
                          </SelectTrigger>
                          <SelectContent>
                            {skus.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} <span className="text-muted-foreground">({s.item_type})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <Label>Units</Label>
                          <Input
                            type="number"
                            min={1}
                            value={row.units}
                            onChange={e => setBundleSkus((prev) => prev.map((r, i) => i === idx ? { ...r, units: Number(e.target.value) || 1 } : r))}
                            className="w-16"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <Checkbox
                            checked={row.priceUnit === "0.00"}
                            onCheckedChange={v => setBundleSkus((prev) => prev.map((r, i) => {
                              if (i !== idx) return r;
                              if (v) {
                                return { ...r, priceUnit: "0.00" };
                              } else {
                                // If unchecked, try to autofill default price if available
                                const sku = skus.find((s) => s.id === r.skuId);
                                return { ...r, priceUnit: sku && sku.default_price != null ? String(sku.default_price) : "" };
                              }
                            }))}
                            className="h-4 w-4"
                            style={{ minWidth: 16, minHeight: 16 }}
                          />
                          <Label className="mb-0 text-xs">Gift</Label>
                        </div>
                        {bundleSkus.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setBundleSkus((prev) => prev.filter((_, i) => i !== idx))}
                            title="Remove this SKU"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 items-end">
                      <div>
                        <Label>Price / unit</Label>
                        <Input
                          inputMode="decimal"
                          value={row.priceUnit}
                          onChange={e => setBundleSkus((prev) => prev.map((r, i) => i === idx ? { ...r, priceUnit: e.target.value } : r))}
                          placeholder="Price/unit"
                        />
                      </div>
                      <div>
                        <Label>Cost / unit</Label>
                        <Input
                          inputMode="decimal"
                          value={row.costUnit}
                          onChange={e => setBundleSkus((prev) => prev.map((r, i) => i === idx ? { ...r, costUnit: e.target.value } : r))}
                          placeholder="Cost/unit"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => setBundleSkus((prev) => [...prev, { skuId: "", units: 1, priceUnit: "", costUnit: "" }])}
                >
                  Add SKU +
                </Button>
              </div>
            )}
          </div>

          {/* Date + Units */}
          <div className={`grid gap-3 ${isBundle ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div className="grid gap-1">
              <Label>Sale Date</Label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            {/* Bundle ID is now always auto-generated and not user-editable */}
            {!isBundle && (
              <div className="grid gap-1">
                <Label>Units</Label>
                <Input
                  type="number"
                  min={1}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          {/* Prices */}
          {!isBundle && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Price / unit</Label>
                        <Input
                          inputMode="decimal"
                          value={priceUnit}
                          onChange={(e) => setPriceUnit(e.target.value)}
                          disabled={isGift}
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
          )}

          {/* Bundle + Notes */}
          <div className="my-2">
            {isBundle && (
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Bundle size</Label>
                  <Input
                    type="number"
                    min={2}
                    value={bundleSkus.reduce((sum, row) => sum + Number(row.units), 0)}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Bundle price</Label>
                  <Input
                    inputMode="decimal"
                    value={bundlePrice}
                    onChange={e => setBundlePrice(e.target.value)}
                    placeholder={bundleSkus.reduce((sum, row) => sum + Number(row.priceUnit) * Number(row.units), 0).toFixed(2)}
                  />
                </div>
              </div>
            )}
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
        {!isBundle ? (
          <div className="text-xs text-muted-foreground">
            Preview — Revenue: ${currency(Number(units) * Number(priceUnit))}
            {" · "}COGS: ${currency(Number(units) * Number(costUnit))}
            {" · "}Gross Profit: $
            {currency(Number(units) * (Number(priceUnit) - Number(costUnit)))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Preview — Revenue: ${currency(bundleSkus.reduce((sum, row) => sum + Number(row.priceUnit) * Number(row.units), 0))}
            {" · "}COGS: ${currency(bundleSkus.reduce((sum, row) => sum + Number(row.costUnit) * Number(row.units), 0))}
            {" · "}Gross Profit: $
            {currency(bundleSkus.reduce((sum, row) => sum + (Number(row.priceUnit) - Number(row.costUnit)) * Number(row.units), 0))}
          </div>
        )}

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
