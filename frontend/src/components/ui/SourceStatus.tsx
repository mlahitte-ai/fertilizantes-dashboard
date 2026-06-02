"use client";

import { useEffect, useState } from "react";
import { fetchSourceStatus } from "@/lib/api";
import type { DataSource } from "@/types";

const STATUS_COLORS = {
  ok: "text-green-400",
  error: "text-red-400",
  pending: "text-yellow-400",
};

export default function SourceStatus() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSourceStatus()
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Cargando fuentes...</div>;
  if (!sources.length) return <div className="text-slate-400">No hay fuentes registradas aún.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="pb-2 pr-4">Fuente</th>
            <th className="pb-2 pr-4">Frecuencia</th>
            <th className="pb-2 pr-4">Última actualización</th>
            <th className="pb-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.name} className="border-b border-slate-800">
              <td className="py-3 pr-4 text-slate-200">{s.name}</td>
              <td className="py-3 pr-4 text-slate-400 capitalize">{s.frequency}</td>
              <td className="py-3 pr-4 text-slate-400">
                {s.last_updated ? new Date(s.last_updated).toLocaleString("es-AR") : "—"}
              </td>
              <td className={`py-3 font-medium ${STATUS_COLORS[s.last_status]}`}>
                {s.last_status}
                {s.last_error && (
                  <span className="ml-2 text-xs text-red-300 font-normal">
                    {s.last_error.slice(0, 60)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
