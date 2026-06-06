"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Check, Trash2, Mic, MicOff, Save } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { emitNexusEvent } from "@/lib/nexusEvents";

interface Goal { id: string; text: string; done: boolean; createdAt: string; }

export default function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [obsidianOk, setObsidianOk] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load goals from Obsidian on mount
  useEffect(() => {
    fetch("/api/obsidian?type=goals")
      .then(r => r.json())
      .then(d => { if (d.goals) setGoals(d.goals); setObsidianOk(true); })
      .catch(() => setObsidianOk(false));
  }, []);

  const { state: voiceState, start: startVoice, isSupported: voiceSupported } = useVoiceInput({
    onTranscript: (text, isFinal) => { if (isFinal) setInput(prev => (prev + " " + text).trim()); },
  });

  // Auto-save to Obsidian whenever goals change (debounced 800ms)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "goals", goals }),
      })
        .then(r => { if (r.ok) { setSaved(true); setObsidianOk(true); setTimeout(() => setSaved(false), 2000); emitNexusEvent({ type: "info", agent: "OBSIDIAN", message: "Goals synced to vault", detail: `${goals.length} goals saved` }); } })
        .catch(() => setObsidianOk(false))
        .finally(() => setSaving(false));
    }, 800);
  }, [goals]);

  const addGoal = () => {
    const text = input.trim();
    if (!text) return;
    const newGoal: Goal = { id: Date.now().toString(), text, done: false, createdAt: new Date().toISOString() };
    setGoals(prev => [...prev, newGoal]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, done: !g.done } : g);
      const goal = updated.find(g => g.id === id);
      if (goal?.done) {
        emitNexusEvent({ type: "success", agent: "GOALS", message: "Goal completed", detail: goal.text.slice(0, 40) });
      }
      return updated;
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const saveToObsidian = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "goals", goals }),
      });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); setObsidianOk(true); }
    } catch { setObsidianOk(false); }
    finally { setSaving(false); }
  };

  const done = goals.filter(g => g.done).length;
  const pct = goals.length > 0 ? Math.round((done / goals.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full" style={{ background: "#6D28D9" }} />
          <div>
            <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-syne)", color: "#07182E" }}>Goals</h1>
            <p className="text-[12px]" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.5)" }}>
              {done}/{goals.length} completados · {pct}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {obsidianOk === true && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,166,118,0.1)", border: "1px solid rgba(0,166,118,0.2)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00A676" }} />
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#00A676" }}>Obsidian</span>
            </div>
          )}
          {obsidianOk === false && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(109,40,217,0.1)", border: "1px solid rgba(109,40,217,0.2)" }}>
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: "#6D28D9" }}>Set OBSIDIAN_VAULT_PATH</span>
            </div>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={saveToObsidian} disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: saved ? "rgba(0,166,118,0.15)" : "rgba(109,40,217,0.08)", border: saved ? "1px solid rgba(0,166,118,0.3)" : "1px solid rgba(109,40,217,0.2)", cursor: "pointer" }}>
            <Save size={13} style={{ color: saved ? "#00A676" : "#6D28D9" }} />
            <span className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-syne)", color: saved ? "#00A676" : "#6D28D9" }}>
              {saved ? "¡Guardado!" : saving ? "Guardando…" : "Guardar en Obsidian"}
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Progress bar */}
      {goals.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl p-4"
          style={{ background: "rgba(109,40,217,0.04)", border: "1px solid rgba(109,40,217,0.1)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: "rgba(31,41,55,0.5)" }}>Progreso total</span>
            <span className="text-[13px] font-bold" style={{ fontFamily: "var(--font-jetbrains)", color: "#6D28D9" }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(109,40,217,0.1)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg,#6D28D9,#F72585)" }}
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </motion.div>
      )}

      {/* Goals list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <AnimatePresence>
          {goals.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-32 gap-3">
              <Target size={32} style={{ color: "rgba(109,40,217,0.2)" }} />
              <p className="text-sm" style={{ fontFamily: "var(--font-outfit)", color: "rgba(31,41,55,0.4)" }}>
                Sin metas aún — agrega tu primera
              </p>
            </motion.div>
          )}
          {goals.map((goal, i) => (
            <motion.div key={goal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3.5 rounded-xl group"
              style={{ background: goal.done ? "rgba(0,166,118,0.05)" : "rgba(7,24,46,0.03)", border: goal.done ? "1px solid rgba(0,166,118,0.15)" : "1px solid rgba(7,24,46,0.06)" }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleGoal(goal.id)}
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: goal.done ? "#00A676" : "rgba(7,24,46,0.06)", border: goal.done ? "none" : "1px solid rgba(7,24,46,0.12)", cursor: "pointer" }}>
                {goal.done && <Check size={13} style={{ color: "#F7EFE2" }} strokeWidth={3} />}
              </motion.button>
              <span className="flex-1 text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-outfit)", color: goal.done ? "rgba(31,41,55,0.5)" : "rgba(226,232,240,0.85)", textDecoration: goal.done ? "line-through" : "none" }}>
                {goal.text}
              </span>
              <motion.button initial={{ opacity: 0 }} whileHover={{ opacity: 1, scale: 1.1 }} className="opacity-0 group-hover:opacity-100 p-1 rounded"
                style={{ cursor: "pointer", background: "none", border: "none" }} onClick={() => deleteGoal(goal.id)}>
                <Trash2 size={13} style={{ color: "rgba(239,68,68,0.5)" }} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 rounded-xl"
        style={{ background: "rgba(13,20,40,0.9)", border: "1px solid rgba(109,40,217,0.2)" }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addGoal()}
          placeholder="Nueva meta… (Enter para agregar)"
          className="flex-1 bg-transparent focus:outline-none text-sm"
          style={{ fontFamily: "var(--font-outfit)", color: "#07182E" }} />
        {voiceSupported && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startVoice}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: voiceState === "listening" ? "rgba(239,68,68,0.15)" : "rgba(7,24,46,0.05)", border: "1px solid rgba(7,24,46,0.08)", cursor: "pointer" }}>
            {voiceState === "listening"
              ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><Mic size={13} style={{ color: "#EF4444" }} /></motion.div>
              : <MicOff size={13} style={{ color: "rgba(31,41,55,0.4)" }} />}
          </motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addGoal}
          className="w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ background: input.trim() ? "#6D28D9" : "rgba(109,40,217,0.1)", border: "none", cursor: input.trim() ? "pointer" : "default" }}>
          <Plus size={15} style={{ color: input.trim() ? "#F7EFE2" : "rgba(109,40,217,0.3)" }} />
        </motion.button>
      </div>
    </div>
  );
}
