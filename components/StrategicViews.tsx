"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileText,
  Inbox,
  Megaphone,
  Network,
  RotateCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  WandSparkles,
  Workflow,
  ChevronDown,
} from "lucide-react";

type Accent = { color: string; rgb: string };

const accents: Record<string, Accent> = {
  cyan: { color: "#6D28D9", rgb: "226,178,79" },
  gold: { color: "#6D28D9", rgb: "226,178,79" },
  green: { color: "#00A676", rgb: "138,154,85" },
  purple: { color: "#F72585", rgb: "209,132,73" },
  rose: { color: "#EF4444", rgb: "196,98,58" },
  blue: { color: "#5F8C94", rgb: "95,140,148" },
};

function Shell({ eyebrow, title, subtitle, icon: Icon, accent = "cyan", children }: { eyebrow: string; title: string; subtitle: string; icon: React.ElementType; accent?: keyof typeof accents; children: React.ReactNode }) {
  const a = accents[accent];
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 flex flex-col gap-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color: a.color }} />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ fontFamily: "var(--font-jetbrains)", color: `rgba(${a.rgb},0.72)` }}>{eyebrow}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "var(--font-syne)", color: "#07182E", letterSpacing: "-0.02em" }}>{title}</h1>
            <p className="text-[13px] mt-1 max-w-3xl" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.58)" }}>{subtitle}</p>
          </div>
          <div className="px-3 py-2 rounded-xl text-right" style={{ background: `rgba(${a.rgb},0.06)`, border: `1px solid rgba(${a.rgb},0.14)` }}>
            <div className="text-[9px] uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains)", color: `rgba(${a.rgb},0.62)` }}>Modo</div>
            <div className="text-[12px] font-bold" style={{ fontFamily: "var(--font-syne)", color: a.color }}>Anti-caos</div>
          </div>
        </motion.div>
        {children}
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon: Icon, accent = "cyan", children, defaultOpen = true }: { title: string; subtitle?: string; icon: React.ElementType; accent?: keyof typeof accents; children: React.ReactNode; defaultOpen?: boolean }) {
  const a = accents[accent];
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="rounded-2xl overflow-hidden" style={{ background: "rgba(247,239,226,0.86)", border: `1px solid rgba(${a.rgb},0.15)`, backdropFilter: "blur(16px)" }}>
      <button type="button" onClick={() => setOpen(v => !v)} className="flex w-full items-start gap-3 p-4 text-left" style={{ borderBottom: open ? `1px solid rgba(${a.rgb},0.1)` : "1px solid transparent", background: `radial-gradient(ellipse at top left, rgba(${a.rgb},0.08), transparent 62%)`, cursor: "pointer" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `rgba(${a.rgb},0.12)`, border: `1px solid rgba(${a.rgb},0.22)` }}>
          <Icon size={17} style={{ color: a.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black" style={{ fontFamily: "var(--font-syne)", color: a.color }}>{title}</h2>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-outfit)", color: "rgba(7,24,46,0.58)" }}>{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="mt-1 rounded-lg p-1" style={{ background: `rgba(${a.rgb},0.08)`, color: a.color }}>
          <ChevronDown size={15} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Row({ title, meta, accent = "cyan", status }: { title: string; meta: string; accent?: keyof typeof accents; status?: string }) {
  const a = accents[accent];
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl mb-2 last:mb-0" style={{ background: `rgba(${a.rgb},0.045)`, border: `1px solid rgba(${a.rgb},0.1)` }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `rgba(${a.rgb},0.12)`, border: `1px solid rgba(${a.rgb},0.18)` }}>
        <CheckCircle2 size={11} style={{ color: a.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.88)" }}>{title}</div>
        <div className="text-[10px] mt-1" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.5)" }}>{meta}</div>
      </div>
      {status && <span className="text-[9px] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-jetbrains)", color: a.color, background: `rgba(${a.rgb},0.1)`, border: `1px solid rgba(${a.rgb},0.18)` }}>{status}</span>}
    </div>
  );
}

function Matrix({ items }: { items: { label: string; detail: string; accent: keyof typeof accents }[] }) {
  return <div className="grid grid-cols-2 gap-3">{items.map(item => {
    const a = accents[item.accent];
    return <div key={item.label} className="rounded-xl p-3" style={{ background: `rgba(${a.rgb},0.045)`, border: `1px solid rgba(${a.rgb},0.12)` }}>
      <div className="text-[12px] font-bold" style={{ fontFamily: "var(--font-syne)", color: a.color }}>{item.label}</div>
      <div className="text-[11px] mt-1 leading-snug" style={{ fontFamily: "var(--font-outfit)", color: "rgba(7,24,46,0.62)" }}>{item.detail}</div>
    </div>;
  })}</div>;
}

type InboxCategory = "La Carolina" | "IERA / Granada Media" | "Dar Ibrahim" | "Buzzi / Marketing" | "Fondo El Salvador" | "Patrimonio familiar" | "Personal / Arte" | "No sé todavía";
type InboxKind = "Tarea" | "Idea" | "Documento" | "Reunión" | "Campaña" | "Prompt" | "Referencia" | "Esperando respuesta";
type InboxAction = "Guardar en Daily Note" | "Crear pendiente" | "Mandar a proyecto" | "Mandar a Marketing" | "Archivar como referencia";
type SavedInboxItem = { id: string; text: string; category: InboxCategory; kind: InboxKind; action: InboxAction; createdAt: string; file?: string };

const inboxCategories: InboxCategory[] = ["La Carolina", "IERA / Granada Media", "Dar Ibrahim", "Buzzi / Marketing", "Fondo El Salvador", "Patrimonio familiar", "Personal / Arte", "No sé todavía"];
const inboxKinds: InboxKind[] = ["Tarea", "Idea", "Documento", "Reunión", "Campaña", "Prompt", "Referencia", "Esperando respuesta"];
const inboxActions: InboxAction[] = ["Guardar en Daily Note", "Crear pendiente", "Mandar a proyecto", "Mandar a Marketing", "Archivar como referencia"];

