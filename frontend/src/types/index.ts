export interface PricePoint {
  date: string;
  value: number;
  source?: string;
}

export interface CurrentPrice {
  product: string;
  market: string;
  date: string;
  value: number;
  source?: string;
}

export interface RatioPoint {
  date: string;
  year: number;
  month: number;
  ratio: number;
  fert_price: number;
  grain_price: number;
  deviation_pct?: number;
}

export interface RatioResult {
  grain: string;
  grain_market: string;
  fert: string;
  fert_market: string;
  series: RatioPoint[];
  average: number | null;
  std_dev: number | null;
  current_ratio: number | null;
  current_deviation_pct: number | null;
  warning?: string;
}

export interface DataSource {
  name: string;
  url: string;
  frequency: string;
  last_updated: string | null;
  last_status: "ok" | "error" | "pending";
  last_error: string | null;
  is_active: boolean;
}
