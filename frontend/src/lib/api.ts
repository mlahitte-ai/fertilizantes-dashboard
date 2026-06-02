const BASE = "/api";

export async function fetchCurrentPrices() {
  const res = await fetch(`${BASE}/prices/current`);
  if (!res.ok) throw new Error("Error al obtener precios actuales");
  return res.json();
}

export async function fetchPriceHistory(
  product: string,
  from?: string,
  to?: string
) {
  const params = new URLSearchParams({ product });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${BASE}/prices/history?${params}`);
  if (!res.ok) throw new Error("Error al obtener histórico");
  return res.json();
}

export async function fetchRatio(params: {
  grain: string;
  grain_market: string;
  fert: string;
  fert_market: string;
  months: number;
}) {
  const p = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${BASE}/ratio?${p}`);
  if (!res.ok) throw new Error("Error al calcular ratio");
  return res.json();
}

export async function fetchSourceStatus() {
  const res = await fetch(`${BASE}/sources/status`);
  if (!res.ok) throw new Error("Error al obtener estado de fuentes");
  return res.json();
}

export async function analyzeWithAI(query: string, predefined_key?: string) {
  const res = await fetch(`${BASE}/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, predefined_key }),
  });
  if (!res.ok) throw new Error("Error en consulta IA");
  return res.json();
}

export async function fetchPredefinedQueries() {
  const res = await fetch(`${BASE}/ai/predefined`);
  if (!res.ok) return [];
  return res.json();
}
