"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { fetchPriceHistory } from "@/lib/api";
import type { PricePoint } from "@/types";

const SERIES = [
  { key: "urea_arg",   product: "urea",  market: "arg_fca",   label: "Urea Argentina",  color: "#1d4ed8", dash: false },
  { key: "urea_world", product: "urea",  market: "world_cfr", label: "Urea Mundial",    color: "#93c5fd", dash: true  },
  { key: "map_arg",    product: "map",   market: "arg_fca",   label: "MAP Argentina",   color: "#059669", dash: false },
  { key: "map_world",  product: "map",   market: "world_cfr", label: "MAP Mundial",     color: "#6ee7b7", dash: true  },
  { key: "dap_arg",    product: "dap",   market: "arg_fca",   label: "DAP Argentina",   color: "#7c3aed", dash: false },
  { key: "dap_world",  product: "dap",   market: "world_fob", label: "DAP Mundial",     color: "#c4b5fd", dash: true  },
  { key: "potash",     product: "potash",market: "world_cfr", label: "Potasa MOP",      color: "#b45309", dash: true  },
];

const PERIODS = [
  { label: "6m", months: 6 },
  { label: "1a", months: 12 },
  { label: "2.5a", months: 30 },
  { label: "Todo", months: 0 },
];

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PriceHistoryChart() {
  const [data, setData] = useState<Record<string, { date: string; value: number }[]>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(SERIES.map((s) => [s.key, ["urea_arg","urea_world","map_arg","map_world"].includes(s.key)]))
  );
  const [period, setPeriod] = useState(1); // index en PERIODS
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const fromDate = PERIODS[period].months ? monthsAgo(PERIODS[period].months) : undefined;
    try {
      const results = await Promise.all(
        SERIES.map((s) =>
          fetchPriceHistory(`${s.product}_${marketAlias(s.market)}`, fromDate)
            .then((rows: PricePoint[]) => [s.key, rows] as const)
            .catch(() => [s.key, []] as const)
        )
      );
      setData(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Merge all series by date for Recharts
  const merged: Record<string, number | string>[] = [];
  const allDates = [
    ...new Set(SERIES.flatMap((s) => (data[s.key] ?? []).map((p) => p.date))),
  ].sort();

  for (const date of allDates) {
    const row: Record<string, number | string> = { date };
    for (const s of SERIES) {
      const found = (data[s.key] ?? []).find((p) => p.date === date);
      if (found) row[s.key] = found.value;
    }
    merged.push(row);
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Precios históricos (USD/tn)</h2>
        <div className="flex gap-1">
          {PERIODS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPeriod(i)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                period === i
                  ? "bg-green-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SERIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-opacity ${
              visible[s.key] ? "opacity-100" : "opacity-40"
            }`}
            style={{ borderColor: s.color, color: s.color }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center text-slate-400">Cargando...</div>
      ) : merged.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-400">
          Sin datos. Ejecutá el seed o esperá el próximo scrape.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={merged} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(0, 7)}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit="$" />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: number, name: string) => {
                const serie = SERIES.find((s) => s.key === name);
                return [`$${value.toFixed(0)}/tn`, serie?.label ?? name];
              }}
            />
            <Legend
              formatter={(value) => SERIES.find((s) => s.key === value)?.label ?? value}
              wrapperStyle={{ display: "none" }}
            />
            {SERIES.filter((s) => visible[s.key]).map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function marketAlias(market: string): string {
  const aliases: Record<string, string> = {
    world_cfr: "world",
    world_fob: "world",
    arg_fca:   "arg",
    cbot:      "cbot",
    bcr_fas:   "bcr",
    us:        "us",
  };
  return aliases[market] ?? market;
}
