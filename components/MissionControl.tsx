"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, Target, BookOpen, Database, ChevronRight } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId, ProviderDef } from "@/lib/providers";

// ── Types ─────────────────────────────────────────────────────────────────────
type AgentStatus = "LIVE" | "DEGRADED" | "OFFLINE" | "CHECKING";

interface AgentHealth {
  status: AgentStatus;
  latency: number | null;
  configured: boolean;
}

// ── Status colour map ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<AgentStatus, { color: string; bg: string; pulse: boolean }> = {
  LIVE:     { color: "#34d399", bg: "rgba(52,211,153,0.12)",  pulse: true  },
  DEGRADED: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  pulse: true  },
  OFFLINE:  { color: "#fb7185", bg: "rgba(251,113,133,0.12)", pulse: false },
  CHECKING: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  pulse: true  },
};

// ── Role descriptions per agent ───────────────────────────────────────────────
const ROLE: Record<ProviderId, string> = {
  claude: "Intelligence Layer — Reasoning, code, deep analysis",
  openai: "Execution Layer — General intelligence, creative tasks",
  gemini: "Research Layer — Multimodal, fast, grounded search",
  hermes: "Local Layer — VPS agent, tool calls, offline tasks",
};

// ── Top status ribbon ─────────────────────────────────────────────────────────
function StatusRibbon({ health }: { health: Record<string, AgentHealth> }) {
  const [heartbeat, setHeartbeat] = useState(true);
  const [avgLatency, setAvgLatency] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setHeartbeat(h => !h), 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const latencies = Object.values(health)
      .map(h => h.latency)
      .filter((l): l is number => l !== null);
    setAvgLatency(latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null);
  }, [health]);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-0 px-6 py-2 overflow-x-auto"
      style={{
        background: "rgba(5,10,24,0.9)",
        borderBottom: "1px solid rgba(34,211,238,0.08)",
        backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}
    >
      {/* System label */}
      <span
        className="text-[10px] tracking-[0.2em] uppercase mr-5 flex-shrink-0"
        style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.4)" }}
      >
        Mission Control
      </span>

      {/* Agent statuses */}
      <div className="flex items-center gap-0 flex-1">
        {PROVIDERS.map((p, i) => {
          const h = health[p.id] ?? { status: "CHECKING" as AgentStatus, latency: null, configured: false };
          const st = STATUS_STYLE[h.status];
          return (
            <div key={p.id} className="flex items-center">
              <div className="flex items-center gap-2 px-4 py-1"
                style={{ borderRight: "1px solid rgba(34,211,238,0.07)" }}>
                <motion.div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: st.color }}
                  animate={st.pulse ? { opacity: [1, 0.3, 1], scale: [1, 1.25, 1] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                />
                <span
                  className="text-[11px] font-semibold flex-shrink-0"
                  style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(226,232,240,0.7)" }}
                >
                  {p.name.toUpperCase()}
                </span>
                <span
                  className="text-[10px] flex-shrink-0"
                  style={{ fontFamily: "var(--font-jetbrains)", color: st.color }}
                >
                  {h.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Heartbeat */}
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3"
          style={{ borderLeft: "1px solid rgba(34,211,238,0.07)" }}>
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: "#34d399" }}
            animate={{ scale: heartbeat ? [1, 1.5, 1] : 1, opacity: heartbeat ? [1, 0.5, 1] : 0.5 }}
            transition={{ duration: 0.4 }}
          />
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.5)" }}>
            HEARTBEAT
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3"
          style={{ borderLeft: "1px solid rgba(34,211,238,0.07)" }}>
          <Zap size={10} style={{ color: "#22d3ee" }} />
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#22d3ee" }}>
            {avgLatency ? `${avgLatency}ms` : "—"}
          </span>
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
            LATENCY
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({
  prov, health, index, onOpenControlRoom,
}: {
  prov: ProviderDef;
  health: AgentHealth;
  index: number;
  onOpenControlRoom: () => void;
}) {
  const id = prov.id as ProviderId;
  const st = STATUS_STYLE[health.status];
  const rgb = prov.accentRgb;

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-xl flex flex-col"
      style={{
        background: "rgba(8,14,31,0.9)",
        border: `1px solid rgba(${rgb},0.15)`,
        backdropFilter: "blur(16px)",
      }}
      whileHover={{ y: -3, borderColor: `rgba(${rgb},0.4)`, boxShadow: `0 16px 48px rgba(${rgb},0.12)` }}
    >
      {/* Gradient mesh */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 15% 15%, rgba(${rgb},0.1) 0%, transparent 55%)` }} />

      {/* Status badge top-right */}
      <div className="absolute top-3 right-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: st.bg, border: `1px solid ${st.color}35` }}>
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }}
            animate={st.pulse ? { opacity: [1, 0.3, 1] } : undefined}
            transition={{ duration: 1.6, repeat: Infinity }} />
          <span className="text-[9px] font-bold tracking-wider"
            style={{ fontFamily: "var(--font-jetbrains)", color: st.color }}>
            {health.status}
          </span>
        </div>
      </div>

      <div className="relative z-10 p-5 flex flex-col flex-1">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-4">
          <AgentAvatar provider={id} size={52} glow={health.status === "LIVE"} pulse={health.status === "LIVE"} />
          <div>
            <h3 className="text-xl font-black leading-tight"
              style={{ fontFamily: "var(--font-syne)", color: prov.accent }}>
              {prov.name}
            </h3>
            <p className="text-[11px] mt-0.5"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.45)" }}>
              {prov.provider} · {prov.modelLabel}
            </p>
          </div>
        </div>

        {/* Role description */}
        <p className="text-[13px] leading-relaxed mb-5 flex-1"
          style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.55)" }}>
          {ROLE[id]}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5 pb-4"
          style={{ borderBottom: `1px solid rgba(${rgb},0.1)` }}>
          <div>
            <div className="text-[9px] tracking-widest uppercase mb-1"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
              Context
            </div>
            <div className="text-[12px] font-semibold"
              style={{ fontFamily: "var(--font-jetbrains)", color: `rgba(${rgb},0.8)` }}>
              {prov.contextWindow}
            </div>
          </div>
          <div>
            <div className="text-[9px] tracking-widest uppercase mb-1"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
              Latency
            </div>
            <div className="text-[12px] font-semibold"
              style={{ fontFamily: "var(--font-jetbrains)", color: `rgba(${rgb},0.8)` }}>
              {health.latency ? `${health.latency}ms` : "—"}
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-[9px] tracking-widest uppercase mb-1"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
              Model
            </div>
            <div className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                fontFamily: "var(--font-jetbrains)",
                background: `rgba(${rgb},0.1)`,
                color: `rgba(${rgb},0.7)`,
                border: `1px solid rgba(${rgb},0.15)`,
              }}>
              {prov.modelLabel}
            </div>
          </div>
        </div>

        {/* OPEN CONTROL ROOM button */}
        {health.status === "LIVE" || health.status === "DEGRADED" ? (
          <motion.button
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenControlRoom}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl"
            style={{
              background: `rgba(${rgb},0.1)`,
              border: `1px solid rgba(${rgb},0.25)`,
              cursor: "pointer",
            }}
          >
            <span className="text-[12px] font-bold tracking-wide uppercase"
              style={{ fontFamily: "var(--font-syne)", color: prov.accent }}>
              Open Control Room
            </span>
            <ChevronRight size={15} style={{ color: prov.accent }} />
          </motion.button>
        ) : (
          <div className="px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[11px]"
              style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>
              {!health.configured
                ? `Set ${prov.envKey} in .env.local`
                : id === "hermes"
                ? "Run: hermes serve --port 8080 on VPS"
                : "Unreachable — check API key"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── SELF layer tiles ──────────────────────────────────────────────────────────
function SelfTile({
  icon: Icon, label, description, color, delay, onClick,
}: {
  icon: React.ElementType; label: string; description: string;
  color: string; delay: number; onClick: () => void;
}) {
  const rgb = color === "#34d399" ? "52,211,153"
    : color === "#a78bfa" ? "167,139,250"
    : "34,211,238";
  return (
    <motion.button
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl text-left w-full"
      style={{
        background: `rgba(${rgb},0.05)`,
        border: `1px solid rgba(${rgb},0.14)`,
        cursor: "pointer",
      }}
      whileHover={{ y: -2, borderColor: `rgba(${rgb},0.35)`, background: `rgba(${rgb},0.09)` }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-[13px] font-bold" style={{ fontFamily: "var(--font-syne)", color }}>
          {label}
        </div>
        <div className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.5)" }}>
          {description}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: `rgba(${rgb},0.4)`, marginLeft: "auto" }} />
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface MissionControlProps {
  onOpenAgent: (id: ProviderId) => void;
  onNavigate: (view: string) => void;
}

export default function MissionControl({ onOpenAgent, onNavigate }: MissionControlProps) {
  const [health, setHealth] = useState<Record<string, AgentHealth>>({
    claude: { status: "CHECKING", latency: null, configured: false },
    openai: { status: "CHECKING", latency: null, configured: false },
    gemini: { status: "CHECKING", latency: null, configured: false },
    hermes: { status: "CHECKING", latency: null, configured: false },
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
          latency: p.latency,
          status: !p.configured
            ? "OFFLINE"
            : p.reachable === null
            ? "CHECKING"
            : p.reachable
            ? "LIVE"
            : "OFFLINE",
        };
      }
      setHealth(next);
    } catch { /* network */ }
  };

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 30_000);
    return () => clearInterval(t);
  }, []);

  const liveCount = Object.values(health).filter(h => h.status === "LIVE").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status ribbon */}
      <StatusRibbon health={health} />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* Hero headline */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight"
                style={{ fontFamily: "var(--font-syne)", color: "#e2e8f0", letterSpacing: "-0.02em" }}>
                Mission Control
              </h1>
              <p className="text-[13px] mt-1"
                style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.5)" }}>
                Status of every agent, every memory, every signal
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: liveCount > 0 ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)", border: `1px solid ${liveCount > 0 ? "rgba(52,211,153,0.25)" : "rgba(251,113,133,0.25)"}` }}>
              <motion.div className="w-2 h-2 rounded-full"
                style={{ background: liveCount > 0 ? "#34d399" : "#fb7185" }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <span className="text-[11px] font-bold"
                style={{ fontFamily: "var(--font-jetbrains)", color: liveCount > 0 ? "#34d399" : "#fb7185" }}>
                {liveCount}/{PROVIDERS.length} LIVE
              </span>
            </div>
          </div>
        </motion.div>

        {/* Agent grid 2×2 */}
        <div className="grid grid-cols-2 gap-4">
          {PROVIDERS.map((p, i) => (
            <AgentCard
              key={p.id}
              prov={p}
              health={health[p.id] ?? { status: "CHECKING", latency: null, configured: false }}
              index={i}
              onOpenControlRoom={() => onOpenAgent(p.id as ProviderId)}
            />
          ))}
        </div>

        {/* SELF layer */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-4 rounded-full" style={{ background: "#a78bfa" }} />
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-syne)", color: "#a78bfa" }}>
              Self Layer — Grounded in you
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(167,139,250,0.08)" }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SelfTile icon={Target}   label="Goals 🎯"   description="Track what matters" color="#34d399" delay={0.45} onClick={() => onNavigate("goals")} />
            <SelfTile icon={BookOpen} label="Journal 📓" description="Daily entries"       color="#a78bfa" delay={0.5}  onClick={() => onNavigate("journal")} />
            <SelfTile icon={Database} label="Memory 🧠"  description="Every chat logged"   color="#22d3ee" delay={0.55} onClick={() => onNavigate("memory")} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
