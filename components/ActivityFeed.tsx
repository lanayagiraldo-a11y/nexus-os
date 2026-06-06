"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Zap, AlertTriangle, CheckCircle, Info, ArrowRight, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { NexusEvent } from "@/lib/nexusEvents";
type EventType="success"|"warning"|"info"|"processing"|"system";
interface FeedEvent{id:string;type:EventType;agent:string;message:string;ts:number;detail?:string;}
const ECFG:Record<EventType,{icon:React.ElementType;color:string;bg:string}>={
  success:{icon:CheckCircle,color:"#00A676",bg:"rgba(0,166,118,0.08)"},
  warning:{icon:AlertTriangle,color:"#6D28D9",bg:"rgba(109,40,217,0.08)"},
  info:{icon:Info,color:"#6D28D9",bg:"rgba(109,40,217,0.08)"},
  processing:{icon:Zap,color:"#F72585",bg:"rgba(247,37,133,0.08)"},
  system:{icon:Activity,color:"#1F2937",bg:"rgba(31,41,55,0.06)"},
};

function relTime(ts:number):string{
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<5)return"just now";
  if(s<60)return`${s}s ago`;
  if(s<3600)return`${Math.floor(s/60)}m ago`;
  return`${Math.floor(s/3600)}h ago`;
}

interface ActivityFeedProps{collapsed?:boolean;onToggle?:()=>void;}

