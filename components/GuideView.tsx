"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, CheckCircle, Circle, Save, Zap, Mic, Brain, Target, MessageSquare, Settings, PartyPopper } from "lucide-react";
import { emitNexusEvent } from "@/lib/nexusEvents";

interface Step { id: string; emoji: string; title: string; done: boolean; }
interface Section { id: string; emoji: string; title: string; color: string; colorRgb: string; steps: Step[]; content: React.ReactNode; }

const CHECK_KEY = "nexus-guide-checks";

function loadChecks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) ?? "{}"); } catch { return {}; }
}

function saveChecks(c: Record<string, boolean>) {
  localStorage.setItem(CHECK_KEY, JSON.stringify(c));
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-3">
      <pre className="rounded-xl p-4 text-[12px] leading-relaxed overflow-x-auto"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(34,211,238,0.15)", fontFamily: "var(--font-jetbrains)", color: "#67e8f9" }}>
        {children}
      </pre>
      <button onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee", cursor: "pointer" }}>
        {copied ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl my-3"
      style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)" }}>
      <span className="text-[15px] flex-shrink-0">💡</span>
      <p className="text-[13px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.7)" }}>{children}</p>
    </div>
  );
}

interface GuideViewProps { onFinish?: () => void; }

export default function GuideView({ onFinish }: GuideViewProps = {}) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState("start");
  const [savedToObsidian, setSavedToObsidian] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const prevPctRef = useRef(0);

  useEffect(() => { setChecks(loadChecks()); }, []);

  const toggle = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveChecks(next);
  };

  const sections: Section[] = [
    {
      id: "start", emoji: "🚀", title: "Qué es NEXUS OS", color: "#22d3ee", colorRgb: "34,211,238",
      steps: [
        { id: "s1", emoji: "✅", title: "Entiendo qué es NEXUS OS", done: checks["s1"] },
        { id: "s2", emoji: "✅", title: "Tengo el dashboard abierto", done: checks["s2"] },
      ],
      content: (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.8)" }}>
            NEXUS OS es tu <strong style={{ color: "#22d3ee" }}>centro de comando de IA personal</strong> — un dashboard que vive en tu computador y te permite hablar con Claude, ChatGPT y Gemini desde un solo lugar.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "💬", label: "Chat con 4 agentes de IA", color: "#a78bfa" },
              { icon: "🎤", label: "Habla con voz en lugar de escribir", color: "#34d399" },
              { icon: "🧠", label: "Todo se guarda en Obsidian", color: "#60a5fa" },
              { icon: "🎯", label: "Trackea metas y escribe tu diario", color: "#fbbf24" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: `rgba(${item.color === "#a78bfa" ? "167,139,250" : item.color === "#34d399" ? "52,211,153" : item.color === "#60a5fa" ? "96,165,250" : "251,191,36"},0.06)`, border: `1px solid rgba(${item.color === "#a78bfa" ? "167,139,250" : item.color === "#34d399" ? "52,211,153" : item.color === "#60a5fa" ? "96,165,250" : "251,191,36"},0.15)` }}>
                <span className="text-[18px]">{item.icon}</span>
                <p className="text-[12px] leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.7)" }}>{item.label}</p>
              </div>
            ))}
          </div>
          <Tip>Todo funciona en tu laptop. Sin cuentas extras. Sin suscripciones. Solo abre http://localhost:3000 y listo.</Tip>
        </div>
      ),
    },
    {
      id: "chat", emoji: "💬", title: "Chatear con los agentes", color: "#a78bfa", colorRgb: "167,139,250",
      steps: [
        { id: "c1", emoji: "✅", title: "Abrí el chat de Claude", done: checks["c1"] },
        { id: "c2", emoji: "✅", title: "Envié mi primer mensaje", done: checks["c2"] },
        { id: "c3", emoji: "✅", title: "Usé un starter prompt", done: checks["c3"] },
      ],
      content: (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.8)" }}>
            En el sidebar izquierdo verás los 4 agentes. Haz clic en cualquiera para abrir su sala de control privada.
          </p>
          <div className="space-y-2">
            {[
              { color: "#a78bfa", name: "Claude", desc: "Razonamiento profundo, código, análisis estratégico" },
              { color: "#34d399", name: "ChatGPT", desc: "Versátil para todo — emails, ideas, resúmenes" },
              { color: "#60a5fa", name: "Gemini", desc: "Multimodal, búsqueda en tiempo real, velocidad" },
              { color: "#fbbf24", name: "Hermes", desc: "Agente en VPS — tareas privadas y locales" },
            ].map(a => (
              <div key={a.name} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                <div>
                  <span className="text-[13px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: a.color }}>{a.name}</span>
                  <span className="text-[12px] ml-2" style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.6)" }}>{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <Tip>Cada chat se guarda automáticamente en tu vault de Obsidian después de cada respuesta. Abre Obsidian → Agentic OS → Chats.</Tip>
        </div>
      ),
    },
    {
      id: "voice", emoji: "🎤", title: "Hablar con voz", color: "#34d399", colorRgb: "52,211,153",
      steps: [
        { id: "v1", emoji: "✅", title: "Hice clic en el ícono de micrófono", done: checks["v1"] },
        { id: "v2", emoji: "✅", title: "Vi mis palabras aparecer en tiempo real", done: checks["v2"] },
      ],
      content: (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.8)" }}>
            Todos los chats, Goals y Journal tienen un botón de micrófono. <strong style={{ color: "#34d399" }}>Sin API keys</strong> — usa el reconocimiento de voz del browser.
          </p>
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)" }}>
            <p className="text-[12px] font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains)", color: "#34d399" }}>Cómo usarlo</p>
            {["1. Abre cualquier chat (Claude, ChatGPT, Gemini)", "2. Haz clic en el ícono del micrófono 🎤", "3. Habla — verás el texto aparecer en tiempo real", "4. Cuando termines, el texto queda listo para enviar", "5. Presiona Enter o haz clic en Enviar"].map(s => (
              <p key={s} className="text-[13px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.7)" }}>{s}</p>
            ))}
          </div>
          <Tip>Funciona mejor en Chrome o Safari. El micrófono se pone rojo pulsante cuando está escuchando.</Tip>
        </div>
      ),
    },
    {
      id: "obsidian", emoji: "🧠", title: "Obsidian — tu memoria", color: "#60a5fa", colorRgb: "96,165,250",
      steps: [
        { id: "o1", emoji: "✅", title: "Encontré la carpeta Agentic OS en mi vault", done: checks["o1"] },
        { id: "o2", emoji: "✅", title: "Vi un chat guardado en Chats/", done: checks["o2"] },
        { id: "o3", emoji: "✅", title: "Vi las metas en Goals/goals.md", done: checks["o3"] },
      ],
      content: (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.8)" }}>
            NEXUS OS guarda todo en tu vault de Obsidian automáticamente. Abre Obsidian y busca la carpeta <code style={{ color: "#60a5fa", background: "rgba(96,165,250,0.1)", padding: "1px 6px", borderRadius: 4 }}>Agentic OS</code>.
          </p>
          <div className="rounded-xl p-4" style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)" }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-jetbrains)", color: "#60a5fa" }}>Estructura de archivos</p>
            <div className="space-y-1.5" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>
              {[
                { indent: 0, text: "📁 Agentic OS/", color: "#60a5fa" },
                { indent: 1, text: "📁 Chats/", color: "rgba(148,163,184,0.7)" },
                { indent: 2, text: "📄 2026-05-30.md  ← chats del día", color: "rgba(148,163,184,0.5)" },
                { indent: 1, text: "📁 Goals/", color: "rgba(148,163,184,0.7)" },
                { indent: 2, text: "📄 goals.md  ← todas tus metas", color: "rgba(148,163,184,0.5)" },
                { indent: 1, text: "📁 Journal/", color: "rgba(148,163,184,0.7)" },
                { indent: 2, text: "📄 2026-05-30.md  ← diario del día", color: "rgba(148,163,184,0.5)" },
              ].map((line, i) => (
                <div key={i} className="flex" style={{ paddingLeft: line.indent * 18 }}>
                  <span style={{ color: line.color }}>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
          <Tip>Los chats se guardan solos. Las metas se guardan solas. El journal lo guardas tú con el botón.</Tip>
        </div>
      ),
    },
    {
      id: "goals", emoji: "🎯", title: "Goals y Journal", color: "#fbbf24", colorRgb: "251,191,36",
      steps: [
        { id: "g1", emoji: "✅", title: "Agregué mi primera meta", done: checks["g1"] },
        { id: "g2", emoji: "✅", title: "Marqué una meta como completada", done: checks["g2"] },
        { id: "g3", emoji: "✅", title: "Escribí una entrada en el Journal", done: checks["g3"] },
      ],
      content: (
        <div className="space-y-4">
          <p className="text-[14px] leading-relaxed" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.8)" }}>
            En el sidebar encuentra <strong style={{ color: "#fbbf24" }}>Goals 🎯</strong> y <strong style={{ color: "#a78bfa" }}>Journal 📓</strong>. Ambos soportan voz y se sincronizan con Obsidian.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)" }}>
              <p className="text-[12px] font-bold mb-2" style={{ fontFamily: "var(--font-syne)", color: "#fbbf24" }}>🎯 Goals</p>
              <ul className="space-y-1">
                {["Escribe tu meta", "Presiona Enter", "Haz clic en el círculo para completar", "Se guarda solo en Obsidian"].map(s => (
                  <li key={s} className="text-[12px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.6)" }}>· {s}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <p className="text-[12px] font-bold mb-2" style={{ fontFamily: "var(--font-syne)", color: "#a78bfa" }}>📓 Journal</p>
              <ul className="space-y-1">
                {["Escribe o habla tu entrada", "Haz clic en Guardar entrada", "Se crea un archivo por día", "Puedes ver entradas anteriores"].map(s => (
                  <li key={s} className="text-[12px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.6)" }}>· {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tips", emoji: "✨", title: "Tips y atajos", color: "#fb7185", colorRgb: "251,113,133",
      steps: [
        { id: "t1", emoji: "✅", title: "Usé ⌘K para navegar rápido", done: checks["t1"] },
        { id: "t2", emoji: "✅", title: "Copié una respuesta del agente", done: checks["t2"] },
      ],
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { key: "⌘K", desc: "Abrir la paleta de comandos — navega sin mouse" },
              { key: "Enter", desc: "Enviar mensaje en el chat" },
              { key: "Shift+Enter", desc: "Nueva línea sin enviar" },
              { key: "🎤 clic", desc: "Activar micrófono — hablar en lugar de escribir" },
              { key: "⏹ clic", desc: "Detener la respuesta del agente" },
              { key: "↩ clic", desc: "Limpiar el chat y empezar de cero" },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 p-2.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <kbd className="px-2 py-1 rounded-md text-[11px] font-semibold flex-shrink-0"
                  style={{ background: "rgba(251,113,133,0.12)", border: "1px solid rgba(251,113,133,0.25)", fontFamily: "var(--font-jetbrains)", color: "#fb7185" }}>
                  {item.key}
                </kbd>
                <span className="text-[13px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.65)" }}>{item.desc}</span>
              </div>
            ))}
          </div>
          <Tip>El Activity Feed de la derecha muestra eventos en tiempo real. Cada vez que un agente responde, aparece ahí.</Tip>
        </div>
      ),
    },
  ];

  const active = sections.find(s => s.id === activeSection) ?? sections[0];
  const totalSteps = sections.flatMap(s => s.steps).length;
  const doneSteps = sections.flatMap(s => s.steps).filter(s => checks[s.id]).length;
  const pct = Math.round((doneSteps / totalSteps) * 100);

  // When the guide reaches 100%, celebrate and auto-collapse back to the dashboard
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      // First render after loading saved checks — set baseline, don't celebrate
      initializedRef.current = true;
      prevPctRef.current = pct;
      return;
    }
    if (pct === 100 && prevPctRef.current < 100) {
      setCelebrating(true);
      emitNexusEvent({ type: "success", agent: "GUÍA", message: "Guía completada al 100%", detail: `${totalSteps} pasos ✓` });
      const t = setTimeout(() => { setCelebrating(false); onFinish?.(); }, 3500);
      return () => clearTimeout(t);
    }
    prevPctRef.current = pct;
  }, [pct, totalSteps, onFinish]);

  const saveGuideToObsidian = async () => {
    const md = `# 📖 Guía NEXUS OS\n\`\`\`tags: nexus-os, guia, tutorial\`\`\`\n\n## Tu progreso: ${pct}% completado\n\n${sections.map(s => `### ${s.emoji} ${s.title}\n${s.steps.map(st => `- [${checks[st.id] ? "x" : " "}] ${st.title}`).join("\n")}`).join("\n\n")}\n\n---\n*Generado por NEXUS OS*\n`;
    try {
      await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "journal", entry: md, voiceInput: false }),
      });
      setSavedToObsidian(true);
      setTimeout(() => setSavedToObsidian(false), 2500);
    } catch { /* silent */ }
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Overlay de celebración al completar la guía */}
      <AnimatePresence>
        {celebrating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5"
            style={{ background: "rgba(2,4,9,0.92)", backdropFilter: "blur(12px)" }}>
            <motion.div initial={{ scale: 0.5, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)", boxShadow: "0 0 60px rgba(52,211,153,0.3)" }}>
              <PartyPopper size={44} style={{ color: "#34d399" }} />
            </motion.div>
            <div className="text-center">
              <motion.h2 initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                className="text-3xl font-black mb-2" style={{ fontFamily: "var(--font-syne)", color: "#e2e8f0" }}>
                ¡Guía completada! 🎉
              </motion.h2>
              <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                className="text-[14px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(148,163,184,0.7)" }}>
                Ya dominas NEXUS OS, Liliana. Volviendo al Command Center…
              </motion.p>
            </div>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              onClick={() => { setCelebrating(false); onFinish?.(); }}
              className="px-5 py-2 rounded-xl text-[13px] font-semibold"
              style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", color: "#22d3ee", fontFamily: "var(--font-syne)", cursor: "pointer" }}>
              Ir ahora →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar de secciones */}
      <div className="flex flex-col flex-shrink-0 overflow-y-auto p-4 gap-1"
        style={{ width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,10,24,0.6)" }}>
        <div className="mb-3 px-2">
          <p className="text-[10px] tracking-widest uppercase mb-2" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.4)" }}>Guía NEXUS OS</p>
          {/* Progress */}
          <div className="p-2.5 rounded-xl mb-2" style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.12)" }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.5)" }}>Progreso</span>
              <span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-jetbrains)", color: "#22d3ee" }}>{pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(34,211,238,0.1)" }}>
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#22d3ee,#a78bfa)" }}
                animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
            </div>
            <p className="text-[9px] mt-1" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.35)" }}>{doneSteps}/{totalSteps} pasos</p>
          </div>
        </div>

        {sections.map(s => {
          const sectionDone = s.steps.filter(st => checks[st.id]).length;
          const isActive = activeSection === s.id;
          return (
            <motion.button key={s.id} onClick={() => setActiveSection(s.id)} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full"
              style={{ background: isActive ? `rgba(34,211,238,0.08)` : "transparent", border: isActive ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent", cursor: "pointer" }}>
              <span className="text-[15px]">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ fontFamily: "var(--font-outfit)", color: isActive ? "#e2e8f0" : "rgba(148,163,184,0.6)" }}>{s.title}</p>
                <p className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.3)" }}>{sectionDone}/{s.steps.length} ✓</p>
              </div>
            </motion.button>
          );
        })}

        <div className="mt-auto pt-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveGuideToObsidian}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl"
            style={{ background: savedToObsidian ? "rgba(52,211,153,0.12)" : "rgba(34,211,238,0.06)", border: savedToObsidian ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(34,211,238,0.15)", cursor: "pointer" }}>
            <Save size={12} style={{ color: savedToObsidian ? "#34d399" : "#22d3ee" }} />
            <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: savedToObsidian ? "#34d399" : "#22d3ee" }}>
              {savedToObsidian ? "¡Guardado!" : "Guardar en Obsidian"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {/* Header de sección */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 rounded-full" style={{ background: active.color }} />
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-syne)", color: "#e2e8f0" }}>
                  {active.emoji} {active.title}
                </h1>
              </div>
            </div>

            {/* Contenido */}
            <div className="mb-6">{active.content}</div>

            {/* Checklist de pasos */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[10px] tracking-widest uppercase mb-3" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(148,163,184,0.4)" }}>Checklist</p>
              <div className="space-y-2">
                {active.steps.map(step => (
                  <motion.button key={step.id} onClick={() => toggle(step.id)} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg"
                    style={{ background: checks[step.id] ? "rgba(52,211,153,0.06)" : "transparent", cursor: "pointer", border: "none" }}>
                    {checks[step.id]
                      ? <CheckCircle size={16} style={{ color: "#34d399", flexShrink: 0 }} />
                      : <Circle size={16} style={{ color: "rgba(148,163,184,0.3)", flexShrink: 0 }} />}
                    <span className="text-[13px]"
                      style={{ fontFamily: "var(--font-outfit)", color: checks[step.id] ? "rgba(148,163,184,0.5)" : "rgba(226,232,240,0.8)", textDecoration: checks[step.id] ? "line-through" : "none" }}>
                      {step.title}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Navegación */}
            <div className="flex justify-between mt-6">
              {sections.findIndex(s => s.id === activeSection) > 0 && (
                <motion.button whileHover={{ x: -2 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) - 1].id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "rgba(148,163,184,0.6)", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
                  ← Anterior
                </motion.button>
              )}
              <div className="flex-1" />
              {sections.findIndex(s => s.id === activeSection) < sections.length - 1 && (
                <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveSection(sections[sections.findIndex(s => s.id === activeSection) + 1].id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", cursor: "pointer", color: "#22d3ee", fontFamily: "var(--font-outfit)", fontSize: 13 }}>
                  Siguiente <ChevronRight size={14} />
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
