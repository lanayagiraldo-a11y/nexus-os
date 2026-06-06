import { PROVIDER_CONFIGS, type ProviderId } from "./nexusConfig";

export type { ProviderId };

export interface ProviderDef {
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
  baseUrl?: string;
  roleTitle: string;
  uses: string[];
}

export const PROVIDERS: ProviderDef[] = PROVIDER_CONFIGS.map((p) => ({
  ...p,
  baseUrl: p.defaultBaseUrl,
}));

export const getProvider = (id: ProviderId) => PROVIDERS.find((p) => p.id === id)!;
