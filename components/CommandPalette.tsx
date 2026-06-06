"use client";
import{useEffect,useRef,useState}from"react";
import{motion,AnimatePresence}from"framer-motion";
import{Search,Terminal,Bot,MessageSquare,Zap,Target,BookOpen,BookMarked,ArrowRight,SunMedium,Inbox,Megaphone,Video,Workflow,Network}from"lucide-react";
interface Command{id:string;label:string;description:string;icon:React.ElementType;accent:string;shortcut?:string;action:()=>void;}
interface CommandPaletteProps{isOpen:boolean;onClose:()=>void;onNavigate:(view:string)=>void;}
export default function CommandPalette({isOpen,onClose,onNavigate}:CommandPaletteProps){
  const[query,setQuery]=useState("");const[selected,setSelected]=useState(0);const inputRef=useRef<HTMLInputElement>(null);
  const COMMANDS:Command[]=[
    {id:"dashboard",label:"Command Center",description:"Panorama de todos tus agentes",icon:Terminal,accent:"#6D28D9",shortcut:"D",action:()=>{onNavigate("dashboard");onClose();}},
    {id:"today",label:"Hoy — Morning Mission Check",description:"Pendientes críticos, agenda, misiones, captura rápida y Daily Note",icon:SunMedium,accent:"#6D28D9",shortcut:"H",action:()=>{onNavigate("today");onClose();}},
    {id:"inbox",label:"Inbox Universal",description:"Capturar, clasificar y enrutar posts, audios, links, documentos e ideas",icon:Inbox,accent:"#6D28D9",shortcut:"I",action:()=>{onNavigate("inbox");onClose();}},
    {id:"marketing",label:"Marketing Command Center",description:"Clientes, campañas, prompts, aprobaciones y revisión anti-caos",icon:Megaphone,accent:"#F72585",shortcut:"M",action:()=>{onNavigate("marketing");onClose();}},
    {id:"audiovisuales",label:"Audiovisuales",description:"Estudio IA para imágenes, videos, prompts visuales, Higgsfield, ChatGPT Imagen y Flow",icon:Video,accent:"#EF4444",shortcut:"A",action:()=>{onNavigate("audiovisuales");onClose();}},
    {id:"workflows",label:"Workflows / SOPs",description:"Procesos repetibles para posts, campañas, reuniones y documentos",icon:Workflow,accent:"#00A676",shortcut:"W",action:()=>{onNavigate("workflows");onClose();}},
    {id:"empresas",label:"Empresas y Personas",description:"Contexto por empresa, persona clave y esperando respuesta",icon:Network,accent:"#5F8C94",shortcut:"E",action:()=>{onNavigate("empresas");onClose();}},
    {id:"agent-claude",label:"Claude — Finanzas y estrategia",description:"Análisis financiero, NIIF, razonamiento profundo, código",icon:MessageSquare,accent:"#F72585",shortcut:"C",action:()=>{onNavigate("agent-claude");onClose();}},
    {id:"agent-openai",label:"ChatGPT — Marketing y contenido",description:"Emails, ideas, copys, resúmenes",icon:Bot,accent:"#00A676",action:()=>{onNavigate("agent-openai");onClose();}},
    {id:"agent-gemini",label:"Gemini — Research y búsqueda",description:"Búsqueda en tiempo real, comparativos, multimodal",icon:Zap,accent:"#5F8C94",action:()=>{onNavigate("agent-gemini");onClose();}},
    {id:"agent-hermes",label:"Hermes — Tareas privadas",description:"Agente local en VPS, sin nube",icon:Bot,accent:"#6D28D9",action:()=>{onNavigate("agent-hermes");onClose();}},
    {id:"goals",label:"Goals — Tus metas",description:"Trackea objetivos, se sincroniza con Obsidian",icon:Target,accent:"#00A676",shortcut:"G",action:()=>{onNavigate("goals");onClose();}},
    {id:"journal",label:"Journal — Tu diario",description:"Notas del día con voz, guarda en Obsidian",icon:BookOpen,accent:"#F72585",shortcut:"J",action:()=>{onNavigate("journal");onClose();}},
    {id:"guide",label:"Guía NEXUS OS",description:"Cómo usar el sistema paso a paso",icon:BookMarked,accent:"#6D28D9",action:()=>{onNavigate("guide");onClose();}},
  ];
  const filtered=query?COMMANDS.filter(c=>c.label.toLowerCase().includes(query.toLowerCase())||c.description.toLowerCase().includes(query.toLowerCase())):COMMANDS;
  useEffect(()=>{if(isOpen){setQuery("");setSelected(0);setTimeout(()=>inputRef.current?.focus(),50);}},[isOpen]);
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(!isOpen)return;if(e.key==="Escape")onClose();if(e.key==="ArrowDown")setSelected(s=>Math.min(s+1,filtered.length-1));if(e.key==="ArrowUp")setSelected(s=>Math.max(s-1,0));if(e.key==="Enter"&&filtered[selected])filtered[selected].action();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[isOpen,filtered,selected,onClose]);
  useEffect(()=>setSelected(0),[query]);
  return(
    <AnimatePresence>{isOpen&&(<>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50" style={{background:"rgba(247,239,226,0.85)",backdropFilter:"blur(8px)"}} onClick={onClose}/>
      <motion.div initial={{y:-30,opacity:0,scale:0.97}} animate={{y:0,opacity:1,scale:1}} exit={{y:-20,opacity:0,scale:0.97}} transition={{duration:0.2,ease:[0.22,1,0.36,1]}} className="fixed z-50" style={{top:"20%",left:"50%",transform:"translateX(-50%)",width:"min(600px,90vw)",background:"rgba(247,239,226,0.98)",border:"1px solid rgba(109,40,217,0.25)",boxShadow:"0 32px 80px rgba(7,24,46,0.6)",borderRadius:"6px"}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5" style={{borderBottom:"1px solid rgba(109,40,217,0.1)"}}>
          <Search size={15} style={{color:"rgba(109,40,217,0.6)",flexShrink:0}}/>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Escribe un comando…" className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-600" style={{fontFamily:"var(--font-outfit)",color:"#07182E"}}/>
          <div className="text-[10px] px-2 py-0.5 rounded-sm" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.4)",background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.06)"}}>ESC</div>
        </div>
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.map((cmd,i)=>{const Icon=cmd.icon;const isSel=selected===i;return(
            <motion.button key={cmd.id} onClick={cmd.action} onMouseEnter={()=>setSelected(i)} className="w-full flex items-center gap-3 px-4 py-3 text-left" style={{background:isSel?"rgba(109,40,217,0.06)":"transparent",border:"none",cursor:"pointer"}}>
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{background:isSel?`${cmd.accent}18`:"rgba(7,24,46,0.04)",border:`1px solid ${isSel?cmd.accent+"30":"rgba(7,24,46,0.06)"}`}}><Icon size={14} style={{color:isSel?cmd.accent:"rgba(31,41,55,0.5)"}}/></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{fontFamily:"var(--font-outfit)",color:isSel?"#07182E":"rgba(226,232,240,0.7)"}}>{cmd.label}</div>
                <div className="text-[11px] mt-0.5" style={{fontFamily:"var(--font-outfit)",color:"rgba(31,41,55,0.45)"}}>{cmd.description}</div>
              </div>
              {cmd.shortcut&&<div className="text-[9px] px-1.5 py-0.5 rounded" style={{fontFamily:"var(--font-jetbrains)",color:isSel?cmd.accent:"rgba(31,41,55,0.35)",background:isSel?`${cmd.accent}15`:"rgba(7,24,46,0.04)",border:`1px solid ${isSel?cmd.accent+"25":"rgba(7,24,46,0.06)"}`}}>⌘{cmd.shortcut}</div>}
              {isSel&&<ArrowRight size={12} style={{color:cmd.accent}}/>}
            </motion.button>
          );})}
        </div>
        <div className="px-4 py-2 flex items-center gap-4" style={{borderTop:"1px solid rgba(109,40,217,0.08)"}}>
          {[["↑↓","Navigate"],["↵","Execute"],["Esc","Dismiss"]].map(([k,l])=>(
            <div key={k} className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.4)",background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.06)"}}>{k}</span>
              <span className="text-[9px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.3)"}}>{l}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>)}</AnimatePresence>
  );
}
