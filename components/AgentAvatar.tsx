"use client";
import { motion } from "framer-motion";
import type { ProviderId } from "@/lib/providers";
interface AvatarProps { provider: ProviderId; size?: number; glow?: boolean; pulse?: boolean; }
function ClaudeIcon({size}:{size:number}) {
  return <svg width={size*0.55} height={size*0.55} viewBox="0 0 24 24" fill="none">
    <path d="M12 3 C6.48 3 2 7.48 2 13 C2 16.1 3.4 18.9 5.6 20.8 L5.6 21 L18.4 21 L18.4 20.8 C20.6 18.9 22 16.1 22 13 C22 7.48 17.52 3 12 3Z" fill="none" stroke="rgba(247,37,133,0.9)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 13.5 C8 11.02 9.79 9 12 9 C14.21 9 16 11.02 16 13.5" stroke="rgba(247,37,133,1)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="14.5" r="1.5" fill="#F72585"/>
  </svg>;
}
function OpenAIIcon({size}:{size:number}) {
  const s=size*0.52;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M22.28 9.82a5.98 5.98 0 00-.52-4.91 6.05 6.05 0 00-6.51-2.9A6.07 6.07 0 004.98 4.18a5.98 5.98 0 00-3.99 2.9 6.05 6.05 0 00.74 7.1 5.98 5.98 0 00.51 4.91 6.05 6.05 0 006.51 2.9A5.98 5.98 0 0013.26 24a6.06 6.06 0 005.77-4.21 5.99 5.99 0 003.99-2.9 6.06 6.06 0 00-.74-7.07zM13.26 22.3a4.48 4.48 0 01-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 00.39-.68V11l2.02 1.17a.07.07 0 01.04.05v5.58a4.5 4.5 0 01-4.49 4.5zm-9.66-4.13a4.47 4.47 0 01-.53-3.01l.14.08 4.78 2.76a.77.77 0 00.78 0l5.84-3.37v2.33a.08.08 0 01-.03.06L9.74 19.95a4.5 4.5 0 01-6.14-1.78zM2.34 7.9a4.49 4.49 0 012.37-1.97V11.6a.77.77 0 00.39.68l5.81 3.35-2.02 1.17a.08.08 0 01-.07 0L3.71 13.9A4.5 4.5 0 012.34 7.9zm16.6 3.86l-5.84-3.37 2.02-1.16a.08.08 0 01.07 0l4.83 2.79a4.49 4.49 0 01-.68 8.1V12.44a.79.79 0 00-.4-.68zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 00-.79 0L9.41 9.23V6.9a.07.07 0 01.03-.06l4.83-2.79a4.5 4.5 0 016.68 4.66zM8.31 12.86L6.29 11.7a.08.08 0 01-.04-.06V6.07a4.5 4.5 0 017.38-3.45l-.14.08L8.7 5.46a.79.79 0 00-.39.68v6.72zm1.1-2.37l2.6-1.5 2.6 1.5v2.99l-2.59 1.5-2.61-1.5V10.49z" fill="rgba(0,166,118,0.9)"/>
  </svg>;
}
function GeminiIcon({size}:{size:number}) {
  const s=size*0.54;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 2C12 2 11.2 7.5 8.5 10.5C5.8 13.5 2 13 2 13C2 13 5.8 12.5 8.5 15.5C11.2 18.5 12 24 12 24C12 24 12.8 18.5 15.5 15.5C18.2 12.5 22 13 22 13C22 13 18.2 13.5 15.5 10.5C12.8 7.5 12 2 12 2Z" fill="url(#gg)"/>
    <defs><linearGradient id="gg" x1="2" y1="2" x2="22" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#5F8C94"/><stop offset="50%" stopColor="#D98A70"/><stop offset="100%" stopColor="#6D28D9"/></linearGradient></defs>
  </svg>;
}
function HermesIcon({size}:{size:number}) {
  const s=size*0.52;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="3" x2="12" y2="21" stroke="rgba(109,40,217,0.9)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 8C10 6 6 6 5 8C6 9 9 8.5 12 10" fill="rgba(109,40,217,0.7)"/>
    <path d="M12 8C14 6 18 6 19 8C18 9 15 8.5 12 10" fill="rgba(109,40,217,0.7)"/>
    <path d="M12 12C10.5 11 8 11 7 12.5C8 13 10 12.5 12 13.5" fill="rgba(109,40,217,0.5)"/>
    <path d="M12 12C13.5 11 16 11 17 12.5C16 13 14 12.5 12 13.5" fill="rgba(109,40,217,0.5)"/>
    <circle cx="12" cy="6" r="2" fill="#6D28D9" opacity="0.9"/>
  </svg>;
}
function AntigravityIcon({size}:{size:number}) {
  const s=size*0.54;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="ag" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8"/>
        <stop offset="55%" stopColor="#4F46E5"/>
        <stop offset="100%" stopColor="#A855F7"/>
      </linearGradient>
    </defs>
    <path d="M12 2.5L19.5 8.2L16.7 20.5H7.3L4.5 8.2L12 2.5Z" stroke="url(#ag)" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M8.1 12.3L12 6.6L15.9 12.3L12 17.4L8.1 12.3Z" fill="url(#ag)" opacity="0.78"/>
    <path d="M5.4 8.8C8.2 10.2 15.8 10.2 18.6 8.8" stroke="#38BDF8" strokeWidth="1.1" strokeLinecap="round" opacity="0.75"/>
    <circle cx="12" cy="12" r="1.45" fill="#F7EFE2" opacity="0.95"/>
  </svg>;
}
const CFG: Record<ProviderId,{bg:string;border:string;shadow:string;Icon:React.ComponentType<{size:number}>}> = {
  claude:  {bg:"radial-gradient(circle at 35% 35%, rgba(247,37,133,0.25), rgba(124,58,237,0.1))",  border:"rgba(247,37,133,0.35)", shadow:"0 0 24px rgba(247,37,133,0.3),0 0 48px rgba(247,37,133,0.1)", Icon:ClaudeIcon},
  openai:  {bg:"radial-gradient(circle at 35% 35%, rgba(0,166,118,0.2), rgba(0,166,118,0.08))",   border:"rgba(0,166,118,0.35)",  shadow:"0 0 24px rgba(0,166,118,0.3),0 0 48px rgba(0,166,118,0.1)",  Icon:OpenAIIcon},
  gemini:  {bg:"radial-gradient(circle at 35% 35%, rgba(247,37,133,0.2), rgba(247,37,133,0.08))",   border:"rgba(247,37,133,0.35)",  shadow:"0 0 24px rgba(247,37,133,0.3),0 0 48px rgba(247,37,133,0.1)",  Icon:GeminiIcon},
  hermes:  {bg:"radial-gradient(circle at 35% 35%, rgba(109,40,217,0.2), rgba(247,37,133,0.08))",   border:"rgba(109,40,217,0.35)",  shadow:"0 0 24px rgba(109,40,217,0.3),0 0 48px rgba(109,40,217,0.1)",  Icon:HermesIcon},
  antigravity:{bg:"radial-gradient(circle at 35% 35%, rgba(79,70,229,0.22), rgba(56,189,248,0.08))",border:"rgba(79,70,229,0.36)",shadow:"0 0 24px rgba(79,70,229,0.28),0 0 48px rgba(56,189,248,0.12)",Icon:AntigravityIcon},
};
export default function AgentAvatar({provider,size=48,glow=false,pulse=false}:AvatarProps) {
  const cfg=CFG[provider]; const {Icon}=cfg;
  return (
    <motion.div className="relative flex-shrink-0 flex items-center justify-center rounded-xl"
      style={{width:size,height:size,background:cfg.bg,border:`1px solid ${cfg.border}`,boxShadow:glow?cfg.shadow:undefined}}
      whileHover={glow?{boxShadow:cfg.shadow}:undefined}>
      {pulse&&<motion.div className="absolute inset-0 rounded-xl" style={{border:`1px solid ${cfg.border}`}} animate={{scale:[1,1.18,1],opacity:[0.6,0,0.6]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut"}}/>}
      <Icon size={size}/>
    </motion.div>
  );
}