function inferInbox(text: string): { category: InboxCategory; kind: InboxKind; action: InboxAction; confidence: string; chips: string[] } {
  const lower = text.toLowerCase();
  let category: InboxCategory = "No sé todavía";
  if (/carolina|transmetro|metrocaribe|mtc|bus|buses|foton|fotón|portal de soledad|fabio|gustavo|edith|john|marilé|ruben|rubén/.test(lower)) category = "La Carolina";
  else if (/iera|granada|dawah|islam|musulman|cor[aá]n|traducci[oó]n|cartas de amor|ibrahim/.test(lower)) category = "IERA / Granada Media";
  else if (/dar ibrahim|colegio|escuela|beca|paypal|migraci[oó]n|niños|bukele/.test(lower)) category = "Dar Ibrahim";
  else if (/buzzi|marketing|campaña|marca|cliente|froozy|taqwa|mailchimp|copy|carrusel|reel/.test(lower)) category = "Buzzi / Marketing";
  else if (/el salvador|emerson|fondo|panam[aá]|ontario|sharia|sharía|inversi[oó]n|altum|lote/.test(lower)) category = "Fondo El Salvador";
  else if (/patrimonio|aroca|fip|fideicomiso|familia|ag constructora|tamaral|4h/.test(lower)) category = "Patrimonio familiar";
  else if (/arte|acuarela|caligraf[ií]a|patreon|personal|karim|adel|wilfred|sof[ií]a/.test(lower)) category = "Personal / Arte";

  let kind: InboxKind = "Referencia";
  if (/reuni[oó]n|acta|minuta|llamada|cita/.test(lower)) kind = "Reunión";
  else if (/pendiente|hacer|solicitar|confirmar|enviar|preparar|llamar|revisar|pagar|agendar|seguimiento/.test(lower)) kind = "Tarea";
  else if (/documento|contrato|pdf|carta|propuesta|informe|archivo/.test(lower)) kind = "Documento";
  else if (/campaña|post|copy|caption|mailchimp|contenido|carrusel|reel/.test(lower)) kind = "Campaña";
  else if (/prompt|gpt|claude|gemini|agente|workflow/.test(lower)) kind = "Prompt";
  else if (/idea|podr[ií]amos|se me ocurre/.test(lower)) kind = "Idea";
  else if (/esperando|respuesta|bloqueado|depende de/.test(lower)) kind = "Esperando respuesta";

  const action: InboxAction = kind === "Campaña" ? "Mandar a Marketing" : kind === "Referencia" || kind === "Prompt" ? "Archivar como referencia" : kind === "Tarea" || kind === "Esperando respuesta" ? "Crear pendiente" : "Guardar en Daily Note";
  const chips = [category, kind, action];
  const confidence = category === "No sé todavía" ? "Baja" : "Media";
  return { category, kind, action, confidence, chips };
}

export function UniversalInboxView() {
  const [entry, setEntry] = useState("");
  const suggestion = useMemo(() => inferInbox(entry), [entry]);
  const [category, setCategory] = useState<InboxCategory>("No sé todavía");
  const [kind, setKind] = useState<InboxKind>("Tarea");
  const [action, setAction] = useState<InboxAction>("Guardar en Daily Note");
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [recent, setRecent] = useState<SavedInboxItem[]>([]);

  const applySuggestion = () => {
    setCategory(suggestion.category);
    setKind(suggestion.kind);
    setAction(suggestion.action);
  };

  const saveToObsidian = async () => {
    if (!entry.trim()) {
      setStatus("Pega primero algo para guardar.");
      return;
    }
    setSaving(true);
    setStatus("Guardando en Daily Note…");
    const block = [
      `> [!inbox] Inbox Universal — ${category}`,
      `> **Tipo:** ${kind}`,
      `> **Acción sugerida:** ${action}`,
      `> **Estado:** Pendiente de procesar / confirmar destino final`,
      `>`,
      ...entry.trim().split("\n").map(line => `> ${line}`),
    ].join("\n");
    try {
      const response = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "daily-capture", entry: block, rawEntry: entry.trim(), category, kind, action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar");
      const item: SavedInboxItem = { id: `${Date.now()}`, text: entry.trim(), category, kind, action, createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }), file: payload.file };
      setRecent(prev => [item, ...prev].slice(0, 6));
      setEntry("");
      setStatus(payload.createdTask ? "Guardado y creado como pendiente para Hoy ✅" : "Guardado en la Daily Note de hoy ✅");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error guardando en Obsidian");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell eyebrow="Captura + clasificación" title="Inbox Universal" subtitle="Un solo lugar para pegar posts, audios, pantallazos, links, documentos e ideas; luego el sistema decide a qué empresa, proyecto, persona y acción pertenece." icon={Inbox} accent="gold">
      <div className="grid grid-cols-1 gap-4">
        <Card title="Entrada rápida" subtitle="Prioridad visual: pega aquí lo bruto y conviértelo en captura o pendiente." icon={Inbox} accent="gold">
          <textarea value={entry} onChange={e => setEntry(e.target.value)} placeholder="Pega aquí un WhatsApp, audio transcrito, link, idea, tarea, post, correo o documento en bruto…" className="w-full min-h-[300px] lg:min-h-[360px] resize-none rounded-xl p-4 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(7,24,46,0.035)", border: "1px solid rgba(109,40,217,0.14)" }} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={category} onChange={e => setCategory(e.target.value as InboxCategory)} className="rounded-xl px-3 py-2 text-[12px] bg-transparent" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.9)", fontFamily: "var(--font-outfit)" }}>{inboxCategories.map(v => <option key={v}>{v}</option>)}</select>
            <select value={kind} onChange={e => setKind(e.target.value as InboxKind)} className="rounded-xl px-3 py-2 text-[12px] bg-transparent" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.9)", fontFamily: "var(--font-outfit)" }}>{inboxKinds.map(v => <option key={v}>{v}</option>)}</select>
            <select value={action} onChange={e => setAction(e.target.value as InboxAction)} className="rounded-xl px-3 py-2 text-[12px] bg-transparent" style={{ color: "#07182E", border: "1px solid rgba(247,37,133,0.18)", backgroundColor: "rgba(247,239,226,0.9)", fontFamily: "var(--font-outfit)" }}>{inboxActions.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button onClick={applySuggestion} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(109,40,217,0.12)", border: "1px solid rgba(109,40,217,0.24)", color: "#6D28D9" }}><Sparkles size={13}/><span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-syne)" }}>Aplicar sugerencia</span></button>
            <button onClick={saveToObsidian} disabled={saving} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl disabled:opacity-50" style={{ background: "rgba(109,40,217,0.08)", border: "1px solid rgba(109,40,217,0.18)", color: "#6D28D9" }}><ArrowRight size={13}/><span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-syne)" }}>{saving ? "Guardando…" : "Guardar en Obsidian"}</span></button>
          </div>
          {status && <div className="mt-2 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: status.includes("✅") ? "#00A676" : "rgba(109,40,217,0.8)" }}>{status}</div>}
        </Card>

        <Card title="Clasificación sugerida" subtitle="V1 rápida: reglas locales, sin gastar IA todavía" icon={Search} accent="cyan">
          <div className="space-y-2">
            <Row title={suggestion.category} meta="Empresa / proyecto probable" accent="blue" status={`Confianza ${suggestion.confidence}`} />
            <Row title={suggestion.kind} meta="Tipo de entrada detectada" accent="gold" />
            <Row title={suggestion.action} meta="Acción recomendada antes de archivar" accent="green" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {suggestion.chips.map(chip => <span key={chip} className="rounded-full px-2 py-1 text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#6D28D9", background: "rgba(109,40,217,0.08)", border: "1px solid rgba(109,40,217,0.16)" }}>{chip}</span>)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Qué debe detectar" subtitle="El enrutador inteligente que falta en casi todos los sistemas" icon={Search} accent="cyan" defaultOpen={false}>
          <Matrix items={[
            { label: "Tipo", detail: "post, prompt, tarea, campaña, documento, reunión, idea", accent: "gold" },
            { label: "Dueño", detail: "La Carolina, Buzzi, IERA, Dar Ibrahim, Fondo SV, patrimonio, personal", accent: "blue" },
            { label: "Acción", detail: "guardar, responder, aprobar, convertir en workflow o crear pendiente", accent: "green" },
            { label: "Destino", detail: "Daily note, proyecto, persona, empresa o inbox de Obsidian", accent: "purple" },
          ]}/>
        </Card>
        <Card title="Reglas rápidas" subtitle="Para que la bandeja no se vuelva otro caos" icon={ShieldCheck} accent="green" defaultOpen={false}>
          <Row title="Si es urgente" meta="Va a Daily Note y luego aparece en Hoy" accent="rose" status="Hoy" />
          <Row title="Si es campaña" meta="Va a Marketing Command Center" accent="purple" status="Mkt" />
          <Row title="Si es solo referencia" meta="Se archiva sin crear tarea" accent="blue" status="Archivo" />
          <Row title="Si no sé" meta="Queda en No sé todavía para revisión manual" accent="gold" status="Inbox" />
        </Card>
      </div>

      <Card title="Cola procesada en esta sesión" subtitle="Lo último que guardaste desde esta pantalla" icon={AlertTriangle} accent="rose">
        {recent.length === 0 ? (
          <Row title="Todavía no hay entradas guardadas" meta="Pega algo arriba, aplica sugerencia y guarda en Obsidian." accent="rose" status="Vacío" />
        ) : recent.map(item => (
          <Row key={item.id} title={item.text.length > 110 ? `${item.text.slice(0, 110)}…` : item.text} meta={`${item.createdAt} · ${item.category} · ${item.kind} · ${item.action}`} accent={item.category === "La Carolina" ? "blue" : item.category.includes("Marketing") ? "purple" : item.category.includes("Salvador") || item.category.includes("Dar") ? "gold" : "green"} status="Guardado" />
        ))}
      </Card>
    </Shell>
  );
}

