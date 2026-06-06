import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/providers";
import { getHermesApiKey, getHermesBaseUrl } from "@/lib/nexusConfig";

export const runtime = "nodejs";

interface ProviderHealth {
  id: string;
  configured: boolean;
  reachable: boolean | null;
  latency: number | null;
  error?: string;
}

async function pingUrl(url: string, headers: Record<string, string> = {}): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  try {
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    return { ok: resp.ok, latency: Date.now() - start, error: resp.ok ? undefined : `HTTP ${resp.status}` };
  } catch (error) {
    return { ok: false, latency: Date.now() - start, error: String(error) };
  }
}

export async function GET() {
  const hermesBaseUrl = getHermesBaseUrl().replace(/\/$/, "");
  const results: ProviderHealth[] = await Promise.all([
    (async (): Promise<ProviderHealth> => {
      const key = process.env.CLAUDE_API_KEY;
      if (!key) return { id: "claude", configured: false, reachable: null, latency: null };
      const { ok, latency, error } = await pingUrl("https://api.anthropic.com/v1/models", {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      });
      return { id: "claude", configured: true, reachable: ok, latency, error };
    })(),
    (async (): Promise<ProviderHealth> => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return { id: "openai", configured: false, reachable: null, latency: null };
      const { ok, latency, error } = await pingUrl("https://api.openai.com/v1/models", { Authorization: `Bearer ${key}` });
      return { id: "openai", configured: true, reachable: ok, latency, error };
    })(),
    (async (): Promise<ProviderHealth> => {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return { id: "gemini", configured: false, reachable: null, latency: null };
      const { ok, latency, error } = await pingUrl(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      return { id: "gemini", configured: true, reachable: ok, latency, error };
    })(),
    (async (): Promise<ProviderHealth> => {
      const key = getHermesApiKey();
      if (!key) return { id: "hermes", configured: false, reachable: null, latency: null };
      const { ok, latency, error } = await pingUrl(`${hermesBaseUrl}/v1/models`, { Authorization: `Bearer ${key}` });
      return { id: "hermes", configured: true, reachable: ok, latency, error };
    })(),
  ]);

  return NextResponse.json({
    providers: results.map((health) => {
      const def = PROVIDERS.find((p) => p.id === health.id);
      return {
        ...health,
        name: def?.name,
        modelLabel: def?.modelLabel,
        bridge: def?.bridge,
        commandLabel: def?.commandLabel,
        envKey: def?.envKey,
      };
    }),
    timestamp: Date.now(),
  });
}
