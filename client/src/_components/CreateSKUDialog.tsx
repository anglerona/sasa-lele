"use client";

import { useState, type ReactNode } from "react";
import type { SKUOpt } from "@/lib/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";


export type CreateSKUDialogProps = {
  token?: string;
  apiBase: string;
  onCreated: (sku: SKUOpt) => void;
  trigger?: ReactNode;
};

function asMoney(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function CreateSKUDialog({
  token,
  apiBase,
  onCreated,
  trigger,
}: CreateSKUDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState<string>("");
  const [price, setPrice] = useState("0.00");
  const [cost, setCost] = useState("0.00");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [customType, setCustomType] = useState("");
  const [useCustomType, setUseCustomType] = useState(false);
  const [skuTypes, setSkuTypes] = useState<string[]>([]);

  // make sure this is a strict boolean
  const canSave = Boolean(token) && Boolean(name.trim()) && Boolean(useCustomType ? customType.trim() : itemType);

  // Load SKU types when dialog opens
  async function loadSkuTypes() {
    try {
      const res = await fetch(`${apiBase}/api/skus/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
    const types = Array.from(new Set((Array.isArray(data) ? data : data.results || []).map((s: any) => String(s.item_type)).filter(Boolean)));
    setSkuTypes(types as string[]);
    } catch {}
  }

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      // Prevent duplicate type
      const typeToUse = useCustomType ? customType.trim() : itemType;
      if (["print", "keychain", "sticker", "other"].includes(typeToUse.toLowerCase())) {
        setErr("Type already exists. Please choose a unique type.");
        setSaving(false);
        return;
      }
      const res = await fetch(`${apiBase}/api/skus/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          item_type: typeToUse,
          default_price: asMoney(price),
          default_cost: asMoney(cost),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Create SKU failed (${res.status}) ${text}`);
      }
      const sku = await res.json();
      onCreated(sku);
      // reset
      setOpen(false);
      setName("");
      setItemType("");
      setPrice("0.00");
      setCost("0.00");
      setErr(null);
    } catch (e: unknown) {
      if (typeof e === "object" && e && "message" in e) {
        setErr((e as { message?: string }).message ?? "Failed to create SKU");
      } else {
        setErr("Failed to create SKU");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setErr(null);
        setOpen(v);
        if (v) loadSkuTypes();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button variant="secondary">New SKU</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New SKU</DialogTitle>
        </DialogHeader>


        {err && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">
            {err}
          </div>
        )}

        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (err) setErr(null);
              }}
              placeholder="e.g. Keychain-Gojo"
            />
          </div>

          <div className="grid gap-1">
            <Label>Type</Label>
            <Select
              value={useCustomType ? "__custom__" : itemType}
              onValueChange={(v: string) => {
                if (v === "__custom__") {
                  setUseCustomType(true);
                  setItemType("");
                } else {
                  setUseCustomType(false);
                  setItemType(v);
                }
                if (err) setErr(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {skuTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
                <SelectItem value="__custom__">Create new type...</SelectItem>
              </SelectContent>
            </Select>
            {useCustomType && (
              <Input
                className="mt-2"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="Enter new type (must be unique)"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Default Price</Label>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (err) setErr(null);
                }}
              />
            </div>
            <div className="grid gap-1">
              <Label>Default Cost</Label>
              <Input
                inputMode="decimal"
                value={cost}
                onChange={(e) => {
                  setCost(e.target.value);
                  if (err) setErr(null);
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave || saving || (useCustomType && !customType.trim())}>
            {saving ? "Saving..." : "Save SKU"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