type MarketingBrand = "La Carolina" | "IERA / Granada Media" | "Dar Ibrahim" | "Buzzi / Taqwa Team" | "FROOZY" | "Isa García" | "Otro";
type MarketingObjective = "Awareness" | "Educación" | "Donación" | "Venta / conversión" | "Reputación" | "Convocatoria" | "Interna / cultura";
type MarketingChannel = "WhatsApp" | "Instagram" | "Facebook" | "Mailchimp / email" | "Reel / video" | "Carrusel" | "Landing / web" | "Multicanal";
type MarketingDeliverable = "Brief de campaña" | "Campaña completa" | "Copy / captions" | "Carrusel" | "Guion audiovisual" | "Email" | "Prompt creativo" | "Plan de pauta";
type SavedMarketingCampaign = { id: string; title: string; brand: MarketingBrand; deliverable: MarketingDeliverable; createdAt: string; file?: string };

const marketingBrands: MarketingBrand[] = ["La Carolina", "IERA / Granada Media", "Dar Ibrahim", "Buzzi / Taqwa Team", "FROOZY", "Isa García", "Otro"];
const marketingObjectives: MarketingObjective[] = ["Awareness", "Educación", "Donación", "Venta / conversión", "Reputación", "Convocatoria", "Interna / cultura"];
const marketingChannels: MarketingChannel[] = ["WhatsApp", "Instagram", "Facebook", "Mailchimp / email", "Reel / video", "Carrusel", "Landing / web", "Multicanal"];
const marketingDeliverables: MarketingDeliverable[] = ["Brief de campaña", "Campaña completa", "Copy / captions", "Carrusel", "Guion audiovisual", "Email", "Prompt creativo", "Plan de pauta"];

