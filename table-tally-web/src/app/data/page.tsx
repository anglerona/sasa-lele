"use client";

import BundleCalculator from "./BundleCalculator";
import AvgCostByType from "./AvgCostByType";
import { SKUOpt } from "@/lib/types";
import { useEffect, useState } from "react";
import { PolarArea, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale } from "chart.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/_components/Navbar";
import { useSession } from "next-auth/react";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, RadialLinearScale);

// Removed duplicate DataPage definition and its block

export default function DataPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [skus, setSkus] = useState<SKUOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  useEffect(() => {
    async function fetchRows() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/sales/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    async function fetchSkus() {
      try {
        const res = await fetch(`${API_BASE}/api/skus/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setSkus(Array.isArray(data) ? data : []);
      } catch {
        setSkus([]);
      }
    }
    if (token) {
      fetchRows();
      fetchSkus();
    }
  }, [API_BASE, token]);


  // Top SKUs by Gross Profit (Bar Chart)
  const skuProfit: Record<string, { name: string, profit: number }> = {};
  rows.forEach(r => {
    const id = r.sku?.id;
    if (!id) return;
    if (!skuProfit[id]) skuProfit[id] = { name: r.sku.name, profit: 0 };
    const grossProfit = Number(r.gross_profit ?? (r.revenue ?? r.price_unit * r.units) - (r.cogs ?? r.cost_unit * r.units));
    skuProfit[id].profit += grossProfit;
  });
  const topSkuProfits = Object.values(skuProfit).sort((a, b) => b.profit - a.profit).slice(0, 7);
  const skuProfitBarData = {
    labels: topSkuProfits.map(s => s.name),
    datasets: [{
      label: "Gross Profit by SKU",
      data: topSkuProfits.map(s => s.profit),
      backgroundColor: "#4BC0C0",
    }],
  };

  // Top Events by Revenue (Horizontal Bar Chart)
  const eventRevenue: Record<string, { name: string, revenue: number }> = {};
  rows.forEach(r => {
    if (!r.event?.id) return;
    if (!eventRevenue[r.event.id]) eventRevenue[r.event.id] = { name: r.event.name, revenue: 0 };
    eventRevenue[r.event.id].revenue += Number(r.revenue || r.price_unit * r.units);
  });
  const topEvents = Object.values(eventRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 7);
  const eventBarData = {
    labels: topEvents.map(e => e.name),
    datasets: [{
      label: "Revenue by Event",
      data: topEvents.map(e => e.revenue),
      backgroundColor: "#FF9F40",
    }],
  };

  // Category breakdown for Polar chart
  const categoryCounts: Record<string, number> = {};
  rows.forEach(r => {
    const cat = r.sku?.item_type || "Unknown";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + r.units;
  });
  const polarData = {
    labels: Object.keys(categoryCounts),
    datasets: [{
      label: "Units Sold by Category",
      data: Object.values(categoryCounts),
      backgroundColor: [
        "#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF"
      ],
    }],
  };

  // Best and worst selling items (by units)
  const itemCounts: Record<string, { name: string, units: number }> = {};
  rows.forEach(r => {
    const id = r.sku?.id;
    if (!id) return;
    if (!itemCounts[id]) itemCounts[id] = { name: r.sku.name, units: 0 };
    itemCounts[id].units += r.units;
  });
  const sortedItems = Object.values(itemCounts).sort((a, b) => b.units - a.units);
  const bestItems = sortedItems.slice(0, 5);
  const worstItems = sortedItems.slice(-5).reverse();

  const barData = (items: typeof bestItems, label: string) => ({
    labels: items.map(i => i.name),
    datasets: [{
      label,
      data: items.map(i => i.units),
      backgroundColor: "#36A2EB",
    }],
  });

  // Revenue by category
  const revenueByCat: Record<string, number> = {};
  rows.forEach(r => {
    const cat = r.sku?.item_type || "Unknown";
    revenueByCat[cat] = (revenueByCat[cat] || 0) + Number(r.revenue || r.price_unit * r.units);
  });
  const revenuePolarData = {
    labels: Object.keys(revenueByCat),
    datasets: [{
      label: "Revenue by Category",
      data: Object.values(revenueByCat),
      backgroundColor: [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF"
      ],
    }],
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto py-8 px-2 space-y-8">
        <h1 className="text-2xl font-bold mb-4">Data & Analytics</h1>
        {loading ? <div>Loading...</div> : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4 h-full flex flex-col justify-center">
                <h2 className="font-semibold mb-2">Units Sold by Category</h2>
                <PolarArea data={polarData} />
              </Card>
              <div className="flex flex-col gap-4">
                <Card className="p-4">
                  <h2 className="font-semibold mb-2">Best Selling Items</h2>
                  <Bar data={barData(bestItems, "Units Sold")}/>
                </Card>
                <Card className="p-4">
                  <h2 className="font-semibold mb-2">Worst Selling Items</h2>
                  <Bar data={barData(worstItems, "Units Sold")}/>
                </Card>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Revenue by Category</h2>
                <PolarArea data={revenuePolarData} />
              </Card>
              <Card className="p-4">
                <h2 className="font-semibold mb-2">Top SKUs by Gross Profit</h2>
                <Bar data={skuProfitBarData} />
              </Card>
            </div>
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Top Events by Revenue</h2>
              <Bar data={eventBarData} options={{ indexAxis: 'y' }} />
            </Card>
            <AvgCostByType skus={skus} />
            <BundleCalculator skus={skus} />
          </>
        )}
      </div>
    </>
  );
}