export default function ActivityFeed({collapsed=false,onToggle}:ActivityFeedProps){
  const now=Date.now();
  const[events,setEvents]=useState<FeedEvent[]>([
    {id:"init-1",type:"system",agent:"NEXUS OS",message:"System initialized",ts:now,detail:"All modules loaded"},
  ]);
  const[alertCount,setAlertCount]=useState(0);
  const[,setTick]=useState(0);

  // Re-render timestamps every 30s
  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>t+1),30000);
    return()=>clearInterval(id);
  },[]);

  // Listen for real events from agents, goals, journal
  useEffect(()=>{
    const handler=(e:Event)=>{
      const d=(e as CustomEvent<NexusEvent>).detail;
      const ev:FeedEvent={
        id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        type:d.type,
        agent:d.agent,
        message:d.message,
        ts:Date.now(),
        detail:d.detail,
      };
      setEvents(prev=>[ev,...prev.slice(0,29)]);
      if(d.type==="warning")setAlertCount(c=>c+1);
    };
    window.addEventListener("nexus-event",handler);
    return()=>window.removeEventListener("nexus-event",handler);
  },[]);

  // ── Collapsed: thin rail with expand button ──
  if(collapsed){
    return(
      <motion.div initial={{width:300}} animate={{width:52}} transition={{duration:0.35,ease:[0.22,1,0.36,1]}} className="hidden xl:flex flex-col items-center glass" style={{flexShrink:0,borderTop:"none",borderBottom:"none",borderRight:"none"}}>
        <motion.button whileHover={{scale:1.1,background:"rgba(109,40,217,0.12)"}} whileTap={{scale:0.92}} onClick={onToggle} title="Expand Activity Feed" className="mt-4 w-9 h-9 rounded-lg flex items-center justify-center" style={{background:"rgba(109,40,217,0.06)",border:"1px solid rgba(109,40,217,0.15)",cursor:"pointer"}}>
          <PanelRightOpen size={15} style={{color:"#6D28D9"}}/>
        </motion.button>
        <div className="flex flex-col items-center gap-1 mt-5">
          <Activity size={14} style={{color:"#6D28D9"}}/>
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{fontFamily:"var(--font-syne)",color:"rgba(109,40,217,0.7)",writingMode:"vertical-rl"}}>Activity</span>
        </div>
        <div className="mt-4 relative">
          <motion.div className="w-2 h-2 rounded-full" style={{background:"#00A676"}} animate={{opacity:[1,0.3,1]}} transition={{duration:1.5,repeat:Infinity}}/>
        </div>
        <div className="mt-auto mb-4 flex flex-col items-center gap-1">
          <span className="text-sm font-bold tabular-nums" style={{fontFamily:"var(--font-jetbrains)",color:"#6D28D9"}}>{events.length}</span>
          <span className="text-[8px] tracking-wider" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.5)"}}>EV</span>
          {alertCount>0&&<><span className="text-sm font-bold tabular-nums mt-2" style={{fontFamily:"var(--font-jetbrains)",color:"#EF4444"}}>{alertCount}</span><span className="text-[8px] tracking-wider" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(239,68,68,0.6)"}}>AL</span></>}
        </div>
      </motion.div>
    );
  }

  return(
    <motion.div initial={{x:60,opacity:0}} animate={{x:0,opacity:1}} transition={{duration:0.5,delay:0.2,ease:[0.22,1,0.36,1]}} className="hidden xl:flex flex-col glass" style={{width:300,flexShrink:0,borderTop:"none",borderBottom:"none",borderRight:"none"}}>
      <div className="flex items-center justify-between p-4 pb-3" style={{borderBottom:"1px solid rgba(109,40,217,0.08)"}}>
        <div className="flex items-center gap-2"><Activity size={13} style={{color:"#6D28D9"}}/><span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{fontFamily:"var(--font-syne)",color:"#6D28D9"}}>Activity Feed</span></div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5"><motion.div className="w-1.5 h-1.5 rounded-full" style={{background:"#00A676"}} animate={{opacity:[1,0.3,1]}} transition={{duration:1.5,repeat:Infinity}}/><span className="text-[9px] tracking-widest" style={{fontFamily:"var(--font-jetbrains)",color:"#00A676"}}>LIVE</span></div>
          <motion.button whileHover={{scale:1.12}} whileTap={{scale:0.9}} onClick={onToggle} title="Collapse Activity Feed" className="w-6 h-6 rounded-md flex items-center justify-center" style={{background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.08)",cursor:"pointer"}}><PanelRightClose size={12} style={{color:"rgba(31,41,55,0.6)"}}/></motion.button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {events.map(ev=>{const cfg=ECFG[ev.type];const Icon=cfg.icon;return(
            <motion.div key={ev.id} initial={{height:0,opacity:0,y:-10}} animate={{height:"auto",opacity:1,y:0}} exit={{height:0,opacity:0}} transition={{duration:0.3}} layout>
              <div className="p-2.5 rounded-sm" style={{background:cfg.bg,border:`1px solid ${cfg.color}18`}}>
                <div className="flex items-start gap-2">
                  <Icon size={11} style={{color:cfg.color,marginTop:2,flexShrink:0}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold tracking-wider" style={{fontFamily:"var(--font-jetbrains)",color:cfg.color}}>{ev.agent}</span>
                      <span className="text-[9px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.4)"}}>{relTime(ev.ts)}</span>
                    </div>
                    <div className="text-[11px] mt-0.5 leading-snug" style={{fontFamily:"var(--font-outfit)",color:"rgba(226,232,240,0.92)"}}>{ev.message}</div>
                    {ev.detail&&<div className="text-[10px] mt-1 flex items-center gap-1" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.6)"}}><ArrowRight size={8}/>{ev.detail}</div>}
                  </div>
                </div>
              </div>
            </motion.div>
          );})}
        </AnimatePresence>
      </div>
      <div className="p-3" style={{borderTop:"1px solid rgba(109,40,217,0.08)"}}>
        <div className="grid grid-cols-3 gap-2">
          {[{label:"Events",value:String(events.length),color:"#6D28D9"},{label:"Agents",value:"4",color:"#00A676"},{label:"Alerts",value:String(alertCount),color:"#EF4444"}].map(s=>(
            <div key={s.label} className="text-center p-1.5 rounded-sm" style={{background:"rgba(7,24,46,0.02)",border:"1px solid rgba(7,24,46,0.04)"}}>
              <div className="text-sm font-bold tabular-nums" style={{fontFamily:"var(--font-jetbrains)",color:s.color}}>{s.value}</div>
              <div className="text-[9px] mt-0.5" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.4)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