export function MarketingCommandCenterView() {
  const [campaignInput, setCampaignInput] = useState("");
  const [brand, setBrand] = useState<MarketingBrand>("La Carolina");
  const [objective, setObjective] = useState<MarketingObjective>("Interna / cultura");
  const [channel, setChannel] = useState<MarketingChannel>("Multicanal");
  const [deliverable, setDeliverable] = useState<MarketingDeliverable>("Campaña completa");
  const [creativeRequirements, setCreativeRequirements] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [approver, setApprover] = useState("Liliana");
  const [marketingStatus, setMarketingStatus] = useState("");
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [recentCampaigns, setRecentCampaigns] = useState<SavedMarketingCampaign[]>([]);

  const campaignTitle = campaignInput.trim().split("\n").map(line => line.trim()).find(Boolean) ?? "Nueva campaña";
  const campaignBrief = useMemo(() => {
    const cleanInput = campaignInput.trim() || "Pendiente: describir la campaña, problema u oportunidad.";
    const creative = creativeRequirements.trim() || "Pendiente: tono, estética, referencias, hooks, estilo visual o restricciones creativas.";
    const special = specialRequirements.trim() || "Pendiente: datos obligatorios, restricciones legales, aprobaciones, fechas, personas, documentos o contexto sensible.";
    return [
      `## 🟣 Campaña Marketing CC — ${brand}`,
      "",
      `**Título de trabajo:** ${campaignTitle}`,
      `**Marca / proyecto:** ${brand}`,
      `**Objetivo:** ${objective}`,
      `**Canal:** ${channel}`,
      `**Entregable:** ${deliverable}`,
      `**Aprobador:** ${approver || "Por definir"}`,
      "",
      "### Input principal",
      cleanInput,
      "",
      "### Requerimientos creativos",
      creative,
      "",
      "### Requerimientos especiales / no negociables",
      special,
      "",
      "### Pendientes de producción",
      `- [ ] Definir promesa central y público de ${brand}`,
      `- [ ] Preparar ${deliverable.toLowerCase()} para ${channel}`,
      "- [ ] Revisar con Liliana antes de publicar o enviar",
    ].join("\n");
  }, [approver, brand, campaignInput, campaignTitle, channel, creativeRequirements, deliverable, objective, specialRequirements]);

  const saveMarketingCampaign = async () => {
    if (!campaignInput.trim() && !creativeRequirements.trim() && !specialRequirements.trim()) {
      setMarketingStatus("Escribe el input principal o algún requerimiento creativo/especial.");
      return;
    }
    setSavingMarketing(true);
    setMarketingStatus("Guardando campaña en Obsidian y creando pendiente…");
    try {
      const response = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily-capture",
          entry: campaignBrief,
          rawEntry: `Crear ${deliverable.toLowerCase()} — ${brand}: ${campaignTitle}`,
          category: "Buzzi / Marketing",
          kind: "Campaña",
          action: "Crear pendiente",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar la campaña");
      const item: SavedMarketingCampaign = { id: `${Date.now()}`, title: campaignTitle, brand, deliverable, createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }), file: payload.file };
      setRecentCampaigns(prev => [item, ...prev].slice(0, 5));
      setMarketingStatus("Campaña guardada y pendiente creado en Hoy ✅");
    } catch (error) {
      setMarketingStatus(error instanceof Error ? error.message : "Error guardando la campaña");
    } finally {
      setSavingMarketing(false);
    }
  };

  return (
    <Shell eyebrow="Buzzi · Taqwa · IERA · La Carolina" title="Marketing Command Center" subtitle="Centro operativo para pedir campañas, guardar briefs, capturar requerimientos especiales y pasar piezas a producción creativa sin mezclarlo con Inbox general." icon={Megaphone} accent="purple">
      <div className="grid grid-cols-1 gap-4">
        <Card title="Entrada de campaña" subtitle="Escribe aquí la solicitud: campaña, pieza, idea, problema o requerimiento especial. Esto sí es el input operativo de Marketing CC." icon={Megaphone} accent="purple">
          <textarea value={campaignInput} onChange={e => setCampaignInput(e.target.value)} placeholder="Ej: Necesito una campaña para La Carolina sobre cultura vial para conductores, con piezas para WhatsApp y Facebook. Debe ser cercana, firme y no sonar a regaño…" className="w-full min-h-[220px] lg:min-h-[280px] resize-none rounded-xl p-4 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(7,24,46,0.035)", border: "1px solid rgba(247,37,133,0.18)" }} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            <select value={brand} onChange={e => setBrand(e.target.value as MarketingBrand)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(247,37,133,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{marketingBrands.map(v => <option key={v}>{v}</option>)}</select>
            <select value={objective} onChange={e => setObjective(e.target.value as MarketingObjective)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(0,166,118,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{marketingObjectives.map(v => <option key={v}>{v}</option>)}</select>
            <select value={channel} onChange={e => setChannel(e.target.value as MarketingChannel)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(247,37,133,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{marketingChannels.map(v => <option key={v}>{v}</option>)}</select>
            <select value={deliverable} onChange={e => setDeliverable(e.target.value as MarketingDeliverable)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{marketingDeliverables.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
            <textarea value={creativeRequirements} onChange={e => setCreativeRequirements(e.target.value)} placeholder="Requerimientos creativos: tono, estética, referencias, idea visual, hooks, formatos, textos obligatorios sobre imagen/video…" className="w-full min-h-[130px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(247,37,133,0.045)", border: "1px solid rgba(247,37,133,0.16)" }} />
            <textarea value={specialRequirements} onChange={e => setSpecialRequirements(e.target.value)} placeholder="Requerimientos especiales/no negociables: fecha, aprobador, documentos, restricciones legales, público sensible, datos que deben aparecer o evitarse…" className="w-full min-h-[130px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(109,40,217,0.04)", border: "1px solid rgba(109,40,217,0.16)" }} />
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input value={approver} onChange={e => setApprover(e.target.value)} placeholder="Aprobador / responsable: Liliana, John, Ibrahim, cliente…" className="rounded-xl px-3 py-2 text-[12px] focus:outline-none" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }} />
            <button onClick={saveMarketingCampaign} disabled={savingMarketing} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl disabled:opacity-50" style={{ background: "rgba(247,37,133,0.12)", border: "1px solid rgba(247,37,133,0.28)", color: "#F72585" }}><ArrowRight size={13}/><span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-syne)" }}>{savingMarketing ? "Guardando…" : "Guardar brief + crear pendiente"}</span></button>
          </div>
          {marketingStatus && <div className="mt-2 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: marketingStatus.includes("✅") ? "#00A676" : "rgba(109,40,217,0.82)" }}>{marketingStatus}</div>}
        </Card>

        <Card title="Brief generado" subtitle="Vista previa de lo que se guardará en Obsidian y aparecerá como pendiente en Hoy" icon={FileText} accent="blue" defaultOpen={false}>
          <pre className="whitespace-pre-wrap rounded-xl p-3 text-[11px] leading-relaxed" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(226,232,240,0.82)", background: "rgba(15,23,42,0.74)", border: "1px solid rgba(247,37,133,0.14)" }}>{campaignBrief}</pre>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Clientes / marcas" subtitle="Dónde pertenece cada acción" icon={Building2} accent="purple" defaultOpen={false}>
          <Row title="FROOZY" meta="Taqwa Team · crisis reputacional · marca sin registrar" accent="purple" status="Activo" />
          <Row title="La Carolina" meta="Campañas internas, cultura vial, conductores" accent="blue" status="Activo" />
          <Row title="IERA / Granada Media" meta="Contenido islámico, educación, donantes" accent="green" status="Activo" />
          <Row title="Isa García" meta="Marca islámica personal · Corán · traducción" accent="gold" status="Brand" />
        </Card>
        <Card title="Campañas" subtitle="Estado visual de producción" icon={Megaphone} accent="blue" defaultOpen={false}>
          <Row title="Brief / idea" meta="Objetivo, público, canal, tono" accent="blue" />
          <Row title="Contenido" meta="Copy, carrusel, video, landing, email" accent="purple" />
          <Row title="Aprobación" meta="Liliana / cliente / John / equipo" accent="gold" />
          <Row title="Publicación" meta="Canva, Mailchimp, Blotato, Facebook Ads" accent="green" />
        </Card>
        <Card title="Prompts y referencias" subtitle="Lo creativo también tiene su propio input arriba" icon={FileText} accent="gold" defaultOpen={false}>
          <Row title="Prompts de contenido" meta="Hooks, captions, campañas, UGC" accent="gold" />
          <Row title="Prompts visuales" meta="Imagen, video, marca, estilo" accent="purple" />
          <Row title="Requerimientos especiales" meta="Lo que no puede faltar o no se puede decir" accent="rose" status="Nuevo" />
          <Row title="Referencias" meta="Guardar fuente + por qué sirve" accent="green" />
        </Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Aprobaciones" subtitle="Nada se envía sin revisión explícita" icon={ClipboardCheck} accent="gold" defaultOpen={false}>
          <Row title="Listo para revisar contigo" meta="Piezas que Hermi puede preparar pero no enviar" accent="gold" status="Review" />
          <Row title="Pendiente aprobación externa" meta="John, cliente, Isa, Ibrahim, diseñador" accent="rose" status="Esperando" />
          <Row title="Aprobado para publicar" meta="Ya puede pasar a ejecución / entrega" accent="green" status="OK" />
        </Card>
        <Card title="Cola de campañas guardadas" subtitle="Lo último creado desde Marketing CC en esta sesión" icon={ClipboardCheck} accent="green" defaultOpen={recentCampaigns.length > 0}>
          {recentCampaigns.length === 0 ? (
            <Row title="Todavía no has guardado campañas en esta sesión" meta="Completa la entrada de campaña y guarda el brief para verlo en Hoy." accent="green" status="Vacío" />
          ) : recentCampaigns.map(item => (
            <Row key={item.id} title={item.title.length > 110 ? `${item.title.slice(0, 110)}…` : item.title} meta={`${item.createdAt} · ${item.brand} · ${item.deliverable}`} accent="green" status="Guardado" />
          ))}
        </Card>
      </div>
    </Shell>
  );
}

type AudiovisualProject = "La Carolina" | "IERA / Granada Media" | "Dar Ibrahim" | "Buzzi / Taqwa Team" | "Arte personal" | "Otro";
type AudiovisualOutput = "Prompt visual" | "Guion / storyboard" | "Imagen" | "Video / reel" | "Carrusel visual" | "Moodboard";
type AudiovisualFormat = "9:16 vertical" | "1:1 cuadrado" | "16:9 horizontal" | "4:5 feed" | "Multiformato";
type SavedAudiovisualItem = { id: string; title: string; project: AudiovisualProject; output: AudiovisualOutput; createdAt: string; file?: string };

const audiovisualProjects: AudiovisualProject[] = ["La Carolina", "IERA / Granada Media", "Dar Ibrahim", "Buzzi / Taqwa Team", "Arte personal", "Otro"];
const audiovisualOutputs: AudiovisualOutput[] = ["Prompt visual", "Guion / storyboard", "Imagen", "Video / reel", "Carrusel visual", "Moodboard"];
const audiovisualFormats: AudiovisualFormat[] = ["9:16 vertical", "1:1 cuadrado", "16:9 horizontal", "4:5 feed", "Multiformato"];

export function AudiovisualesView() {
  const [idea, setIdea] = useState("");
  const [project, setProject] = useState<AudiovisualProject>("Dar Ibrahim");
  const [output, setOutput] = useState<AudiovisualOutput>("Video / reel");
  const [format, setFormat] = useState<AudiovisualFormat>("9:16 vertical");
  const [style, setStyle] = useState("");
  const [screenText, setScreenText] = useState("");
  const [voiceScript, setVoiceScript] = useState("");
  const [references, setReferences] = useState("");
  const [audiovisualStatus, setAudiovisualStatus] = useState("");
  const [savingAudiovisual, setSavingAudiovisual] = useState(false);
  const [recentAudiovisual, setRecentAudiovisual] = useState<SavedAudiovisualItem[]>([]);

  const audiovisualTitle = idea.trim().split("\n").map(line => line.trim()).find(Boolean) ?? "Nueva pieza audiovisual";
  const audiovisualBrief = useMemo(() => {
    return [
      `## 🎬 Audiovisuales — ${project}`,
      "",
      `**Título de trabajo:** ${audiovisualTitle}`,
      `**Proyecto:** ${project}`,
      `**Salida solicitada:** ${output}`,
      `**Formato:** ${format}`,
      "**Estado:** Preparación / no genera créditos todavía",
      "",
      "### Idea principal",
      idea.trim() || "Pendiente: describir la pieza audiovisual.",
      "",
      "### Estilo visual",
      style.trim() || "Pendiente: estética, mood, iluminación, colores, cámara, referencias visuales.",
      "",
      "### Texto en pantalla",
      screenText.trim() || "Pendiente: hooks, subtítulos, frases obligatorias o copy sobre la imagen/video.",
      "",
      "### Voz / guion",
      voiceScript.trim() || "Pendiente: voz en off, diálogo, escenas o estructura narrativa.",
      "",
      "### Referencias / restricciones",
      references.trim() || "Pendiente: links, imágenes de referencia, marcas, restricciones o cosas a evitar.",
      "",
      "### Pendientes de producción",
      `- [ ] Refinar ${output.toLowerCase()} para ${project}`,
      `- [ ] Validar formato ${format} y referencias antes de generar créditos`,
      "- [ ] Revisar con Liliana antes de usar motores de imagen/video",
    ].join("\n");
  }, [audiovisualTitle, format, idea, output, project, references, screenText, style, voiceScript]);

  const saveAudiovisualBrief = async () => {
    if (!idea.trim() && !style.trim() && !screenText.trim() && !voiceScript.trim() && !references.trim()) {
      setAudiovisualStatus("Escribe la idea audiovisual o algún detalle de estilo, texto, guion o referencia.");
      return;
    }
    setSavingAudiovisual(true);
    setAudiovisualStatus("Guardando brief audiovisual en Obsidian…");
    try {
      const response = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily-capture",
          entry: audiovisualBrief,
          rawEntry: `Preparar ${output.toLowerCase()} — ${project}: ${audiovisualTitle}`,
          category: "Buzzi / Marketing",
          kind: "Prompt",
          action: "Crear pendiente",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar el brief audiovisual");
      const item: SavedAudiovisualItem = { id: `${Date.now()}`, title: audiovisualTitle, project, output, createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }), file: payload.file };
      setRecentAudiovisual(prev => [item, ...prev].slice(0, 5));
      setAudiovisualStatus("Brief audiovisual guardado y pendiente creado en Hoy ✅");
    } catch (error) {
      setAudiovisualStatus(error instanceof Error ? error.message : "Error guardando brief audiovisual");
    } finally {
      setSavingAudiovisual(false);
    }
  };

  return (
    <Shell eyebrow="Estudio IA · Imagen + video" title="Audiovisuales" subtitle="Entrada operativa para preparar prompts, guiones, storyboards e ideas visuales sin gastar créditos todavía. Los motores se conectarán después de aprobación." icon={Video} accent="rose">
      <div className="grid grid-cols-1 gap-4">
        <Card title="Entrada audiovisual" subtitle="Pide aquí imagen, video, reel, storyboard o prompt visual. Esta V1 solo prepara y guarda: no genera créditos." icon={Video} accent="rose">
          <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Ej: Quiero un reel para Dar Ibrahim mostrando la emoción de los niños becados, estilo documental, 9:16, con voz en off y texto en pantalla…" className="w-full min-h-[220px] lg:min-h-[280px] resize-none rounded-xl p-4 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(7,24,46,0.035)", border: "1px solid rgba(239,68,68,0.18)" }} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={project} onChange={e => setProject(e.target.value as AudiovisualProject)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{audiovisualProjects.map(v => <option key={v}>{v}</option>)}</select>
            <select value={output} onChange={e => setOutput(e.target.value as AudiovisualOutput)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(239,68,68,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{audiovisualOutputs.map(v => <option key={v}>{v}</option>)}</select>
            <select value={format} onChange={e => setFormat(e.target.value as AudiovisualFormat)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(247,37,133,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{audiovisualFormats.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
            <textarea value={style} onChange={e => setStyle(e.target.value)} placeholder="Estilo visual: documental, cinematográfico, cálido, institucional, colores, iluminación, cámara, mood…" className="w-full min-h-[120px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(239,68,68,0.045)", border: "1px solid rgba(239,68,68,0.16)" }} />
            <textarea value={screenText} onChange={e => setScreenText(e.target.value)} placeholder="Texto en pantalla: hook, subtítulos, frases obligatorias, CTA, copy que debe verse en imagen/video…" className="w-full min-h-[120px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(109,40,217,0.04)", border: "1px solid rgba(109,40,217,0.16)" }} />
            <textarea value={voiceScript} onChange={e => setVoiceScript(e.target.value)} placeholder="Voz / guion / storyboard: escenas, narración, diálogo, duración, estructura del reel…" className="w-full min-h-[120px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(109,40,217,0.04)", border: "1px solid rgba(109,40,217,0.16)" }} />
            <textarea value={references} onChange={e => setReferences(e.target.value)} placeholder="Referencias / restricciones: links, imágenes, marcas, estilo que sí/no, elementos sensibles, cosas a evitar…" className="w-full min-h-[120px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(247,37,133,0.04)", border: "1px solid rgba(247,37,133,0.16)" }} />
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button onClick={saveAudiovisualBrief} disabled={savingAudiovisual} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl disabled:opacity-50" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#EF4444" }}><ArrowRight size={13}/><span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-syne)" }}>{savingAudiovisual ? "Guardando…" : "Guardar brief audiovisual + crear pendiente"}</span></button>
            <span className="text-[10px] flex items-center" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.62)" }}>Seguro: no conecta motores ni consume créditos.</span>
          </div>
          {audiovisualStatus && <div className="mt-2 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: audiovisualStatus.includes("✅") ? "#00A676" : "rgba(109,40,217,0.82)" }}>{audiovisualStatus}</div>}
        </Card>

        <Card title="Brief audiovisual generado" subtitle="Vista previa del prompt/guion que se guarda en Obsidian" icon={FileText} accent="cyan" defaultOpen={false}>
          <pre className="whitespace-pre-wrap rounded-xl p-3 text-[11px] leading-relaxed" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(226,232,240,0.82)", background: "rgba(15,23,42,0.74)", border: "1px solid rgba(109,40,217,0.14)" }}>{audiovisualBrief}</pre>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="Imagen" subtitle="Piezas visuales, moodboards y prompts para generación" icon={WandSparkles} accent="purple" defaultOpen={false}>
          <Row title="Motores previstos" meta="Higgsfield · ChatGPT Imagen · Flow / referencias externas" accent="purple" status="Setup" />
          <Row title="Formatos" meta="1:1 post, 9:16 historia/reel, 16:9 portada o presentación" accent="blue" />
          <Row title="Salida esperada" meta="Prompt visual + estilo + texto sobre imagen + caption" accent="gold" />
        </Card>
        <Card title="Video" subtitle="Reels, anuncios, UGC y storytelling" icon={Video} accent="rose" defaultOpen={false}>
          <Row title="Higgsfield" meta="UGC, producto, anuncios, avatar, marketing comercial" accent="rose" status="Prioridad" />
          <Row title="Flow" meta="Storytelling, escenas cinematográficas, campaña emocional" accent="blue" />
          <Row title="Canva / CapCut" meta="Edición final, subtítulos, marca y montaje" accent="green" />
        </Card>
        <Card title="Guion / Storyboard" subtitle="Antes de gastar créditos, ordenar la idea" icon={FileText} accent="cyan" defaultOpen={false}>
          <Row title="Hook" meta="Primeros 3 segundos: qué capta atención" accent="cyan" />
          <Row title="Escenas" meta="Tomas, acciones, personajes, ambiente y duración" accent="purple" />
          <Row title="Voz / texto" meta="Voz en off, subtítulos, CTA y caption" accent="gold" />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Plantillas por proyecto" subtitle="Para que el estudio audiovisual piense con tu contexto real" icon={Building2} accent="gold" defaultOpen={false}>
          <Row title="La Carolina" meta="Transporte urbano, seguridad vial, usuarios, conductores, institucional" accent="blue" status="Empresa" />
          <Row title="IERA / Granada Media" meta="Dawah, educación, donantes, reels islámicos, campaña World Cup" accent="green" status="Islam" />
          <Row title="Dar Ibrahim" meta="Escuela, becas, niños, fundraising, narrativa emocional" accent="gold" status="SV" />
          <Row title="Buzzi / Taqwa Team" meta="Clientes, anuncios, UGC, identidad visual, marcas" accent="purple" status="Mkt" />
          <Row title="Arte personal" meta="Acuarela, urban sketching, caligrafía islámica, moodboards" accent="rose" status="Personal" />
        </Card>
        <Card title="Cola audiovisual guardada" subtitle="Lo último preparado desde esta pestaña" icon={ClipboardCheck} accent="blue" defaultOpen={recentAudiovisual.length > 0}>
          {recentAudiovisual.length === 0 ? (
            <Row title="Sin briefs audiovisuales guardados en esta sesión" meta="Completa la entrada audiovisual y guárdala para verla en Hoy." accent="blue" status="Vacío" />
          ) : recentAudiovisual.map(item => (
            <Row key={item.id} title={item.title.length > 110 ? `${item.title.slice(0, 110)}…` : item.title} meta={`${item.createdAt} · ${item.project} · ${item.output}`} accent="blue" status="Guardado" />
          ))}
        </Card>
      </div>
    </Shell>
  );
}

