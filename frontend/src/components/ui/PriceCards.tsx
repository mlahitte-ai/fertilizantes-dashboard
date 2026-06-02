"use client";

import { useEffect, useState } from "react";
import { fetchCurrentPrices } from "@/lib/api";
import type { CurrentPrice } from "@/types";

const CARDS = [
  { product: "urea",  market: "world_cfr", label: "Urea Mundial",      unit: "CFR Golfo" },
  { product: "urea",  market: "arg_fca",   label: "Urea Argentina",    unit: "FCA may." },
  { product: "map",   market: "world_cfr", label: "MAP Mundial",       unit: "spot" },
  { product: "map",   market: "arg_fca",   label: "MAP Argentina",     unit: "FCA may." },
  { product: "soy",   market: "cbot",      label: "Soja CBOT",         unit: "USD/tn" },
  { product: "soy",   market: "bcr_fas",   label: "Soja BCR FAS",      unit: "USD/tn" },
  { product: "corn",  market: "cbot",      label: "Maíz CBOT",         unit: "USD/tn" },
  { product: "wheat", market: "cbot",      label: "Trigo CBOT",        unit: "USD/tn" },
];

export default function PriceCards() {
  const [prices, setPrices] = useState<CurrentPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPrices()
      .then(setPrices)
      .catch(() => setPrices([]))
      .finally(() => setLoading(false));
  }, []);

  function getValue(product: string, market: string) {
    return prices.find((p) => p.product === product && p.market === market);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {CARDS.map((card) => {
        const p = getValue(card.product, card.market);
        return (
          <div key={`${card.product}_${card.market}`}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="text-xs text-slate-400 mb-1">{card.label}</div>
            {loading ? (
              <div className="h-6 bg-slate-700 rounded animate-pulse" />
            ) : p ? (
              <>
                <div className="text-xl font-bold text-slate-100">
                  ${p.value.toFixed(0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">{card.unit} · {p.date}</div>
              </>
            ) : (
              <div className="text-sm text-slate-500">Sin datos</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
