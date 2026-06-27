"use client";
import{useState,useEffect,useCallback}from"react";
import{AnimatePresence,motion}from"framer-motion";
import NeuralBackground from"@/components/NeuralBackground";
import Header from"@/components/Header";
import Sidebar from"@/components/Sidebar";
import ActivityFeed from"@/components/ActivityFeed";
import CommandPalette from"@/components/CommandPalette";
import AgentFleet from"@/components/AgentFleet";
import MissionControl from "@/components/MissionControl";
import MissionControlHub from "@/components/MissionControlHub";
import AgentChatPage from"@/components/AgentChatPage";
import TodayView from"@/components/TodayView";
import GoalsView from"@/components/GoalsView";
import JournalView from"@/components/JournalView";
import AnalyticsView from"@/components/AnalyticsView";
import GuideView from"@/components/GuideView";
import OrchestratorView from"@/components/OrchestratorView";
import{UniversalInboxView,MarketingCommandCenterView,AudiovisualesView,WorkflowsView,EmpresasPersonasView}from"@/components/StrategicViews";
import{PROVIDERS}from"@/lib/providers";
import type{ProviderId}from"@/lib/providers";

function BootSequence({onComplete}:{onComplete:()=>void}){
  const lines=["NEXUS OS v2.1.0 — Neural Executive eXperience Unified System","Quantum memory subsystem................... [OK]","Neural core protocols...................... [OK]","Claude Sonnet ................................. [OK]","ChatGPT GPT-5.5 ............................. [OK]","Gemini 2.5 Flash ............................ [OK]","Hermes Agent (Hermi) ......................... [OK]","","4 AI agents registered. Fleet ready.","Welcome, Liliana."];
  const[visible,setVisible]=useState<number[]>([]);const[done,setDone]=useState(false);
  useEffect(()=>{let i=0;let finished=false;const finish=()=>{if(finished)return;finished=true;setDone(true);setTimeout(()=>onComplete(),350);};const id=setInterval(()=>{setVisible(p=>[...p,i]);i++;if(i>=lines.length){clearInterval(id);setTimeout(finish,400);}},110);const fallback=setTimeout(finish,lines.length*140+1600);return()=>{clearInterval(id);clearTimeout(fallback);};},[lines.length,onComplete]);
  return(
    <motion.div exit={{opacity:0,scale:1.012}} transition={{duration:0.45}} className="fixed inset-0 z-50 flex flex-col justify-center items-center" style={{background:"#F7EFE2"}}>
      <NeuralBackground/>
      <div className="relative z-10 w-full max-w-xl px-8">
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center mb-8">
          <div className="text-5xl font-black tracking-[0.35em] mb-1" style={{fontFamily:"var(--font-syne)",color:"#6D28D9",textShadow:"0 0 48px rgba(109,40,217,0.5)"}}>NEXUS OS</div>
          <div style={{fontFamily:"var(--font-jetbrains)",fontSize:10,letterSpacing:"0.3em",color:"rgba(31,41,55,0.4)"}}>NEURAL EXECUTIVE EXPERIENCE UNIFIED SYSTEM</div>
        </motion.div>
        <div className="rounded-xl p-5" style={{background:"rgba(247,239,226,0.9)",border:"1px solid rgba(109,40,217,0.14)",backdropFilter:"blur(20px)"}}>
          {lines.map((line,i)=>(
            <motion.div key={i} initial={{opacity:0,x:-8}} animate={visible.includes(i)?{opacity:1,x:0}:{}} transition={{duration:0.18}} style={{fontFamily:"var(--font-jetbrains)",fontSize:12,lineHeight:2,color:line.includes("[OK]")?"#00A676":line.includes("Welcome")?"#07182E":line.includes("AI agents")?"#F72585":line===""?undefined:"rgba(109,40,217,0.75)",fontWeight:line.includes("Welcome")?600:400}}>
              {line===""?<br/>:<span>{!line.includes("Welcome")&&!line.includes("NEXUS")&&!line.includes("AI agents")&&<span style={{color:"rgba(109,40,217,0.3)"}}>&gt; </span>}{line}</span>}
            </motion.div>
          ))}
          {!done&&visible.length>0&&<motion.span animate={{opacity:[1,0,1]}} transition={{duration:0.65,repeat:Infinity}} style={{fontFamily:"var(--font-jetbrains)",fontSize:12,color:"#6D28D9"}}>▊</motion.span>}
        </div>
      </div>
    </motion.div>
  );
}