type WorkflowKind = "Procesar post" | "Crear campaña" | "Procesar reunión" | "Revisar documento legal" | "Ordenar captura" | "Actualizar Daily Note";
type WorkflowProject = "La Carolina" | "IERA / Granada Media" | "Dar Ibrahim" | "Buzzi / Marketing" | "Fondo El Salvador" | "Patrimonio familiar" | "Personal / Arte" | "No sé todavía";
type WorkflowOutput = "Nota Obsidian + pendientes" | "Resumen ejecutivo" | "Borrador de correo" | "Brief / entregable" | "Lista de acciones";
type SavedWorkflowItem = { id: string; title: string; flow: WorkflowKind; project: WorkflowProject; createdAt: string; file?: string };

const workflowKinds: WorkflowKind[] = ["Procesar post", "Crear campaña", "Procesar reunión", "Revisar documento legal", "Ordenar captura", "Actualizar Daily Note"];
const workflowProjects: WorkflowProject[] = ["La Carolina", "IERA / Granada Media", "Dar Ibrahim", "Buzzi / Marketing", "Fondo El Salvador", "Patrimonio familiar", "Personal / Arte", "No sé todavía"];
const workflowOutputs: WorkflowOutput[] = ["Nota Obsidian + pendientes", "Resumen ejecutivo", "Borrador de correo", "Brief / entregable", "Lista de acciones"];

