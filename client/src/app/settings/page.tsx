"use client";
import CreateSKUDialog from "@/_components/CreateSKUDialog";
import CreateEventDialog from "@/_components/CreateEventDialog";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import type { SKUOpt as ImportedSKUOpt } from "@/lib/types";
import dynamic from "next/dynamic";

type SKUOpt = ImportedSKUOpt & {
  default_price?: number | string;
  default_cost?: number | string;
};

const Navbar = dynamic(() => import("@/_components/Navbar"), { ssr: false });
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import DatePicker from "@/components/ui/DatePicker";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type EventOpt = { id: string; name: string; start_date?: string; end_date?: string };


type SaleRow = {
  id: string;
  sku: SKUOpt;
  units: number;
  // ...other fields not needed for filtering
};

export default function SettingsPage() {
  const [editTypes, setEditTypes] = useState<{[type: string]: string}>({});

  const [skus, setSkus] = useState<SKUOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventOpt[]>([]);
  const { toast } = useToast();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const signedIn = status === "authenticated" && !!token;
  const [sales, setSales] = useState<SaleRow[]>([]);

  // Filters for SKU type and sold status (must be after skus/sales are defined)
  const [skuTypeFilter, setSkuTypeFilter] = useState<string>("__all__");
  const [skuSoldFilter, setSkuSoldFilter] = useState<string>("__all__");

  // Get all unique item types from SKUs
  const skuTypes = useMemo<string[]>(() => Array.from(new Set(skus.map((s: SKUOpt) => s.item_type).filter(Boolean) as string[])), [skus]);

  useEffect(() => {
    setEditTypes(types => {
      const updated: {[type: string]: string} = {};
      skuTypes.forEach(type => {
        updated[type] = types[type] ?? type;
      });
      return updated;
    });
  }, [skuTypes]);
  // Track which event ID was copied for checkmark feedback
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

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
      setLoading(true);
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
      } finally {
        setLoading(false);
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
    if (res.ok) {
      toast({ title: "SKU saved", type: "success" });
    } else {
      toast({ title: "SKU save failed", description: `Status: ${res.status}`, type: "error" });
    }
  }
  async function deleteSku(id: string) {
    if (!confirm("Delete this SKU? This will fail if it has sales.")) return;
    const res = await fetch(`${API_BASE}/api/skus/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) {
      toast({ title: "Delete failed", description: `Status: ${res.status}`, type: "error" });
      return;
    }
    setSkus(prev => prev.filter(s => s.id !== id));
    toast({ title: "SKU deleted", type: "success" });
  }

  // --- Event handlers
  async function saveEvent(ev: EventOpt) {
    const res = await fetch(`${API_BASE}/api/events/${ev.id}/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ev.name,
        start_date: ev.start_date || null,
        end_date: ev.end_date || null,
      }),
    });
    if (res.ok) {
      toast({ title: "Event saved", type: "success" });
    } else {
      toast({ title: "Event save failed", description: `Status: ${res.status}`, type: "error" });
    }
  }
  async function deleteEvent(id: string) {
    if (!confirm("Delete this event (and its sales)?")) return;
    const res = await fetch(`${API_BASE}/api/events/${id}/?force=1`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }});
    if (!res.ok) {
      toast({ title: "Delete failed", description: `Status: ${res.status}`, type: "error" });
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: "Event deleted", type: "success" });
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
            <TabsTrigger value="types">Types</TabsTrigger>
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
                      {/* Add SKU type filter items here if needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 space-y-2">
                  {filteredSkus.length > 0 ? (
                    filteredSkus.map((s) => {
                      const hasSales = sales.some(sale => sale.sku?.id === s.id);
                      const unitsSold = sales.filter(sale => sale.sku?.id === s.id).reduce((sum, sale) => sum + (sale.units || 0), 0);
                      return (
                        <div key={s.id} className="grid grid-cols-5 gap-2 items-center border rounded-xl p-3">
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
                          <div>
                            <Label className="text-xs">Units Sold</Label>
                            <Input value={unitsSold} readOnly tabIndex={-1} className="bg-muted/50 cursor-not-allowed" />
                          </div>
                          <div className="flex gap-2 justify-end col-span-2">
                            <Button size="sm" onClick={()=>saveSku(s)}>Save</Button>
                            <Button size="sm" variant="destructive" onClick={()=>deleteSku(s.id)}>Delete</Button>
                          </div>
                          {hasSales && (
                            <span className="text-xs text-muted-foreground">Cannot delete: sales exist</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    loading ? (
                      <div className="flex justify-center items-center py-6">
                        <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-transparent border-primary"></span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No SKUs yet.</p>
                    )
                  )}
                </div>
              </div>
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
                      setEvents(prev => [...prev, ev as EventOpt]);
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
                        <div className="flex flex-col gap-1 col-span-1">
                          <Label className="text-xs">Event ID</Label>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm opacity-80" style={{userSelect:'all'}}>{ev.id}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title={copiedEventId === ev.id ? "Copied!" : "Copy Event ID"}
                              style={{zIndex:1, position:'relative'}}
                              onClick={e => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(ev.id);
                                setCopiedEventId(ev.id);
                                setTimeout(() => {
                                  setCopiedEventId(current => current === ev.id ? null : current);
                                }, 2000);
                              }}
                            >
                              {copiedEventId === ev.id ? (
                                <CheckIcon className="size-4 text-green-600" />
                              ) : (
                                <CopyIcon className="size-4" />
                              )}
                            </Button>
                          </div>
                        </div>
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
          <TabsContent value="types">
            <section>
              <h2 className="text-xl font-semibold mb-4">SKU Types</h2>
              <div className="space-y-3">
                {skuTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No types found.</p>
                ) : (
                  skuTypes.map(type => {
                    const hasSales = sales.some(s => s.sku?.item_type === type);
                    return (
                      <div key={type} className="flex items-center gap-2 border rounded-xl p-3">
                        <Input
                          value={editTypes[type] ?? type}
                          disabled={false}
                          onChange={e => setEditTypes(et => ({ ...et, [type]: e.target.value }))}
                          className="w-48"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={editTypes[type] === type}
                          onClick={async () => {
                            const affectedSkus = skus.filter(s => s.item_type === type);
                            let success = true;
                            for (const sku of affectedSkus) {
                              try {
                                const res = await fetch(`${API_BASE}/api/skus/${sku.id}/`, {
                                  method: "PATCH",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                  },
                                  body: JSON.stringify({
                                    name: sku.name,
                                    item_type: editTypes[type],
                                    default_price: sku.default_price,
                                    default_cost: sku.default_cost
                                  }),
                                });
                                if (!res.ok) throw new Error();
                              } catch {
                                success = false;
                              }
                            }
                            if (success) {
                              toast({ title: "Type updated", type: "success" });
                              setSkus(prev => prev.map(s => s.item_type === type ? { ...s, item_type: editTypes[type] } : s));
                              setEditTypes(et => {
                                const updated = { ...et };
                                updated[editTypes[type]] = editTypes[type];
                                delete updated[type];
                                return updated;
                              });
                            } else {
                              toast({ title: "Failed to update type", type: "error" });
                            }
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={hasSales}
                          onClick={() => {
                            setSkus(prev => prev.filter(s => s.item_type !== type));
                            setEditTypes(et => {
                              const updated = { ...et };
                              delete updated[type];
                              return updated;
                            });
                          }}
                        >
                          Delete
                        </Button>
                        {hasSales && (
                          <span className="text-xs text-muted-foreground">Cannot delete: sales exist</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
