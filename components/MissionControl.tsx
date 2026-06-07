"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, BookOpen, Database, ChevronRight, Inbox, Megaphone, Video, Workflow, Network, SunMedium, BrainCircuit } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId, ProviderDef } from "@/lib/providers";

type AgentStatus = "LIVE" | "OFFLINE" | "CHECKING";

interface AgentHealth {
  status: AgentStatus;
  configured: boolean;
}

const STATUS: Record<AgentStatus, { color: string; label: string }> = {
  LIVE:     { color: "#00A676", label: "Online" },
  OFFLINE:  { color: "#EF4444", label: "Offline" },
  CHECKING: { color: "#5F8C94", label: "Verificando…" },
};

// Para qué usa Liliana cada agente
const ROLE: Record<ProviderId, { title: string; uses: string[] }> = {
  claude:  { title: "Finanzas · Estrategia · Código",   uses: ["Análisis financiero y NIIF", "Estrategia empresarial", "Redacción legal y formal"] },
  openai:  { title: "Marketing · Contenido · Emails",   uses: ["Copys y campañas Buzzi", "Emails profesionales", "Ideas creativas y resúmenes"] },
  gemini:  { title: "Research · Búsqueda en tiempo real", uses: ["Comparativos y benchmarks", "Noticias y tendencias", "Datos de mercado actualizados"] },
  hermes:  { title: "Segundo cerebro · Obsidian · Herramientas", uses: ["Memoria y contexto personal", "Archivos y Obsidian", "Automatizaciones con herramientas"] },
};