const workflowDescriptions: Record<WorkflowKind, string> = {
  "Procesar post": "Transcribir → clasificar prompts → detectar sistema → guardar en Obsidian → crear acciones",
  "Crear campaña": "Brief → público → promesa → piezas → aprobación → publicación → aprendizaje",
  "Procesar reunión": "Transcripción → decisiones → pendientes → responsables → notas relacionadas",
  "Revisar documento legal": "Resumen → riesgos → cláusulas → pendientes → correo borrador",
  "Ordenar captura": "Tipo → empresa → proyecto → persona → destino → siguiente acción",
  "Actualizar Daily Note": "Qué hicimos → decisiones → pendientes → links → seguimiento",
};

export function WorkflowsView() {
  const [workflowInput, setWorkflowInput] = useState("");
  const [workflowKind, setWorkflowKind] = useState<WorkflowKind>("Procesar reunión");
  const [workflowProject, setWorkflowProject] = useState<WorkflowProject>("La Carolina");
  const [workflowOutput, setWorkflowOutput] = useState<WorkflowOutput>("Nota Obsidian + pendientes");
  const [workflowContext, setWorkflowContext] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [savingWorkflow, setSavingWorkflow] = useState(false);
  const [recentWorkflows, setRecentWorkflows] = useState<SavedWorkflowItem[]>([]);

  const workflowTitle = workflowInput.trim().split("\n").map(line => line.trim()).find(Boolean) ?? workflowKind;
  const workflowBrief = useMemo(() => {
    return [
      `## 🔁 Workflow — ${workflowKind}`,
      "",
      `**Título de trabajo:** ${workflowTitle}`,
      `**Proyecto / empresa:** ${workflowProject}`,
      `**Workflow:** ${workflowKind}`,
      `**Salida esperada:** ${workflowOutput}`,
      "**Estado:** Preparado para ejecución / pendiente de procesar",
      "",
      "### Entrada para procesar",
      workflowInput.trim() || "Pendiente: pegar texto, transcripción, documento, link o captura.",
      "",
      "### Contexto / reglas especiales",
      workflowContext.trim() || "Pendiente: responsables, fechas, formato deseado, restricciones, documentos relacionados o instrucciones de estilo.",
      "",
      "### Proceso sugerido",
      workflowDescriptions[workflowKind],
      "",
      "### Pendientes de ejecución",
      `- [ ] Ejecutar workflow: ${workflowKind} — ${workflowProject}`,
      `- [ ] Producir salida: ${workflowOutput}`,
      "- [ ] Revisar resultado con Liliana antes de enviar/publicar/cerrar",
    ].join("\n");
  }, [workflowContext, workflowInput, workflowKind, workflowOutput, workflowProject, workflowTitle]);

  const saveWorkflowBrief = async () => {
    if (!workflowInput.trim() && !workflowContext.trim()) {
      setWorkflowStatus("Pega la entrada del workflow o agrega contexto antes de guardar.");
      return;
    }
    setSavingWorkflow(true);
    setWorkflowStatus("Guardando workflow en Obsidian y creando pendiente…");
    try {
      const response = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily-capture",
          entry: workflowBrief,
          rawEntry: `Ejecutar workflow: ${workflowKind} — ${workflowProject}: ${workflowTitle}`,
          category: workflowProject,
          kind: "Tarea",
          action: "Crear pendiente",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo guardar el workflow");
      const item: SavedWorkflowItem = { id: `${Date.now()}`, title: workflowTitle, flow: workflowKind, project: workflowProject, createdAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }), file: payload.file };
      setRecentWorkflows(prev => [item, ...prev].slice(0, 5));
      setWorkflowStatus("Workflow guardado y pendiente creado en Hoy ✅");
    } catch (error) {
      setWorkflowStatus(error instanceof Error ? error.message : "Error guardando workflow");
    } finally {
      setSavingWorkflow(false);
    }
  };

  return (
    <Shell eyebrow="SOPs / procesos repetibles" title="Workflows" subtitle="Entrada operativa para preparar la ejecución de procesos repetibles. Esta V1 guarda el workflow y crea pendiente en Hoy; no ejecuta agentes automáticamente todavía." icon={Workflow} accent="green">
      <div className="grid grid-cols-1 gap-4">
        <Card title="Ejecutar workflow" subtitle="Pega aquí la transcripción, texto, documento o captura que quieres procesar con un procedimiento." icon={Workflow} accent="green">
          <textarea value={workflowInput} onChange={e => setWorkflowInput(e.target.value)} placeholder="Ej: Pega una transcripción de reunión, un WhatsApp largo, un correo legal, una captura de pendientes o el texto que quieres convertir en acciones…" className="w-full min-h-[220px] lg:min-h-[280px] resize-none rounded-xl p-4 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(7,24,46,0.035)", border: "1px solid rgba(0,166,118,0.18)" }} />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <select value={workflowKind} onChange={e => setWorkflowKind(e.target.value as WorkflowKind)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(0,166,118,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{workflowKinds.map(v => <option key={v}>{v}</option>)}</select>
            <select value={workflowProject} onChange={e => setWorkflowProject(e.target.value as WorkflowProject)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(247,37,133,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{workflowProjects.map(v => <option key={v}>{v}</option>)}</select>
            <select value={workflowOutput} onChange={e => setWorkflowOutput(e.target.value as WorkflowOutput)} className="rounded-xl px-3 py-2 text-[12px]" style={{ color: "#07182E", border: "1px solid rgba(109,40,217,0.18)", backgroundColor: "rgba(247,239,226,0.92)", fontFamily: "var(--font-outfit)" }}>{workflowOutputs.map(v => <option key={v}>{v}</option>)}</select>
          </div>
          <textarea value={workflowContext} onChange={e => setWorkflowContext(e.target.value)} placeholder="Contexto / reglas especiales: responsable, fecha, formato, qué debe extraer, qué debe evitar, dónde guardarlo, a quién va dirigido…" className="mt-3 w-full min-h-[130px] resize-none rounded-xl p-3 text-sm focus:outline-none" style={{ fontFamily: "var(--font-outfit)", color: "#07182E", background: "rgba(0,166,118,0.045)", border: "1px solid rgba(0,166,118,0.16)" }} />
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button onClick={saveWorkflowBrief} disabled={savingWorkflow} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl disabled:opacity-50" style={{ background: "rgba(0,166,118,0.12)", border: "1px solid rgba(0,166,118,0.28)", color: "#00A676" }}><ArrowRight size={13}/><span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-syne)" }}>{savingWorkflow ? "Guardando…" : "Guardar workflow + crear pendiente"}</span></button>
            <span className="text-[10px] flex items-center" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.62)" }}>V1 segura: prepara ejecución y guarda; no dispara agentes sin revisión.</span>
          </div>
          {workflowStatus && <div className="mt-2 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: workflowStatus.includes("✅") ? "#00A676" : "rgba(109,40,217,0.82)" }}>{workflowStatus}</div>}
        </Card>

        <Card title="Workflow preparado" subtitle="Vista previa de lo que se guardará en Obsidian y se convertirá en pendiente" icon={FileText} accent="blue" defaultOpen={false}>
          <pre className="whitespace-pre-wrap rounded-xl p-3 text-[11px] leading-relaxed" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(226,232,240,0.82)", background: "rgba(15,23,42,0.74)", border: "1px solid rgba(247,37,133,0.14)" }}>{workflowBrief}</pre>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {workflowKinds.map((title, i) => <Card key={title} title={title} subtitle={workflowDescriptions[title]} icon={RotateCw} defaultOpen={false} accent={(i % 4 === 0 ? "green" : i % 4 === 1 ? "purple" : i % 4 === 2 ? "blue" : "gold") as keyof typeof accents}>
          <Row title="Entrada" meta="Texto, audio, screenshot, link o archivo" accent="cyan" />
          <Row title="Proceso" meta={workflowDescriptions[title]} accent="purple" />
          <Row title="Salida" meta="Nota Obsidian + pendientes + entregable si aplica" accent="green" />
        </Card>)}
      </div>

      <Card title="Cola de workflows guardados" subtitle="Lo último preparado desde esta pestaña" icon={ClipboardCheck} accent="green" defaultOpen={recentWorkflows.length > 0}>
        {recentWorkflows.length === 0 ? (
          <Row title="Todavía no hay workflows guardados en esta sesión" meta="Completa la entrada de workflow y guárdala para verla en Hoy." accent="green" status="Vacío" />
        ) : recentWorkflows.map(item => (
          <Row key={item.id} title={item.title.length > 110 ? `${item.title.slice(0, 110)}…` : item.title} meta={`${item.createdAt} · ${item.project} · ${item.flow}`} accent="green" status="Guardado" />
        ))}
      </Card>
    </Shell>
  );
}

