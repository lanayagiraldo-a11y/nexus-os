"use client";
import { motion } from "framer-motion";
import { LayoutDashboard, BarChart3, Settings, Target, BookOpen, Database, BookMarked } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers";
const ACCENT: Record<ProviderId,string> = { claude:"#a78bfa", openai:"#34d399", gemini:"#60a5fa", hermes:"#fbbf24" };
interface SidebarProps { activeView: string; onViewChange: (v:string)=>void; }
function NavBtn({id,label,icon:Icon,isActive,onClick}:{id:string;label:string;icon:React.ElementType;isActive:boolean;onClick:()=>void}) {
  return (
    <motion.button onClick={onClick} className="relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left" style={{background:isActive?"rgba(34,211,238,0.08)":"transparent",border:isActive?"1px solid rgba(34,211,238,0.2)":"1px solid transparent",cursor:"pointer"}} whileHover={{background:"rgba(255,255,255,0.03)",x:1}} whileTap={{scale:0.98}}>
      {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{background:"#22d3ee"}} transition={{type:"spring",stiffness:450,damping:35}}/>}
      <Icon size={15} style={{color:isActive?"#22d3ee":"rgba(148,163,184,0.7)",flexShrink:0}}/>
      <span className="text-[13px] font-medium flex-1" style={{fontFamily:"var(--font-outfit)",color:isActive?"#e2e8f0":"rgba(203,213,225,0.82)"}}>{label}</span>
    </motion.button>
  );
}
export default function Sidebar({activeView,onViewChange}:SidebarProps) {
  return (
    <motion.aside initial={{x:-80,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:0.5,delay:0.1,ease:[0.22,1,0.36,1]}} className="flex flex-col" style={{width:216,flexShrink:0,background:"rgba(5,10,24,0.85)",borderRight:"1px solid rgba(34,211,238,0.08)",backdropFilter:"blur(20px)"}}>
      <div className="p-3 pb-2">
        <p className="text-[9px] tracking-[0.2em] uppercase px-3 mb-2" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.55)"}}>Overview</p>
        <NavBtn id="dashboard" label="Command Center" icon={LayoutDashboard} isActive={activeView==="dashboard"} onClick={()=>onViewChange("dashboard")}/>
        <NavBtn id="analytics" label="Analytics"    icon={BarChart3}       isActive={activeView==="analytics"} onClick={()=>onViewChange("analytics")}/>
        <NavBtn id="goals"     label="Goals 🎯"    icon={Target}          isActive={activeView==="goals"}     onClick={()=>onViewChange("goals")}/>
        <NavBtn id="journal"   label="Journal 📓"  icon={BookOpen}        isActive={activeView==="journal"}   onClick={()=>onViewChange("journal")}/>
        <NavBtn id="memory"    label="Memory"       icon={Database}        isActive={activeView==="memory"}    onClick={()=>onViewChange("memory")}/>
        <NavBtn id="guide"     label="Guía 📖"     icon={BookMarked}      isActive={activeView==="guide"}     onClick={()=>onViewChange("guide")}/>
      </div>
      <div className="mx-3 my-1" style={{height:1,background:"rgba(34,211,238,0.07)"}}/>
      <div className="p-3 flex-1">
        <p className="text-[9px] tracking-[0.2em] uppercase px-3 mb-2" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.55)"}}>AI Agents</p>
        {PROVIDERS.map((p,i)=>{
          const viewId=`agent-${p.id}`; const isActive=activeView===viewId; const color=ACCENT[p.id as ProviderId];
          return (
            <motion.button key={p.id} initial={{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.18+i*0.05}} onClick={()=>onViewChange(viewId)} className="relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg mb-0.5 text-left" style={{background:isActive?`rgba(${p.accentRgb},0.1)`:"transparent",border:isActive?`1px solid rgba(${p.accentRgb},0.2)`:"1px solid transparent",cursor:"pointer"}} whileHover={{background:"rgba(255,255,255,0.03)",x:1}} whileTap={{scale:0.98}}>
              {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{background:color}} transition={{type:"spring",stiffness:450,damping:35}}/>}
              <AgentAvatar provider={p.id as ProviderId} size={22}/>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold leading-tight" style={{fontFamily:"var(--font-outfit)",color:isActive?color:`rgba(${p.accentRgb},0.92)`}}>{p.name}</div>
                <div className="text-[10px] truncate mt-0.5" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(148,163,184,0.55)"}}>{p.modelLabel}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="mx-3 mb-1" style={{height:1,background:"rgba(34,211,238,0.07)"}}/>
      <div className="p-3 pt-1">
        <NavBtn id="settings" label="Settings" icon={Settings} isActive={activeView==="settings"} onClick={()=>onViewChange("settings")}/>
        <div className="mt-3 p-3 rounded-xl" style={{background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.1)"}}>
          <div className="flex items-center gap-2 mb-2">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{background:"#34d399"}} animate={{opacity:[1,0.3,1]}} transition={{duration:2,repeat:Infinity}}/>
            <span className="text-[10px] font-semibold" style={{fontFamily:"var(--font-syne)",color:"#34d399"}}>NEXUS Online</span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_,i)=><motion.div key={i} className="flex-1 h-0.5 rounded-full" style={{background:"#34d399"}} animate={{scaleX:[0.3,1,0.3],opacity:[0.3,0.8,0.3]}} transition={{duration:1.4,repeat:Infinity,delay:i*0.12,ease:"easeInOut"}}/>)}
          </div>
          <div className="mt-1 text-[9px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(52,211,153,0.5)"}}>4 agents registered</div>
        </div>
      </div>
    </motion.aside>
  );
}
