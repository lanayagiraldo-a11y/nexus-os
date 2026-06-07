"use client";
import{useState,useRef,useEffect,useCallback}from"react";
import{motion,AnimatePresence}from"framer-motion";
import{ArrowLeft,Send,RotateCcw,Copy,Check,MoreHorizontal,Mic,MicOff}from"lucide-react";
import AgentAvatar from"./AgentAvatar";
import{PROVIDERS}from"@/lib/providers";
import type{ProviderId}from"@/lib/providers";
import{useVoiceInput}from"@/hooks/useVoiceInput";
import{emitNexusEvent}from"@/lib/nexusEvents";

interface Message{id:string;role:"user"|"assistant";content:string;timestamp:Date;tokens?:number;streaming?:boolean;error?:boolean;}
interface AgentChatPageProps{provider:ProviderId;onBack:()=>void;}
interface ProviderHealth{id:ProviderId;configured?:boolean;reachable?:boolean|null;latency?:number|null;error?:string;bridge?:string;commandLabel?:string;envKey?:string;}
const ACCENT:Record<ProviderId,string>={claude:"#F72585",openai:"#00A676",gemini:"#5F8C94",hermes:"#6D28D9",antigravity:"#4F46E5"};
const ACCENT_RGB:Record<ProviderId,string>={claude:"209,132,73",openai:"138,154,85",gemini:"95,140,148",hermes:"226,178,79",antigravity:"79,70,229"};
const STARTERS:Record<ProviderId,string[]>={
  claude:["Analyze this codebase and suggest improvements","Write a strategic brief for my next quarter","Explain this concept step by step"],
  openai:["Help me brainstorm creative ideas","Draft a professional email","Summarize this in simple terms"],
  gemini:["What's happening in AI today?","Compare these two approaches","Give me a quick research overview"],
  hermes:["Revisa mi Obsidian y dame contexto","Ayúdame a organizar esta idea","Qué tienes en memoria sobre esto?"],
  antigravity:["Abrir workspace de NEXUS","Planear una tarea de código","Revisar arquitectura del repo"],
};
const TAGLINES:Record<ProviderId,string>={claude:"Brilliant reasoning, deep code, nuanced writing",openai:"Versatile intelligence across every domain",gemini:"Multimodal speed — text, images, and beyond",hermes:"Hermi · segundo cerebro · Obsidian · herramientas",antigravity:"Google Antigravity · IDE externo · puente pendiente"};

function TypingDots({color}:{color:string}){
  return<div className="flex items-center gap-1">{[0,0.15,0.3].map((d,i)=><motion.div key={i} className="w-2 h-2 rounded-full" style={{background:color}} animate={{y:[0,-5,0],opacity:[0.4,1,0.4]}} transition={{duration:0.7,repeat:Infinity,delay:d,ease:"easeInOut"}}/>)}</div>;
}

