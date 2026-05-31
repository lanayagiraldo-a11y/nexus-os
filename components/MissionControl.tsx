"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, BookOpen, Database, ChevronRight } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId, ProviderDef } from "@/lib/providers";

type AgentStatus = "LIVE" | "OFFLINE" | "CHECKING";

interface AgentHealth {
  status: AgentStatus;
  configured: boolean;
}

const STATUS: Record<AgentStatus, { color: string; label: string }> = {
  LIVE:     { color: "#34d399", label: "Online" },
  OFFLINE:  { color: "#fb7185", label: "Offline" },
  CHECKING: { color: "#60a5fa", label: "Verificando…" },
};

// Para qué usa Liliana cada agente
const ROLE: Record<ProviderId, { title: string; uses: string[] }> = {
  claude:  { title: "Finanzas · Estrategia · Código",   uses: ["Análisis financiero y NIIF", "Estrategia empresarial", "Redacción legal y formal"] },
  openai:  { title: "Marketing · Contenido · Emails",   uses: ["Copys y campañas Buzzi", "Emails profesionales", "Ideas creativas y resúmenes"] },
  gemini:  { title: "Research · Búsqueda en tiempo real", uses: ["Comparativos y benchmarks", "Noticias y tendencias", "Datos de mercado actualizados"] },
  hermes:  { title: "Tareas privadas · Sin nube",        uses: ["Análisis confidenciales", "Documentos sensibles", "Sin registro externo"] },
};

const ACCENT: Record<ProviderId, string> = {
  claude: "#a78bfa", openai: "#34d399", gemini: "#60a5fa", hermes: "#fbbf24",
};

function AgentCard({ prov, health, index, onOpen }: {
  prov: ProviderDef; health: AgentHealth; index: number; onOpen: () => void;
}) {
  const id = prov.id as ProviderId;
  const accent = ACCENT[id];
  const rgb = prov.accentRgb;
  const st = STATUS[health.status];
  const role = ROLE[id];
  const canOpen = health.status === "LIVE" || health.status === "CHECKING";

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{ background: "rgba(8,14,31,0.9)", border: `1px solid rgba(${rgb},0.15)`, backdropFilter: "blur(16px)" }}
      whileHover={{ y: -2, borderColor: `rgba(${rgb},0.35)`, boxShadow: `0 12px 40px rgba(${rgb},0.1)` }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 10% 10%, rgba(${rgb},0.08) 0%, transparent 60%)` }} />

      <div className="relative z-10 p-5 flex flex-col flex-1 gap-4">
        {/* Header: avatar + nombre + estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentAvatar provider={id} size={44} glow={health.status === "LIVE"} />
            <div>
              <h3 className="text-lg font-black leading-tight" style={{ fontFamily: "var(--font-syne)", color: accent }}>
                {prov.name}
              </h3>
              <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.55)" }}>
                {role.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: `${st.color}15`, border: `1px solid ${st.color}35` }}>
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }}
              animate={health.status !== "OFFLINE" ? { opacity: [1, 0.3, 1] } : undefined}
              transition={{ duration: 1.6, repeat: Infinity }} />
            <span className="text-[10px] font-bold tracking-wide"
              style={{ fontFamily: "var(--font-jetbrains)", color: st.color }}>
              {st.label}
            </span>
          </div>
        </div>

        {/* Para qué lo uso */}
        <ul className="flex flex-col gap-1.5 flex-1">
          {role.uses.map(u => (
            <li key={u} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: `rgba(${rgb},0.6)` }} />
              <span className="text-[12px] leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(203,213,225,0.75)" }}>
                {u}
              </span>
            </li>
          ))}
        </ul>

        {/* Botón de entrar */}
        {canOpen ? (
          <motion.button
            whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={onOpen}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl mt-1"
            style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, cursor: "pointer" }}>
            <span className="text-[12px] font-bold tracking-wide uppercase"
              style={{ fontFamily: "var(--font-syne)", color: accent }}>
              Abrir chat
            </span>
            <ChevronRight size={14} style={{ color: accent }} />
          </motion.button>
        ) : (
          <div className="px-4 py-2.5 rounded-xl mt-1"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[11px]"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
              {!health.configured
                ? `Agrega ${prov.envKey} en .env.local`
                : id === "hermes"
                ? "Instala Ollama en el VPS para activar"
                : "Verifica la API key"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SelfTile({ icon: Icon, label, description, color, rgb, delay, onClick }: {
  icon: React.ElementType; label: string; description: string;
  color: string; rgb: string; delay: number; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl text-left w-full"
      style={{ background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.14)`, cursor: "pointer" }}
      whileHover={{ y: -2, borderColor: `rgba(${rgb},0.32)`, background: `rgba(${rgb},0.09)` }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold" style={{ fontFamily: "var(--font-syne)", color }}>{label}</div>
        <div className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.5)" }}>{description}</div>
      </div>
      <ChevronRight size={13} style={{ color: `rgba(${rgb},0.4)` }} />
    </motion.button>
  );
}

