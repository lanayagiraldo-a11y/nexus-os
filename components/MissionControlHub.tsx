"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentAvatar from "./AgentAvatar";
import ConsejoSimple from "./ConsejoSimple";
import QueuePanel from "./QueuePanel";
import EmpresasPanel from "./EmpresasPanel";

// Colors
const PURPLE = "#4C1D95";
const PARCHMENT = "#F7EFE2";
const INK = "#07182E";
const EMERALD = "#047857";

type TabId = "chat" | "consejo" | "workflow" | "cola" | "empresas";

interface EmpresaLite { id: string; nombre: string; sources: unknown[] }

interface Message {
  id: number;
  role: "user" | "agent";
  agent?: string;
  agentLabel?: string;
  text: string;
  time: string;
  extra?: "perplexity" | "image" | "audio" | "pdf";
  extraLabel?: string;
  fileUrl?: string;
  loading?: boolean;
}

const AGENTS = [
  { id: "hermes", label: "Hermes", color: "#7C3AED", status: "Libre" },
  { id: "perplexity", label: "Perplexity", color: "#00A676", status: "Listo" },
  { id: "gemini", label: "Gemini", color: "#2563EB", status: "Informando" },
  { id: "elevenlabs", label: "ElevenLabs", color: "#F59E0B", status: "Listo" },
  { id: "imagegen", label: "Image Gen", color: "#F72585", status: "Listo" },
  { id: "claude", label: "Claude", color: "#7C3AED", status: "Inactivo" },
  { id: "codex", label: "Codex", color: "#00A676", status: "Inactivo" },
];

