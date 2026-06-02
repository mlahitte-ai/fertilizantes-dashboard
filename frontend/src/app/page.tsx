"use client";

import { useState } from "react";
import PriceCards from "@/components/ui/PriceCards";
import PriceHistoryChart from "@/components/charts/PriceHistoryChart";
import RatioChart from "@/components/charts/RatioChart";
import AIPanel from "@/components/ai/AIPanel";
import SourceStatus from "@/components/ui/SourceStatus";

type Tab = "prices" | "ratio" | "ai" | "sources";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("prices");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">
          Tablero de Fertilizantes
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Precios Argentina y mercado mundial · Series históricas · Análisis IA
        </p>
      </header>

      {/* Summary cards — always visible */}
      <PriceCards />

      {/* Tab navigation */}
      <nav className="flex gap-1 mt-8 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
        {(
          [
            { id: "prices", label: "Precios históricos" },
            { id: "ratio", label: "Relación insumo/producto" },
            { id: "ai", label: "Análisis IA" },
            { id: "sources", label: "Fuentes" },
          ] as { id: Tab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-green-600 text-white"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === "prices" && <PriceHistoryChart />}
      {activeTab === "ratio" && <RatioChart />}
      {activeTab === "ai" && <AIPanel />}
      {activeTab === "sources" && <SourceStatus />}
    </div>
  );
}