interface MissionControlProps {
  onOpenAgent: (id: ProviderId) => void;
  onNavigate: (view: string) => void;
}

export default function MissionControl({ onOpenAgent, onNavigate }: MissionControlProps) {
  const [health, setHealth] = useState<Record<string, AgentHealth>>({
    claude: { status: "CHECKING", configured: false },
    openai: { status: "CHECKING", configured: false },
    gemini: { status: "CHECKING", configured: false },
    hermes: { status: "CHECKING", configured: false },
  });

  const checkHealth = async () => {
    try {
      const r = await fetch("/api/providers");
      if (!r.ok) return;
      const d = await r.json();
      const next: Record<string, AgentHealth> = {};
      for (const p of d.providers) {
        next[p.id] = {
          configured: p.configured,
          status: !p.configured ? "OFFLINE" : p.reachable === null ? "CHECKING" : p.reachable ? "LIVE" : "OFFLINE",
        };
      }
      setHealth(next);
    } catch { /* network */ }
  };

  useEffect(() => { checkHealth(); const t = setInterval(checkHealth, 30_000); return () => clearInterval(t); }, []);

  const liveCount = Object.values(health).filter(h => h.status === "LIVE").length;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 flex flex-col gap-6">

        {/* Saludo + estado global */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "#e2e8f0", letterSpacing: "-0.02em" }}>
              {greeting}, Liliana 👋
            </h1>
            <p className="text-[13px] mt-1"
              style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.5)" }}>
              {liveCount === 0 ? "Configurando agentes…" : `${liveCount} agente${liveCount > 1 ? "s" : ""} listo${liveCount > 1 ? "s" : ""} para trabajar`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: liveCount > 0 ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)", border: `1px solid ${liveCount > 0 ? "rgba(52,211,153,0.25)" : "rgba(251,113,133,0.25)"}` }}>
            <motion.div className="w-2 h-2 rounded-full"
              style={{ background: liveCount > 0 ? "#34d399" : "#fb7185" }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <span className="text-[11px] font-bold"
              style={{ fontFamily: "var(--font-jetbrains)", color: liveCount > 0 ? "#34d399" : "#fb7185" }}>
              {liveCount}/{PROVIDERS.length} activos
            </span>
          </div>
        </motion.div>

        {/* Grid de agentes 2×2 */}
        <div className="grid grid-cols-2 gap-4">
          {PROVIDERS.map((p, i) => (
            <AgentCard
              key={p.id} prov={p} index={i}
              health={health[p.id] ?? { status: "CHECKING", configured: false }}
              onOpen={() => onOpenAgent(p.id as ProviderId)}
            />
          ))}
        </div>

        {/* Self Layer */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: "#a78bfa" }} />
            <span className="text-[10px] font-semibold tracking-[0.18em] uppercase"
              style={{ fontFamily: "var(--font-syne)", color: "#a78bfa" }}>
              Tus herramientas personales
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.1)" }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SelfTile icon={Target}   label="Goals 🎯"   description="Metas del día · auto-sync Obsidian" color="#34d399" rgb="52,211,153"  delay={0.4}  onClick={() => onNavigate("goals")} />
            <SelfTile icon={BookOpen} label="Journal 📓" description="Diario con voz · guarda en Obsidian" color="#a78bfa" rgb="167,139,250" delay={0.46} onClick={() => onNavigate("journal")} />
            <SelfTile icon={Database} label="Memory 🧠"  description="Todos tus chats guardados"          color="#22d3ee" rgb="34,211,238"  delay={0.52} onClick={() => onNavigate("memory")} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
