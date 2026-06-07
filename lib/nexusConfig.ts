export type ProviderId = "claude" | "openai" | "gemini" | "hermes" | "antigravity";

export interface NexusProviderConfig {
  id: ProviderId;
  name: string;
  fullName: string;
  model: string;
  modelLabel: string;
  provider: string;
  accent: string;
  accentRgb: string;
  icon: string;
  description: string;
  contextWindow: string;
  envKey: string;
  bridge: string;
  commandLabel: string;
  defaultBaseUrl?: string;
  roleTitle: string;
  uses: string[];
}

export const NEXUS_CONFIG = {
  app: {
    name: "NEXUS OS",
    version: "2.1.0",
    owner: "Liliana",
    subtitle: "Neural Executive eXperience Unified System",
    locale: "es-CO",
    timezone: "America/Bogota",
  },
  obsidian: {
    envKey: "OBSIDIAN_VAULT_PATH",
    defaultVaultPath: "/Users/lilianaanaya/Boveda Liliana A",
    agenticDir: "Agentic OS",
    folders: {
      chats: "Chats",
      goals: "Goals",
      journal: "Journal",
      dailyNotes: "daily-notes",
    },
  },
  hermes: {
    envBaseUrlKey: "HERMES_BASE_URL",
    envModelKey: "HERMES_MODEL",
    envProviderKey: "HERMES_PROVIDER",
    envApiKey: "HERMES_API_KEY",
    envSessionKey: "HERMES_SESSION_KEY",
    defaultBaseUrl: "http://127.0.0.1:8642",
    defaultModel: "hermes-agent",
    defaultProvider: "api_server",
  },
  providers: [
    {
      id: "claude",
      name: "Claude",
      fullName: "Claude Sonnet",
      model: "claude-sonnet-4-6",
      modelLabel: "Sonnet 4.6",
      provider: "Anthropic",
      accent: "#D18449",
      accentRgb: "209,132,73",
      icon: "🔮",
      description: "Reasoning, code & deep analysis",
      contextWindow: "200k",
      envKey: "CLAUDE_API_KEY",
      bridge: "anthropic-sdk",
      commandLabel: "POST /api/chat · provider=claude",
      roleTitle: "Finanzas · Estrategia · Código",
      uses: ["Análisis financiero y NIIF", "Estrategia empresarial", "Redacción legal y formal"],
    },
    {
      id: "openai",
      name: "ChatGPT",
      fullName: "ChatGPT",
      model: "gpt-5.5",
      modelLabel: "GPT-5.5",
      provider: "OpenAI",
      accent: "#8A9A55",
      accentRgb: "138,154,85",
      icon: "⚡",
      description: "General intelligence & creativity",
      contextWindow: "272k",
      envKey: "OPENAI_API_KEY",
      bridge: "openai-sdk",
      commandLabel: "POST /api/chat · provider=openai",
      roleTitle: "Marketing · Contenido · Emails",
      uses: ["Copys y campañas Buzzi", "Emails profesionales", "Ideas creativas y resúmenes"],
    },
    {
      id: "gemini",
      name: "Gemini",
      fullName: "Gemini",
      model: "gemini-2.5-flash",
      modelLabel: "2.5 Flash",
      provider: "Google",
      accent: "#5F8C94",
      accentRgb: "95,140,148",
      icon: "✨",
      description: "Multimodal · fast · grounded",
      contextWindow: "1M",
      envKey: "GEMINI_API_KEY",
      bridge: "google-sdk",
      commandLabel: "POST /api/chat · provider=gemini",
      roleTitle: "Research · Búsqueda en tiempo real",
      uses: ["Comparativos y benchmarks", "Noticias y tendencias", "Datos de mercado actualizados"],
    },
    {
      id: "hermes",
      name: "Hermes",
      fullName: "Hermes Agent",
      model: "hermes-agent",
      modelLabel: "Hermi",
      provider: "Hermes Agent",
      accent: "#E2B24F",
      accentRgb: "226,178,79",
      icon: "🪶",
      description: "Segundo cerebro · Obsidian · herramientas",
      contextWindow: "memoria + tools",
      envKey: "HERMES_API_KEY",
      bridge: "hermes-api-server",
      commandLabel: "POST /api/chat · provider=hermes → Hermes Agent",
      defaultBaseUrl: "http://127.0.0.1:8642",
      roleTitle: "Segundo cerebro · Obsidian · Herramientas",
      uses: ["Memoria y contexto personal", "Archivos y Obsidian", "Automatizaciones con herramientas"],
    },
    {
      id: "antigravity",
      name: "Antigravity",
      fullName: "Google Antigravity",
      model: "antigravity-workspace",
      modelLabel: "IDE Agent",
      provider: "Google",
      accent: "#4F46E5",
      accentRgb: "79,70,229",
      icon: "🛰️",
      description: "Workspace agent · IDE orchestration",
      contextWindow: "workspace",
      envKey: "ANTIGRAVITY_WORKSPACE_PATH",
      bridge: "external-ide",
      commandLabel: "External workspace · chat bridge pending",
      roleTitle: "Código · IDE · Multi-agente",
      uses: ["Proyectos de código", "Orquestación desde IDE", "Exploración técnica en workspace"],
    },
  ] satisfies NexusProviderConfig[],
} as const;

export const PROVIDER_CONFIGS: NexusProviderConfig[] = [...NEXUS_CONFIG.providers];

export function getConfiguredVaultPath(): string {
  return (process.env.OBSIDIAN_VAULT_PATH || NEXUS_CONFIG.obsidian.defaultVaultPath).replace(
    /^~/,
    process.env.HOME ?? "/Users/lilianaanaya"
  );
}

export function getHermesBaseUrl(): string {
  return process.env.HERMES_BASE_URL || NEXUS_CONFIG.hermes.defaultBaseUrl;
}

export function getHermesModel(): string {
  return process.env.HERMES_MODEL || NEXUS_CONFIG.hermes.defaultModel;
}

export function getHermesApiKey(): string | undefined {
  return process.env.HERMES_API_KEY || process.env.API_SERVER_KEY || process.env.CLAUDE_DASHBOARD_TOKEN;
}

export function getHermesSessionKey(): string | undefined {
  return process.env.HERMES_SESSION_KEY;
}

export function envIsConfigured(envKey: string): boolean {
  if (envKey === "HERMES_API_KEY") return Boolean(getHermesApiKey());
  return Boolean(process.env[envKey]);
}
