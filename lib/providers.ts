export type ProviderId = "claude" | "openai" | "gemini" | "hermes";
export interface ProviderDef {
  id: ProviderId; name: string; fullName: string; model: string; modelLabel: string;
  provider: string; accent: string; accentRgb: string; icon: string; description: string;
  contextWindow: string; envKey: string; bridge: string; baseUrl?: string;
}
export const PROVIDERS: ProviderDef[] = [
  { id:"claude", name:"Claude", fullName:"Claude claude-sonnet-4-6", model:"claude-sonnet-4-6", modelLabel:"Sonnet 4.6", provider:"Anthropic", accent:"#a78bfa", accentRgb:"167,139,250", icon:"🔮", description:"Reasoning, code & deep analysis", contextWindow:"200k", envKey:"ANTHROPIC_API_KEY", bridge:"anthropic-sdk" },
  { id:"openai", name:"ChatGPT", fullName:"GPT-4o", model:"gpt-4o", modelLabel:"GPT-4o", provider:"OpenAI", accent:"#34d399", accentRgb:"52,211,153", icon:"⚡", description:"General intelligence & creativity", contextWindow:"128k", envKey:"OPENAI_API_KEY", bridge:"openai-sdk" },
  { id:"gemini", name:"Gemini", fullName:"Gemini 2.0 Flash", model:"gemini-2.0-flash", modelLabel:"2.0 Flash", provider:"Google", accent:"#60a5fa", accentRgb:"96,165,250", icon:"✨", description:"Multimodal · fast · grounded", contextWindow:"1M", envKey:"GEMINI_API_KEY", bridge:"google-sdk" },
  { id:"hermes", name:"Hermes", fullName:"Nous Hermes (VPS)", model:"gpt-5.5", modelLabel:"gpt-5.5", provider:"Nous Research", accent:"#fbbf24", accentRgb:"251,191,36", icon:"🪶", description:"Local VPS · blazing fast · private", contextWindow:"272k", envKey:"HERMES_BASE_URL", bridge:"ollama", baseUrl:process.env.HERMES_BASE_URL??"http://localhost:11434" },
];
export const getProvider = (id: ProviderId) => PROVIDERS.find(p => p.id === id)!;
