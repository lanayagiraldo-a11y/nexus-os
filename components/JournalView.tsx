"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Save, Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { emitNexusEvent } from "@/lib/nexusEvents";

export default function JournalView() {
  const [entry, setEntry] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [obsidianOk, setObsidianOk] = useState<boolean | null>(null);
  const [voiceInput, setVoiceInput] = useState(false);

  const today = new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const todayShort = new Date().toISOString().split("T")[0];

  // Load today's journal
  useEffect(() => {
    fetch("/api/obsidian?type=journal")
      .then(r => r.json())
      .then(d => { if (d.content) setSavedContent(d.content); setObsidianOk(true); })
      .catch(() => setObsidianOk(false));
  }, []);

  const { state: voiceState, start: startVoice, isSupported } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      if (isFinal) { setEntry(prev => (prev + " " + text).trim()); setVoiceInput(true); }
    },
  });

  const saveJournal = async () => {
    if (!entry.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "journal", entry: entry.trim(), voiceInput }),
      });
      if (r.ok) {
        setSaved(true);
        setSavedContent(prev => prev + (prev ? "\n\n---\n\n" : "") + entry.trim());
        emitNexusEvent({
          type: "info",
          agent: "JOURNAL",
          message: voiceInput ? "Voice entry saved to vault" : "Journal entry saved to vault",
          detail: `${entry.trim().split(/\s+/).length} words`,
        });
        setEntry("");
        setVoiceInput(false);
        setObsidianOk(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch { setObsidianOk(false); }
    finally { setSaving(false); }
  };

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ background: "#F72585" }} />
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-syne)", color: "#07182E" }}>Journal</h1>
            <p className="text-[12px] capitalize" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.5)" }}>{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {obsidianOk === true && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,166,118,0.1)", border: "1px solid rgba(0,166,118,0.2)" }}>
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00A676" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#00A676" }}>Obsidian sync</span>
            </div>
          )}
          {obsidianOk === false && (
            <div className="px-2.5 py-1 rounded-full" style={{ background: "rgba(109,40,217,0.1)", border: "1px solid rgba(109,40,217,0.2)" }}>
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#6D28D9" }}>Set OBSIDIAN_VAULT_PATH</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Saved entries from today */}
      {savedContent && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-4 overflow-y-auto max-h-48"
          style={{ background: "rgba(247,37,133,0.04)", border: "1px solid rgba(247,37,133,0.12)" }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={12} style={{ color: "#F72585" }} />
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-jetbrains)", color: "#F72585" }}>
              Entradas de hoy — {todayShort}
            </span>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "var(--font-outfit)", color: "rgba(226,232,240,0.65)" }}>
            {savedContent.replace(/^#.*\n```.*\n```\n\n/, "").slice(0, 600)}
            {savedContent.length > 600 && "…"}
          </div>
        </motion.div>
      )}

      {/* New entry textarea */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.4)" }}>
            Nueva entrada {voiceState === "listening" ? "🎤 Escuchando…" : ""}
          </span>
          <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.3)" }}>
            {wordCount} palabras
          </span>
        </div>

        <textarea value={entry} onChange={e => setEntry(e.target.value)}
          placeholder={`¿Qué quieres registrar hoy?\n\nEscribe libremente o usa el micrófono 🎤`}
          className="flex-1 resize-none focus:outline-none text-sm leading-relaxed p-4 rounded-xl"
          style={{
            fontFamily: "var(--font-outfit)", color: "#07182E",
            background: "rgba(13,20,40,0.9)",
            border: voiceState === "listening" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(247,37,133,0.2)",
            transition: "border-color 0.3s ease",
          }} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isSupported && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startVoice}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: voiceState === "listening" ? "rgba(239,68,68,0.15)" : "rgba(247,37,133,0.08)",
                border: voiceState === "listening" ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(247,37,133,0.2)",
                cursor: "pointer",
              }}>
              {voiceState === "listening"
                ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Mic size={14} style={{ color: "#EF4444" }} /></motion.div>
                : <MicOff size={14} style={{ color: "#F72585" }} />}
              <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: voiceState === "listening" ? "#EF4444" : "#F72585" }}>
                {voiceState === "listening" ? "Detener" : "Hablar"}
              </span>
            </motion.button>
          )}

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={saveJournal}
            disabled={!entry.trim() || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl ml-auto"
            style={{
              background: saved ? "rgba(0,166,118,0.15)" : entry.trim() ? "rgba(247,37,133,0.15)" : "rgba(7,24,46,0.04)",
              border: saved ? "1px solid rgba(0,166,118,0.35)" : entry.trim() ? "1px solid rgba(247,37,133,0.35)" : "1px solid rgba(7,24,46,0.06)",
              cursor: entry.trim() ? "pointer" : "default",
            }}>
            <Save size={14} style={{ color: saved ? "#00A676" : "#F72585" }} />
            <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: saved ? "#00A676" : "#F72585" }}>
              {saved ? "¡Guardado en Obsidian!" : saving ? "Guardando…" : "Guardar entrada"}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