export function EmpresasPersonasView() {
  return (
    <Shell eyebrow="Contexto operacional de Liliana" title="Empresas y Personas Clave" subtitle="Vista para no perder de vista dónde vive cada pendiente: empresa, proyecto, persona, documento, campaña y próxima acción." icon={Network} accent="blue">
      <div className="grid grid-cols-2 gap-4">
        <Card title="Empresas / frentes" subtitle="Cada tarjeta debería abrir su propio tablero" icon={Factory} accent="blue">
          <Row title="La Carolina" meta="Operación, datos, campañas, RRHH, jurídico, conductores" accent="blue" status="Alta carga" />
          <Row title="IERA / Granada Media" meta="Marketing, educación continua, World Cup 2026, donantes" accent="green" status="Activo" />
          <Row title="Taqwa Team / Buzzi" meta="Clientes, propuestas, carruseles, campañas, Froozy" accent="purple" status="Marketing" />
          <Row title="Dar Ibrahim / Fondo El Salvador" meta="Escuela, inversión, migración, Emerson, legal" accent="gold" status="Estratégico" />
          <Row title="AG / AG Constructora / Tamaral" meta="Patrimonio, finca raíz, agro, estructura familiar" accent="cyan" status="Patrimonio" />
        </Card>
        <Card title="Personas clave" subtitle="Seguimiento relacional, no solo tareas" icon={Users} accent="purple">
          <Row title="John / Edith / Néstor / Víctor" meta="La Carolina: decisiones, datos, IA, operación" accent="blue" />
          <Row title="Isa / Ibrahim / equipo IERA" meta="Contenido islámico, traducción, educación, donantes" accent="green" />
          <Row title="Emerson / Omar / David / Aroca" meta="El Salvador, legal, fondo, Dar Ibrahim" accent="gold" />
          <Row title="Clientes / diseñadores / proveedores" meta="Marketing, aprobaciones, entregables" accent="purple" />
        </Card>
      </div>
      <Card title="Esperando respuesta" subtitle="Separado de pendientes: aquí tú no tienes que hacer, pero sí dar seguimiento" icon={AlertTriangle} accent="rose">
        <Row title="Pendiente de aprobación" meta="Piezas listas que alguien debe validar" accent="rose" status="Esperando" />
        <Row title="Pendiente de información" meta="Datos, documentos, claves o contexto que bloquean" accent="gold" status="Bloquea" />
        <Row title="Pendiente de firma / decisión" meta="Legal, financiero, familiar o cliente" accent="purple" status="Crítico" />
      </Card>
    </Shell>
  );
}