function Bubble({msg,isFirstOfGroup,isLastOfGroup,provId,accent,accentRgb}:{msg:Message;isFirstOfGroup:boolean;isLastOfGroup:boolean;provId:ProviderId;accent:string;accentRgb:string}){
  const[copied,setCopied]=useState(false);const[showTime,setShowTime]=useState(false);
  const isUser=msg.role==="user";
  const copy=()=>{navigator.clipboard.writeText(msg.content);setCopied(true);setTimeout(()=>setCopied(false),1500);};
  const timeStr=msg.timestamp.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true});
  return(
    <motion.div initial={{opacity:0,y:6,scale:0.98}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.25,ease:[0.22,1,0.36,1]}} className={`flex gap-3 ${isUser?"flex-row-reverse":"flex-row"} ${isFirstOfGroup?"mt-4":"mt-0.5"}`} onMouseEnter={()=>setShowTime(true)} onMouseLeave={()=>setShowTime(false)}>
      <div className="flex-shrink-0 flex items-end" style={{width:32}}>{!isUser&&isLastOfGroup&&<AgentAvatar provider={provId} size={32}/>}</div>
      <div className={`flex flex-col max-w-[72%] ${isUser?"items-end":"items-start"}`}>
        {isFirstOfGroup&&!isUser&&<span className="text-[11px] font-semibold mb-1 ml-1" style={{fontFamily:"var(--font-jetbrains)",color:`rgba(${accentRgb},0.7)`}}>{PROVIDERS.find(p=>p.id===provId)?.name}</span>}
        <div className="relative group">
          <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap" style={{fontFamily:"var(--font-outfit)",color:msg.error?"#EF4444":isUser?"rgba(226,232,240,0.95)":"rgba(226,232,240,0.88)",background:isUser?`linear-gradient(135deg,rgba(${accentRgb},0.22),rgba(${accentRgb},0.14))`:"rgba(13,20,40,0.9)",border:isUser?`1px solid rgba(${accentRgb},0.3)`:"1px solid rgba(7,24,46,0.07)",borderRadius:isUser?"14px 4px 14px 14px":"4px 14px 14px 14px",backdropFilter:"blur(12px)",maxWidth:"100%"}}>
            {msg.streaming&&!msg.content?<TypingDots color={accent}/>:<>{msg.content}{msg.streaming&&<motion.span animate={{opacity:[1,0]}} transition={{duration:0.45,repeat:Infinity}} style={{color:accent,marginLeft:2}}>▊</motion.span>}</>}
          </div>
          {!isUser&&!msg.streaming&&msg.content&&<motion.button initial={{opacity:0}} whileHover={{opacity:1}} className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100" style={{background:"rgba(13,20,40,0.8)",border:"1px solid rgba(7,24,46,0.08)",cursor:"pointer"}} onClick={copy}>{copied?<Check size={11} style={{color:"#00A676"}}/>:<Copy size={11} style={{color:"rgba(31,41,55,0.5)"}}/>}</motion.button>}
        </div>
        <AnimatePresence>{showTime&&isLastOfGroup&&<motion.div initial={{opacity:0,y:-3}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-3}} transition={{duration:0.15}} className="mt-1 mx-1" style={{fontFamily:"var(--font-jetbrains)",fontSize:10,color:"rgba(31,41,55,0.35)"}}>{timeStr}{msg.tokens?` · ${msg.tokens} tokens`:""}</motion.div>}</AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AgentChatPage({provider:provId,onBack}:AgentChatPageProps){
  const prov=PROVIDERS.find(p=>p.id===provId)!;
  const accent=ACCENT[provId];const accentRgb=ACCENT_RGB[provId];
  const[messages,setMessages]=useState<Message[]>([]);
  const[health,setHealth]=useState<ProviderHealth|null>(null);
  const[input,setInput]=useState("");const[streaming,setStreaming]=useState(false);
  const[interimText,setInterimText]=useState("");
  const abortRef=useRef<AbortController|null>(null);
  const bottomRef=useRef<HTMLDivElement>(null);
  const textareaRef=useRef<HTMLTextAreaElement>(null);
  const stableInputRef=useRef(input);
  useEffect(()=>{stableInputRef.current=input;},[input]);
  useEffect(()=>{
    let cancelled=false;
    const load=async()=>{
      try{
        const resp=await fetch("/api/providers",{cache:"no-store"});
        const payload=await resp.json() as {providers?:ProviderHealth[]};
        if(!cancelled)setHealth((payload.providers??[]).find(p=>p.id===provId)??null);
      }catch{if(!cancelled)setHealth(null);}
    };
    load();
    const timer=window.setInterval(load,30000);
    return()=>{cancelled=true;window.clearInterval(timer);};
  },[provId]);

  const{state:voiceState,start:startVoice,isSupported:voiceSupported}=useVoiceInput({
    onTranscript:(text,isFinal)=>{
      if(isFinal){setInput(prev=>(prev?prev+" ":"")+text.trim());setInterimText("");}
      else setInterimText(text);
    },
  });

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);
  useEffect(()=>{const ta=textareaRef.current;if(!ta)return;ta.style.height="auto";ta.style.height=`${Math.min(ta.scrollHeight,160)}px`;},[input]);

  const send=useCallback(async()=>{
    const text=input.trim();if(!text||streaming)return;
    setInput("");setInterimText("");
    const userMsg:Message={id:Date.now().toString(),role:"user",content:text,timestamp:new Date()};
    const streamId=(Date.now()+1).toString();
    const streamMsg:Message={id:streamId,role:"assistant",content:"",timestamp:new Date(),streaming:true};
    setMessages(prev=>[...prev,userMsg,streamMsg]);setStreaming(true);
    const history=messages.filter(m=>!m.streaming).slice(-14).map(m=>({role:m.role,content:m.content}));
    abortRef.current=new AbortController();
    try{
      const resp=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:provId,messages:[...history,{role:"user",content:text}]}),signal:abortRef.current.signal});
      if(!resp.ok){const err=await resp.json().catch(()=>({error:"Request failed"}));setMessages(prev=>prev.map(m=>m.id===streamId?{...m,content:`Error: ${err.error??"Unknown"}`,streaming:false,error:true}:m));emitNexusEvent({type:"warning",agent:prov.name.toUpperCase(),message:"Request failed",detail:err.error??"Unknown error"});setStreaming(false);return;}
      const reader=resp.body!.getReader();const dec=new TextDecoder();let acc="";let outTok=0;
      while(true){const{done,value}=await reader.read();if(done)break;
        for(const line of dec.decode(value).split("\n")){
          if(!line.startsWith("data: "))continue;
          try{const d=JSON.parse(line.slice(6));if(d.text){acc+=d.text;setMessages(prev=>prev.map(m=>m.id===streamId?{...m,content:acc}:m));}if(d.done)outTok=d.usage?.output??d.usage?.total??0;if(d.error){acc=`Error: ${d.error}`;setMessages(prev=>prev.map(m=>m.id===streamId?{...m,content:acc,streaming:false,error:true}:m));}}catch{}
        }
      }
      setMessages(prev=>prev.map(m=>m.id===streamId?{...m,streaming:false,tokens:outTok||undefined}:m));
      // Emit real activity event
      if(acc&&!acc.startsWith("Error:")){
        emitNexusEvent({
          type:"success",
          agent:prov.name.toUpperCase(),
          message:"Response delivered",
          detail:outTok?`${outTok} tokens`:undefined,
        });
      }
      // Auto-save to Obsidian (fire-and-forget)
      if (acc && !acc.startsWith("Error:")) {
        const allMsgs = [...messages.filter(m=>!m.streaming), userMsg, { ...streamMsg, content: acc }];
        fetch("/api/obsidian", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "chat",
            provider: provId,
            providerName: prov.name,
            messages: allMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
          }),
        }).catch(()=>{}); // silent — vault path may not be set yet
      }
    }catch(e){if((e as Error).name!=="AbortError")setMessages(prev=>prev.map(m=>m.id===streamId?{...m,content:"Connection lost. Check .env.local API keys.",streaming:false,error:true}:m));}
    setStreaming(false);
  },[input,streaming,provId,messages]);

  const handleKey=(e:React.KeyboardEvent)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
  const grouped=messages.map((msg,i)=>({msg,isFirstOfGroup:!messages[i-1]||messages[i-1].role!==msg.role,isLastOfGroup:!messages[i+1]||messages[i+1].role!==msg.role}));
  const isListening=voiceState==="listening";
  const isOnline=health?.reachable===true;
  const isConfigured=health?.configured!==false;
  const statusText=streaming?"Generating…":isOnline?"Online":isConfigured?"Standby":"Setup";
  const statusColor=isOnline?"#00A676":isConfigured?"#6D28D9":"#EF4444";
  const commandLabel=health?.commandLabel??prov.commandLabel;
  const bridgeLabel=health?.bridge??prov.bridge;

  return(
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 flex-shrink-0" style={{borderBottom:`1px solid rgba(${accentRgb},0.12)`,background:`rgba(${accentRgb},0.03)`}}>
        <motion.button whileHover={{x:-2}} whileTap={{scale:0.95}} onClick={onBack} className="flex items-center gap-2 p-1.5 rounded-lg" style={{background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.07)",cursor:"pointer"}}><ArrowLeft size={14} style={{color:"rgba(31,41,55,0.6)"}}/></motion.button>
        <AgentAvatar provider={provId} size={36} glow/>
        <div className="flex-1"><div className="text-[15px] font-bold leading-tight" style={{fontFamily:"var(--font-syne)",color:accent}}>{prov.name}</div><div className="text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(31,41,55,0.45)"}}>{prov.fullName} · {prov.contextWindow} context</div></div>
        <div className="flex items-center gap-1.5"><motion.div className="w-2 h-2 rounded-full" style={{background:statusColor}} animate={{opacity:[1,0.4,1],scale:[1,0.85,1]}} transition={{duration:2,repeat:Infinity}}/><span className="text-[10px] font-medium" style={{fontFamily:"var(--font-jetbrains)",color:statusColor}}>{statusText}</span></div>
        <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.92}} onClick={()=>{abortRef.current?.abort();setStreaming(false);setMessages([]);}} className="p-1.5 rounded-lg" style={{background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.07)",cursor:"pointer"}}><RotateCcw size={13} style={{color:"rgba(31,41,55,0.5)"}}/></motion.button>
        <button className="p-1.5 rounded-lg" style={{background:"rgba(7,24,46,0.04)",border:"1px solid rgba(7,24,46,0.07)",cursor:"pointer"}}><MoreHorizontal size={13} style={{color:"rgba(31,41,55,0.5)"}}/></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length===0&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <AgentAvatar provider={provId} size={72} glow pulse/>
            <div><h2 className="text-2xl font-black mb-2" style={{fontFamily:"var(--font-syne)",color:accent}}>{prov.name}</h2><p className="text-[14px] max-w-sm mx-auto leading-relaxed" style={{fontFamily:"var(--font-outfit)",color:"rgba(31,41,55,0.5)"}}>{TAGLINES[provId]}</p></div>
            <div className="w-full max-w-md rounded-2xl p-3 text-left" style={{background:`rgba(${accentRgb},0.055)`,border:`1px solid rgba(${accentRgb},0.16)`}}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-[0.18em]" style={{fontFamily:"var(--font-jetbrains)",color:`rgba(${accentRgb},0.7)`}}>Comando real</span>
                <span className="flex items-center gap-1.5 text-[10px]" style={{fontFamily:"var(--font-jetbrains)",color:statusColor}}><span className="h-1.5 w-1.5 rounded-full" style={{background:statusColor}}/>{statusText}</span>
              </div>
              <div className="text-[11px] mb-1" style={{fontFamily:"var(--font-jetbrains)",color:"rgba(226,232,240,0.72)"}}>{commandLabel}</div>
              <div className="text-[10px]" style={{fontFamily:"var(--font-outfit)",color:"rgba(31,41,55,0.55)"}}>Bridge: {bridgeLabel} · Config: {health?.envKey??prov.envKey}{health?.latency?` · ${health.latency}ms`:""}</div>
              {health?.error&&<div className="text-[10px] mt-1 truncate" style={{fontFamily:"var(--font-outfit)",color:"#EF4444"}}>Error: {health.error}</div>}
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md w-full">
              {STARTERS[provId].map((s,i)=><motion.button key={i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1+i*0.08}} onClick={()=>{setInput(s);setTimeout(()=>textareaRef.current?.focus(),50);}} className="px-3 py-2 rounded-xl text-left text-[11px] leading-snug" style={{background:`rgba(${accentRgb},0.07)`,border:`1px solid rgba(${accentRgb},0.18)`,color:"rgba(226,232,240,0.65)",fontFamily:"var(--font-outfit)",cursor:"pointer"}} whileHover={{background:`rgba(${accentRgb},0.12)`}}>{s}</motion.button>)}
            </div>
          </motion.div>
        )}
        {grouped.map(({msg,isFirstOfGroup,isLastOfGroup})=><Bubble key={msg.id} msg={msg} isFirstOfGroup={isFirstOfGroup} isLastOfGroup={isLastOfGroup} provId={provId} accent={accent} accentRgb={accentRgb}/>)}
        <div ref={bottomRef} className="h-4"/>
      </div>

      {/* Input */}
      <div className="px-5 py-4 flex-shrink-0" style={{borderTop:`1px solid rgba(${accentRgb},0.1)`}}>
        {interimText&&<div className="mb-2 px-4 py-2 rounded-xl text-[13px] italic" style={{fontFamily:"var(--font-outfit)",color:`rgba(${accentRgb},0.6)`,background:`rgba(${accentRgb},0.05)`,border:`1px solid rgba(${accentRgb},0.1)`}}>🎤 {interimText}</div>}
        <div className="flex items-end gap-3 rounded-2xl px-4 py-3" style={{background:"rgba(13,20,40,0.9)",border:`1px solid rgba(${accentRgb},0.2)`}}>
          <textarea ref={textareaRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder={isListening?`Listening… speak now`:`Message ${prov.name}…`} rows={1} className="flex-1 bg-transparent resize-none focus:outline-none text-sm leading-relaxed" style={{fontFamily:"var(--font-outfit)",color:"#07182E",maxHeight:160,overflow:"auto"}}/>
          {/* Mic button */}
          {voiceSupported&&(
            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={startVoice} className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center relative" style={{background:isListening?`rgba(${accentRgb},0.2)`:"rgba(7,24,46,0.06)",border:isListening?`1px solid rgba(${accentRgb},0.5)`:"1px solid rgba(7,24,46,0.1)",cursor:"pointer"}}>
              {isListening&&<motion.div className="absolute inset-0 rounded-xl" style={{border:`2px solid rgba(${accentRgb},0.6)`}} animate={{scale:[1,1.2,1],opacity:[0.8,0,0.8]}} transition={{duration:1.2,repeat:Infinity}}/>}
              {isListening?<Mic size={15} style={{color:accent,position:"relative",zIndex:1}}/>:<MicOff size={15} style={{color:"rgba(31,41,55,0.4)",position:"relative",zIndex:1}}/>}
            </motion.button>
          )}
          {/* Send / Stop */}
          <AnimatePresence mode="wait">
            {streaming?(
              <motion.button key="stop" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} whileHover={{scale:1.08}} whileTap={{scale:0.92}} onClick={()=>{abortRef.current?.abort();setStreaming(false);}} className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",cursor:"pointer"}}><div className="w-3 h-3 rounded-sm" style={{background:"#EF4444"}}/></motion.button>
            ):(
              <motion.button key="send" initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.8,opacity:0}} whileHover={input.trim()?{scale:1.08}:undefined} whileTap={input.trim()?{scale:0.92}:undefined} onClick={send} disabled={!input.trim()} className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{background:input.trim()?accent:"rgba(7,24,46,0.06)",border:"none",cursor:input.trim()?"pointer":"default",transition:"background 0.2s ease"}}><Send size={15} style={{color:input.trim()?"#F7EFE2":`rgba(${accentRgb},0.3)`,transform:"rotate(-10deg)"}}/></motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between mt-2 px-1" style={{fontFamily:"var(--font-jetbrains)",fontSize:10,color:"rgba(31,41,55,0.28)"}}>
          <span>Return to send · Shift+Return for new line · 🎤 click mic to speak</span>
          <span style={{color:`rgba(${accentRgb},0.45)`}}>{prov.modelLabel}</span>
        </div>
      </div>
    </div>
  );
}
