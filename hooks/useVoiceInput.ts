"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export type VoiceState = "idle"|"listening"|"unsupported";
interface UseVoiceInputOptions { onTranscript:(text:string,isFinal:boolean)=>void; lang?:string; }
export function useVoiceInput({onTranscript,lang="en-US"}:UseVoiceInputOptions) {
  const [state,setState]=useState<VoiceState>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef=useRef<any>(null);
  const isSupported=typeof window!=="undefined"&&("SpeechRecognition" in window||"webkitSpeechRecognition" in window);
  const stop=useCallback(()=>{ recognitionRef.current?.stop(); recognitionRef.current=null; setState("idle"); },[]);
  const start=useCallback(()=>{
    if (!isSupported){setState("unsupported");return;}
    if (state==="listening"){stop();return;}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;;
    const r=new SR(); r.lang=lang; r.continuous=true; r.interimResults=true; r.maxAlternatives=1;
    r.onstart=()=>setState("listening");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult=(event:any)=>{
      let interim="",final="";
      for(let i=event.resultIndex;i<event.results.length;i++){const res=event.results[i];if(res.isFinal)final+=res[0].transcript;else interim+=res[0].transcript;}
      if(final)onTranscript(final,true);else if(interim)onTranscript(interim,false);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onerror=(e:any)=>{if(e.error!=="aborted")setState("idle");};
    r.onend=()=>{setState("idle");recognitionRef.current=null;};
    recognitionRef.current=r; r.start();
  },[isSupported,lang,onTranscript,state,stop]);
  useEffect(()=>()=>{recognitionRef.current?.abort();},[]);
  return {state,start,stop,isSupported};
}
