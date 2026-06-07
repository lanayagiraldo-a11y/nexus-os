"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Mic, PenLine, Send, Sparkles, Target, Clock3, BriefcaseBusiness } from "lucide-react";
import { emitNexusEvent } from "@/lib/nexusEvents";
import { useVoiceInput } from "@/hooks/useVoiceInput";

type TodayTask = {
  id: string;
  title: string;
  section: string;
  checked: boolean;
  inProgress: boolean;
  priority: "high" | "medium" | "normal" | "waiting";
};

type DailySummary = {
  totalTasks: number;
  openTasks: number;
  doneTasks: number;
  high: TodayTask[];
  urgentProjects: TodayTask[];
  projectCompany: TodayTask[];
  projectCompanyInProgress: TodayTask[];
  projectCompanyDone: TodayTask[];
  laCarolina: TodayTask[];
  laCarolinaInProgress: TodayTask[];
  laCarolinaDone: TodayTask[];
  waiting: TodayTask[];
  suggested: TodayTask[];
};

type DailyPayload = {
  content?: string;
  today?: string;
  file?: string;
  summary?: DailySummary;
};

const emptySummary: DailySummary = {
  totalTasks: 0,
  openTasks: 0,
  doneTasks: 0,
  high: [],
  urgentProjects: [],
  projectCompany: [],
  projectCompanyInProgress: [],
  projectCompanyDone: [],
  laCarolina: [],
  laCarolinaInProgress: [],
  laCarolinaDone: [],
  waiting: [],
  suggested: [],
};

const fallbackProjectCompany: TodayTask[] = [
  { id: "urgent-ruben", title: "Enviar a Rubén la versión ajustada del simulador/simulacro Transmetro", section: "La Carolina", checked: false, inProgress: false, priority: "high" },
  { id: "urgent-edith", title: "Mandar mensaje a Edith por DC Capital + Metrocaribe", section: "La Carolina", checked: false, inProgress: false, priority: "high" },
  { id: "urgent-sv", title: "Avanzar propuesta Emerson o dashboard sociedad El Salvador", section: "Fondo SV", checked: false, inProgress: false, priority: "medium" },
  { id: "urgent-dar", title: "Revisar pendientes Dar Ibrahim: becas, PayPal, documentos y protocolo", section: "Dar Ibrahim", checked: false, inProgress: false, priority: "medium" },
  { id: "urgent-buzzi", title: "Revisar pendientes Buzzi / marketing que desbloqueen campañas o entregables", section: "Buzzi", checked: false, inProgress: false, priority: "medium" },
  { id: "urgent-isa", title: "Avanzar Marca Isa García / traducciones islámicas si hay documentos pendientes", section: "Marca Isa", checked: false, inProgress: false, priority: "normal" },
];

const toneStyles: Record<TodayTask["priority"], { color: string; rgb: string; label: string }> = {
  high: { color: "#B91C1C", rgb: "185,28,28", label: "Alta" },
  medium: { color: "#4C1D95", rgb: "76,29,149", label: "Media" }, 
  normal: { color: "#00A676", rgb: "138,154,85", label: "Normal" },
  waiting: { color: "#5F8C94", rgb: "95,140,148", label: "Esperando" },
};

function SectionCard({ title, subtitle, icon: Icon, accent, children, defaultOpen = true }: { title: string; subtitle: string; icon: React.ElementType; accent: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const rgb = accent === "#EF4444" ? "196,98,58" : accent === "#5F8C94" ? "95,140,148" : accent === "#00A676" ? "138,154,85" : accent === "#6D28D9" ? "226,178,79" : "209,132,73";
  return (
    <motion.section initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="rounded-2xl overflow-hidden" style={{ background: "rgba(247,239,226,0.86)", border: `1px solid rgba(${rgb},0.16)`, backdropFilter: "blur(16px)" }}>
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-start gap-3 p-4 text-left" style={{ borderBottom: open ? `1px solid rgba(${rgb},0.1)` : "1px solid transparent", background: `radial-gradient(ellipse at top left, rgba(${rgb},0.08), transparent 58%)`, cursor: "pointer" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)` }}>
          <Icon size={17} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-black leading-tight" style={{ fontFamily: "var(--font-syne)", color: accent }}>{title}</h2>
          <p className="text-sm mt-1 leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(7,24,46,0.76)" }}>{subtitle}</p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-1 rounded-full p-1" style={{ background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.13)` }}>
          <ChevronDown size={15} style={{ color: accent }} />
        </motion.div>
      </button>
      {open && <motion.div initial={false} animate={{ opacity: 1, height: "auto" }} className="p-3">{children}</motion.div>}
    </motion.section>
  );
}

