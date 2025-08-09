"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DatePicker from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type CreateEventDialogProps = {
  token?: string;
  apiBase: string;
  onCreated: (event: any) => void;
  trigger?: React.ReactNode;
};

export default function CreateEventDialog({ token, apiBase, onCreated, trigger }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const canSave = Boolean(token) && Boolean(name.trim());

  async function submit() {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      const body: any = { name };
      if (startDate) body.start_date = startDate;
      if (endDate) body.end_date = endDate;
      const res = await fetch(`${apiBase}/api/events/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Create Event failed (${res.status}) ${text}`);
      }
      const event = await res.json();
      onCreated(event);
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      setErr(null);
    } catch (e: any) {
      setErr(e.message ?? "Failed to create event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { setErr(null); setOpen(v); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="secondary">New Event</Button>}
      </DialogTrigger>
  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
        </DialogHeader>
        {err && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 p-2 rounded">{err}</div>
        )}
        <div className="grid gap-3">
          <div className="grid gap-1">
            <Label>Name</Label>
            <Input value={name} onChange={e => { setName(e.target.value); if (err) setErr(null); }} placeholder="e.g. Anime Expo 2025" />
          </div>
          <div className="grid gap-1">
            <Label>Start Date (optional)</Label>
            <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick a start date (optional)" />
          </div>
          <div className="grid gap-1">
            <Label>End Date (optional)</Label>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Pick an end date (optional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={!canSave || saving}>{saving ? "Saving..." : "Save Event"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
