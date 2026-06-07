"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Send,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Megaphone,
  PenLine,
  Lightbulb,
  FileText,
  FolderOpen,
  Save,
  ClipboardCheck,
  ListChecks,
  Users,
  Database,
  Link2,
} from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { emitNexusEvent } from "@/lib/nexusEvents";

interface AgentResult {
  provider: ProviderId;
  name: string;
  role: string;
  status: "completed" | "failed";
  content: string;
  error?: string;
}
interface OrchestrationResponse {
  mission: string;
  mode: string;
  createdAt: string;
  results: AgentResult[];
  synthesis: string;
  context?: {
    type: string;
    label: string;
    sourceCount: number;
    sources: string[];
  } | null;
}

type ContextType = "none" | "pasted" | "daily" | "vault-path" | "url";
type ExecutionKind = "save-synthesis" | "create-tasks" | "save-and-create-tasks";

const MODES = [
  { id: "committee", label: "Comité completo", icon: BrainCircuit, hint: "Estrategia + redacción + creatividad + contexto" },
  { id: "marketing", label: "Marketing", icon: Megaphone, hint: "Campañas, posicionamiento, canales y KPIs" },
  { id: "strategy", label: "Estrategia", icon: ShieldCheck, hint: "Riesgos, prioridades y decisión" },
  { id: "creative", label: "Creativos", icon: PenLine, hint: "Copy, imágenes, carruseles, videos y prompts visuales" },
];

const STARTERS = [
  "Revisa este post: primero transcribe, dime de qué es cada prompt y si ya está incluido en mi sistema de marketing.",
  "Crea una campaña para La Carolina con estrategia, creativos visuales, copys, riesgos y próximos pasos.",
  "Analiza esta idea de negocio y dime qué haría cada agente antes de ejecutarla.",
];

const CONTEXT_OPTIONS: Array<{ type: ContextType; label: string; icon: typeof FileText; hint: string; path?: string }> = [
  { type: "none", label: "Sin contexto", icon: BrainCircuit, hint: "Solo la misión escrita" },
  { type: "daily", label: "Daily note de hoy", icon: FileText, hint: "Lee la nota diaria en Obsidian" },
  { type: "vault-path", label: "La Carolina", icon: FolderOpen, hint: "Carpeta/proyecto en Obsidian", path: "empresas/la-carolina" },
  { type: "vault-path", label: "Dar Ibrahim / IERA", icon: FolderOpen, hint: "Carpeta/proyecto en Obsidian", path: "proyectos/dar-ibrahim" },
  { type: "vault-path", label: "Fondo El Salvador", icon: FolderOpen, hint: "Carpeta/proyecto en Obsidian", path: "proyectos/fondo-inversion-el-salvador" },
  { type: "url", label: "Link externo", icon: Link2, hint: "Google Drive, OneDrive, PDF público o página web" },
  { type: "pasted", label: "Texto pegado", icon: ClipboardCheck, hint: "Pega acta, correo, contrato o WhatsApp" },
];

const ACCENT: Record<ProviderId, string> = { claude: "#B45309", openai: "#047857", gemini: "#0F766E", hermes: "#4C1D95" };
const ACCENT_RGB: Record<ProviderId, string> = { claude: "180,83,9", openai: "4,120,87", gemini: "15,118,110", hermes: "76,29,149" };

function MarkdownLike({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "#111827" }}>
      {text}
    </div>
  );
}