function CollapsibleGroup({ title, subtitle, count, children, defaultOpen = false, accent = "#5F8C94" }: { title: string; subtitle?: string; count: number; children: React.ReactNode; defaultOpen?: boolean; accent?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const rgb = accent === "#EF4444" ? "196,98,58" : accent === "#00A676" ? "138,154,85" : accent === "#6D28D9" ? "226,178,79" : accent === "#F72585" ? "209,132,73" : "95,140,148";
  return (
    <div className="rounded-xl mb-2 last:mb-0 overflow-hidden" style={{ background: `rgba(${rgb},0.04)`, border: `1px solid rgba(${rgb},0.12)` }}>
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left" style={{ cursor: "pointer" }}>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="rounded-full p-1" style={{ background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.12)` }}>
          <ChevronDown size={13} style={{ color: accent }} />
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="text-base sm:text-[17px] font-black leading-tight" style={{ fontFamily: "var(--font-syne)", color: "#07182E" }}>{title}</div>
          {subtitle && <div className="text-[13px] truncate mt-0.5" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.70)" }}>{subtitle}</div>}
        </div>
        <span className="text-[12px] px-2 py-1 rounded-full font-black" style={{ fontFamily: "var(--font-jetbrains)", color: accent, background: `rgba(${rgb},0.10)`, border: `1px solid rgba(${rgb},0.22)` }}>{count}</span>
      </button>
      {open && <motion.div initial={false} animate={{ opacity: 1, height: "auto" }} className="px-2.5 pb-2.5">{children}</motion.div>}
    </div>
  );
}

function classifyProject(item: TodayTask): string {
  const text = `${item.section} ${item.title}`.toLowerCase();
  if (/carolina|rubén|edith|transmetro|portal|gustavo|fabio|buses|foton|fotón|mtc|metrocaribe|marilé/.test(text)) return "La Carolina";
  if (/dar ibrahim|beca|scholarship|paypal|migraci|aron|granada/.test(text)) return "Dar Ibrahim / IERA";
  if (/iera|cartas de amor|corán|islam|traducci/.test(text)) return "IERA / Traducciones";
  if (/buzzi|marketing|campaña|mailchimp|contenido/.test(text)) return "Buzzi / Marketing";
  if (/el salvador|emerson|fondo|sociedad|altum|sharia|sharía|guazapa/.test(text)) return "Fondo El Salvador";
  if (/isa|marca isa|ismael/.test(text)) return "Marca Isa García";
  if (/patrimonio|aroca|ivón|ivon|fideicomiso|familia/.test(text)) return "Patrimonio familiar";
  return item.section || "Otros proyectos";
}

function groupTasksByProject(items: TodayTask[]) {
  const map = new Map<string, TodayTask[]>();
  items.forEach(item => {
    const key = classifyProject(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  });
  return Array.from(map.entries()).map(([title, tasks]) => ({ title, tasks }));
}

function uniqueTasks(items: TodayTask[]) {
  return items.filter((item, index, array) => array.findIndex(other => other.title === item.title) === index);
}

function GroupedTaskList({ groups, emptyText, accent = "#5F8C94" }: { groups: Array<{ title: string; tasks: TodayTask[] }>; emptyText: string; accent?: string }) {
  if (!groups.length) return <EmptyState text={emptyText} />;
  return (
    <div>
      {groups.map((group, index) => (
        <CollapsibleGroup key={group.title} title={group.title} subtitle="Pendientes detectados en la Daily Note" count={group.tasks.length} defaultOpen={index === 0} accent={accent}>
          {group.tasks.map(item => <TaskRow key={`${group.title}-${item.id}`} item={item} />)}
        </CollapsibleGroup>
      ))}
    </div>
  );
}

function TaskRow({ item }: { item: TodayTask }) {
  const s = toneStyles[item.priority];
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl mb-2 last:mb-0" style={{ background: `rgba(${s.rgb},0.045)`, border: `1px solid rgba(${s.rgb},0.1)` }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(${s.rgb},0.12)`, border: `1px solid rgba(${s.rgb},0.18)` }}>
        <CheckCircle2 size={11} style={{ color: s.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] sm:text-base leading-snug font-semibold" style={{ fontFamily: "var(--font-outfit)", color: "#111827" }}>{item.title}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {item.inProgress && <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ fontFamily: "var(--font-jetbrains)", color: "#4C1D95", background: "rgba(76,29,149,0.10)", border: "1px solid rgba(76,29,149,0.20)" }}>EN PROCESO</span>}
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ fontFamily: "var(--font-jetbrains)", color: s.color, background: `rgba(${s.rgb},0.10)`, border: `1px solid rgba(${s.rgb},0.18)` }}>{s.label}</span>
          <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.68)" }}>{item.section}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl p-4 text-[12px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.65)", background: "rgba(7,24,46,0.025)", border: "1px dashed rgba(31,41,55,0.15)" }}>{text}</div>;
}

