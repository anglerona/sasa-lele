"use client";
import { useEffect, useMemo, useState } from "react";
function NotesMenu({ row, token, API_BASE, setRows, setEditRowId, setEditRow }: any) {
  const [notesOpen, setNotesOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {row.notes && row.notes.trim() && (
            <DropdownMenuItem onClick={() => setNotesOpen(true)}>
              View Notes
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => { setEditRowId(row.id); setEditRow({ ...row }); }}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            if (!confirm("Delete this sale?")) return;
            try {
              const res = await fetch(`${API_BASE}/api/sales/${row.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error();
              setRows((rows: any[]) => rows.filter(r => r.id !== row.id));
            } catch {
              alert("Failed to delete sale");
            }
          }} className="text-red-600 focus:text-red-700">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground min-h-[2rem]">{row.notes || "(No notes)"}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useUserColors } from "@/lib/userColors";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Navbar from "@/_components/Navbar";
import { Input } from "@/components/ui/input";
import { SKUOpt } from "@/lib/types";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MoreVertical } from "lucide-react";
import CreateSKUDialog from "@/_components/CreateSKUDialog";
import CreateEventDialog from "@/_components/CreateEventDialog";
import DatePicker from "@/components/ui/DatePicker";
import AddSaleDialog from "@/_components/AddSaleDialog";


export default function SalesPage() {
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<any | null>(null);
  // Apply user color settings globally
  useUserColors();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session, status } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  // filters
  const [events, setEvents] = useState<Array<{ id: string; name: string; start_date?: string }>>([]);
  const [eventId, setEventId] = useState("all");
  const [year, setYear] = useState("all");
  const [type, setType] = useState("all");
  const [bundle, setBundle] = useState("all");
  const [skus, setSkus] = useState<SKUOpt[]>([]);
  const [rows, setRows] = useState<SaleRow[]>([]);
  // Only show SKUs that are used in sales (for filter bar)
  const usedSkuIds = useMemo(() => new Set(rows.map((r: any) => r.sku?.id).filter(Boolean)), [rows]);
  const filteredSkus = useMemo(() => skus.filter(s => usedSkuIds.has(s.id)), [skus, usedSkuIds]);
  const [skuId, setSkuId] = useState("all");

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    fetch(`${API_BASE}/api/events/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setEvents)
      .catch(() => setError("Failed to load events"));
  }, [API_BASE, status, token]);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    fetch(`${API_BASE}/api/skus/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setSkus)
      .catch(() => setError("Failed to load SKUs"));
  }, [API_BASE, status, token]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (eventId && eventId !== "all") p.set("event", eventId);
    if (year && year !== "all") p.set("year", year);
    if (type && type !== "all") p.set("type", type);
    if (bundle && bundle !== "all") p.set("bundle", bundle);
    if (skuId && skuId !== "all") p.set("sku", skuId);
    return p.toString();
  }, [eventId, year, type, bundle, skuId]);

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
    setEventId("all");
    setYear("all");
    setType("all");
    setBundle("all");
    setSkuId("all");
  };

  return (
    <>
      {status === "authenticated" && <Navbar />}
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <AddSaleDialog
            token={token}
            apiBase={API_BASE}
            events={events}
            onCreated={(row: any) => setRows((prev) => [row, ...prev])}
          />
          {status !== "authenticated" && (
            <Button variant="secondary" onClick={() => (location.href = "/login")}> 
              Login
            </Button>
          )}
        </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-7 border rounded-2xl p-4">
        <div className="col-span-2 flex flex-col">
          <label className="text-sm font-medium mb-1">Event</label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {events.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">SKU</label>
          <Select value={skuId} onValueChange={setSkuId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select SKU" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {skus.map((sku: SKUOpt) => (
                <SelectItem key={sku.id} value={sku.id}>
                  {sku.name}{" "}
                  <span className="text-muted-foreground">
                    ({sku.item_type})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Year</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[...Array.from(new Set(
                events.map(ev => {
                  if (ev.start_date) return String(ev.start_date).slice(0, 4);
                  const match = ev.name?.match(/\d{4}/);
                  return match ? match[0] : "";
                })
              ))]
                .filter(y => y && y.length === 4 && !isNaN(Number(y)))
                .sort((a, b) => Number(b) - Number(a))
                .map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="print">Print</SelectItem>
              <SelectItem value="keychain">Keychain</SelectItem>
              <SelectItem value="sticker">Sticker</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Bundle</label>
          <Select value={bundle} onValueChange={setBundle}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select bundle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-7 flex gap-2 mt-auto">
          <Button className="w-full md:w-auto" onClick={fetchSales} disabled={loading}>
            {loading ? "Loading..." : "Apply Filters"}
          </Button>
          <Button className="w-full md:w-auto" variant="secondary" onClick={resetFilters}>
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
              <TableHead className="text-right">Sale Price/Unit</TableHead>
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
              <TableHead>Gift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Alternating bundle highlight logic */}
            {(() => {
              // Group rows by bundle_id, assign alternating highlight classes
              let bundleColorMap: Record<string, string> = {};
              let colorIdx = 0;
              const bundleColors = ["bg-blue-50", "bg-green-50"]; // You can adjust these colors
              // First, collect all unique bundle_ids in order of appearance
              const bundleOrder: string[] = [];
              sorted.forEach((row: any) => {
                if (row.is_bundle && row.bundle_id && !bundleOrder.includes(row.bundle_id)) {
                  bundleOrder.push(row.bundle_id);
                }
              });
              // Assign colors
              bundleOrder.forEach((bid, i) => {
                bundleColorMap[bid] = bundleColors[i % bundleColors.length];
              });
              return sorted.map((r: any) => {
                const isEditing = editRowId === r.id;
                const gp = Number(isEditing ? editRow?.gross_profit : r.gross_profit);
                let rowClass = gp < 0 ? "bg-red-50" : "";
                if (r.is_bundle && r.bundle_id) {
                  rowClass += " " + (bundleColorMap[r.bundle_id] || "");
                }
                return isEditing ? (
                  <TableRow key={r.id} className={rowClass.trim()}>
                  <TableCell>
                    <Input
                      type="date"
                      value={editRow.sale_date}
                      onChange={e => setEditRow({ ...editRow, sale_date: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editRow.event?.id || r.event.id}
                      onValueChange={v => setEditRow({ ...editRow, event: { ...editRow.event, id: v }, event_id: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Event" /></SelectTrigger>
                      <SelectContent>
                        {events.map(ev => (
                          <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editRow.sku?.item_type || r.sku.item_type}
                      onValueChange={v => setEditRow({ ...editRow, sku: { ...editRow.sku, item_type: v } })}
                    >
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="print">Print</SelectItem>
                        <SelectItem value="keychain">Keychain</SelectItem>
                        <SelectItem value="sticker">Sticker</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editRow.sku?.id || r.sku.id}
                      onValueChange={v => {
                        const sku = skus.find(s => s.id === v);
                        setEditRow({ ...editRow, sku: sku ? { ...sku } : { id: v }, sku_id: v });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="SKU" /></SelectTrigger>
                      <SelectContent>
                        {skus
                          .filter(s => (editRow.sku?.item_type || r.sku.item_type) === s.item_type)
                          .map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={1}
                      value={editRow.units}
                      onChange={e => setEditRow({ ...editRow, units: Number(e.target.value) })}
                      className="w-16 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      value={editRow.price_unit}
                      onChange={e => setEditRow({ ...editRow, price_unit: e.target.value })}
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      value={editRow.cost_unit}
                      onChange={e => setEditRow({ ...editRow, cost_unit: e.target.value })}
                      className="w-20 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right">${r.revenue}</TableCell>
                  <TableCell className="text-right">${r.cogs}</TableCell>
                  <TableCell className={`text-right font-medium ${gp > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    ${r.gross_profit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        id={`edit-bundle-${r.id}`}
                        checked={!!editRow.is_bundle}
                        onChange={e => setEditRow({ ...editRow, is_bundle: e.target.checked })}
                        className="accent-primary"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        id={`edit-gift-${r.id}`}
                        checked={!!editRow.is_gift}
                        onChange={e => setEditRow({ ...editRow, is_gift: e.target.checked, price_unit: e.target.checked ? "0.00" : editRow.price_unit })}
                        className="accent-primary"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        // Save edit
                        try {
                          const res = await fetch(`${API_BASE}/api/sales/${r.id}/`, {
                            method: "PATCH",
                            headers: {
                              Authorization: `Bearer ${token}`,
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                              event_id: editRow.event_id || editRow.event?.id || r.event.id,
                              sku_id: editRow.sku_id || editRow.sku?.id || r.sku.id,
                              sale_date: editRow.sale_date,
                              units: editRow.units,
                              price_unit: editRow.price_unit,
                              cost_unit: editRow.cost_unit,
                              is_bundle: editRow.is_bundle,
                              is_gift: editRow.is_gift,
                            })
                          });
                          if (!res.ok) throw new Error();
                          const updated = await res.json();
                          setRows(rows => rows.map(row => row.id === r.id ? { ...row, ...updated } : row));
                          setEditRowId(null);
                          setEditRow(null);
                        } catch {
                          alert("Failed to save changes");
                        }
                      }}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={() => { setEditRowId(null); setEditRow(null); }}>Cancel</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={r.id} className={rowClass.trim()}>
                  <TableCell>{r.sale_date}</TableCell>
                  <TableCell>{r.event && typeof r.event === 'object' && 'name' in r.event ? r.event.name : ''}</TableCell>
                  <TableCell className="capitalize">{r.sku.item_type}</TableCell>
                  <TableCell>{r.sku.name}</TableCell>
                  <TableCell className="text-right">{r.units}</TableCell>
                  <TableCell className="text-right">{'$'+r.price_unit}</TableCell>
                  <TableCell className="text-right">{'$'+r.cost_unit}</TableCell>
                  <TableCell className="text-right">{'$'+r.revenue}</TableCell>
                  <TableCell className="text-right">{'$'+r.cogs}</TableCell>
                  <TableCell className={`text-right font-medium ${gp > 0 ? "text-emerald-700" : "text-red-700"}`}>{'$'+r.gross_profit}</TableCell>
                  <TableCell>{r.is_bundle ? "Y" : "N"}</TableCell>
                  <TableCell>{r.is_gift ? "Y" : "N"}</TableCell>
                  <TableCell>
                    {/* Notes dialog state */}
                    <NotesMenu row={r} token={token} API_BASE={API_BASE} setRows={setRows} setEditRowId={setEditRowId} setEditRow={setEditRow} />
                  </TableCell>
                </TableRow>
              );
              });
            })()}
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
    </>
  );
}
