import { NextResponse } from "next/server";
export const runtime = "nodejs";
interface ProviderHealth { id: string; configured: boolean; reachable: boolean | null; latency: number | null; error?: string; }
async function pingUrl(url: string, headers: Record<string,string> = {}): Promise<{ok:boolean;latency:number}> {
  const start = Date.now();
  try {
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    return { ok: resp.ok, latency: Date.now() - start };
  } catch { return { ok: false, latency: Date.now() - start }; }
}
export async function GET() {
  const results: ProviderHealth[] = await Promise.all([
    (async (): Promise<ProviderHealth> => {
      const configured = !!process.env.CLAUDE_API_KEY;
      if (!configured) return { id:"claude", configured:false, reachable:null, latency:null };
      const { ok, latency } = await pingUrl("https://api.anthropic.com/v1/models", { "x-api-key": process.env.CLAUDE_API_KEY!, "anthropic-version":"2023-06-01" });
      return { id:"claude", configured:true, reachable:ok, latency };
    })(),
    (async (): Promise<ProviderHealth> => {
      const configured = !!process.env.OPENAI_API_KEY;
      if (!configured) return { id:"openai", configured:false, reachable:null, latency:null };
      const { ok, latency } = await pingUrl("https://api.openai.com/v1/models", { Authorization:`Bearer ${process.env.OPENAI_API_KEY}` });
      return { id:"openai", configured:true, reachable:ok, latency };
    })(),
    (async (): Promise<ProviderHealth> => {
      const configured = !!process.env.GEMINI_API_KEY;
      if (!configured) return { id:"gemini", configured:false, reachable:null, latency:null };
      const { ok, latency } = await pingUrl(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
      return { id:"gemini", configured:true, reachable:ok, latency };
    })(),
    (async (): Promise<ProviderHealth> => {
      const baseUrl = process.env.HERMES_BASE_URL ?? "http://localhost:11434";
      const { ok, latency } = await pingUrl(`${baseUrl}/v1/models`).catch(() => ({ ok: false, latency: 0 }));
      return { id:"hermes", configured:true, reachable:ok, latency };
    })(),
  ]);
  return NextResponse.json({ providers: results, timestamp: Date.now() });
}