export default function TodayView() {
  const [capture, setCapture] = useState("");
  const [dailyContent, setDailyContent] = useState("");
  const [summary, setSummary] = useState<DailySummary>(emptySummary);
  const [dailyFile, setDailyFile] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const todayLabel = useMemo(() => new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }), []);

  const { state: voiceState, start: startVoice, isSupported } = useVoiceInput({
    lang: "es-CO",
    onTranscript: (text, isFinal) => {
      if (isFinal) setCapture(prev => prev ? `${prev} ${text}` : text);
    },
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/obsidian?type=daily-summary", { cache: "no-store" })
      .then(r => r.json())
      .then((d: DailyPayload) => {
        setDailyContent(d.content ?? "");
        setSummary({ ...emptySummary, ...(d.summary ?? {}) });
        setDailyFile(d.file ?? "");
      })
      .catch(() => {
        setDailyContent("");
        setSummary(emptySummary);
      })
      .finally(() => setLoading(false));
  }, [saved]);

  const projectCompanyItems = summary.projectCompany.length ? summary.projectCompany : fallbackProjectCompany;
  const urgentProjectItems = summary.urgentProjects.length ? summary.urgentProjects : projectCompanyItems.slice(0, 10);
  const suggested = uniqueTasks([
    ...urgentProjectItems,
    ...projectCompanyItems,
    ...summary.waiting,
    ...fallbackProjectCompany,
  ]).slice(0, 12);
  const focusGroups = groupTasksByProject(suggested);
  const pendingGroups = groupTasksByProject(uniqueTasks([...projectCompanyItems, ...urgentProjectItems, ...fallbackProjectCompany]).slice(0, 18));

  const saveCapture = async () => {
    const text = capture.trim();
    if (!text) return;
    setSaving(true);
    try {
      const r = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily-capture", entry: text }),
      });
      if (!r.ok) throw new Error("No se pudo guardar");
      setCapture("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      emitNexusEvent({ type: "success", agent: "HOY", message: "Captura guardada en Daily Note", detail: text.slice(0, 48) });
    } catch (err) {
      emitNexusEvent({ type: "warning", agent: "HOY", message: "No se pudo guardar la captura", detail: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain">
      <div className="p-4 sm:p-5 lg:p-6 pb-24 md:pb-6 flex flex-col gap-5">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} style={{ color: "#4C1D95" }} />
              <span className="text-[12px] font-black tracking-[0.18em] uppercase" style={{ fontFamily: "var(--font-jetbrains)", color: "#4C1D95" }}>Today Command Deck</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--font-syne)", color: "#07182E", letterSpacing: "-0.02em" }}>Hoy, Liliana</h1>
            <p className="text-base mt-1 capitalize" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.74)" }}>{todayLabel} · conectado a tu Daily Note real</p>
            {dailyFile && <p className="text-[10px] mt-1 truncate max-w-[720px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.36)" }}>{dailyFile}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-[260px]">
            {[
              ["Abiertos", summary.openTasks, "#EF4444"],
              ["Hechos", summary.doneTasks, "#00A676"],
              ["Total", summary.totalTasks, "#5F8C94"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="px-3 py-2 rounded-xl text-center" style={{ background: "rgba(109,40,217,0.04)", border: "1px solid rgba(109,40,217,0.10)" }}>
                <div className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.55)" }}>{label}</div>
                <div className="text-lg font-black" style={{ fontFamily: "var(--font-syne)", color: String(color) }}>{loading ? "…" : value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="Foco recomendado" subtitle="Menús desplegables por empresa/proyecto" icon={Target} accent="#00A676">
            <GroupedTaskList groups={focusGroups} accent="#00A676" emptyText="Cuando la Daily Note tenga pendientes de empresas/proyectos, aquí aparecerán agrupados por frente." />
          </SectionCard>

          <SectionCard title="Empresas y proyectos urgentes" subtitle="Pendientes abiertos de todos los frentes, no solo La Carolina" icon={BriefcaseBusiness} accent="#EF4444">
            <div className="mb-3 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.055)", border: "1px solid rgba(239,68,68,0.12)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(239,68,68,0.78)" }}>Lectura estratégica</div>
              <p className="text-[15px] leading-relaxed font-medium" style={{ fontFamily: "var(--font-outfit)", color: "#111827" }}>
                Esta vista mezcla La Carolina con Buzzi, IERA, Dar Ibrahim, Fondo El Salvador, Marca Isa, patrimonio y otros proyectos para que veas qué pendiente desbloquea deuda, ingresos, permisos, entregas o decisiones.
              </p>
            </div>
            <GroupedTaskList groups={pendingGroups} accent="#EF4444" emptyText="No hay pendientes de empresas/proyectos detectados automáticamente." />
          </SectionCard>

          <SectionCard title="Estado transversal" subtitle="En proceso y cerrados recientes de todos los frentes" icon={CheckCircle2} accent="#00A676">
            {summary.projectCompanyInProgress.length > 0 && (
              <div className="mb-3">
                <div className="text-[12px] uppercase tracking-widest mb-2 font-black" style={{ fontFamily: "var(--font-jetbrains)", color: "#4C1D95" }}>En proceso</div>
                {summary.projectCompanyInProgress.map((item: TodayTask) => <TaskRow key={`progress-${item.id}`} item={item} />)}
              </div>
            )}
            {summary.projectCompanyDone.length > 0 ? (
              <div>
                <div className="text-[12px] uppercase tracking-widest mb-2 font-black" style={{ fontFamily: "var(--font-jetbrains)", color: "#047857" }}>Cerrados hoy / recientes</div>
                {summary.projectCompanyDone.map((item: TodayTask) => <TaskRow key={`done-${item.id}`} item={item} />)}
              </div>
            ) : <EmptyState text="Cuando marques tareas de cualquier empresa o proyecto como hechas, aparecerán aquí para que veas avance transversal." />}
          </SectionCard>

          <SectionCard title="Bloqueadores / esperando respuesta" subtitle="Personas o respuestas que pueden frenar proyectos" icon={Clock3} accent="#5F8C94">
            {summary.waiting.length ? summary.waiting.map(item => <TaskRow key={item.id} item={item} />) : <EmptyState text="Sin bloqueadores detectados automáticamente en la Daily Note." />}
          </SectionCard>

          <SectionCard title="Captura rápida" subtitle="Dicta o escribe en bruto; se guarda en la Daily Note" icon={PenLine} accent="#F72585">
            <textarea value={capture} onChange={e => setCapture(e.target.value)} placeholder="Ej: Hoy necesito enfocarme en La Carolina, Dar Ibrahim, Buzzi y Fondo El Salvador..." className="w-full min-h-[118px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(7,24,46,0.035)", border: "1px solid rgba(247,37,133,0.14)" }} />
            <div className="flex items-center justify-between mt-3 gap-2">
              <button onClick={startVoice} disabled={!isSupported || voiceState === "listening"} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ cursor: isSupported ? "pointer" : "not-allowed", background: voiceState === "listening" ? "rgba(239,68,68,0.12)" : "rgba(7,24,46,0.04)", border: "1px solid rgba(7,24,46,0.08)", color: voiceState === "listening" ? "#B91C1C" : "#111827" }}>
                <Mic size={15} />
                <span className="text-[13px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{voiceState === "listening" ? "Escuchando…" : "Dictar"}</span>
              </button>
              <button onClick={saveCapture} disabled={saving || !capture.trim()} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ cursor: capture.trim() ? "pointer" : "not-allowed", background: "rgba(247,37,133,0.12)", border: "1px solid rgba(247,37,133,0.24)", color: "#F72585" }}>
                <Send size={15} />
                <span className="text-[13px] font-black" style={{ fontFamily: "var(--font-syne)" }}>{saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}</span>
              </button>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Daily Note" subtitle="Vista previa viva desde Obsidian" icon={ClipboardList} accent="#4C1D95">
        <div className="rounded-xl p-4 max-h-72 overflow-y-auto whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.62)", border: "1px solid rgba(76,29,149,0.18)", fontFamily: "var(--font-outfit)", color: "#111827", fontSize: 15, lineHeight: 1.75 }}>
            {dailyContent || "Aún no hay contenido cargado para la Daily Note de hoy. Usa Captura rápida para empezar."}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
