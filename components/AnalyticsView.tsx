"use client";
import { motion } from "framer-motion";

const AGENTS = [
  { name:"Claude",  tokens:142, calls:203, color:"#F72585", rgb:"209,132,73" },
  { name:"ChatGPT", tokens:89,  calls:347, color:"#00A676", rgb:"138,154,85"  },
  { name:"Gemini",  tokens:203, calls:156, color:"#5F8C94", rgb:"95,140,148"  },
  { name:"Hermes",  tokens:0,   calls:0,   color:"#6D28D9", rgb:"226,178,79"  },
];

function StatCard({ label, value, unit, delta, color, delay }: { label:string; value:string; unit:string; delta:string; color:string; delay:number }) {
  const rgb = color==="#F72585"?"209,132,73":color==="#00A676"?"138,154,85":color==="#5F8C94"?"95,140,148":"226,178,79";
  const positive = delta.startsWith("+");
  return (
    <motion.div initial={{ y:16, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay, duration:0.5, ease:[0.22,1,0.36,1] }}
      className="rounded-xl p-5 relative overflow-hidden"
      style={{ background:`rgba(${rgb},0.04)`, border:`1px solid rgba(${rgb},0.15)` }}
      whileHover={{ y:-2, boxShadow:`0 8px 32px rgba(${rgb},0.12)` }}>
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10" style={{ background:color }} />
      <div className="text-[10px] tracking-[0.15em] uppercase mb-2" style={{ fontFamily:"var(--font-jetbrains)", color:"rgba(31,41,55,0.5)" }}>{label}</div>
      <div className="text-3xl font-bold" style={{ fontFamily:"var(--font-syne)", color }}>
        {value}<span className="text-sm ml-1" style={{ color:"rgba(31,41,55,0.5)" }}>{unit}</span>
      </div>
      <div className="mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ fontFamily:"var(--font-jetbrains)", background:positive?"rgba(0,166,118,0.1)":"rgba(239,68,68,0.1)", color:positive?"#00A676":"#EF4444" }}>
        {delta}
      </div>
    </motion.div>
  );
}

export default function AnalyticsView() {
  const total = AGENTS.reduce((s,a) => s+a.tokens, 0);
  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background:"#F72585" }} />
        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily:"var(--font-syne)", color:"#F72585" }}>Analytics</span>
        <div className="flex-1 h-px" style={{ background:"rgba(247,37,133,0.08)" }} />
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Tokens" value={`${total}k`} unit="/hr" delta="+12%" color="#6D28D9" delay={0.1} />
        <StatCard label="API Calls"    value="706"       unit=""    delta="+8%"  color="#F72585" delay={0.15} />
        <StatCard label="Success Rate" value="98.7"      unit="%"   delta="+1%"  color="#00A676" delay={0.2} />
      </div>

      {/* Per-agent table */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="rounded-xl overflow-hidden" style={{ border:"1px solid rgba(109,40,217,0.1)" }}>
        <div className="grid gap-4 px-5 py-3" style={{ gridTemplateColumns:"1fr 80px 80px 60px", background:"rgba(109,40,217,0.04)", borderBottom:"1px solid rgba(109,40,217,0.07)" }}>
          {["Agent","Tokens","Calls","Status"].map(h => (
            <div key={h} className="text-[9px] tracking-widest uppercase" style={{ fontFamily:"var(--font-jetbrains)", color:"rgba(31,41,55,0.4)" }}>{h}</div>
          ))}
        </div>
        {AGENTS.map((a, i) => (
          <motion.div key={a.name} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35+i*0.05 }}
            className="grid gap-4 px-5 py-3"
            style={{ gridTemplateColumns:"1fr 80px 80px 60px", borderBottom:i<AGENTS.length-1?"1px solid rgba(109,40,217,0.05)":"none" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background:a.color }} />
              <span className="text-[12px] font-semibold" style={{ fontFamily:"var(--font-syne)", color:a.color }}>{a.name}</span>
            </div>
            <div className="text-[12px] tabular-nums" style={{ fontFamily:"var(--font-jetbrains)", color:"rgba(226,232,240,0.65)" }}>{a.tokens}k</div>
            <div className="text-[12px] tabular-nums" style={{ fontFamily:"var(--font-jetbrains)", color:"rgba(226,232,240,0.65)" }}>{a.calls.toLocaleString()}</div>
            <div className="text-[10px] px-2 py-0.5 rounded-full text-center"
              style={{ fontFamily:"var(--font-jetbrains)", background:a.calls>0?"rgba(0,166,118,0.1)":"rgba(31,41,55,0.08)", color:a.calls>0?"#00A676":"rgba(31,41,55,0.4)" }}>
              {a.calls>0?"Active":"Idle"}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
