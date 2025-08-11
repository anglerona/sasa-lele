"use client";
import { EventOpt } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function SalesFilters({
  events, eventId, setEventId, year, setYear, month, setMonth, type, setType, bundle, setBundle,
  onApply, loading, onReset,
}: {
  events: EventOpt[];
  eventId: string; setEventId: (v: string)=>void;
  year: string; setYear: (v: string)=>void;
  month: string; setMonth: (v: string)=>void;
  type: string; setType: (v: string)=>void;
  bundle: string; setBundle: (v: string)=>void;
  onApply: ()=>void; loading: boolean; onReset: ()=>void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-6 border rounded-2xl p-4">
      <div className="col-span-2">
        <label className="text-sm font-medium">Event</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={eventId} onChange={(e)=>setEventId(e.target.value)}>
          <option value="">All</option>
          {events.map((ev)=> (<option key={ev.id} value={ev.id}>{ev.name}</option>))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Year</label>
        <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="YYYY" value={year} onChange={(e)=>setYear(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Month</label>
        <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="1-12" value={month} onChange={(e)=>setMonth(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="">All</option>
          <option value="print">Print</option>
          <option value="keychain">Keychain</option>
          <option value="sticker">Sticker</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Bundle</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={bundle} onChange={(e)=>setBundle(e.target.value)}>
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      <div className="md:col-span-6 flex gap-2">
        <Button onClick={onApply} disabled={loading}>{loading ? "Loading..." : "Apply Filters"}</Button>
        <Button variant="secondary" onClick={onReset}>Reset</Button>
      </div>
    </div>
  );
}
