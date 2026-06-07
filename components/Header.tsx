"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Shield, Terminal, Zap, ChevronRight } from "lucide-react";
function Metric({ label, value, color }: { label:string; value:number; color:string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] tracking-[0.15em] uppercase" style={{color:"rgba(31,41,55,0.7)",fontFamily:"var(--font-jetbrains)"}}>{label}</span>
      <div className="w-16 h-1 rounded-full" style={{background:"rgba(7,24,46,0.06)"}}>
        <motion.div className="h-full rounded-full" style={{background:color}} initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:1.5,ease:"easeOut"}}/>
      </div>
      <span className="text-[11px] font-medium tabular-nums" style={{color,fontFamily:"var(--font-jetbrains)"}}>{value}%</span>
    </div>
  );
}
interface ProviderHealth{id:string;configured:boolean;reachable:boolean|null;error?:string;}

export default function Header({ onOpenCommand }: { onOpenCommand:()=>void }) {
  const [time,setTime]=useState(""); const [date,setDate]=useState("");
  const [metrics,setMetrics]=useState({cpu:34,mem:67,neural:48});
  const [claudeHealth,setClaudeHealth]=useState<ProviderHealth|null>(null);
  useEffect(()=>{const tick=()=>{const n=new Date();setTime(n.toLocaleTimeString("en-US",{hour12:false}));setDate(n.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}))};tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{const id=setInterval(()=>setMetrics({cpu:Math.floor(Math.random()*40+20),mem:Math.floor(Math.random()*30+50),neural:Math.floor(Math.random()*60+30)}),3000);return()=>clearInterval(id);},[]);
  useEffect(()=>{let cancelled=false;const load=async()=>{try{const r=await fetch("/api/providers",{cache:"no-store"});const d=await r.json() as {providers?:ProviderHealth[]};if(!cancelled)setClaudeHealth((d.providers??[]).find(p=>p.id==="claude")??null);}catch{if(!cancelled)setClaudeHealth(null);}};load();const id=setInterval(load,30000);return()=>{cancelled=true;clearInterval(id);};},[]);
  const claudeOk=claudeHealth?.reachable===true;
  const claudeNeedsKey=claudeHealth?.configured===false;
  const claudeLabel=claudeOk?"Claude":claudeNeedsKey?"Claude Key":"Claude Auth";
  const claudeColor=claudeOk?"#00A676":"#EF4444";
  return (
    <motion.header initial={false} animate={{y:0,opacity:1}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} className="relative z-20 flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 h-14 glass" style={{borderTop:"none",borderLeft:"none",borderRight:"none"}}>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="relative flex items-center gap-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-sm animate-spin-slow" style={{background:"conic-gradient(from 0deg, rgba(109,40,217,0.8), rgba(247,37,133,0.4), rgba(109,40,217,0.8))",padding:"1px",borderRadius:"4px"}}><div className="w-full h-full rounded-sm" style={{background:"#F7EFE2"}}/></div>
            <Zap size={14} className="relative z-10" style={{color:"#6D28D9"}}/>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold tracking-[0.16em] sm:tracking-[0.2em]" style={{fontFamily:"var(--font-syne)",color:"#6D28D9",textShadow:"0 0 12px rgba(109,40,217,0.6)"}}>NEXUS OS</div>
            <div className="hidden sm:block text-[9px] tracking-[0.15em]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.5)"}}>v2.1.0 · NEURAL CORE ACTIVE</div>
          </div>
        </div>
        <div className="hidden md:block w-px h-6" style={{background:"rgba(109,40,217,0.15)"}}/>
        <div className="hidden md:flex items-center gap-1" style={{fontFamily:"var(--font-jetbrains)"}}>
          <span className="text-[11px]" style={{color:"rgba(31,41,55,0.5)"}}>AI</span>
          <ChevronRight size={10} style={{color:"rgba(31,41,55,0.3)"}}/>
          <span className="text-[11px]" style={{color:"#6D28D9"}}>Command Center</span>
        </div>
      </div>
      <div className="hidden xl:flex items-center gap-6">
        <Metric label="CPU" value={metrics.cpu} color="#6D28D9"/>
        <div className="w-px h-4" style={{background:"rgba(109,40,217,0.1)"}}/>
        <Metric label="MEM" value={metrics.mem} color="#F72585"/>
        <div className="w-px h-4" style={{background:"rgba(109,40,217,0.1)"}}/>
        <Metric label="NEURAL" value={metrics.neural} color="#00A676"/>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{background:claudeColor}}/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:claudeColor}}>{claudeLabel}</span></div>
          <div className="flex items-center gap-1.5"><Shield size={11} style={{color:"#6D28D9"}}/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(109,40,217,0.8)"}}>Secure</span></div>
          <div className="flex items-center gap-1.5"><Wifi size={11} style={{color:"#00A676"}}/><span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(0,166,118,0.8)"}}>Online</span></div>
        </div>
        <div className="hidden sm:block w-px h-6" style={{background:"rgba(109,40,217,0.15)"}}/>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums" style={{fontFamily:"var(--font-jetbrains)",color:"#6D28D9",textShadow:"0 0 12px rgba(109,40,217,0.6)"}}>{time}</div>
          <div className="text-[9px] tracking-widest" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.4)"}}>{date}</div>
        </div>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={onOpenCommand} className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-sm" style={{background:"rgba(109,40,217,0.06)",border:"1px solid rgba(109,40,217,0.2)",cursor:"pointer"}}>
          <Terminal size={12} style={{color:"#6D28D9"}}/>
          <span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.7)"}}>⌘K</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
