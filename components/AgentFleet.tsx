"use client";
import{useEffect,useState}from"react";
import{motion}from"framer-motion";
import{ArrowRight,RefreshCw,Zap,Clock,MessageSquare}from"lucide-react";
import AgentAvatar from"./AgentAvatar";
import{PROVIDERS}from"@/lib/providers";
import type{ProviderId,ProviderDef}from"@/lib/providers";
export interface ProviderHealth{id?:string;configured:boolean;reachable:boolean|null;latency:number|null;}
const TAGLINES:Record<ProviderId,string>={claude:"Reasoning, deep code & nuanced writing",openai:"Versatile intelligence across every domain",gemini:"Multimodal speed — text, images & beyond",hermes:"VPS-hosted · private · blazing fast",antigravity:"External IDE workspace · code orchestration"};
const MESH:Record<ProviderId,string>={claude:"radial-gradient(ellipse at 20% 20%,rgba(247,37,133,0.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(109,40,217,0.08) 0%,transparent 60%)",openai:"radial-gradient(ellipse at 20% 20%,rgba(0,166,118,0.1) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(16,163,127,0.07) 0%,transparent 60%)",gemini:"radial-gradient(ellipse at 20% 20%,rgba(247,37,133,0.1) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(109,40,217,0.07) 0%,transparent 60%)",hermes:"radial-gradient(ellipse at 20% 20%,rgba(109,40,217,0.1) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(245,158,11,0.07) 0%,transparent 60%)",antigravity:"radial-gradient(ellipse at 20% 20%,rgba(56,189,248,0.10) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(79,70,229,0.10) 0%,transparent 60%)"};
const EMPTY:ProviderHealth={configured:false,reachable:null,latency:null};
function StatusBadge({health,accent,accentRgb}:{health:ProviderHealth;accent:string;accentRgb:string}){
  const st=!health.configured?"key":health.reachable===null?"checking":health.reachable?"online":"offline";
  const m={online:{label:"Online",color:"#00A676",pulse:true},offline:{label:"Offline",color:"#EF4444",pulse:false},key:{label:"Add API Key",color:"#6D28D9",pulse:false},checking:{label:"Checking",color:accent,pulse:true}};
  const c=m[st];
  return<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{background:`${c.color}18`,border:`1px solid ${c.color}35`}}>
    {st!=="key"&&<motion.div className="w-1.5 h-1.5 rounded-full" style={{background:c.color}} animate={c.pulse?{opacity:[1,0.3,1],scale:[1,1.3,1]}:undefined} transition={c.pulse?{duration:1.8,repeat:Infinity}:undefined}/>}
    <span className="text-[10px] font-semibold tracking-wide" style={{fontFamily:"var(--font-jetbrains)",color:c.color}}>{c.label}</span>
  </div>;
}
function AgentCard({provider,health,msgCount,index,onOpen}:{provider:ProviderDef;health:ProviderHealth;msgCount:number;index:number;onOpen:()=>void}){
  const id=provider.id as ProviderId;const rgb=provider.accentRgb;const accent=provider.accent;
  const isReady=health.configured&&health.reachable===true;
  return(
    <motion.div initial={{y:28,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:index*0.09,duration:0.55,ease:[0.22,1,0.36,1]}} onClick={isReady?onOpen:undefined} className="relative overflow-hidden rounded-xl flex flex-col" style={{background:"rgba(247,239,226,0.85)",border:`1px solid rgba(${rgb},0.18)`,cursor:isReady?"pointer":"default",minHeight:220}} whileHover={isReady?{y:-4,borderColor:`rgba(${rgb},0.45)`,boxShadow:`0 20px 60px rgba(${rgb},0.15)`,transition:{duration:0.25}}:undefined}>
      <div className="absolute inset-0" style={{background:MESH[id]}}/>
      {isReady&&<motion.div className="absolute inset-0 pointer-events-none" style={{background:`linear-gradient(115deg,transparent 35%,rgba(${rgb},0.06) 50%,transparent 65%)`}} animate={{x:["-100%","200%"]}} transition={{duration:3.5,repeat:Infinity,repeatDelay:4,ease:"linear"}}/>}
      <div className="relative z-10 flex flex-col h-full p-5">
        <div className="flex items-start justify-between mb-4"><AgentAvatar provider={id} size={56} glow={isReady} pulse={isReady}/><StatusBadge health={health} accent={accent} accentRgb={rgb}/></div>
        <div className="mb-3">
          <h3 className="text-xl font-bold mb-0.5" style={{fontFamily:"var(--font-syne)",color:accent,letterSpacing:"-0.01em"}}>{provider.name}</h3>
          <p className="text-[11px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.5)"}}>{provider.provider} · {provider.fullName}</p>
        </div>
        <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{fontFamily:"var(--font-outfit)",color:"rgba(226,232,240,0.55)"}}>{TAGLINES[id]}</p>
        <div className="flex items-center gap-4 pb-4 mb-4" style={{borderBottom:`1px solid rgba(${rgb},0.1)`}}>
          <div className="flex items-center gap-1.5"><MessageSquare size={11} style={{color:`rgba(${rgb},0.55)`}}/><span className="text-[11px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.6)"}}>{msgCount} msgs</span></div>
          <div className="flex items-center gap-1.5"><Clock size={11} style={{color:`rgba(${rgb},0.55)`}}/><span className="text-[11px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.6)"}}>{health.latency?`${health.latency}ms`:"—"}</span></div>
          <div className="ml-auto"><span className="text-[9px] px-2 py-0.5 rounded-full" style={{fontFamily:"var(--font-jetbrains)",background:`rgba(${rgb},0.1)`,color:`rgba(${rgb},0.7)`,border:`1px solid rgba(${rgb},0.15)`}}>{provider.contextWindow} ctx</span></div>
        </div>
        {isReady?<motion.div className="flex items-center gap-2" whileHover={{x:3}} transition={{type:"spring",stiffness:400,damping:25}}><span className="text-[12px] font-semibold" style={{fontFamily:"var(--font-syne)",color:accent}}>Open Chat</span><ArrowRight size={13} style={{color:accent}}/></motion.div>:<div className="text-[11px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.3)"}}>{!health.configured?`Set ${provider.envKey} in .env.local`:id==="hermes"?"Start: hermes serve --port 8080":"Unreachable"}</div>}
      </div>
    </motion.div>
  );
}
export default function AgentFleet({onOpenAgent,messageCounts}:{onOpenAgent:(id:ProviderId)=>void;messageCounts:Record<string,number>}){
  const[health,setHealth]=useState<Record<string,ProviderHealth>>({claude:EMPTY,openai:EMPTY,gemini:EMPTY,hermes:EMPTY,antigravity:EMPTY});
  const[checking,setChecking]=useState(false);const[lastChecked,setLastChecked]=useState("");
  const check=async()=>{setChecking(true);try{const r=await fetch("/api/providers");if(r.ok){const d=await r.json();const m:Record<string,ProviderHealth>={};for(const p of d.providers)m[p.id]=p;setHealth(m);setLastChecked(new Date().toLocaleTimeString("en-US",{hour12:false}));}}catch{}finally{setChecking(false);}};
  useEffect(()=>{check();const t=setInterval(check,30_000);return()=>clearInterval(t);},[]);
  const onlineCount=PROVIDERS.filter(p=>health[p.id]?.reachable===true).length;
  return(
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
        <div className="flex items-end justify-between">
          <div><h1 className="text-2xl font-black tracking-tight mb-1" style={{fontFamily:"var(--font-syne)",color:"#07182E"}}>AI Fleet</h1><p className="text-[13px]" style={{fontFamily:"var(--font-outfit)",color:"rgba(31,41,55,0.5)"}}>{onlineCount} of {PROVIDERS.length} agents online · click to chat</p></div>
          <motion.button onClick={check} whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{background:"rgba(109,40,217,0.07)",border:"1px solid rgba(109,40,217,0.15)",cursor:"pointer"}}>
            <motion.div animate={checking?{rotate:360}:{}} transition={{duration:0.7,repeat:checking?Infinity:0,ease:"linear"}}><RefreshCw size={11} style={{color:"#6D28D9"}}/></motion.div>
            <span className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"#6D28D9"}}>{lastChecked?`${lastChecked}`:"Refresh"}</span>
          </motion.button>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 gap-4">
        {PROVIDERS.map((p,i)=><AgentCard key={p.id} provider={p} health={health[p.id]??EMPTY} msgCount={messageCounts[p.id]??0} index={i} onOpen={()=>onOpenAgent(p.id as ProviderId)}/>)}
      </div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.45}} className="rounded-xl p-4" style={{background:"rgba(109,40,217,0.03)",border:"1px solid rgba(109,40,217,0.08)"}}>
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-2.5" style={{fontFamily:"var(--font-syne)",color:"rgba(109,40,217,0.5)"}}>Setup · .env.local</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {[{key:"CLAUDE_API_KEY",val:"sk-ant-...",color:"#F72585"},{key:"OPENAI_API_KEY",val:"sk-proj-...",color:"#00A676"},{key:"GEMINI_API_KEY",val:"AIza...",color:"#5F8C94"},{key:"HERMES_BASE_URL",val:"https://...",color:"#6D28D9"},{key:"ANTIGRAVITY_WORKSPACE_PATH",val:"/path/to/project",color:"#4F46E5"}].map(({key,val,color})=>(
            <div key={key} className="text-[11px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.45)"}}><span style={{color}}>{key}</span>=<span>{val}</span></div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