const ACCENT: Record<ProviderId, string> = {
  claude: "#F72585", openai: "#00A676", gemini: "#5F8C94", hermes: "#6D28D9",
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
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{ background: "rgba(229,231,235,0.96)", border: `1px solid rgba(${rgb},0.24)`, backdropFilter: "blur(16px)", boxShadow: "0 16px 42px rgba(17,24,39,0.10)" }}
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
              <h3 className="text-xl font-black leading-tight" style={{ fontFamily: "var(--font-syne)", color: accent }}>
                {prov.name}
              </h3>
              <p className="text-[13px] mt-0.5 font-semibold" style={{ fontFamily: "var(--font-outfit)", color: "rgba(17,24,39,0.82)" }}>
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
              <span className="text-[14px] leading-snug font-semibold" style={{ fontFamily: "var(--font-outfit)", color: "#111827" }}>
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
            style={{ background: "rgba(7,24,46,0.02)", border: "1px solid rgba(7,24,46,0.06)" }}>
            <span className="text-[11px]"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.35)" }}>
              {!health.configured
                ? `Agrega ${prov.envKey} en .env.local`
                : id === "hermes"
                ? "Verifica Ollama/Hermes en el VPS"
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
      initial={false} animate={{ y: 0, opacity: 1 }}
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
        <div className="text-[16px] font-black" style={{ fontFamily: "var(--font-syne)", color }}>{label}</div>
        <div className="text-[13px] mt-0.5 truncate font-semibold" style={{ fontFamily: "var(--font-outfit)", color: "rgba(17,24,39,0.82)" }}>{description}</div>
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
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      <div className="p-4 sm:p-5 lg:p-6 pb-24 md:pb-6 flex flex-col gap-5 sm:gap-6">

        <div className="flex items-center gap-3 -mb-1">
          <div className="w-1 h-4 rounded-full" style={{ background: "#6D28D9" }} />
          <span className="text-[12px] font-black tracking-[0.16em] uppercase"
            style={{ fontFamily: "var(--font-syne)", color: "#6D28D9" }}>
            Command Center
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(109,40,217,0.1)" }} />
        </div>

        {/* Saludo + estado global */}
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-syne)", color: "#07182E", letterSpacing: "-0.02em" }}>
              {greeting}, Liliana 👋
            </h1>
            <p className="text-[16px] mt-1 font-semibold"
              style={{ fontFamily: "var(--font-outfit)", color: "rgba(17,24,39,0.82)" }}>
              {liveCount === 0 ? "Configurando agentes…" : `${liveCount} agente${liveCount > 1 ? "s" : ""} listo${liveCount > 1 ? "s" : ""} para trabajar`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate("audiovisuales")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.28)", cursor: "pointer" }}>
              <Video size={14} style={{ color: "#EF4444" }} />
              <span className="text-[11px] font-bold"
                style={{ fontFamily: "var(--font-syne)", color: "#fecdd3" }}>
                Abrir Audiovisuales
              </span>
            </motion.button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: liveCount > 0 ? "rgba(0,166,118,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${liveCount > 0 ? "rgba(0,166,118,0.25)" : "rgba(239,68,68,0.25)"}` }}>
              <motion.div className="w-2 h-2 rounded-full"
                style={{ background: liveCount > 0 ? "#00A676" : "#EF4444" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <span className="text-[11px] font-bold"
                style={{ fontFamily: "var(--font-jetbrains)", color: liveCount > 0 ? "#00A676" : "#EF4444" }}>
                {liveCount}/{PROVIDERS.length} activos
              </span>
            </div>
          </div>
        </motion.div>

        {/* Grid de agentes 2×2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {PROVIDERS.map((p, i) => (
            <AgentCard
              key={p.id} prov={p} index={i}
              health={health[p.id] ?? { status: "CHECKING", configured: false }}
              onOpen={() => onOpenAgent(p.id as ProviderId)}
            />
          ))}
        </div>

        {/* Self Layer */}
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: "#F72585" }} />
            <span className="text-[12px] font-black tracking-[0.16em] uppercase"
              style={{ fontFamily: "var(--font-syne)", color: "#F72585" }}>
              Tus herramientas personales
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(247,37,133,0.1)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <SelfTile icon={BrainCircuit} label="Orquestador" description="Manda una misión al comité multiagente" color="#6D28D9" rgb="226,178,79" delay={0.3} onClick={() => onNavigate("orchestrator")} />
            <SelfTile icon={SunMedium} label="Hoy ☀️" description="Pendientes, agenda, misiones y Daily Note" color="#6D28D9" rgb="226,178,79" delay={0.34} onClick={() => onNavigate("today")} />
            <SelfTile icon={Inbox} label="Inbox universal" description="Captura y clasificación anti-caos" color="#6D28D9" rgb="226,178,79" delay={0.38} onClick={() => onNavigate("inbox")} />
            <SelfTile icon={Megaphone} label="Marketing CC" description="Campañas, prompts y aprobaciones" color="#F72585" rgb="209,132,73" delay={0.42} onClick={() => onNavigate("marketing")} />
            <SelfTile icon={Video} label="Audiovisuales" description="Imagen, video, prompts visuales e historial" color="#EF4444" rgb="196,98,58" delay={0.44} onClick={() => onNavigate("audiovisuales")} />
            <SelfTile icon={Workflow} label="Workflows" description="SOPs para tareas repetibles" color="#00A676" rgb="138,154,85" delay={0.46} onClick={() => onNavigate("workflows")} />
            <SelfTile icon={Network} label="Empresas/Personas" description="Contexto y esperando respuesta" color="#5F8C94" rgb="95,140,148" delay={0.5} onClick={() => onNavigate("empresas")} />
            <SelfTile icon={Target}   label="Goals 🎯"   description="Metas del día · auto-sync Obsidian" color="#00A676" rgb="138,154,85"  delay={0.56}  onClick={() => onNavigate("goals")} />
            <SelfTile icon={BookOpen} label="Journal 📓" description="Diario con voz · guarda en Obsidian" color="#F72585" rgb="209,132,73" delay={0.6} onClick={() => onNavigate("journal")} />
            <SelfTile icon={Database} label="Memory 🧠"  description="Todos tus chats guardados"          color="#6D28D9" rgb="226,178,79"  delay={0.64} onClick={() => onNavigate("memory")} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
