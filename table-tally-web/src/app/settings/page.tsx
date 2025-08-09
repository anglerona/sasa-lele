"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type EventOpt = { id: string; name: string; start_date?: string; end_date?: string };
type SKU = { id: string; name: string; item_type: string; default_price?: string; default_cost?: string };

export default function SettingsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const [skus, setSkus] = useState<SKU[]>([]);
  const [events, setEvents] = useState<EventOpt[]>([]);
  const signedIn = status === "authenticated" && !!token;

  useEffect(() => {
    if (!signedIn) return;

    const headers: HeadersInit = { Authorization: `Bearer ${token}` };

    async function safeJson(res: Response) {
      try {
        return await res.json();
      } catch {
        return null;
      }
    }

    function normalizeArray(data: any) {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return []; // always give an array
    }

    (async () => {
      try {
        const [skusRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/skus/`, { headers }),
          fetch(`${API_BASE}/api/events/`, { headers }),
        ]);

        const skusData = await safeJson(skusRes);
        const eventsData = await safeJson(eventsRes);

        console.log("[Settings] /api/skus ->", skusRes.status, skusData);
        console.log("[Settings] /api/events ->", eventsRes.status, eventsData);

        // If not OK, keep arrays empty (prevents .map crash)
        setSkus(skusRes.ok ? normalizeArray(skusData) : []);
        setEvents(eventsRes.ok ? normalizeArray(eventsData) : []);
      } catch (e) {
        console.error("[Settings] load error:", e);
        setSkus([]);
        setEvents([]);
      }
    })();
  }, [signedIn, API_BASE, token]);

  // --- SKU handlers
  async function saveSku(sku: SKU) {
    const res = await fetch(`${API_BASE}/api/skus/${sku.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: sku.name }),
    });
    if (!res.ok) alert(`SKU save failed (${res.status})`);
  }
  async function deleteSku(id: string) {
    if (!confirm("Delete this SKU? This will fail if it has sales.")) return;
    const res = await fetch(`${API_BASE}/api/skus/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert(`Delete failed (${res.status})`);
    setSkus(prev => prev.filter(s => s.id !== id));
  }

  // --- Event handlers
  async function saveEvent(ev: EventOpt) {
    const res = await fetch(`${API_BASE}/api/events/${ev.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: ev.name }),
    });
    if (!res.ok) alert(`Event save failed (${res.status})`);
  }
  async function deleteEvent(id: string) {
    if (!confirm("Delete this event (and its sales)?")) return;
    const res = await fetch(`${API_BASE}/api/events/${id}/?force=1`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) return alert(`Delete failed (${res.status})`);
    setEvents(prev => prev.filter(e => e.id !== id));
  }


  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* SKUs */}
      <section className="mt-4">
        <h2 className="text-xl font-semibold mb-2">SKUs</h2>
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">Sign in to manage SKUs.</p>
        ) : (
          <div className="space-y-3">
            {Array.isArray(skus) && skus.length > 0 ? (
              skus.map((s, idx) => (
                <div key={s.id} className="grid grid-cols-5 gap-2 items-center border rounded-xl p-3">
                  <div className="col-span-3">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={s.name}
                      onChange={(e)=>{
                        const name = e.target.value;
                        setSkus(prev => prev.map((x,i)=> i===idx ? {...x, name} : x));
                      }}
                    />
                  </div>
                  <div className="text-sm">{s.item_type}</div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={()=>saveSku(s)}>Save</Button>
                    <Button size="sm" variant="destructive" onClick={()=>deleteSku(s.id)}>Delete</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No SKUs yet.</p>
            )}
          </div>
        )}
      </section>

      {/* Events */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Events</h2>
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">Sign in to manage events.</p>
        ) : (
          <div className="space-y-3">
            {Array.isArray(events) && events.length > 0 ? (
              events.map((ev, idx) => (
                <div key={ev.id} className="grid grid-cols-5 gap-2 items-center border rounded-xl p-3">
                  <div className="col-span-3">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={ev.name}
                      onChange={(e)=>{
                        const name = e.target.value;
                        setEvents(prev => prev.map((x,i)=> i===idx ? {...x, name} : x));
                      }}
                    />
                  </div>
                  <div className="text-sm col-span-1 opacity-60">ID: {ev.id.slice(0,6)}…</div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" onClick={()=>saveEvent(ev)}>Save</Button>
                    <Button size="sm" variant="destructive" onClick={()=>deleteEvent(ev.id)}>Delete</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
