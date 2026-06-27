"use client";
import { useState, useEffect, useCallback } from "react";

const PURPLE = "#4C1D95";
const INK = "#07182E";

interface QueueIssue {
  number: number;
  title: string;
  url: string;
  agentState: string | null;
  agent: string | null;
  labels: string[];
}

const AGENT_META: Record<string, { icon: string; color: string; nombre: string }> = {
  hermes: { icon: "🪶", color: "#7C3AED", nombre: "Hermes" },
  claude: { icon: "🔮", color: "#D18449", nombre: "Claude" },
  openai: { icon: "⚡", color: "#10A37F", nombre: "ChatGPT" },
  gemini: { icon: "✨", color: "#2563EB", nombre: "Gemini" },
  codex: { icon: "🤖", color: "#00A676", nombre: "Codex" },
  perplexity: { icon: "🔍", color: "#00A676", nombre: "Perplexity" },
  manus: { icon: "🧩", color: "#6B7280", nombre: "Manus" },
  deepseek: { icon: "🐋", color: "#4D6BFE", nombre: "DeepSeek" },
};

const COLUMNS: { state: string; label: string; color: string }[] = [
  { state: "agent-todo", label: "📥 Todo", color: "#6B7280" },
  { state: "agent-working", label: "⚙️ Working", color: "#D97706" },
  { state: "agent-needs-input", label: "🟣 Needs input", color: "#7C3AED" },
  { state: "agent-review", label: "👀 Review", color: "#1D76DB" },
  { state: "agent-done", label: "✅ Done", color: "#047857" },
  { state: "agent-blocked", label: "⛔ Blocked", color: "#D73A4A" },
];

async function api(body: object) {
  const r = await fetch("/api/github", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export default function QueuePanel() {
  const [issues, setIssues] = useState<QueueIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api({ action: "list-issues" });
      if (Array.isArray(data.issues)) setIssues(data.issues.filter((i: QueueIssue) => i.agentState));
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000); };

  const runNext = async () => {
    setBusy("run-next");
    const r = await api({ action: "run-next" });
    flash(r.ran ? `#${r.issue?.number} → ${r.issue?.finalState}` : (r.message || "Cola vacía"));
    setBusy(null); load();
  };

  const act = async (number: number, action: string, extra: object = {}) => {
    setBusy(`${action}-${number}`);
    await api({ action, number, ...extra });
    setBusy(null); load();
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-sm font-bold" style={{ color: INK, fontFamily: "'Syne', sans-serif" }}>
          🗂️ Cola Open Engine {loading && <span className="opacity-40">· cargando…</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "rgba(31,41,55,0.06)", color: INK }}>↻ Refrescar</button>
          <button onClick={runNext} disabled={busy === "run-next"} className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: PURPLE, opacity: busy === "run-next" ? 0.5 : 1 }}>
            {busy === "run-next" ? "Procesando…" : "▶ Procesar siguiente"}
          </button>
        </div>
      </div>

      {toast && <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(76,29,149,0.08)", color: PURPLE }}>{toast}</div>}

      <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(31,41,55,0.04)", color: "rgba(31,41,55,0.55)" }}>
        Las peticiones se crean desde <b>💬 Chat</b> o <b>🧠 Consejo</b>. Aquí ves la cola, quién la trabaja y la apruebas.
      </div>

      {/* Columnas por estado */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        {COLUMNS.map((col) => {
          const items = issues.filter((i) => i.agentState === col.state);
          return (
            <div key={col.state} className="rounded-xl p-2.5" style={{ background: "rgba(247,239,226,0.6)", border: "1px solid rgba(76,29,149,0.06)" }}>
              <div className="text-xs font-bold mb-2 flex items-center justify-between" style={{ color: col.color }}>
                <span>{col.label}</span>
                <span className="px-1.5 rounded" style={{ background: col.color, color: "#fff" }}>{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((i) => {
                  const meta = i.agent ? AGENT_META[i.agent] : null;
                  const working = col.state === "agent-working";
                  return (
                  <div key={i.number} className="rounded-lg p-2 text-xs" style={{ background: "#fff", border: "1px solid rgba(31,41,55,0.08)" }}>
                    <a href={i.url} target="_blank" rel="noreferrer" className="font-semibold block mb-1 hover:underline" style={{ color: INK }}>
                      #{i.number} {i.title.replace(/\[.*?\]/g, "").trim().slice(0, 60)}
                    </a>
                    {/* Agente a cargo de la acción */}
                    {meta && (
                      <div className="flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded w-fit" style={{ background: `${meta.color}14`, color: meta.color }}>
                        {working && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />}
                        <span style={{ fontWeight: 700 }}>{meta.icon} {meta.nombre}</span>
                        <span style={{ opacity: 0.7 }}>{working ? "trabajando…" : col.state === "agent-review" ? "terminó" : ""}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {col.state === "agent-todo" && (
                        <button onClick={() => act(i.number, "run-next")} disabled={!!busy} className="px-1.5 py-0.5 rounded text-white" style={{ background: PURPLE }}>▶ run</button>
                      )}
                      {col.state === "agent-review" && (
                        <button onClick={() => act(i.number, "approve")} disabled={!!busy} className="px-1.5 py-0.5 rounded text-white" style={{ background: "#047857" }}>✓ aprobar</button>
                      )}
                      {(col.state === "agent-blocked" || col.state === "agent-review" || col.state === "agent-needs-input") && (
                        <button onClick={() => act(i.number, "set-state", { state: "agent-todo" })} disabled={!!busy} className="px-1.5 py-0.5 rounded" style={{ background: "rgba(31,41,55,0.08)", color: INK }}>↻ reabrir</button>
                      )}
                    </div>
                  </div>
                  );
                })}
                {!items.length && <div className="text-xs opacity-30 py-1" style={{ color: INK }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
