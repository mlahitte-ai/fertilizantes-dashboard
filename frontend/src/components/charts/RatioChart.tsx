"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ComposedChart, Line, ReferenceLine, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fetchRatio } from "@/lib/api";
import type { RatioResult } from "@/types";

const GRAINS = [
  { value: "soy", label: "Soja" },
  { value: "corn", label: "Maíz" },
  { value: "wheat", label: "Trigo" },
];
const GRAIN_MARKETS = [
  { value: "cbot", label: "CBOT" },
  { value: "bcr_fas", label: "BCR FAS" },
];
const FERTS = [
  { value: "urea", label: "Urea" },
  { value: "map", label: "MAP 12-52" },
  { value: "dap", label: "DAP" },
  { value: "potash", label: "Potasa MOP" },
];
const FERT_MARKETS = [
  { value: "world_cfr", label: "Mundial" },
  { value: "arg_fca", label: "Argentina FCA" },
  { value: "us", label: "EE.UU." },
];
const MONTHS_OPTIONS = [
  { value: 12, label: "1 año" },
  { value: 30, label: "2.5 años" },
  { value: 60, label: "5 años" },
  { value: 84, label: "7 años" },
];

const Select = ({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-400">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default function RatioChart() {
  const [grain, setGrain] = useState("soy");
  const [grainMarket, setGrainMarket] = useState("cbot");
  const [fert, setFert] = useState("urea");
  const [fertMarket, setFertMarket] = useState("world_cfr");
  const [months, setMonths] = useState(30);
  const [result, setResult] = useState<RatioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRatio({ grain, grain_market: grainMarket, fert, fert_market: fertMarket, months });
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [grain, grainMarket, fert, fertMarket, months]);

  useEffect(() => { load(); }, [load]);

  const avg = result?.average ?? null;
  const std = result?.std_dev ?? null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">
        Relación insumo / producto (tn grano / tn fertilizante)
      </h2>

      {/* Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Select label="Grano" value={grain} options={GRAINS} onChange={setGrain} />
        <Select label="Mercado grano" value={grainMarket} options={GRAIN_MARKETS} onChange={setGrainMarket} />
        <Select label="Fertilizante" value={fert} options={FERTS} onChange={setFert} />
        <Select label="Mercado fert." value={fertMarket} options={FERT_MARKETS} onChange={setFertMarket} />
      </div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-slate-400">Período:</span>
        {MONTHS_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setMonths(o.value)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              months === o.value
                ? "bg-green-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Warning */}
      {result?.warning && (
        <div className="mb-4 px-4 py-2 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm rounded">
          {result.warning}
        </div>
      )}

      {/* Current ratio summary */}
      {result && result.current_ratio != null && (
        <div className="flex gap-6 mb-6">
          <div>
            <div className="text-xs text-slate-400">Ratio actual</div>
            <div className="text-2xl font-bold text-slate-100">{result.current_ratio.toFixed(2)}</div>
          </div>
          {avg && (
            <div>
              <div className="text-xs text-slate-400">Promedio período</div>
              <div className="text-2xl font-bold text-slate-100">{avg.toFixed(2)}</div>
            </div>
          )}
          {result.current_deviation_pct != null && (
            <div>
              <div className="text-xs text-slate-400">Desvío vs promedio</div>
              <div className={`text-2xl font-bold ${
                result.current_deviation_pct > 0 ? "text-red-400" : "text-green-400"
              }`}>
                {result.current_deviation_pct > 0 ? "+" : ""}{result.current_deviation_pct.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-80 flex items-center justify-center text-slate-400">Calculando...</div>
      ) : error ? (
        <div className="h-80 flex items-center justify-center text-red-400">{error}</div>
      ) : !result?.series.length ? (
        <div className="h-80 flex items-center justify-center text-slate-400">Sin datos suficientes.</div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={result.series} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="ratioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#f1f5f9" }}
              formatter={(value: number, name: string) => {
                if (name === "ratio") return [`${value.toFixed(2)} tn grano/tn fert`, "Ratio"];
                return [value, name];
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded p-3 text-sm">
                    <div className="text-slate-300 mb-1">{label}</div>
                    <div className="text-slate-100">Ratio: <strong>{d.ratio?.toFixed(2)}</strong></div>
                    <div className="text-slate-400">Fert: ${d.fert_price?.toFixed(0)}/tn</div>
                    <div className="text-slate-400">Grano: ${d.grain_price?.toFixed(0)}/tn</div>
                    {d.deviation_pct != null && (
                      <div className={d.deviation_pct > 0 ? "text-red-400" : "text-green-400"}>
                        {d.deviation_pct > 0 ? "+" : ""}{d.deviation_pct.toFixed(1)}% vs promedio
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {/* Zona de precio promedio ± 1 std */}
            {avg != null && std != null && (
              <>
                <ReferenceLine y={avg} stroke="#64748b" strokeDasharray="4 4" label={{ value: `Promedio ${avg.toFixed(2)}`, fill: "#64748b", fontSize: 11 }} />
                <ReferenceLine y={avg + std} stroke="#ef4444" strokeDasharray="2 4" opacity={0.5} />
                <ReferenceLine y={Math.max(0, avg - std)} stroke="#22c55e" strokeDasharray="2 4" opacity={0.5} />
              </>
            )}
            <Area type="monotone" dataKey="ratio" fill="url(#ratioGradient)" stroke="none" />
            <Line
              type="monotone"
              dataKey="ratio"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      {avg != null && std != null && (
        <div className="mt-3 flex gap-6 text-xs text-slate-500">
          <span><span className="text-red-400">—</span> Promedio + 1σ (zona cara)</span>
          <span><span className="text-green-400">—</span> Promedio − 1σ (zona barata)</span>
        </div>
      )}
    </div>
  );
}
