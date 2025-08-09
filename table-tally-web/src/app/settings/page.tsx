"use client";
import CreateSKUDialog from "@/_components/CreateSKUDialog";
import CreateEventDialog from "@/_components/CreateEventDialog";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { SKUOpt as ImportedSKUOpt } from "@/lib/types";
import dynamic from "next/dynamic";

type SKUOpt = ImportedSKUOpt & {
  default_cost?: number | string;
};

const Navbar = dynamic(() => import("@/_components/Navbar"), { ssr: false });
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/DatePicker";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
  // (removed duplicate top-level filter and memo logic; all hooks should be inside the component)

type EventOpt = { id: string; name: string; start_date?: string; end_date?: string };

type SaleRow = {
  id: string;
  sku: SKUOpt;
  // ...other fields not needed for filtering
};

export default function SettingsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;


  const [skus, setSkus] = useState<SKUOpt[]>([]);
  const [events, setEvents] = useState<EventOpt[]>([]);
  const signedIn = status === "authenticated" && !!token;
  const [sales, setSales] = useState<SaleRow[]>([]);

  // Filters for SKU type and sold status (must be after skus/sales are defined)
  const [skuTypeFilter, setSkuTypeFilter] = useState<string>("__all__");
  const [skuSoldFilter, setSkuSoldFilter] = useState<string>("__all__");

  // Get all unique item types from SKUs
  const skuTypes = useMemo<string[]>(() => Array.from(new Set(skus.map((s: SKUOpt) => s.item_type).filter(Boolean) as string[])), [skus]);

  // Set of sold SKU IDs
  const soldSkuIds = useMemo<Set<string>>(() => new Set(sales.map((s: SaleRow) => s.sku?.id).filter(Boolean) as string[]), [sales]);

  // Filtered SKUs
  const filteredSkus = useMemo<SKUOpt[]>(() => {
    return skus.filter((sku: SKUOpt) => {
      let typeMatch = skuTypeFilter === "__all__" || sku.item_type === skuTypeFilter;
      let soldMatch =
        skuSoldFilter === "__all__" ||
        (skuSoldFilter === "sold" && soldSkuIds.has(sku.id)) ||
        (skuSoldFilter === "unsold" && !soldSkuIds.has(sku.id));
      return typeMatch && soldMatch;
    });
  }, [skus, skuTypeFilter, skuSoldFilter, soldSkuIds]);

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
        const [skusRes, eventsRes, salesRes] = await Promise.all([
          fetch(`${API_BASE}/api/skus/`, { headers }),
          fetch(`${API_BASE}/api/events/`, { headers }),
          fetch(`${API_BASE}/api/sales/`, { headers }),
        ]);

        const skusData = await safeJson(skusRes);
        const eventsData = await safeJson(eventsRes);
        const salesData = await safeJson(salesRes);

    setSkus(skusRes.ok ? normalizeArray(skusData) : [] as SKUOpt[]);
        setEvents(eventsRes.ok ? normalizeArray(eventsData) : []);
        setSales(salesRes.ok ? normalizeArray(salesData) : []);
      } catch (e) {
        setSkus([]);
        setEvents([]);
        setSales([]);
      }
    })();
  }, [signedIn, API_BASE, token]);

  // --- SKU handlers
  async function saveSku(sku: SKUOpt) {
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


  // Compute set of SKU IDs used in sales
  const usedSkuIds = useMemo(() => {
    return new Set(sales.map(s => s.sku?.id).filter(Boolean));
  }, [sales]);



  return (
    <>
      {signedIn && <Navbar />}
      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Tabs defaultValue="skus" className="mt-4">
          <TabsList>
            <TabsTrigger value="skus">SKUs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="skus">
            {/* SKUs */}
            <section>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">SKUs</h2>
                  {signedIn && (
                    <CreateSKUDialog
                      token={token}
                      apiBase={API_BASE}
                      onCreated={sku => {
                        setSkus(prev => prev.find((s: any) => s.id === sku.id) ? prev : [...prev, sku]);
                      }}
                      trigger={<Button type="button" variant="outline">Add SKU +</Button>}
                    />
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <Label className="text-xs">Type:</Label>
                  <Select value={skuTypeFilter} onValueChange={setSkuTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Types</SelectItem>
                      {skuTypes.map((type: string) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label className="text-xs">Sold:</Label>
                  <Select value={skuSoldFilter} onValueChange={setSkuSoldFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="unsold">Unsold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!signedIn ? (
                <p className="text-sm text-muted-foreground">Sign in to manage SKUs.</p>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(filteredSkus) && filteredSkus.length > 0 ? (
                    filteredSkus.map((s, idx) => (
                      <div key={s.id} className="grid grid-cols-6 gap-2 items-center border rounded-xl p-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={s.name}
                            onChange={(e)=>{
                              const name = e.target.value;
                              setSkus(prev => prev.map((x,i)=> x.id===s.id ? {...x, name} : x));
                            }}
                          />
                        </div>
                        <div className="text-sm">{s.item_type}</div>
                        <div>
                          <Label className="text-xs">Cost/Unit</Label>
                          <Input
                            inputMode="decimal"
                            value={s.default_cost ?? ''}
                            onChange={e => {
                              const default_cost = e.target.value;
                              setSkus(prev => prev.map((x,i)=> x.id===s.id ? {...x, default_cost} : x));
                            }}
                          />
                        </div>
                        <div className="flex gap-2 justify-end col-span-2">
                          <Button size="sm" onClick={()=>saveSku(s)}>Save</Button>
                          <Button size="sm" variant="destructive" onClick={()=>deleteSku(s.id)}>Delete</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No SKUs with sales yet.</p>
                  )}
                </div>
              )}
            </section>
          </TabsContent>
          <TabsContent value="events">
            {/* Events */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Events</h2>
                {signedIn && (
                  <CreateEventDialog
                    token={token}
                    apiBase={API_BASE}
                    onCreated={ev => {
                      setEvents(prev => [...prev, ev]);
                    }}
                    trigger={<Button type="button" variant="outline">Add Event +</Button>}
                  />
                )}
              </div>
              {!signedIn ? (
                <p className="text-sm text-muted-foreground">Sign in to manage events.</p>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(events) && events.length > 0 ? (
                    events.map((ev, idx) => (
                      <div key={ev.id} className="grid grid-cols-7 gap-2 items-center border rounded-xl p-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={ev.name}
                            onChange={(e)=>{
                              const name = e.target.value;
                              setEvents(prev => prev.map((x,i)=> i===idx ? {...x, name} : x));
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Start Date</Label>
                          <DatePicker
                            value={ev.start_date || ''}
                            onChange={date => setEvents(prev => prev.map((x,i)=> i===idx ? {...x, start_date: date} : x))}
                            placeholder="YYYY-MM-DD"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Date</Label>
                          <DatePicker
                            value={ev.end_date || ''}
                            onChange={date => setEvents(prev => prev.map((x,i)=> i===idx ? {...x, end_date: date} : x))}
                            placeholder="YYYY-MM-DD"
                          />
                        </div>
                        <div className="text-sm col-span-1 opacity-60">ID: {ev.id.slice(0,6)}…</div>
                        <div className="flex gap-2 justify-end col-span-2">
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
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
