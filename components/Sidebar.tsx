"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, BrainCircuit, ChevronDown, Menu, X, SunMedium, Megaphone, Video } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers";

const ACCENT: Record<ProviderId,string> = { claude:"#F72585", openai:"#00A676", gemini:"#5F8C94", hermes:"#A855F7" };

interface SidebarProps { activeView: string; onViewChange: (v:string)=>void; }
interface ProviderHealth { id: ProviderId; configured?: boolean; reachable?: boolean; error?: string; }

function NavBtn({id,label,icon:Icon,isActive,onClick}:{id:string;label:string;icon:React.ElementType;isActive:boolean;onClick:()=>void}) {
  return (
    <motion.button type="button" onClick={onClick} className="relative flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-left" style={{background:isActive?"rgba(168,85,247,0.42)":"rgba(255,255,255,0.055)",border:isActive?"1px solid rgba(255,255,255,0.38)":"1px solid rgba(255,255,255,0.12)",cursor:"pointer"}} whileHover={{background:"rgba(255,255,255,0.14)",x:1}} whileTap={{scale:0.98}}>
      {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full" style={{background:"#E9D5FF"}} transition={{type:"spring",stiffness:450,damping:35}}/>}
      <Icon size={22} style={{color:"#FFFFFF",flexShrink:0}}/>
      <span className="text-[21px] font-black flex-1 leading-tight" style={{fontFamily:"var(--font-outfit)",color:"#FFFFFF",textShadow:"0 2px 14px rgba(0,0,0,0.55)"}}>{label}</span>
    </motion.button>
  );
}

const overviewItems = [
  {id:"dashboard", label:"Command Center", icon:LayoutDashboard},
  {id:"orchestrator", label:"Orquestador", icon:BrainCircuit},
];

function SidebarContent({activeView,onNavigate,health}:{activeView:string;onNavigate:(v:string)=>void;health:Record<string,ProviderHealth>}) {
  const [agentsOpen, setAgentsOpen] = useState(true);

  useEffect(() => {
    if (activeView.startsWith("agent-")) setAgentsOpen(true);
  }, [activeView]);

  return (
    <>
      <div className="p-3 pb-2">
        <button type="button" aria-expanded={agentsOpen} onClick={()=>setAgentsOpen(open=>!open)} className="group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left" style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.24)",cursor:"pointer"}}>
          <div>
            <p className="text-[12px] tracking-[0.20em] uppercase font-black" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.92)"}}>AI Agents</p>
            <div className="mt-1 text-[20px] font-black leading-tight" style={{fontFamily:"var(--font-outfit)",color:"#FFFFFF",textShadow:"0 2px 12px rgba(0,0,0,0.40)"}}>Agentes en uso</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full px-2 py-1 text-[12px] font-black" style={{fontFamily:"var(--font-jetbrains)",color:"#FFFFFF",background:"rgba(139,28,246,0.42)",border:"1px solid rgba(255,255,255,0.20)"}}>{PROVIDERS.length}</span>
            <motion.span animate={{rotate:agentsOpen?180:0}} transition={{duration:0.18}} style={{color:"#FFFFFF"}}><ChevronDown size={20}/></motion.span>
          </div>
        </button>
        <AnimatePresence initial={false}>
          {agentsOpen&&(
            <motion.div className="mt-2 space-y-1.5" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.22,1,0.36,1]}}>
              {PROVIDERS.map((p,i)=>{
                const viewId=`agent-${p.id}`;
                const isActive=activeView===viewId;
                const color=ACCENT[p.id as ProviderId];
                const status = health[p.id];
                const online = status?.reachable === true;
                const configured = status?.configured !== false;
                const hasError = configured && status?.reachable === false;
                const statusLabel = online ? "Online" : hasError ? "Error" : configured ? "Standby" : "Setup";
                const statusColor = online ? "#00A676" : hasError ? "#EF4444" : configured ? "#E2B24F" : "#EF4444";
                return (
                  <motion.button type="button" key={p.id} initial={{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.03+i*0.04}} onClick={()=>onNavigate(viewId)} className="group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left" style={{background:isActive?`linear-gradient(90deg, rgba(${p.accentRgb},0.36), rgba(${p.accentRgb},0.14))`:"rgba(255,255,255,0.05)",border:isActive?`1px solid rgba(255,255,255,0.30)`:"1px solid rgba(255,255,255,0.10)",boxShadow:isActive?`0 0 18px rgba(${p.accentRgb},0.20)`:"none",cursor:"pointer"}} whileHover={{background:`rgba(${p.accentRgb},0.18)`,x:1}} whileTap={{scale:0.98}}>
                    {isActive&&<motion.div layoutId="nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{background:color}} transition={{type:"spring",stiffness:450,damping:35}}/>}
                    <div className="relative shrink-0">
                      <AgentAvatar provider={p.id as ProviderId} size={30}/>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full" style={{background:statusColor,border:"1px solid rgba(52,35,22,0.95)",boxShadow:`0 0 8px ${statusColor}`}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[18px] font-black leading-tight" style={{fontFamily:"var(--font-syne)",color:"#FFFFFF",textShadow:"0 2px 12px rgba(0,0,0,0.40)"}}>{p.name}</div>
                      <div className="text-[13px] truncate mt-0.5 font-bold" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.86)"}}>{p.modelLabel}</div>
                    </div>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{background:`rgba(${online ? "138,154,85" : configured ? "226,178,79" : "196,98,58"},0.08)`,border:`1px solid ${statusColor}33`}}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{background:statusColor}} />
                      <span className="text-[8px] uppercase" style={{fontFamily:"var(--font-jetbrains)",color:statusColor}}>{statusLabel}</span>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mx-3 my-1" style={{height:1,background:"rgba(255,255,255,0.10)"}}/>
      <div className="p-3 pb-2">
        <p className="text-[12px] tracking-[0.20em] uppercase px-3 mb-2 font-black" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.90)"}}>Overview</p>
        {overviewItems.map(item => <NavBtn key={item.id} id={item.id} label={item.label} icon={item.icon} isActive={activeView===item.id} onClick={()=>onNavigate(item.id)}/>)}
      </div>
      <div className="mx-3 mb-1" style={{height:1,background:"rgba(255,255,255,0.10)"}}/>
      <div className="p-3 pt-1">
        <div className="p-3 rounded-xl" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)"}}>
          <div className="flex items-center gap-2 mb-2">
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{background:"#00A676"}} animate={{opacity:[1,0.3,1]}} transition={{duration:2,repeat:Infinity}}/>
            <span className="text-[13px] font-black" style={{fontFamily:"var(--font-syne)",color:"#34D399"}}>NEXUS Online</span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_,i)=><motion.div key={i} className="flex-1 h-0.5 rounded-full" style={{background:"#00A676"}} animate={{scaleX:[0.3,1,0.3],opacity:[0.3,0.8,0.3]}} transition={{duration:1.4,repeat:Infinity,delay:i*0.12,ease:"easeInOut"}}/>)}
          </div>
          <div className="mt-1 text-[11px] font-semibold" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.70)"}}>{PROVIDERS.length} agents registered</div>
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
      <motion.aside initial={false} animate={{x:0,opacity:1}} transition={{duration:0.3,ease:[0.22,1,0.36,1]}} className="hidden md:flex flex-col overflow-y-auto" style={{width:300,flexShrink:0,background:"linear-gradient(180deg, rgba(24,24,27,0.99), rgba(39,39,42,0.99))",borderRight:"1px solid rgba(255,255,255,0.20)",backdropFilter:"blur(20px)"}}>
        <SidebarContent activeView={activeView} onNavigate={navigate} health={health}/>
      </motion.aside>

      <button type="button" aria-label="Abrir barra izquierda" onClick={()=>setMobileOpen(true)} className="md:hidden fixed left-3 top-[70px] z-50 flex items-center gap-2 rounded-full px-4 py-2.5 shadow-lg" style={{background:"rgba(40,24,54,0.96)",border:"1px solid rgba(255,255,255,0.18)",color:"#FFFFFF",fontFamily:"var(--font-outfit)",backdropFilter:"blur(14px)"}}>
        <Menu size={18}/><span className="text-sm font-black">Menú</span>
      </button>

      <AnimatePresence>
        {mobileOpen&&(
          <>
            <motion.button type="button" aria-label="Cerrar menú" className="md:hidden fixed inset-0 z-50" style={{background:"rgba(7,24,46,0.30)",backdropFilter:"blur(2px)"}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMobileOpen(false)}/>
            <motion.aside className="md:hidden fixed inset-y-0 left-0 z-[60] flex flex-col overflow-y-auto" style={{width:352,maxWidth:"92vw",background:"linear-gradient(180deg, rgba(24,24,27,0.99), rgba(39,39,42,0.99))",borderRight:"1px solid rgba(255,255,255,0.20)",boxShadow:"24px 0 80px rgba(7,24,46,0.42)",backdropFilter:"blur(24px)"}} initial={{x:-320,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-320,opacity:0}} transition={{duration:0.22,ease:[0.22,1,0.36,1]}}>
              <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:"1px solid rgba(109,40,217,0.10)"}}>
                <div>
                  <div className="text-lg font-black tracking-[0.24em]" style={{fontFamily:"var(--font-syne)",color:"#FFFFFF"}}>NEXUS</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.72)"}}>barra izquierda</div>
                </div>
                <button type="button" aria-label="Cerrar barra izquierda" onClick={()=>setMobileOpen(false)} className="rounded-full p-2" style={{background:"rgba(255,255,255,0.10)",color:"#FFFFFF"}}><X size={18}/></button>
              </div>
              <SidebarContent activeView={activeView} onNavigate={navigate} health={health}/>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2" style={{background:"linear-gradient(180deg, rgba(247,239,226,0), rgba(247,239,226,0.96) 18%, rgba(52,35,22,0.98))",borderTop:"1px solid rgba(109,40,217,0.10)",backdropFilter:"blur(18px)"}}>
        <div className="grid grid-cols-2 gap-1 rounded-2xl p-1 max-w-[200px] mx-auto" style={{background:"rgba(247,239,226,0.92)",border:"1px solid rgba(76,29,149,0.18)"}}>
          {[
            {id:"dashboard",label:"Inicio",icon:LayoutDashboard},
            {id:"orchestrator",label:"Orquest.",icon:BrainCircuit},
          ].map(({id,label,icon:Icon})=>{
            const isActive=activeView===id;
            return <button type="button" key={id} onClick={()=>onViewChange(id)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5" style={{background:isActive?"rgba(76,29,149,0.14)":"rgba(109,40,217,0)",border:isActive?"1px solid rgba(76,29,149,0.32)":"1px solid rgba(109,40,217,0)",color:isActive?"#4C1D95":"#07182E",fontFamily:"var(--font-outfit)"}}>
              <Icon size={18}/>
              <span className="text-[12px] font-black truncate max-w-full">{label}</span>
            </button>;
          })}
        </div>
      </nav>
    </>
  );
}
