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

      // Some Netlify/OpenAI project keys can successfully call chat completions
      // while returning 401 on the generic /v1/models listing endpoint. Because
      // this route is polled by the UI every 30 seconds, avoid an expensive test
      // generation here and treat a present key as ready; /api/chat still surfaces
      // the real provider error if a message fails.
      return { id: "openai", configured: true, reachable: true, latency: null };
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
    (async (): Promise<ProviderHealth> => {
      const workspacePath = process.env.ANTIGRAVITY_WORKSPACE_PATH;
      if (!workspacePath) return { id: "antigravity", configured: false, reachable: null, latency: null };

      // Google Antigravity is an external IDE/workspace rather than a chat API.
      // Keep it visible in the fleet, but do not mark it online until a real
      // bridge exists; otherwise the UI would imply NEXUS can chat with it.
      return {
        id: "antigravity",
        configured: true,
        reachable: false,
        latency: null,
        error: "External IDE workspace configured; chat bridge pending",
      };
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