function ResultCard({ result }: { result: AgentResult }) {
  const color = ACCENT[result.provider];
  const rgb = ACCENT_RGB[result.provider];
  const def = PROVIDERS.find(p => p.id === result.provider);
  return (
    <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4"
      style={{ background: "rgba(247,239,226,0.82)", border: `1px solid rgba(${rgb},0.18)`, backdropFilter: "blur(16px)" }}>
      <div className="flex items-center gap-3 mb-3">
        <AgentAvatar provider={result.provider} size={34} glow={result.status === "completed"} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black" style={{ fontFamily: "var(--font-syne)", color }}>{def?.name ?? result.name}</div>
          <div className="text-[10px] truncate" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.5)" }}>{result.role}</div>
        </div>
        {result.status === "completed" ? <CheckCircle2 size={16} color="#047857" /> : <AlertTriangle size={16} color="#B91C1C" />}
      </div>
      {result.status === "completed" ? <MarkdownLike text={result.content} /> : <div className="text-sm" style={{ color: "#B91C1C", fontFamily: "var(--font-outfit)" }}>Error: {result.error}</div>}
    </motion.div>
  );
}

function cleanTaskLine(line: string): string {
  return line
    .replace(/^\s*(?:[-*]|\d+[.)])\s*/, "")
    .replace(/^\[[ xX/-]\]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^propuesta pendiente de aprobación:?\s*/i, "")
    .trim();
}