function Placeholder({title}:{title:string}){
  return<div className="flex-1 flex flex-col items-center justify-center gap-4"><motion.div initial={{scale:0.88,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.4,ease:[0.22,1,0.36,1]}} className="text-center"><div className="text-5xl mb-4 animate-float">🚧</div><div className="text-xl font-bold mb-2" style={{fontFamily:"var(--font-syne)",color:"#6D28D9"}}>{title}</div><div className="text-sm" style={{fontFamily:"var(--font-outfit)",color:"rgba(31,41,55,0.4)"}}>Module initializing…</div></motion.div></div>;
}

export default function NexusOS(){
  const[booting,setBooting]=useState(false);
  const[activeView,setActiveView]=useState("dashboard");
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const view=params.get("view");
    if(view)setActiveView(view);
  },[]);
  const[commandOpen,setCommandOpen]=useState(false);
  const[feedCollapsed,setFeedCollapsed]=useState(false);
  const[messageCounts]=useState<Record<string,number>>({});
  // Restore feed preference
  useEffect(()=>{const saved=localStorage.getItem("nexus-feed-collapsed");if(saved==="1")setFeedCollapsed(true);},[]);
  const toggleFeed=useCallback(()=>{setFeedCollapsed(v=>{const nv=!v;localStorage.setItem("nexus-feed-collapsed",nv?"1":"0");return nv;});},[]);
  const handleKeydown=useCallback((e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setCommandOpen(v=>!v);}},[]);
  useEffect(()=>{window.addEventListener("keydown",handleKeydown);return()=>window.removeEventListener("keydown",handleKeydown);},[handleKeydown]);
  const agentId=activeView.startsWith("agent-")?activeView.replace("agent-","") as ProviderId:null;
  const isAgentChat=agentId!==null&&PROVIDERS.some(p=>p.id===agentId);
  return(
    <div className="flex flex-col h-screen overflow-hidden grid-bg relative">
      <NeuralBackground/>
      <AnimatePresence>{booting&&<BootSequence onComplete={()=>setBooting(false)}/>}</AnimatePresence>
      <CommandPalette isOpen={commandOpen} onClose={()=>setCommandOpen(false)} onNavigate={setActiveView}/>
      <AnimatePresence>
        {!booting&&(
          <motion.div initial={false} animate={{opacity:1}} transition={{duration:0.5}} className="relative z-10 flex flex-col h-full">
            <Header onOpenCommand={()=>setCommandOpen(true)}/>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar activeView={activeView} onViewChange={setActiveView}/>
              <main className="flex flex-1 overflow-hidden" style={{minWidth:0}}>
                <AnimatePresence mode="wait">
                  {activeView==="dashboard"&&<motion.div key="mission-control" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><MissionControlHub/></motion.div>}
                  {activeView==="orchestrator"&&<motion.div key="orchestrator" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><OrchestratorView/></motion.div>}
                  {activeView==="today"&&<motion.div key="today" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><TodayView/></motion.div>}
                  {isAgentChat&&<motion.div key={activeView} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25,ease:[0.22,1,0.36,1]}} className="flex-1 overflow-hidden"><AgentChatPage provider={agentId!} onBack={()=>setActiveView("dashboard")}/></motion.div>}
                  {activeView==="goals"   &&<motion.div key="goals"   initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><GoalsView/></motion.div>}
                  {activeView==="journal" &&<motion.div key="journal" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><JournalView/></motion.div>}
                  {activeView==="analytics"&&<motion.div key="analytics" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><AnalyticsView/></motion.div>}
                  {activeView==="inbox"&&<motion.div key="inbox" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><UniversalInboxView/></motion.div>}
                  {activeView==="marketing"&&<motion.div key="marketing" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><MarketingCommandCenterView/></motion.div>}
                  {activeView==="audiovisuales"&&<motion.div key="audiovisuales" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><AudiovisualesView/></motion.div>}
                  {activeView==="workflows"&&<motion.div key="workflows" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><WorkflowsView/></motion.div>}
                  {activeView==="empresas"&&<motion.div key="empresas" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><EmpresasPersonasView/></motion.div>}
                  {activeView==="guide"&&<motion.div key="guide" initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><GuideView onFinish={()=>setActiveView("dashboard")}/></motion.div>}
                  {(activeView==="memory"||activeView==="settings")&&<motion.div key={activeView} initial={false} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="flex-1 overflow-hidden"><Placeholder title={activeView.charAt(0).toUpperCase()+activeView.slice(1)}/></motion.div>}
                </AnimatePresence>
              </main>
              <ActivityFeed collapsed={feedCollapsed} onToggle={toggleFeed}/>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
