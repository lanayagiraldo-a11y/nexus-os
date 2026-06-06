"use client";
import { useEffect, useRef } from "react";
interface Particle { x:number;y:number;vx:number;vy:number;radius:number;opacity:number;pulse:number;pulseSpeed:number; }
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number; let particles: Particle[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; init(); };
    const init = () => {
      const count = Math.floor((canvas.width * canvas.height) / 18000);
      particles = Array.from({ length: count }, () => ({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-0.5)*0.3, vy:(Math.random()-0.5)*0.3, radius:Math.random()*1.5+0.5, opacity:Math.random()*0.5+0.2, pulse:Math.random()*Math.PI*2, pulseSpeed:Math.random()*0.02+0.01 }));
    };
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (const p of particles) {
        p.x+=p.vx; p.y+=p.vy; p.pulse+=p.pulseSpeed;
        if (p.x<0) p.x=canvas.width; if (p.x>canvas.width) p.x=0;
        if (p.y<0) p.y=canvas.height; if (p.y>canvas.height) p.y=0;
        const op = p.opacity*(0.6+0.4*Math.sin(p.pulse));
        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius*3);
        g.addColorStop(0,`rgba(109,40,217,${op})`); g.addColorStop(1,"rgba(109,40,217,0)");
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius*3,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.radius,0,Math.PI*2); ctx.fillStyle=`rgba(109,40,217,${op*1.5})`; ctx.fill();
      }
      const maxDist=120;
      for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
        const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<maxDist) {
          const s=1-dist/maxDist,op=s*0.12;
          const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          g.addColorStop(0,`rgba(109,40,217,${op})`); g.addColorStop(0.5,`rgba(247,37,133,${op*0.8})`); g.addColorStop(1,`rgba(109,40,217,${op})`);
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle=g; ctx.lineWidth=s*0.8; ctx.stroke();
        }
      }
      animId = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize",resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize",resize); };
  },[]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{zIndex:0}} />;
}
