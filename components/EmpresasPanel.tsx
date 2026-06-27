"use client";
import { useState, useEffect, useCallback } from "react";

const PURPLE = "#4C1D95";
const INK = "#07182E";
const EMERALD = "#047857";

interface Fuente { id: string; label: string; directive: string }
interface Empresa { id: string; nombre: string; sources: Fuente[] }

async function api(body: object) {
  const r = await fetch("/api/empresas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

// Conexiones disponibles (un clic = acceso completo a ese API).
const CONEXIONES = [
  { nombre: "GESTIVO", directive: "gestivo", desc: "Operación: conductores, cierres, viajes perdidos, ausentismo, accidentes…" },
];

function connectionName(directive: string): string {
  return (directive.trim().split(/\s+/)[0] || "fuente").toUpperCase();
}
function isFullConnection(directive: string): boolean {
  const parts = directive.trim().split(/\s+/);
  return parts.length === 1; // solo el proveedor, sin resource/agg => conexión completa
}

export default function EmpresasPanel() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [preview, setPreview] = useState<{ label: string; ok: boolean; error?: string }[] | null>(null);

  const load = useCallback(async () => {
    const d = await api({ action: "list" });
    if (Array.isArray(d.empresas)) {
      setEmpresas(d.empresas);
      setSelId((cur) => cur && d.empresas.some((e: Empresa) => e.id === cur) ? cur : (d.empresas[0]?.id ?? null));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sel = empresas.find((e) => e.id === selId) || null;

  const crearEmpresa = async () => {
    if (!nuevoNombre.trim()) return;
    setBusy(true);
    const d = await api({ action: "upsert-empresa", nombre: nuevoNombre.trim() });
    setNuevoNombre("");
    if (d.id) setSelId(d.id);
    if (Array.isArray(d.empresas)) setEmpresas(d.empresas);
    setBusy(false);
  };

  const borrarEmpresa = async (id: string) => {
    setBusy(true);
    const d = await api({ action: "delete-empresa", id });
    if (Array.isArray(d.empresas)) { setEmpresas(d.empresas); setSelId(d.empresas[0]?.id ?? null); }
    setBusy(false);
  };

  const connect = async (nombre: string, directive: string) => {
    if (!sel) return;
    setBusy(true);
    const d = await api({ action: "add-source", empresaId: sel.id, label: nombre, directive });
    if (Array.isArray(d.empresas)) setEmpresas(d.empresas);
    setBusy(false);
  };

  const delSource = async (sourceId: string) => {
    if (!sel) return;
    setBusy(true);
    const d = await api({ action: "delete-source", empresaId: sel.id, sourceId });
    if (Array.isArray(d.empresas)) setEmpresas(d.empresas);
    setBusy(false);
  };

  const probar = async () => {
    if (!sel) return;
    setBusy(true); setPreview(null);
    const d = await api({ action: "preview", empresaId: sel.id });
    if (Array.isArray(d.results)) setPreview(d.results.map((r: { label: string; ok: boolean; error?: string }) => ({ label: r.label, ok: r.ok, error: r.error })));
    setBusy(false);
  };

  return (
    <div className="absolute inset-0 overflow-y-auto p-4">
      <div className="text-sm font-bold mb-3" style={{ color: INK, fontFamily: "'Syne', sans-serif" }}>🏢 Empresas y sus fuentes</div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(160px, 220px) 1fr" }}>
        {/* Lista de empresas */}
        <div>
          <div className="flex gap-1 mb-2">
            <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && crearEmpresa()}
              placeholder="Nueva empresa…" className="flex-1 text-xs px-2 py-1.5 rounded-lg outline-none" style={{ border: "1px solid rgba(31,41,55,0.12)", color: INK }} />
            <button onClick={crearEmpresa} disabled={busy} className="text-xs px-2 py-1.5 rounded-lg font-bold text-white" style={{ background: PURPLE }}>+</button>
          </div>
          <div className="flex flex-col gap-1">
            {empresas.map((e) => (
              <div key={e.id} onClick={() => { setSelId(e.id); setPreview(null); }} className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-sm"
                style={{ background: e.id === selId ? "rgba(76,29,149,0.10)" : "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.06)", color: INK }}>
                <span className="font-semibold">{e.nombre}</span>
                <span className="text-xs" style={{ color: "rgba(31,41,55,0.4)" }}>{e.sources.length}</span>
              </div>
            ))}
            {!empresas.length && <div className="text-xs opacity-40 px-2 py-3" style={{ color: INK }}>Crea tu primera empresa arriba ↑</div>}
          </div>
        </div>

        {/* Detalle empresa */}
        <div>
          {sel ? (
            <div className="rounded-xl p-3" style={{ background: "rgba(247,239,226,0.92)", border: "1px solid rgba(76,29,149,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold" style={{ color: PURPLE }}>{sel.nombre}</div>
                <div className="flex gap-2">
                  <button onClick={probar} disabled={busy || !sel.sources.length} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(4,120,87,0.1)", color: EMERALD }}>🔍 Probar fuentes</button>
                  <button onClick={() => borrarEmpresa(sel.id)} disabled={busy} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(215,58,74,0.08)", color: "#D73A4A" }}>Eliminar</button>
                </div>
              </div>

              {/* Fuentes */}
              <div className="text-xs font-bold mb-1" style={{ color: INK }}>Fuentes ({sel.sources.length})</div>
              <div className="flex flex-col gap-1.5 mb-3">
                {sel.sources.map((s) => {
                  const pv = preview?.find((p) => p.label.includes(s.label) || s.label.includes(p.label));
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg" style={{ background: "#fff", border: "1px solid rgba(31,41,55,0.08)" }}>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: INK }}>
                          {preview && <span>{pv ? (pv.ok ? "✅" : "⛔") : "•"}</span>}
                          🔌 {connectionName(s.directive)}
                        </div>
                        <div className="text-xs opacity-50" style={{ color: INK }}>{isFullConnection(s.directive) ? "conexión completa · todos los datos del API" : "consulta específica"}</div>
                        {pv && !pv.ok && <div className="text-xs" style={{ color: "#D73A4A" }}>{pv.error}</div>}
                      </div>
                      <button onClick={() => delSource(s.id)} disabled={busy} className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(31,41,55,0.06)", color: INK }}>✕</button>
                    </div>
                  );
                })}
                {!sel.sources.length && <div className="text-xs opacity-40" style={{ color: INK }}>Sin conexiones. Conecta una abajo.</div>}
              </div>

              {/* Conectar fuentes (un clic = acceso completo al API) */}
              <div className="rounded-lg p-2.5" style={{ background: "rgba(76,29,149,0.04)" }}>
                <div className="text-xs font-bold mb-1.5" style={{ color: PURPLE }}>🔌 Conectar una fuente</div>
                <div className="flex flex-col gap-1.5">
                  {CONEXIONES.map((c) => {
                    const yaConectada = sel.sources.some((s) => connectionName(s.directive) === c.nombre.toUpperCase());
                    return (
                      <button key={c.nombre} onClick={() => connect(c.nombre, c.directive)} disabled={busy || yaConectada}
                        className="text-left px-2.5 py-2 rounded-lg" style={{ background: yaConectada ? "rgba(4,120,87,0.08)" : "#fff", border: "1px solid rgba(76,29,149,0.1)", opacity: yaConectada ? 0.7 : 1 }}>
                        <div className="text-sm font-bold" style={{ color: yaConectada ? EMERALD : PURPLE }}>{yaConectada ? "✅ " : "🔌 "}{c.nombre}{yaConectada ? " (conectada)" : ""}</div>
                        <div className="text-xs opacity-60" style={{ color: INK }}>{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-40 p-4" style={{ color: INK }}>Selecciona o crea una empresa.</div>
          )}
        </div>
      </div>
    </div>
  );
}
