"use client";

import { useState, useEffect, useRef } from "react";
import { analyzeWithAI, fetchPredefinedQueries } from "@/lib/api";

interface PredefinedQuery {
  key: string;
  label: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_LABELS: Record<string, string> = {
  current_prices:      "Precios fertilizantes hoy",
  grains_prices:       "Precios granos Chicago y Rosario",
  ratio_vs_historical: "Relación insumo/producto",
  buy_timing:          "¿Comprar ahora o esperar?",
  external_factors:    "Factores externos (Medio Oriente, China)",
};

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p class='mb-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p class='mb-2'>")
    .replace(/$/, "</p>");
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [predefined, setPredefined] = useState<PredefinedQuery[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPredefinedQueries().then(setPredefined).catch(() => []);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(query: string, key?: string) {
    if (!query.trim() || loading) return;
    const userMsg: Message = { role: "user", content: key ? QUICK_LABELS[key] ?? query : query };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await analyzeWithAI(query, key);
      setMessages((m) => [...m, { role: "assistant", content: res.response }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error al consultar la IA. Revisá la ANTHROPIC_API_KEY en el servidor." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col h-[600px]">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Análisis IA</h2>

      {/* Quick buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {predefined.map((q) => (
          <button
            key={q.key}
            onClick={() => send(q.label.replace(/\.\.\.$/, ""), q.key)}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full text-slate-200 transition-colors disabled:opacity-50"
          >
            {QUICK_LABELS[q.key] ?? q.key}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm">
            Usá los botones rápidos o escribí tu consulta sobre fertilizantes y mercados.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-green-700 text-white whitespace-pre-wrap"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              {m.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
              Analizando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu consulta sobre fertilizantes..."
          disabled={loading}
          className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
