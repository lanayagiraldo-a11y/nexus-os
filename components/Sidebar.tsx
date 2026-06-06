"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, BarChart3, Settings, Target, BookOpen, Database, BookMarked, SunMedium, Inbox, Megaphone, Video, Workflow, Network, BrainCircuit, Menu, X } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers";

const ACCENT: Record<ProviderId,string> = { claude:"#F72585", openai:"#00A676", gemini:"#5F8C94", hermes:"#6D28D9" };

interface SidebarProps { activeView: string; onViewChange: (v:string)=>void; }
interface ProviderHealth { id: ProviderId; configured?: boolean; reachable?: boolean; error?: string; }

function NavBtn({id,label,icon:Icon,isActive,onClick}:{id:string;label:string;icon:React.ElementType;isActive:boolean;onClick:()=>void}) {
  return (
    <motion.button type="button" onClick={onClick} className="relative flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left" style={{background:isActive?"rgba(109,40,217,0.08)":"rgba(109,40,217,0)",border:isActive?"1px solid rgba(109,40,217,0.2)":"1px solid rgba(109,40,217,0)",cursor:"pointer"}} whileHover={{background:"rgba(7,24,46,0.03)",x:1}} whileTap={{scale:0.98}}>
      {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full" style={{background:"#6D28D9"}} transition={{type:"spring",stiffness:450,damping:35}}/>}
      <Icon size={15} style={{color:isActive?"#6D28D9":"rgba(31,41,55,0.7)",flexShrink:0}}/>
      <span className="text-[13px] font-medium flex-1" style={{fontFamily:"var(--font-outfit)",color:isActive?"#07182E":"rgba(7,24,46,0.82)"}}>{label}</span>
    </motion.button>
  );
}

const overviewItems = [
  {id:"dashboard", label:"Command Center", icon:LayoutDashboard},
  {id:"orchestrator", label:"Orquestador", icon:BrainCircuit},
  {id:"today", label:"Hoy ☀️", icon:SunMedium},
  {id:"inbox", label:"Inbox universal", icon:Inbox},
  {id:"marketing", label:"Marketing CC", icon:Megaphone},
  {id:"audiovisuales", label:"Audiovisuales", icon:Video},
  {id:"workflows", label:"Workflows", icon:Workflow},
  {id:"empresas", label:"Empresas/Personas", icon:Network},
  {id:"analytics", label:"Analytics", icon:BarChart3},
  {id:"goals", label:"Goals 🎯", icon:Target},
  {id:"journal", label:"Journal 📓", icon:BookOpen},
  {id:"memory", label:"Memory", icon:Database},
  {id:"guide", label:"Guía 📖", icon:BookMarked},
];

function SidebarContent({activeView,onNavigate,health}:{activeView:string;onNavigate:(v:string)=>void;health:Record<string,ProviderHealth>}) {
  return (
    <>
      <div className="p-3 pb-2">
        <p className="text-[9px] tracking-[0.2em] uppercase px-3 mb-2" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.55)"}}>Overview</p>
        {overviewItems.map(item => <NavBtn key={item.id} id={item.id} label={item.label} icon={item.icon} isActive={activeView===item.id} onClick={()=>onNavigate(item.id)}/>)}
      </div>
      <div className="mx-3 my-1" style={{height:1,background:"rgba(109,40,217,0.07)"}}/>
      <div className="p-3 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[9px] tracking-[0.24em] uppercase" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.55)"}}>AI Agents</p>
          <span className="text-[9px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(109,40,217,0.55)"}}>{PROVIDERS.length}</span>
        </div>
        <div className="space-y-1.5">
          {PROVIDERS.map((p,i)=>{
            const viewId=`agent-${p.id}`;
            const isActive=activeView===viewId;
            const color=ACCENT[p.id as ProviderId];
            const status = health[p.id];
            const online = status?.reachable === true;
            const configured = status?.configured !== false;
            const statusLabel = online ? "Online" : configured ? "Standby" : "Setup";
            const statusColor = online ? "#00A676" : configured ? "#6D28D9" : "#EF4444";
            return (
              <motion.button type="button" key={p.id} initial={{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.18+i*0.05}} onClick={()=>onNavigate(viewId)} className="group relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left" style={{background:isActive?`linear-gradient(90deg, rgba(${p.accentRgb},0.16), rgba(${p.accentRgb},0.05))`:"rgba(7,24,46,0.015)",border:isActive?`1px solid rgba(${p.accentRgb},0.28)`:"1px solid rgba(7,24,46,0.035)",boxShadow:isActive?`0 0 18px rgba(${p.accentRgb},0.12)`:"none",cursor:"pointer"}} whileHover={{background:`rgba(${p.accentRgb},0.08)`,x:1}} whileTap={{scale:0.98}}>
                {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{background:color}} transition={{type:"spring",stiffness:450,damping:35}}/>}
                <div className="relative shrink-0">
                  <AgentAvatar provider={p.id as ProviderId} size={24}/>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full" style={{background:statusColor,border:"1px solid rgba(52,35,22,0.95)",boxShadow:`0 0 8px ${statusColor}`}} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-black leading-tight" style={{fontFamily:"var(--font-syne)",color:isActive?color:`rgba(${p.accentRgb},0.96)`}}>{p.name}</div>
                  <div className="text-[10px] truncate mt-0.5" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.58)"}}>{p.modelLabel}</div>
                </div>
                <div className="hidden group-hover:flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{background:`rgba(${online ? "138,154,85" : configured ? "226,178,79" : "196,98,58"},0.08)`,border:`1px solid ${statusColor}33`}}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{background:statusColor}} />
                  <span className="text-[8px] uppercase" style={{fontFamily:"var(--font-jetbrains)",color:statusColor}}>{statusLabel}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="mx-3 mb-1" style={{height:1,background:"rgba(109,40,217,0.07)"}}/>
      <div className="p-3 pt-1">
        <NavBtn id="settings" label="Settings" icon={Settings} isActive={activeView==="settings"} onClick={()=>onNavigate("settings")}/>
        <div className="mt-3 p-3 rounded-xl" style={{background:"rgba(109,40,217,0.04)",border:"1px solid rgba(109,40,217,0.1)"}}>
          <div className="flex items-center gap-2 mb-2">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{background:"#00A676"}} animate={{opacity:[1,0.3,1]}} transition={{duration:2,repeat:Infinity}}/>
            <span className="text-[10px] font-semibold" style={{fontFamily:"var(--font-syne)",color:"#00A676"}}>NEXUS Online</span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_,i)=><motion.div key={i} className="flex-1 h-0.5 rounded-full" style={{background:"#00A676"}} animate={{scaleX:[0.3,1,0.3],opacity:[0.3,0.8,0.3]}} transition={{duration:1.4,repeat:Infinity,delay:i*0.12,ease:"easeInOut"}}/>)}
          </div>
          <div className="mt-1 text-[9px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(0,166,118,0.5)"}}>{PROVIDERS.length} agents registered</div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({activeView,onViewChange}:SidebarProps) {
  const [health, setHealth] = useState<Record<string, ProviderHealth>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadHealth = async () => {
      try {
        const response = await fetch("/api/providers", { cache: "no-store" });
        const payload = await response.json() as { providers?: ProviderHealth[] };
        if (!cancelled) setHealth(Object.fromEntries((payload.providers ?? []).map(p => [p.id, p])));
      } catch {
        if (!cancelled) setHealth({});
      }
    };
    loadHealth();
    const timer = window.setInterval(loadHealth, 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const navigate = (view:string) => {
    onViewChange(view);
    setMobileOpen(false);
  };

  return (
    <>
      <motion.aside initial={{x:-80,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:0.5,delay:0.1,ease:[0.22,1,0.36,1]}} className="hidden md:flex flex-col overflow-y-auto" style={{width:216,flexShrink:0,background:"rgba(52,35,22,0.78)",borderRight:"1px solid rgba(109,40,217,0.08)",backdropFilter:"blur(20px)"}}>
        <SidebarContent activeView={activeView} onNavigate={navigate} health={health}/>
      </motion.aside>

      <button type="button" aria-label="Abrir barra izquierda" onClick={()=>setMobileOpen(true)} className="md:hidden fixed left-3 top-[70px] z-50 flex items-center gap-2 rounded-full px-3 py-2 shadow-lg" style={{background:"rgba(247,239,226,0.94)",border:"1px solid rgba(109,40,217,0.18)",color:"#6D28D9",fontFamily:"var(--font-outfit)",backdropFilter:"blur(14px)"}}>
        <Menu size={16}/><span className="text-xs font-bold">Menú</span>
      </button>

      <AnimatePresence>
        {mobileOpen&&(
          <>
            <motion.button type="button" aria-label="Cerrar menú" className="md:hidden fixed inset-0 z-50" style={{background:"rgba(7,24,46,0.30)",backdropFilter:"blur(2px)"}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMobileOpen(false)}/>
            <motion.aside className="md:hidden fixed inset-y-0 left-0 z-[60] flex flex-col overflow-y-auto" style={{width:286,maxWidth:"82vw",background:"rgba(247,239,226,0.98)",borderRight:"1px solid rgba(109,40,217,0.16)",boxShadow:"24px 0 80px rgba(7,24,46,0.24)",backdropFilter:"blur(24px)"}} initial={{x:-320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-320,opacity:0}} transition={{duration:0.22,ease:[0.22,1,0.36,1]}}>
              <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid rgba(109,40,217,0.10)"}}>
                <div>
                  <div className="text-sm font-black tracking-[0.24em]" style={{fontFamily:"var(--font-syne)",color:"#6D28D9"}}>NEXUS</div>
                  <div className="text-[10px] uppercase tracking-[0.18em]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.58)"}}>barra izquierda</div>
                </div>
                <button type="button" aria-label="Cerrar barra izquierda" onClick={()=>setMobileOpen(false)} className="rounded-full p-2" style={{background:"rgba(109,40,217,0.08)",color:"#6D28D9"}}><X size={16}/></button>
              </div>
              <SidebarContent activeView={activeView} onNavigate={navigate} health={health}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2" style={{background:"linear-gradient(180deg, rgba(247,239,226,0), rgba(247,239,226,0.96) 18%, rgba(52,35,22,0.98))",borderTop:"1px solid rgba(109,40,217,0.10)",backdropFilter:"blur(18px)"}}>
        <div className="grid grid-cols-5 gap-1 rounded-2xl p-1" style={{background:"rgba(247,239,226,0.78)",border:"1px solid rgba(109,40,217,0.12)"}}>
          {[
            {id:"dashboard",label:"Inicio",icon:LayoutDashboard},
            {id:"orchestrator",label:"AI",icon:BrainCircuit},
            {id:"today",label:"Hoy",icon:SunMedium},
            {id:"marketing",label:"Mkt",icon:Megaphone},
            {id:"audiovisuales",label:"Audiov.",icon:Video},
          ].map(({id,label,icon:Icon})=>{
            const isActive=activeView===id;
            return <button type="button" key={id} onClick={()=>onViewChange(id)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2" style={{background:isActive?"rgba(109,40,217,0.10)":"rgba(109,40,217,0)",border:isActive?"1px solid rgba(109,40,217,0.22)":"1px solid rgba(109,40,217,0)",color:isActive?"#6D28D9":"rgba(7,24,46,0.72)",fontFamily:"var(--font-outfit)"}}>
              <Icon size={16}/>
              <span className="text-[10px] font-semibold truncate max-w-full">{label}</span>
            </button>;
          })}
        </div>
      </nav>
    </>
  );
}
