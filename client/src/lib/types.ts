export type EventOpt = { id: string; name: string };
export type SKUOpt = { id: string; name: string; item_type: string };

export type SaleRow = {
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
