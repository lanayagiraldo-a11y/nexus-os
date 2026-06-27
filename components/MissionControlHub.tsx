"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AgentAvatar from "./AgentAvatar";

// Colors
const PURPLE = "#4C1D95";
const PARCHMENT = "#F7EFE2";
const INK = "#07182E";
const EMERALD = "#047857";

type TabId = "chat" | "consejo" | "workflow";

interface Message {
  id: number;
  role: "user" | "agent";
  agent?: string;
  agentLabel?: string;
  text: string;
  time: string;
  extra?: "perplexity" | "image" | "audio" | "pdf";
  extraLabel?: string;
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

  // Consejo state
  const [consejoMission, setConsejoMission] = useState("Evaluar propuesta de Portal de Soledad: análisis financiero, riesgos operativos y campaña de lanzamiento");
  const [selectedAgents, setSelectedAgents] = useState(["Hermes", "Claude", "Gemini", "ChatGPT"]);
  const [selectedContext, setSelectedContext] = useState("La Carolina");
  const [consejoSent, setConsejoSent] = useState(false);

  // Workflow state
  const workflows = [
    { title: "📋 Análisis competidores Taqwa Team", steps: [
      { num: 1, agent: "Perplexity", desc: "Investigación con fuentes", status: "done" as const },
      { num: 2, agent: "Hermes", desc: "Consolidar PDF final", status: "working" as const },
    ]},
    { title: "📋 Propuesta Portal de Soledad", steps: [
      { num: 1, agent: "Claude", desc: "Análisis financiero", status: "done" as const },
      { num: 2, agent: "Gemini", desc: "Validación demanda", status: "done" as const },
      { num: 3, agent: "ChatGPT", desc: "Campaña lanzamiento", status: "done" as const },
      { num: 4, agent: "Hermes", desc: "Síntesis y revisión", status: "working" as const },
    ]},
    { title: "📋 Campaña La Carolina", steps: [
      { num: 1, agent: "Gemini", desc: "Brief segmentación", status: "done" as const },
      { num: 2, agent: "ElevenLabs", desc: "Locución spot", status: "working" as const },
      { num: 3, agent: "Image Gen", desc: "Visuales redes", status: "pending" as const },
    ]},
  ];

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(), role: "user", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput("");
  };

  const toggleAgent = (agent: string) => {
    setSelectedAgents(prev =>
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
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
                      <div>{msg.text}</div>

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
                            <span style={{ color: "rgba(31,41,55,0.5)" }}>la-carolina-bienvenida.mp3</span>
                            <span className="ml-auto px-3 py-1 rounded text-2xs font-bold" style={{ background: "rgba(76,29,149,0.06)", color: PURPLE }}>▶ Reproducir</span>
                          </div>
                        </div>
                      )}

                      {msg.extra === "pdf" && (
                        <div className="mt-2 rounded-lg p-3" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.08)" }}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-lg">📄</span>
                            <span style={{ color: INK, fontWeight: 500 }}>{msg.extraLabel || "documento.pdf"}</span>
                            <span className="ml-auto px-3 py-1 rounded text-2xs font-bold" style={{ background: "rgba(4,120,87,0.06)", color: EMERALD }}>⬇ Descargar</span>
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
            <motion.div key="consejo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto p-4">
              <div className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(31,41,55,0.45)" }}>
                El Consejo convoca a varios agentes para una misma tarea. Útil para análisis complejos que necesitan múltiples perspectivas.
              </div>

              <textarea value={consejoMission} onChange={e => setConsejoMission(e.target.value)}
                rows={4} className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.1)", color: INK, fontFamily: "'Outfit', sans-serif" }}
                placeholder="Describe la misión para el consejo…" />

              <div className="flex gap-3 mt-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-xs font-bold mb-1.5" style={{ color: PURPLE, fontFamily: "'Syne', sans-serif" }}>🤖 Agentes</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Hermes", "Claude", "Gemini", "ChatGPT", "Manus"].map(a => (
                      <button key={a} onClick={() => toggleAgent(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border"
                        style={{
                          background: selectedAgents.includes(a) ? "rgba(76,29,149,0.08)" : "rgba(7,24,46,0.02)",
                          borderColor: selectedAgents.includes(a) ? "rgba(76,29,149,0.22)" : "rgba(7,24,46,0.06)",
                          color: selectedAgents.includes(a) ? PURPLE : "rgba(31,41,55,0.5)",
                          fontWeight: selectedAgents.includes(a) ? 600 : 400,
                        }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div className="text-xs font-bold mb-1.5" style={{ color: PURPLE, fontFamily: "'Syne', sans-serif" }}>📂 Contexto</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {["Sin contexto", "La Carolina", "Dar Ibrahim", "Fondo SV", "Pegar texto"].map(c => (
                      <button key={c} onClick={() => setSelectedContext(c)}
                        className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border"
                        style={{
                          background: selectedContext === c ? "rgba(76,29,149,0.08)" : "rgba(7,24,46,0.02)",
                          borderColor: selectedContext === c ? "rgba(76,29,149,0.22)" : "rgba(7,24,46,0.06)",
                          color: selectedContext === c ? PURPLE : "rgba(31,41,55,0.5)",
                          fontWeight: selectedContext === c ? 600 : 400,
                        }}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border" style={{ border: "1px solid rgba(76,29,149,0.1)", color: "rgba(31,41,55,0.4)", background: "transparent" }}>Cancelar</button>
                <button onClick={() => setConsejoSent(true)} className="px-5 py-2 rounded-lg text-xs font-bold cursor-pointer border-none" style={{ background: PURPLE, color: PARCHMENT, fontFamily: "'Syne', sans-serif" }}>✈️ Enviar al Consejo ({selectedAgents.length})</button>
              </div>

              {consejoSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                  {[
                    { name: "Claude", role: "Análisis financiero", content: "CAPEX estimado COP $280M. Retorno a 14 meses con TIR del 18%. Apalancamiento: 60% crédito flota nueva.", color: "#7C3AED" },
                    { name: "Gemini", role: "Demanda y mercado", content: "Demanda validada: 2,340 viajes/día en Portal de Soledad. Crecimiento del 14% vs 2025.", color: "#2563EB" },
                    { name: "ChatGPT", role: "Campaña", content: "Campaña \"Corazón en Ruta\". 3 videos semanales con testimonios. KPI: 12,000 usuarios nuevos en 60 días.", color: "#00A676" },
                  ].map((r, i) => (
                    <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(247,239,226,0.92)", border: "1px solid rgba(4,120,87,0.15)" }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: r.color }}>{r.name[0]}</div>
                        <div className="flex-1"><div className="text-xs font-bold" style={{ color: INK }}>{r.name}</div><div className="text-2xs" style={{ color: "rgba(31,41,55,0.4)" }}>{r.role}</div></div>
                        <span style={{ color: EMERALD, fontSize: 14 }}>✓</span>
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: INK }}>{r.content}</div>
                    </div>
                  ))}

                  <div className="rounded-xl p-3.5" style={{ background: "linear-gradient(135deg, rgba(76,29,149,0.04), rgba(76,29,149,0.02))", border: "1px solid rgba(76,29,149,0.15)" }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white" style={{ background: PURPLE }}>H</div>
                      <div className="flex-1"><div className="text-xs font-bold" style={{ color: INK }}>Hermes · Síntesis final</div></div>
                    </div>
                    <div className="text-xs leading-relaxed" style={{ color: INK }}>Los 3 agentes coinciden en que Portal de Soledad es viable. Implementar por fases: mes 1-2 validación, mes 3-4 flota, mes 5-6 campaña.</div>
                    <div className="mt-2.5 rounded-lg p-2.5" style={{ background: "rgba(4,120,87,0.03)", border: "1px solid rgba(4,120,87,0.08)" }}>
                      <div className="text-2xs font-bold mb-1" style={{ color: EMERALD }}>📋 Pendientes</div>
                      <div className="text-2xs" style={{ color: INK }}>- Preparar proyección financiera a 6 meses</div>
                      <div className="text-2xs" style={{ color: INK }}>- Coordinar implementación por fases</div>
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      <button className="px-3 py-1.5 rounded text-2xs font-bold cursor-pointer" style={{ background: "rgba(76,29,149,0.06)", border: "1px solid rgba(76,29,149,0.18)", color: PURPLE }}>💾 Guardar en Obsidian</button>
                      <button className="px-3 py-1.5 rounded text-2xs font-bold cursor-pointer border-none" style={{ background: EMERALD, color: PARCHMENT }}>✅ Aprobar y cerrar</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "workflow" && (
            <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto p-4 space-y-3">
              {workflows.map((wf, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(247,239,226,0.92)", border: "1px solid rgba(76,29,149,0.06)" }}>
                  <div className="text-sm font-bold mb-2.5" style={{ color: INK, fontFamily: "'Syne', sans-serif" }}>{wf.title}</div>
                  {wf.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2.5 py-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0"
                        style={{
                          background: step.status === "done" ? EMERALD : step.status === "working" ? "#D97706" : "rgba(31,41,55,0.06)",
                          color: step.status !== "pending" ? "#fff" : "rgba(31,41,55,0.3)",
                          border: step.status === "pending" ? "1px solid rgba(31,41,55,0.1)" : "none",
                        }}>{step.num}</div>
                      <div className="flex-1">
                        <div className="text-2xs font-semibold" style={{ color: PURPLE }}>{step.agent}</div>
                        <div className="text-xs" style={{ color: INK }}>{step.desc}</div>
                        <div className="text-2xs" style={{
                          color: step.status === "done" ? EMERALD : step.status === "working" ? "#D97706" : "rgba(31,41,55,0.3)"
                        }}>{step.status === "done" ? "✅ Completado" : step.status === "working" ? "🔄 Trabajando" : "⏳ Pendiente"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
