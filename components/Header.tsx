"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Shield, Terminal, Zap, ChevronRight } from "lucide-react";
function Metric({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-[0.15em] uppercase" style={{color:"rgba(148,163,184,0.7)",fontFamily:"var(--font-jetbrains)"}}>{label}</span>
      <div className="w-16 h-1 rounded-full" style={{background:"rgba(255,255,255,0.06)"}}>
        <motion.div className="h-full rounded-full" style={{background:color}} initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:1.5,ease:"easeOut"}}/>
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{color,fontFamily:"var(--font-jetbrains)"}}>{value}%</span>
    </div>
  );
}
export default function Header({ onOpenCommand }: { onOpenCommand:()=>void }) {
  const [time,setTime]=useState(""); const [date,setDate]=useState("");
  const [metrics,setMetrics]=useState({cpu:34,mem:67,neural:48});
  useEffect(()=>{const tick=()=>{const n=new Date();setTime(n.toLocaleTimeString("en-US",{hour12:false}));setDate(n.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}))};tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{const id=setInterval(()=>setMetrics({cpu:Math.floor(Math.random()*40+20),mem:Math.floor(Math.random()*30+50),neural:Math.floor(Math.random()*60+30)}),3000);return()=>clearInterval(id);},[]);
  return (
    <motion.header initial={{y:-60,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} className="relative z-20 flex items-center justify-between px-6 h-14 glass" style={{borderTop:"none",borderLeft:"none",borderRight:"none"}}>
      <div className="flex items-center gap-4">
        <div className="relative flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-sm animate-spin-slow" style={{background:"conic-gradient(from 0deg, rgba(34,211,238,0.8), rgba(167,139,250,0.4), rgba(34,211,238,0.8))",padding:"1px",borderRadius:"4px"}}><div className="w-full h-full rounded-sm" style={{background:"#050a18"}}/></div>
            <Zap size={14} className="relative z-10" style={{color:"#22d3ee"}}/>
          </div>
          <div>
            <div className="text-sm font-bold tracking-[0.2em]" style={{fontFamily:"var(--font-syne)",color:"#22d3ee",textShadow:"0 0 12px rgba(34,211,238,0.6)"}}>NEXUS OS</div>
            <div className="text-[9px] tracking-[0.15em]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.5)"}}>v2.1.0 · NEURAL CORE ACTIVE</div>
          </div>
        </div>
        <div className="w-px h-6" style={{background:"rgba(34,211,238,0.15)"}}/>
        <div className="flex items-center gap-1" style={{fontFamily:"var(--font-jetbrains)"}}>
          <span className="text-[11px]" style={{color:"rgba(148,163,184,0.5)"}}>AI</span>
          <ChevronRight size={10} style={{color:"rgba(148,163,184,0.3)"}}/>
          <span className="text-[11px]" style={{color:"#22d3ee"}}>Command Center</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Metric label="CPU" value={metrics.cpu} color="#22d3ee"/>
        <div className="w-px h-4" style={{background:"rgba(34,211,238,0.1)"}}/>
        <Metric label="MEM" value={metrics.mem} color="#a78bfa"/>
        <div className="w-px h-4" style={{background:"rgba(34,211,238,0.1)"}}/>
        <Metric label="NEURAL" value={metrics.neural} color="#34d399"/>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full dot-active"/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"#34d399"}}>Claude</span></div>
          <div className="flex items-center gap-1.5"><Shield size={11} style={{color:"#fbbf24"}}/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(251,191,36,0.8)"}}>Secure</span></div>
          <div className="flex items-center gap-1.5"><Wifi size={11} style={{color:"#34d399"}}/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(52,211,153,0.8)"}}>Online</span></div>
        </div>
        <div className="w-px h-6" style={{background:"rgba(34,211,238,0.15)"}}/>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums" style={{fontFamily:"var(--font-jetbrains)",color:"#22d3ee",textShadow:"0 0 12px rgba(34,211,238,0.6)"}}>{time}</div>
          <div className="text-[9px] tracking-widest" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.4)"}}>{date}</div>
        </div>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={onOpenCommand} className="flex items-center gap-2 px-3 py-1.5 rounded-sm" style={{background:"rgba(34,211,238,0.06)",border:"1px solid rgba(34,211,238,0.2)",cursor:"pointer"}}>
          <Terminal size={12} style={{color:"#22d3ee"}}/>
          <span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.7)"}}>⌘K</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
