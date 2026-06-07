import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { getHermesApiKey, getHermesBaseUrl, getHermesModel, getHermesSessionKey } from "@/lib/nexusConfig";

export interface AgentResult {
  provider: ProviderId;
  name: string;
  role: string;
  status: "completed" | "failed";
  content: string;
  error?: string;
}

export interface OrchestrationResponse {
  mission: string;
  mode: string;
  createdAt: string;
  results: AgentResult[];
  synthesis: string;
}

export const ORCHESTRATOR_ROLES: Record<ProviderId, string> = {
  claude: "Estratega crítico: analiza riesgos, estructura, profundidad, prioridades y decisiones.",
  openai: "Productor/redactor: convierte la misión en piezas accionables, copys, guiones, emails o entregables claros.",
  gemini: "Explorador creativo: propone ángulos, tendencias, variaciones, benchmarks e ideas alternativas.",
  hermes: "Segundo cerebro de Liliana: conecta con su contexto, empresas, Obsidian, marketing anti-caos y próximos pasos seguros.",
  antigravity: "Agente IDE externo: revisa arquitectura, tareas de código y coordinación técnica; no ejecuta hasta que exista puente real con el workspace.",
};

export const MODE_LABELS: Record<string, string> = {
  committee: "Comité completo",
  marketing: "Marketing Command Center",
  strategy: "Estrategia crítica",
  creative: "Creativos: copy, imágenes, carruseles, videos y prompts visuales",
  content: "Creativos: copy, imágenes, carruseles, videos y prompts visuales",
};

export function buildAgentPrompt(provider: ProviderId, mission: string, mode = "committee") {
  return `Misión de Liliana para el Mission Control:\n${mission}\n\nModo: ${MODE_LABELS[mode] ?? mode}\n\nTu rol específico: ${ORCHESTRATOR_ROLES[provider]}\n\nResponde en español, directo, útil y accionable. No digas que eres un modelo. Si el modo es Creativos, incluye cuando aplique: copy, idea visual, prompt para imagen/video, formato sugerido y caption. Entrega:\n1. Diagnóstico breve\n2. Aportes concretos desde tu rol\n3. Riesgos o vacíos\n4. Recomendación práctica para Liliana`;
}

export function buildSynthesisPrompt(mission: string, results: AgentResult[]) {
  const blocks = results.map(r => `## ${r.name} — ${r.status}\n${r.status === "completed" ? r.content : `ERROR: ${r.error}`}`).join("\n\n---\n\n");
  return `Eres Hermi, orquestador principal de Liliana. Sintetiza el comité multiagente.\n\nMisión original:\n${mission}\n\nRespuestas de agentes:\n${blocks}\n\nEntrega en español con esta estructura:\n## Veredicto ejecutivo\n## Qué aportó cada agente\n## Coincidencias importantes\n## Vacíos / riesgos\n## Recomendación final\n## Próximos pasos con aprobación de Liliana\n\nNo inventes acciones ejecutadas. Si algo requiere guardar, publicar, modificar Obsidian o tocar archivos, dilo como propuesta pendiente de aprobación.`;
}

async function callClaude(prompt: string): Promise<string> {
  if (!process.env.CLAUDE_API_KEY) throw new Error("CLAUDE_API_KEY not set");
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  const msg = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1800,
    system: "You are Claude inside NEXUS OS Mission Control.",
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content.map(part => part.type === "text" ? part.text : "").join("\n").trim();
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.5",
    messages: [
      { role: "system", content: "You are ChatGPT GPT-5.5 inside NEXUS OS Mission Control." },
      { role: "user", content: prompt },
    ],
  });
  return r.choices[0]?.message?.content?.trim() || "";
}

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function callHermes(prompt: string, timeoutMs = Number(process.env.HERMES_ORCHESTRATOR_TIMEOUT_MS ?? 90_000)): Promise<string> {
  const baseUrl = getHermesBaseUrl().replace(/\/$/, "");
  const model = getHermesModel();
  const key = getHermesApiKey();
  if (!key) throw new Error("HERMES_API_KEY not set");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  const sessionKey = getHermesSessionKey();
  if (sessionKey) headers["X-Hermes-Session-Key"] = sessionKey;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: "Eres Hermi/Hermes Agent dentro del Mission Control de NEXUS OS de Liliana. Actúa como segundo cerebro: contexto, Obsidian, herramientas y próximos pasos seguros. Responde en español directo." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Hermes Agent ${response.status}: ${raw.slice(0, 500)}`);
  const payload = raw ? JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> } : {};
  const text = payload.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Hermes Agent returned empty response");
  return text;
}

async function callProvider(provider: ProviderId, prompt: string): Promise<string> {
  switch (provider) {
    case "claude": return callClaude(prompt);
    case "openai": return callOpenAI(prompt);
    case "gemini": return callGemini(prompt);
    case "hermes": return callHermes(prompt);
    case "antigravity": throw new Error("Antigravity is registered as an external IDE workspace; no NEXUS chat/orchestrator bridge is configured yet.");
  }
}

export async function runAgentForMission(provider: ProviderId, mission: string, mode: string): Promise<AgentResult> {
  const def = PROVIDERS.find(p => p.id === provider)!;
  try {
    const content = await callProvider(provider, buildAgentPrompt(provider, mission, mode));
    return { provider, name: def.name, role: ORCHESTRATOR_ROLES[provider], status: "completed", content };
  } catch (error) {
    return { provider, name: def.name, role: ORCHESTRATOR_ROLES[provider], status: "failed", content: "", error: error instanceof Error ? error.message : String(error) };
  }
}

export async function synthesizeMission(mission: string, results: AgentResult[]): Promise<string> {
  const prompt = buildSynthesisPrompt(mission, results);
  try {
    return await callOpenAI(prompt);
  } catch {
    try {
      return await callClaude(prompt);
    } catch {
      try {
        return await callHermes(prompt, Number(process.env.HERMES_SYNTHESIS_TIMEOUT_MS ?? 35_000));
      } catch {
        const completed = results.filter(r => r.status === "completed");
        return [
          "## Veredicto ejecutivo",
          completed.length ? "El comité produjo insumos, pero la síntesis automática de Hermi falló. Revisa los aportes por agente abajo." : "Ningún agente pudo completar la misión.",
          "## Próximos pasos",
          "1. Revisar errores de configuración/API si aparecen.\n2. Reintentar la misión o usar solo los agentes disponibles.\n3. No se guardó ni modificó nada automáticamente.",
        ].join("\n\n");
      }
    }
  }
}

export async function orchestrateMission(mission: string, mode = "committee", agents: ProviderId[] = ["claude", "openai", "gemini", "hermes"]): Promise<OrchestrationResponse> {
  const cleanMission = mission.trim();
  if (!cleanMission) throw new Error("Mission is required");
  const uniqueAgents = Array.from(new Set(agents)).filter(a => PROVIDERS.some(p => p.id === a));
  const results = await Promise.all(uniqueAgents.map(agent => runAgentForMission(agent, cleanMission, mode)));
  const synthesis = await synthesizeMission(cleanMission, results);
  return { mission: cleanMission, mode, createdAt: new Date().toISOString(), results, synthesis };
}