function extractActionItems(synthesis: string): string[] {
  const lines = synthesis.split("\n");
  const start = lines.findIndex(line => /pr[oó]ximos pasos|acciones|pendientes|recomendaci[oó]n final/i.test(line));
  const relevant = start >= 0 ? lines.slice(start + 1) : lines;
  return relevant
    .map(cleanTaskLine)
    .filter(line => line.length > 12 && !/^#+\s/.test(line) && !/^no se /i.test(line))
    .filter((line, index, array) => array.indexOf(line) === index)
    .slice(0, 8);
}

export default function OrchestratorView() {
  const [mission, setMission] = useState("");
  const [mode, setMode] = useState("committee");
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<OrchestrationResponse | null>(null);
  const [error, setError] = useState("");
  const [contextType, setContextType] = useState<ContextType>("none");
  const [contextLabel, setContextLabel] = useState("Sin contexto");
  const [contextText, setContextText] = useState("");
  const [contextPath, setContextPath] = useState("");
  const [contextUrl, setContextUrl] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<ProviderId[]>(["claude", "openai", "gemini", "hermes"]);
  const [executionStatus, setExecutionStatus] = useState("");
  const [executing, setExecuting] = useState<ExecutionKind | "copy" | "" >("");

  const extractedTasks = useMemo(() => data ? extractActionItems(data.synthesis) : [], [data]);

  const applyContextOption = (option: typeof CONTEXT_OPTIONS[number]) => {
    setContextType(option.type);
    setContextLabel(option.label);
    setContextPath(option.path ?? "");
    if (option.type !== "pasted") setContextText("");
    if (option.type !== "url") setContextUrl("");
  };

  const toggleAgent = (id: ProviderId) => {
    setSelectedAgents(prev => {
      if (prev.includes(id)) return prev.length === 1 ? prev : prev.filter(agent => agent !== id);
      return [...prev, id];
    });
  };

  const requestContext = () => {
    if (contextType === "none") return { type: "none", label: "Sin contexto" };
    if (contextType === "pasted") return { type: "pasted", label: contextLabel, text: contextText };
    if (contextType === "url") return { type: "url", label: contextLabel, url: contextUrl };
    if (contextType === "daily") return { type: "daily", label: contextLabel };
    return { type: "vault-path", label: contextLabel, path: contextPath };
  };

  const run = async () => {
    const text = mission.trim();
    if (!text || running) return;
    setRunning(true);
    setError("");
    setData(null);
    setExecutionStatus("");
    emitNexusEvent({ type: "info", agent: "ORQUESTADOR", message: "Mission dispatched", detail: `${mode} · ${selectedAgents.length} agentes · ${contextLabel}` });
    try {
      const resp = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ mission: text, mode, agents: selectedAgents, context: requestContext() }),
      });
      const contentType = resp.headers.get("content-type") ?? "";
      const raw = await resp.text();
      let payload: OrchestrationResponse | { error?: string } | null = null;
      if (contentType.includes("application/json")) {
        try {
          payload = raw ? JSON.parse(raw) as OrchestrationResponse | { error?: string } : null;
        } catch {
          throw new Error("El Orquestador recibió JSON inválido del servidor. Recarga la página e intenta de nuevo.");
        }
      } else {
        const preview = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
        throw new Error(`El endpoint del Orquestador devolvió ${resp.status} en formato ${contentType || "no identificado"}, no JSON. ${preview || "Posible servidor/túnel desactualizado."}`);
      }
      if (!resp.ok) throw new Error((payload as { error?: string } | null)?.error ?? "Orchestration failed");
      const dataPayload = payload as OrchestrationResponse;
      setData(dataPayload);
      emitNexusEvent({ type: "success", agent: "ORQUESTADOR", message: "Committee synthesis ready", detail: `${dataPayload.results?.length ?? 0} agents` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      emitNexusEvent({ type: "warning", agent: "ORQUESTADOR", message: "Mission failed", detail: msg });
    } finally {
      setRunning(false);
    }
  };

  const executeSynthesis = async (execution: ExecutionKind) => {
    if (!data || executing) return;
    setExecuting(execution);
    setExecutionStatus("");
    try {
      const resp = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "orchestration",
          mission: data.mission,
          mode: data.mode,
          contextLabel: data.context?.label ?? contextLabel,
          synthesis: data.synthesis,
          tasks: extractedTasks,
          execution,
        }),
      });
      const payload = await resp.json() as { ok?: boolean; error?: string; createdTasks?: number; file?: string };
      if (!resp.ok || !payload.ok) throw new Error(payload.error ?? "No se pudo ejecutar la síntesis");
      const message = execution === "save-synthesis"
        ? "Síntesis guardada en Obsidian."
        : execution === "create-tasks"
        ? `${payload.createdTasks ?? 0} pendiente(s) creados en Hoy.`
        : `Síntesis guardada y ${payload.createdTasks ?? 0} pendiente(s) creados en Hoy.`;
      setExecutionStatus(message);
      emitNexusEvent({ type: "success", agent: "ORQUESTADOR", message: "Synthesis executed", detail: message });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setExecutionStatus(`Error: ${msg}`);
      emitNexusEvent({ type: "warning", agent: "ORQUESTADOR", message: "Execution failed", detail: msg });
    } finally {
      setExecuting("");
    }
  };

  const copySynthesis = async () => {
    if (!data) return;
    setExecuting("copy");
    try {
      await navigator.clipboard.writeText(data.synthesis);
      setExecutionStatus("Síntesis copiada al portapapeles.");
    } catch {
      setExecutionStatus("No pude copiar automáticamente; selecciona la síntesis y cópiala manualmente.");
    } finally {
      setExecuting("");
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      <div className="p-4 sm:p-5 lg:p-6 pb-24 md:pb-6 flex flex-col gap-5">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(76,29,149,0.1)", border: "1px solid rgba(76,29,149,0.22)" }}>
                <BrainCircuit size={20} color="#4C1D95" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-syne)", color: "#07182E" }}>Consejo de agentes</h1>
                <p className="text-[13px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.55)" }}>Selecciona contexto, convoca agentes y convierte la síntesis de Hermi en acciones reales.</p>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full self-start" style={{ background: "rgba(76,29,149,0.08)", border: "1px solid rgba(76,29,149,0.22)", fontFamily: "var(--font-jetbrains)", color: "#4C1D95", fontSize: 11 }}>Ejecuta solo guardar/pendientes; envíos requieren aprobación</div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="rounded-2xl p-4" style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.13)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} color="#4C1D95" />
              <h2 className="text-sm font-black" style={{ fontFamily: "var(--font-syne)", color: "#4C1D95" }}>Selector de contexto</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {CONTEXT_OPTIONS.map(option => {
                const Icon = option.icon;
                const active = contextType === option.type && contextLabel === option.label;
                return <button key={`${option.type}-${option.label}`} onClick={() => applyContextOption(option)} className="p-3 rounded-xl text-left" style={{ background: active ? "rgba(76,29,149,0.1)" : "rgba(7,24,46,0.03)", border: active ? "1px solid rgba(76,29,149,0.32)" : "1px solid rgba(7,24,46,0.07)", cursor: "pointer" }}>
                  <div className="flex items-center gap-2"><Icon size={14} color={active ? "#4C1D95" : "rgba(31,41,55,0.65)"}/><span className="text-[12px] font-bold" style={{ fontFamily: "var(--font-syne)", color: active ? "#4C1D95" : "#111827" }}>{option.label}</span></div>
                  <div className="text-[10px] mt-1" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.5)" }}>{option.hint}</div>
                </button>;
              })}
            </div>
            {contextType === "pasted" && <textarea value={contextText} onChange={e => setContextText(e.target.value)} rows={5} placeholder="Pega aquí el correo, acta, contrato, WhatsApp, brief o fragmento que quieres que usen los agentes…" className="w-full rounded-xl p-3 bg-transparent resize-none focus:outline-none text-sm" style={{ border: "1px solid rgba(7,24,46,0.08)", fontFamily: "var(--font-outfit)", color: "#07182E" }} />}
            {contextType === "url" && <div className="flex flex-col gap-2">
              <input value={contextUrl} onChange={e => setContextUrl(e.target.value)} placeholder="Pega link público de Google Drive, OneDrive, PDF o página web…" className="w-full rounded-xl px-3 py-2.5 bg-transparent focus:outline-none text-sm" style={{ border: "1px solid rgba(7,24,46,0.08)", fontFamily: "var(--font-outfit)", color: "#07182E" }} />
              <div className="text-[10px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.55)" }}>Debe estar compartido como público/cualquiera con el enlace. Si requiere iniciar sesión, el consejo te pedirá pegar el texto o moverlo a Obsidian.</div>
            </div>}
            {contextType === "vault-path" && <input value={contextPath} onChange={e => setContextPath(e.target.value)} placeholder="Ruta dentro de Obsidian. Ej: empresas/la-carolina/portal-soledad.md" className="w-full rounded-xl px-3 py-2.5 bg-transparent focus:outline-none text-sm" style={{ border: "1px solid rgba(7,24,46,0.08)", fontFamily: "var(--font-outfit)", color: "#07182E" }} />}
            <div className="mt-3 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.55)" }}>Contexto activo: {contextLabel}{contextPath ? ` · ${contextPath}` : ""}{contextUrl ? ` · ${contextUrl}` : ""}</div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.14)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} color="#4C1D95" />
              <h2 className="text-sm font-black" style={{ fontFamily: "var(--font-syne)", color: "#4C1D95" }}>Agentes convocados</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2">
              {PROVIDERS.map(provider => {
                const active = selectedAgents.includes(provider.id);
                const rgb = ACCENT_RGB[provider.id];
                return <button key={provider.id} onClick={() => toggleAgent(provider.id)} className="flex items-center gap-2 rounded-xl p-2.5 text-left" style={{ background: active ? `rgba(${rgb},0.10)` : "rgba(7,24,46,0.03)", border: active ? `1px solid rgba(${rgb},0.30)` : "1px solid rgba(7,24,46,0.07)", cursor: "pointer" }}>
                  <AgentAvatar provider={provider.id} size={28} glow={active} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-black" style={{ fontFamily: "var(--font-syne)", color: active ? ACCENT[provider.id] : "#111827" }}>{provider.name}</div>
                    <div className="text-[10px] truncate" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.5)" }}>{provider.modelLabel}</div>
                  </div>
                  {active ? <CheckCircle2 size={15} color={ACCENT[provider.id]} /> : <div className="w-3.5 h-3.5 rounded-full" style={{ border: "1px solid rgba(31,41,55,0.35)" }} />}
                </button>;
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {MODES.map(m => {
            const Icon = m.icon;
            const active = mode === m.id;
            return <motion.button key={m.id} onClick={() => setMode(m.id)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="p-3 rounded-xl text-left"
              style={{ background: active ? "rgba(76,29,149,0.1)" : "rgba(247,239,226,0.7)", border: active ? "1px solid rgba(76,29,149,0.35)" : "1px solid rgba(7,24,46,0.07)", cursor: "pointer" }}>
              <div className="flex items-center gap-2 mb-1"><Icon size={14} color={active ? "#4C1D95" : "rgba(31,41,55,0.65)"}/><span className="text-[12px] font-bold" style={{ fontFamily: "var(--font-syne)", color: active ? "#4C1D95" : "#111827" }}>{m.label}</span></div>
              <div className="text-[10px] leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.48)" }}>{m.hint}</div>
            </motion.button>;
          })}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.13)", backdropFilter: "blur(16px)" }}>
          <textarea value={mission} onChange={e => setMission(e.target.value)} rows={5} placeholder="Ej: Usa el contexto de La Carolina y prepara una propuesta económica para Portal de Soledad con KPIs, riesgos y próximos pasos ejecutables…" className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "#07182E" }} />
          <div className="flex flex-wrap gap-2 mt-3">
            {STARTERS.map(s => <button key={s} onClick={() => setMission(s)} className="px-3 py-1.5 rounded-lg text-[11px]" style={{ background: "rgba(7,24,46,0.04)", border: "1px solid rgba(7,24,46,0.08)", color: "rgba(7,24,46,0.74)", fontFamily: "var(--font-outfit)", cursor: "pointer" }}>{s}</button>)}
          </div>
          <div className="flex justify-stretch sm:justify-end mt-4">
            <motion.button onClick={run} disabled={!mission.trim() || running} whileHover={mission.trim() && !running ? { scale: 1.02 } : undefined} whileTap={mission.trim() && !running ? { scale: 0.98 } : undefined} className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold"
              style={{ background: mission.trim() && !running ? "#4C1D95" : "rgba(7,24,46,0.07)", color: mission.trim() && !running ? "#F7EFE2" : "rgba(31,41,55,0.35)", fontFamily: "var(--font-syne)", cursor: mission.trim() && !running ? "pointer" : "default" }}>
              {running ? <Sparkles size={15} className="animate-pulse" /> : <Send size={15} />}
              {running ? "Orquestando…" : `Enviar al consejo (${selectedAgents.length})`}
            </motion.button>
          </div>
        </div>

        {error && <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(185,28,28,0.08)", border: "1px solid rgba(185,28,28,0.24)", color: "#B91C1C", fontFamily: "var(--font-outfit)" }}>Error: {error}</div>}

        <AnimatePresence>
          {running && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl p-5 text-center" style={{ background: "rgba(76,29,149,0.05)", border: "1px solid rgba(76,29,149,0.14)", color: "#4C1D95", fontFamily: "var(--font-syne)" }}>El consejo de agentes está trabajando con el contexto seleccionado…</motion.div>}
        </AnimatePresence>

        {data && <div className="flex flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(76,29,149,0.08), rgba(76,29,149,0.06))", border: "1px solid rgba(76,29,149,0.2)" }}>
            <div className="flex items-center gap-2 mb-3"><Lightbulb size={18} color="#4C1D95"/><h2 className="text-lg font-black" style={{ fontFamily: "var(--font-syne)", color: "#4C1D95" }}>Síntesis de Hermi</h2></div>
            {data.context && <div className="mb-3 rounded-xl p-3 text-[11px]" style={{ background: "rgba(7,24,46,0.04)", border: "1px solid rgba(7,24,46,0.08)", fontFamily: "var(--font-jetbrains)", color: "rgba(7,24,46,0.68)" }}>Fuente usada: {data.context.label} · {data.context.sourceCount} archivo(s)</div>}
            <MarkdownLike text={data.synthesis} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5" style={{ background: "rgba(247,239,226,0.92)", border: "1px solid rgba(4,120,87,0.18)", backdropFilter: "blur(16px)" }}>
            <div className="flex items-center gap-2 mb-3"><ListChecks size={18} color="#047857"/><h2 className="text-lg font-black" style={{ fontFamily: "var(--font-syne)", color: "#047857" }}>Panel de ejecución</h2></div>
            <p className="text-[12px] mb-4" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.65)" }}>Convierte la síntesis en algo útil: guardarla, crear pendientes reales en Hoy o copiarla para enviar/editar.</p>
            {extractedTasks.length > 0 && <div className="mb-4 rounded-xl p-3" style={{ background: "rgba(4,120,87,0.05)", border: "1px solid rgba(4,120,87,0.14)" }}>
              <div className="text-[11px] font-bold mb-2" style={{ fontFamily: "var(--font-syne)", color: "#047857" }}>Pendientes detectados</div>
              <div className="flex flex-col gap-1.5">
                {extractedTasks.map(task => <div key={task} className="text-[12px]" style={{ fontFamily: "var(--font-outfit)", color: "#111827" }}>- [ ] {task}</div>)}
              </div>
            </div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              <button onClick={() => executeSynthesis("save-synthesis")} disabled={!!executing} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold" style={{ background: "rgba(76,29,149,0.10)", border: "1px solid rgba(76,29,149,0.24)", color: "#4C1D95", fontFamily: "var(--font-syne)", cursor: executing ? "default" : "pointer" }}><Save size={14}/>Guardar síntesis</button>
              <button onClick={() => executeSynthesis("create-tasks")} disabled={!!executing || extractedTasks.length === 0} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold" style={{ background: extractedTasks.length ? "rgba(4,120,87,0.10)" : "rgba(7,24,46,0.04)", border: extractedTasks.length ? "1px solid rgba(4,120,87,0.24)" : "1px solid rgba(7,24,46,0.07)", color: extractedTasks.length ? "#047857" : "rgba(31,41,55,0.35)", fontFamily: "var(--font-syne)", cursor: executing || extractedTasks.length === 0 ? "default" : "pointer" }}><ListChecks size={14}/>Crear pendientes</button>
              <button onClick={() => executeSynthesis("save-and-create-tasks")} disabled={!!executing} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold" style={{ background: "rgba(76,29,149,0.10)", border: "1px solid rgba(76,29,149,0.24)", color: "#4C1D95", fontFamily: "var(--font-syne)", cursor: executing ? "default" : "pointer" }}><CheckCircle2 size={14}/>Guardar + tareas</button>
              <button onClick={copySynthesis} disabled={!!executing} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-bold" style={{ background: "rgba(247,37,133,0.10)", border: "1px solid rgba(247,37,133,0.24)", color: "#F72585", fontFamily: "var(--font-syne)", cursor: executing ? "default" : "pointer" }}><ClipboardCheck size={14}/>Copiar</button>
            </div>
            {executionStatus && <div className="mt-3 rounded-xl p-3 text-[12px]" style={{ background: executionStatus.startsWith("Error") ? "rgba(185,28,28,0.08)" : "rgba(4,120,87,0.08)", border: executionStatus.startsWith("Error") ? "1px solid rgba(185,28,28,0.22)" : "1px solid rgba(4,120,87,0.22)", color: executionStatus.startsWith("Error") ? "#B91C1C" : "#047857", fontFamily: "var(--font-outfit)" }}>{executionStatus}</div>}
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {data.results.map(r => <ResultCard key={r.provider} result={r} />)}
          </div>
        </div>}
      </div>
    </div>
  );
}
