"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, BrainCircuit, ChevronDown, Menu, X, SunMedium, Megaphone, Video } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import { PROVIDERS } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers";

const ACCENT: Record<string,string> = { hermes:"#4C1D95", perplexity:"#00A676", gemini:"#2563EB", elevenlabs:"#D97706", imagegen:"#F72585", claude:"#7C3AED", codex:"#059669" };

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

const AGENTS = [
  {id:"hermes", name:"Hermes", model:"DeepSeek v4", color:"#4C1D95", status:"Libre", dot:"#00A676"},
  {id:"perplexity", name:"Perplexity", model:"Sonar Pro", color:"#00A676", status:"Listo", dot:"#00A676"},
  {id:"gemini", name:"Gemini", model:"2.5 Flash", color:"#2563EB", status:"Informando", dot:"#D97706"},
  {id:"elevenlabs", name:"ElevenLabs", model:"TTS v2", color:"#D97706", status:"Listo", dot:"#00A676"},
  {id:"imagegen", name:"Image Gen", model:"FLUX 2", color:"#F72585", status:"Listo", dot:"#00A676"},
  {id:"claude", name:"Claude", model:"Sonnet 4.6", color:"#7C3AED", status:"Inactivo", dot:"rgba(255,255,255,0.25)"},
  {id:"codex", name:"Codex", model:"GPT 5", color:"#059669", status:"Inactivo", dot:"rgba(255,255,255,0.25)"},
];

const overviewItems = [
  {id:"dashboard", label:"Command Center", icon:LayoutDashboard},
];

function SidebarContent({activeView,onNavigate}:{activeView:string;onNavigate:(v:string)=>void;health?:never}) {
  const [agentsOpen, setAgentsOpen] = useState(true);

  useEffect(() => {
    if (activeView.startsWith("agent-")) setAgentsOpen(true);
  }, [activeView]);

  return (
    <>
      <div className="p-3 pb-2">
        <button type="button" aria-expanded={agentsOpen} onClick={()=>setAgentsOpen(open=>!open)} className="group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left" style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.24)",cursor:"pointer"}}>
          <div><p className="text-[12px] tracking-[0.20em] uppercase font-black" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.90)"}}>AI AGENTS</p><p className="text-[18px] font-black" style={{fontFamily:"var(--font-syne)",color:"#FFFFFF"}}>Agentes en uso</p></div>
          <div className="flex items-center gap-2"><span className="rounded-full px-2.5 py-0.5 text-xs font-black text-white" style={{background:"rgba(168,85,247,0.60)"}}>{AGENTS.length}</span><ChevronDown size={16} style={{color:"rgba(255,255,255,0.72)",transform:agentsOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.25s cubic-bezier(0.22,1,0.36,1)"}}/></div>
        </button>
        <AnimatePresence initial={false}>
          {agentsOpen&&(
            <motion.div className="mt-2 space-y-1.5" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.22,ease:[0.22,1,0.36,1]}}>
              {AGENTS.map((a,i)=>(
                <motion.div key={a.id} initial={{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.03+i*0.04}}
                  className="relative flex items-center gap-3 w-full px-4 py-2.5 rounded-xl"
                  style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{background:a.color}}>{a.name[0]}</div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full" style={{background:a.dot,border:"1px solid rgba(52,35,22,0.95)"}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black leading-tight" style={{color:"#FFFFFF"}}>{a.name}</div>
                    <div className="text-[11px] truncate" style={{color:"rgba(255,255,255,0.6)"}}>{a.model}</div>
                  </div>
                  <div className="text-[10px] font-semibold" style={{color:a.dot}}>{a.status}</div>
                </motion.div>
              ))}
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
          <div className="mt-1 text-[11px] font-semibold" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.70)"}}>{AGENTS.length} agents registrados</div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar({activeView,onViewChange}:SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (view: string) => {
    onViewChange(view);
    setMobileOpen(false);
  };

  return (
    <>
      <motion.aside className="hidden md:flex flex-col overflow-y-auto flex-shrink-0" style={{width:318,background:"linear-gradient(180deg, rgba(24,24,27,0.99), rgba(39,39,42,0.99))",borderRight:"1px solid rgba(255,255,255,0.18)",boxShadow:"24px 0 80px rgba(7,24,46,0.42)",backdropFilter:"blur(24px)"}}>
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{borderColor:"rgba(109,40,217,0.10)"}}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{background:"linear-gradient(135deg, rgba(168,85,247,0.36), rgba(168,85,247,0.12))"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div><div className="text-sm font-black tracking-[0.12em]" style={{fontFamily:"var(--font-syne)",color:"#FFFFFF"}}>NEXUS</div><div className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(255,255,255,0.72)"}}>v2.1.0 · CORE ACTIVE</div></div>
        </div>
        <SidebarContent activeView={activeView} onNavigate={navigate} />
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
              <SidebarContent activeView={activeView} onNavigate={navigate} />
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