export default function MissionControlHub() {
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [empresas, setEmpresas] = useState<EmpresaLite[]>([]);
  const [empresaSel, setEmpresaSel] = useState<string>("");

  useEffect(() => {
    fetch("/api/empresas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list" }) })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d.empresas)) setEmpresas(d.empresas); }).catch(() => {});
  }, [activeTab]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "user", text: "Investiga los competidores de Taqwa Team y dame precios y servicios", time: "10:32", agent: "user" },
    { id: 2, role: "agent", agent: "Hermes", agentLabel: "⚡ Hermes vía Perplexity", text: "Busqué información actualizada de competidores en El Salvador.", time: "10:32", extra: "perplexity", extraLabel: "FROOZY: $3.50 · 5 sabores\nSnowIce: $4.00 · 3 sabores\nChillBox: $2.80 · 2 sabores\n3 fuentes consultadas" },
    { id: 3, role: "user", text: "Crea una imagen para campaña de Taqwa, turquesa y dorado", time: "10:35" },
    { id: 4, role: "agent", agent: "Hermes", agentLabel: "🎨 Hermes vía Image Gen", text: "Imagen generada:", time: "10:35", extra: "image" },
    { id: 5, role: "user", text: "Crea un audio: \"La Carolina te espera, súbete y viaja tranquilo\"", time: "10:38" },
    { id: 6, role: "agent", agent: "Hermes", agentLabel: "🎤 Hermes vía ElevenLabs", text: "Audio generado:", time: "10:38", extra: "audio" },
    { id: 7, role: "user", text: "Pásame el análisis de competidores en PDF", time: "10:40" },
    { id: 8, role: "agent", agent: "Hermes", agentLabel: "📄 Hermes", text: "PDF generado:", time: "10:40", extra: "pdf", extraLabel: "analisis-competidores-taqwa.pdf" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [agentCounts] = useState({ active: 4, total: 7 });

  // Workflow state
  const [workflows, setWorkflows] = useState([
    { title: "📋 Análisis competidores Taqwa Team", steps: [
      { num: 1, agent: "Perplexity", desc: "Investigación con fuentes", status: "done" },
      { num: 2, agent: "Hermes", desc: "Consolidar PDF final", status: "working" },
    ]},
  ]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Fetch real issues from ia-masters-os
  useEffect(() => {
    const fetchIssues = async () => {
      if (activeTab !== "workflow") return;
      setLoadingIssues(true);
      try {
        const resp = await fetch("/api/github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list-issues" }),
        });
        const data = await resp.json();
        if (data.issues && data.issues.length > 0) {
          const grouped = data.issues.reduce((acc: any[], issue: any) => {
            const label = issue.labels.find((l: string) => ["agent-todo","agent-working","agent-review","agent-done"].includes(l)) || "agent-todo";
            const status = label === "agent-done" ? "done" : "working";
            const agentName = issue.title.match(/\[(hermes|claude|codex|gemini|deepseek|perplexity|manus)\]/i);
            const agent = agentName ? agentName[1].charAt(0).toUpperCase() + agentName[1].slice(1) : "Hermes";
            if (!acc.length || acc[acc.length-1].steps.some((s: any) => s.status !== "done")) {
              acc.push({ title: `📋 #${issue.number} ${issue.title.replace(/\[.*?\]/g, '').trim().slice(0, 50)}`, steps: [] });
            }
            const last = acc[acc.length-1];
            last.steps.push({ num: last.steps.length + 1, agent, desc: issue.title.slice(0, 60), status });
            return acc;
          }, []);
          if (grouped.length > 0) setWorkflows(grouped.slice(0, 5));
        }
      } catch (e) {
        console.error("Failed to fetch issues:", e);
      } finally {
        setLoadingIssues(false);
      }
    };
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      id: Date.now(), role: "user", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput("");

    // Add a loading message
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: loadingId, role: "agent", agent: "Hermes",
      agentLabel: "⚡ Hermes", text: "Procesando…",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: true,
    }]);

    try {
      const lower = text.toLowerCase();
      let result: { content: string; extra?: string; extraLabel?: string; fileUrl?: string; agentLabel?: string } | null = null;

      // Detect intent: investigation/research
      if (/investiga|busca|competidores|investigación|research|análisis de mercado|precios/i.test(lower)) {
        const resp = await fetch("/api/perplexity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await resp.json();
        if (resp.ok) {
          result = {
            content: "Aquí tienes los resultados de la investigación:",
            extra: "perplexity",
            extraLabel: data.content,
            agentLabel: "🔍 Hermes vía Perplexity",
          };
        } else throw new Error(data.error || "Error en Perplexity");
      }

      // Detect intent: image generation
      else if (/crea.*imagen|genera.*imagen|imagen.*campaña|diseño.*visual|imagen/i.test(lower)) {
        const resp = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        const data = await resp.json();
        if (resp.ok) {
          result = {
            content: "Imagen generada:",
            extra: "image",
            agentLabel: "🎨 Hermes vía Image Gen",
          };
        } else throw new Error(data.error || "Error en generación");
      }

      // Detect intent: audio
      else if (/crea.*audio|audio|voz|locución|diciendo/i.test(lower)) {
        const audioText = text.replace(/crea un audio|audio|diciendo|locución|voz/gi, "").trim() || text;
        const resp = await fetch("/api/elevenlabs/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: audioText }),
        });
        const data = await resp.json();
        if (resp.ok) {
          result = {
            content: "Audio generado:",
            extra: "audio",
            extraLabel: data.fileName || "audio-mensaje.mp3",
            fileUrl: data.url,
            agentLabel: "🎤 Hermes vía ElevenLabs",
          };
        } else throw new Error(data.error || "Error en audio");
      }

      // Default: chat real con el agente, usando SOLO el contexto de la empresa seleccionada.
      else {
        const empresaNombre = empresas.find((e) => e.id === empresaSel)?.nombre;
        const tag = empresaNombre ? `🏢 ${empresaNombre} · ` : "";
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "hermes", message: text, empresa: empresaSel || undefined }),
        });
        if (!resp.ok || !resp.body) {
          const e = await resp.json().catch(() => ({}));
          throw new Error(e.error || `Error ${resp.status}`);
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let acc = "", buf = "", errMsg = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split("\n\n"); buf = events.pop() ?? "";
          for (const ev of events) {
            const line = ev.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            let data: { text?: string; error?: string; heartbeat?: boolean; status?: string };
            try { data = JSON.parse(raw); } catch { continue; }
            if (data.heartbeat || data.status) continue;
            if (data.error) { errMsg = data.error; continue; }
            if (data.text) {
              acc += data.text;
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: acc, agentLabel: `${tag}⚡ Hermes`, loading: false } : m));
            }
          }
        }
        if (errMsg && !acc) throw new Error(errMsg);
        if (!acc) throw new Error("El agente no devolvió respuesta. Revisa que Hermes esté corriendo o que haya una API key configurada.");
        return; // el mensaje ya se actualizó en streaming
      }

      // Replace loading message with result
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        text: result?.content || "Listo",
        extra: result?.extra as any,
        extraLabel: result?.extraLabel,
        fileUrl: result?.fileUrl,
        agentLabel: result?.agentLabel || "⚡ Hermes",
        loading: false,
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m, text: `Error: ${err.message}`, loading: false,
      } : m));
    }
  };

  const statusColor = (status: string) => {
    switch(status) {
      case "Libre": case "Listo": return "#047857";
      case "Informando": case "working": return "#D97706";
      default: return "rgba(31,41,55,0.15)";
    }
  };

  const statusBg = (status: string) => {
    switch(status) {
      case "Libre": case "Listo": return "rgba(4,120,87,0.06)";
      case "Informando": return "rgba(217,119,6,0.06)";
      default: return "rgba(31,41,55,0.03)";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: PARCHMENT }}>
      {/* Agent Status Bar */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto flex-shrink-0 border-b" style={{ borderColor: "rgba(76,29,149,0.06)" }}>
        {AGENTS.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
            style={{ background: statusBg(a.status), border: `1px solid ${a.status === "Inactivo" ? "rgba(31,41,55,0.06)" : `${a.color}20`}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: statusColor(a.status) }} />
            <span style={{ color: INK, fontWeight: 600 }}>{a.label}</span>
            <span style={{ color: "rgba(31,41,55,0.4)" }}>{a.status}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-3 flex-shrink-0 border-b" style={{ borderColor: "rgba(76,29,149,0.06)" }}>
        {[
          { id: "chat" as TabId, label: "💬 Chat", count: messages.filter(m => m.role === "agent").length },
          { id: "consejo" as TabId, label: "🧠 Consejo" },
          { id: "workflow" as TabId, label: "🔀 Workflow", count: workflows.length },
          { id: "cola" as TabId, label: "🗂️ Cola" },
          { id: "empresas" as TabId, label: "🏢 Empresas" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="pb-2.5 px-4 text-sm font-bold border-b-2 bg-transparent cursor-pointer transition-colors"
            style={{
              fontFamily: "'Syne', sans-serif",
              color: activeTab === tab.id ? PURPLE : "rgba(31,41,55,0.3)",
              borderColor: activeTab === tab.id ? PURPLE : "transparent",
            }}>
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs" style={{
                background: activeTab === tab.id ? `rgba(76,29,149,0.08)` : "rgba(31,41,55,0.04)",
                color: activeTab === tab.id ? PURPLE : "rgba(31,41,55,0.3)",
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col p-4">
              {/* Selector de empresa: aísla el contexto del chat */}
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <span className="text-xs font-semibold" style={{ color: "rgba(31,41,55,0.5)" }}>🏢 Contexto:</span>
                <select value={empresaSel} onChange={(e) => setEmpresaSel(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                  style={{ border: `1px solid ${empresaSel ? PURPLE : "rgba(31,41,55,0.12)"}`, color: empresaSel ? PURPLE : INK, fontWeight: 600, background: empresaSel ? "rgba(76,29,149,0.06)" : "#fff" }}>
                  <option value="">Sin empresa (general)</option>
                  {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre} ({e.sources.length} fuentes)</option>)}
                </select>
                {empresaSel && <span className="text-xs" style={{ color: "rgba(31,41,55,0.4)" }}>solo usa datos de esta empresa</span>}
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user" ? PURPLE : "rgba(247,239,226,0.95)",
                        border: msg.role === "user" ? "none" : "1px solid rgba(76,29,149,0.08)",
                        color: msg.role === "user" ? "#F7EFE2" : INK,
                        borderBottomRightRadius: msg.role === "user" ? 3 : 11,
                        borderBottomLeftRadius: msg.role === "agent" ? 3 : 11,
                      }}>
                      {msg.agentLabel && <div className="flex items-center gap-1.5 mb-1 text-xs font-bold" style={{ color: PURPLE }}>{msg.agentLabel}</div>}
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${PURPLE}20`, borderTopColor: PURPLE }} />
                          <span>Procesando…</span>
                        </div>
                      ) : (
                        <div>{msg.text}</div>
                      )}

                      {(msg.extra === "perplexity" && msg.extraLabel) && (
                        <div className="mt-2 rounded-lg p-3 text-xs" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(4,120,87,0.12)" }}>
                          <span className="inline-block px-1.5 py-0.5 rounded text-2xs font-mono mb-1.5" style={{ background: "rgba(76,29,149,0.04)", color: PURPLE }}>🔍 Perplexity</span>
                          <pre className="whitespace-pre-wrap" style={{ color: INK, fontFamily: "'Outfit', sans-serif", fontSize: 12, lineHeight: 1.6 }}>{msg.extraLabel}</pre>
                        </div>
                      )}

                      {msg.extra === "image" && (
                        <div className="mt-2 rounded-lg p-4 text-center text-xs" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.08)" }}>
                          <span className="text-2xl">🖼️</span>
                          <div className="mt-1" style={{ color: "rgba(31,41,55,0.4)" }}>[Imagen: Campaña Taqwa — turquesa y dorado]</div>
                        </div>
                      )}

                      {msg.extra === "audio" && (
                        <div className="mt-2 rounded-lg p-3" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.08)" }}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-lg">🔊</span>
                            <span style={{ color: "rgba(31,41,55,0.5)" }}>{msg.extraLabel || "audio.mp3"}</span>
                            {msg.fileUrl ? (
                              <audio controls className="ml-auto h-8 max-w-[140px]" src={msg.fileUrl}>Tu navegador no soporta audio</audio>
                            ) : (
                              <span className="ml-auto px-3 py-1 rounded text-2xs font-bold" style={{ background: "rgba(76,29,149,0.06)", color: PURPLE }}>▶ Reproducir</span>
                            )}
                          </div>
                        </div>
                      )}

                      {msg.extra === "pdf" && (
                        <div className="mt-2 rounded-lg p-3" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(4,120,87,0.12)" }}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-lg">📄</span>
                            <span style={{ color: "rgba(31,41,55,0.5)" }}>{msg.extraLabel || "documento.pdf"}</span>
                            {msg.fileUrl ? (
                              <a href={msg.fileUrl} download={msg.extraLabel || "documento.pdf"} className="ml-auto px-3 py-1 rounded text-2xs font-bold no-underline" style={{ background: EMERALD, color: PARCHMENT }}>⬇ Descargar</a>
                            ) : (
                              <span className="ml-auto px-3 py-1 rounded text-2xs font-bold" style={{ background: "rgba(4,120,87,0.1)", color: EMERALD }}>✅ Descargar</span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-1 text-2xs text-right" style={{ color: msg.role === "user" ? "rgba(247,239,226,0.4)" : "rgba(31,41,55,0.2)" }}>{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2 pt-3 flex-shrink-0 border-t" style={{ borderColor: "rgba(76,29,149,0.06)" }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Escribe lo que necesites…"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.1)", color: INK }}
                />
                <button onClick={handleSend}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg cursor-pointer border-none flex-shrink-0"
                  style={{ background: PURPLE, color: PARCHMENT }}>➤</button>
              </div>
            </motion.div>
          )}

          {activeTab === "consejo" && (
            <motion.div key="consejo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden">
              <ConsejoSimple />
            </motion.div>
          )}

          {activeTab === "workflow" && (
            <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto p-4 space-y-3">
              {workflows.map((wf, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(247,239,226,0.92)", border: "1px solid rgba(76,29,149,0.06)" }}>
                  <div className="text-sm font-bold mb-2.5 flex items-center gap-2" style={{ color: INK, fontFamily: "'Syne', sans-serif" }}>
                    <span>{wf.title}</span>
                  </div>
                  <div className="flex flex-col gap-0">
                    {wf.steps.map((step, j) => {
                      const iconBg = step.status === "done" ? EMERALD : step.status === "working" ? "#D97706" : "rgba(31,41,55,0.06)";
                      const iconColor = step.status !== "pending" ? "#fff" : "rgba(31,41,55,0.3)";
                      const iconContent = step.status === "done" ? "✓" : step.status === "working" ? "↻" : String(step.num);
                      return (
                        <div key={j} className="flex items-start gap-3 py-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: iconBg, color: iconColor }}>
                            {iconContent}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold" style={{ color: PURPLE }}>{step.agent}</div>
                            <div className="text-sm" style={{ color: INK }}>{step.desc}</div>
                            <div className="text-xs font-medium mt-0.5" style={{
                              color: step.status === "done" ? EMERALD : step.status === "working" ? "#D97706" : "rgba(31,41,55,0.35)"
                            }}>
                              {step.status === "done" ? "✅ Listo" : step.status === "working" ? "🔄 Trabajando" : "⏳ Pendiente"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "cola" && (
            <motion.div key="cola" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden">
              <QueuePanel />
            </motion.div>
          )}

          {activeTab === "empresas" && (
            <motion.div key="empresas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden">
              <EmpresasPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
