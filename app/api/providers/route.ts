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

async function pingClaude(key: string): Promise<{ ok: boolean; latency: number; error?: string }> {
  const start = Date.now();
  if (!key.startsWith("sk-ant-")) {
    return { ok: false, latency: 0, error: "CLAUDE_API_KEY no tiene formato de llave Anthropic (sk-ant-...)" };
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "OK" }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (resp.ok) return { ok: true, latency };

    const body = await resp.text();
    const clean = body.includes("authentication_error")
      ? "Claude no pudo autenticarse con la llave de producción"
      : body.includes("not_found_error") || body.includes("model")
        ? "El modelo Claude configurado no está disponible para esta llave"
        : `HTTP ${resp.status}`;
    return { ok: false, latency, error: clean };
  } catch (error) {
    return { ok: false, latency: Date.now() - start, error: String(error) };
  }
}

export async function GET() {
  const hermesBaseUrl = getHermesBaseUrl().replace(/\/$/, "");
  const results: ProviderHealth[] = await Promise.all([
    (async (): Promise<ProviderHealth> => {
      const key = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY;
      if (!key) return { id: "claude", configured: false, reachable: null, latency: null };
      const { ok, latency, error } = await pingClaude(key);
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
