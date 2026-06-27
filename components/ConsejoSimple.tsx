"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PURPLE = "#4C1D95";
const PARCHMENT = "#F7EFE2";
const INK = "#07182E";
const EMERALD = "#047857";

type Step = "describe" | "plan" | "execute";

export default function ConsejoSimple() {
  const [step, setStep] = useState<Step>("describe");
  const [mission, setMission] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const steps = [
    { id: "describe" as Step, label: "Describir", done: step !== "describe" },
    { id: "plan" as Step, label: "Revisar plan", done: step === "execute" },
    { id: "execute" as Step, label: "Ejecutar", done: false },
  ];

  const handleSend = () => {
    if (!mission.trim()) return;
    setStep("plan");
  };

  const handleExecute = () => {
    setStep("execute");
    setShowDemo(true);
  };

  const planItems = [
    { icon: "P", color: "#00A676", agent: "Perplexity", desc: "Investigar precios, servicios y presencia digital de competidores", note: "🔍 Búsqueda web con fuentes" },
    { icon: "G", color: "#2563EB", agent: "Gemini", desc: "Analizar datos y preparar informe comparativo con recomendaciones", note: "📊 Análisis y redacción" },
    { icon: "H", color: PURPLE, agent: "Hermes", desc: "Consolidar en PDF y registrar en la bóveda de Obsidian", note: "📄 Entrega final" },
  ];

  const execSteps = [
    { agent: "Perplexity", desc: "Investigación completada", status: "done" as const },
    { agent: "Gemini", desc: "Analizando datos…", status: "working" as const },
    { agent: "Hermes", desc: "Esperando a Gemini", status: "pending" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-5" style={{ background: PARCHMENT }}>
      {/* Progress stepper */}
      <div className="flex items-center justify-center gap-0 mb-5">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold"
                style={{
                  background: s.done ? EMERALD : step === s.id ? PURPLE : "rgba(31,41,55,0.08)",
                  color: s.done || step === s.id ? "#fff" : "rgba(31,41,55,0.3)",
                }}>{s.done ? "✓" : i + 1}</div>
              <span className="text-xs font-medium" style={{
                color: step === s.id ? PURPLE : s.done ? EMERALD : "rgba(31,41,55,0.25)",
              }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px mx-2" style={{
                background: (s.done || (step === "plan" && i === 0)) ? EMERALD : "rgba(31,41,55,0.08)"
              }} />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🧠</span>
        <h2 className="text-lg font-black" style={{ fontFamily: "'Syne', sans-serif", color: INK }}>Consejo de agentes</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: "rgba(31,41,55,0.4)" }}>
        Describe qué necesitas. Hermes arma el plan con los agentes adecuados.
      </p>

      {/* Step 1: Describe */}
      {step === "describe" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <textarea value={mission} onChange={e => setMission(e.target.value)}
            placeholder="Ej: Necesito un informe de flota nueva de La Carolina con KPIs de rendimiento, comparativa contra el mes anterior y recomendaciones operativas para la reunión con John y Edith."
            rows={6} className="w-full rounded-xl p-4 text-sm resize-none outline-none"
            style={{ background: "rgba(247,239,226,0.9)", border: "1px solid rgba(76,29,149,0.12)", color: INK, fontFamily: "'Outfit', sans-serif" }} />
          <div className="flex justify-end mt-3">
            <button onClick={handleSend} disabled={!mission.trim()}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer"
              style={{ background: mission.trim() ? PURPLE : "rgba(76,29,149,0.1)", color: mission.trim() ? PARCHMENT : "rgba(31,41,55,0.3)" }}>
              Enviar a Hermes →
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review plan */}
      {step === "plan" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl p-4" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.08)" }}>
            <div className="text-sm font-semibold mb-3" style={{ color: INK }}>🤖 Hermes propone este plan</div>
            {planItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 relative">
                {i < planItems.length - 1 && (
                  <div className="absolute left-3 top-8 w-0.5 h-6" style={{ background: "rgba(76,29,149,0.08)" }} />
                )}
                <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: item.color }}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold" style={{ color: PURPLE }}>{item.agent}</div>
                  <div className="text-sm" style={{ color: INK }}>{item.desc}</div>
                  <div className="text-2xs mt-0.5" style={{ color: "rgba(31,41,55,0.35)" }}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep("describe")} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border"
              style={{ border: "1px solid rgba(76,29,149,0.12)", color: "rgba(31,41,55,0.5)", background: "transparent" }}>
              ✏️ Editar
            </button>
            <button onClick={handleExecute} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none"
              style={{ background: EMERALD, color: PARCHMENT }}>
              ✅ Ejecutar plan
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Execute */}
      {step === "execute" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-xl p-4" style={{ background: "rgba(247,239,226,0.7)", border: "1px solid rgba(76,29,149,0.08)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">⚙️</span>
              <span className="text-sm font-semibold" style={{ color: INK }}>Ejecutando plan</span>
            </div>
            {execSteps.map((es, i) => {
              const dotBg = es.status === "done" ? EMERALD : es.status === "working" ? "#D97706" : "rgba(31,41,55,0.08)";
              const dotIcon = es.status === "done" ? "✓" : es.status === "working" ? "↻" : String(i + 1);
              const statusText = es.status === "done" ? "✅ Listo" : es.status === "working" ? "🔄 Trabajando" : "⏳ Pendiente";
              const statusColor = es.status === "done" ? EMERALD : es.status === "working" ? "#D97706" : "rgba(31,41,55,0.3)";
              return (
                <div key={i} className="flex items-start gap-3 py-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold text-white flex-shrink-0" style={{ background: dotBg }}>
                    {dotIcon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: PURPLE }}>{es.agent}</div>
                    <div className="text-sm" style={{ color: INK }}>{es.desc}</div>
                    <div className="text-xs font-medium mt-0.5" style={{ color: statusColor }}>{statusText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
