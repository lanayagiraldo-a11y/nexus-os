/**
 * Multi-empresa: cada empresa tiene SUS fuentes de información. Al seleccionar
 * una empresa (en el chat o en la cola) solo se consultan sus fuentes — nunca
 * se mezclan con las de otra empresa.
 *
 * Persistencia: como Nexus corre en Netlify (sin disco persistente), la config
 * se guarda como JSON en el cuerpo de un issue especial de GitHub. Se lee/escribe
 * con el mismo GITHUB_TOKEN (permiso Issues) — sin credenciales extra.
 */
import { gh, REPO } from "@/lib/openEngine";

export interface FuenteDef {
  id: string;
  label: string;
  /** Directiva tal cual va después de "@source: ", ej: "gestivo resource=conductores_con_grupo limit=50". */
  directive: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  sources: FuenteDef[];
}

const CONFIG_TITLE = "⚙️ NEXUS CONFIG — empresas (no borrar)";
const CONFIG_LABEL = "nexus-config";

interface RawIssue { number: number; title: string; body: string | null }

function renderBody(empresas: Empresa[]): string {
  return [
    "Configuración de empresas y fuentes de NEXUS OS. **No borrar ni editar a mano** — lo gestiona la app.",
    "",
    "```json",
    JSON.stringify({ empresas }, null, 2),
    "```",
  ].join("\n");
}

function parseBody(body: string | null): Empresa[] {
  if (!body) return [];
  const m = body.match(/```json\s*([\s\S]*?)```/);
  if (!m) return [];
  try {
    const data = JSON.parse(m[1]) as { empresas?: Empresa[] };
    return Array.isArray(data.empresas) ? data.empresas : [];
  } catch {
    return [];
  }
}

// El número del issue de config se recuerda para leerlo SIEMPRE directo por número
// (consistente), no vía el endpoint de lista (que va con retraso en GitHub).
let configIssueNumber: number | null = null;

async function ensureConfigIssue(): Promise<RawIssue> {
  if (configIssueNumber !== null) {
    return gh<RawIssue>(`/repos/${REPO}/issues/${configIssueNumber}`);
  }
  // Buscar una sola vez por título (solo abiertos; si hay duplicados, el que más empresas tenga).
  const issues = await gh<RawIssue[]>(`/repos/${REPO}/issues?state=open&per_page=100`);
  const matches = issues.filter((i) => i.title === CONFIG_TITLE);
  const existing = matches.sort((a, b) => parseBody(b.body).length - parseBody(a.body).length)[0];
  if (existing) {
    configIssueNumber = existing.number;
    // Releer directo por número para tener el cuerpo fresco.
    return gh<RawIssue>(`/repos/${REPO}/issues/${existing.number}`);
  }
  // Crear si no existe.
  try {
    await gh(`/repos/${REPO}/labels`, { method: "POST", body: JSON.stringify({ name: CONFIG_LABEL, color: "5319e7", description: "Config interna de NEXUS OS" }) });
  } catch { /* ya existe */ }
  const created = await gh<RawIssue>(`/repos/${REPO}/issues`, {
    method: "POST",
    body: JSON.stringify({ title: CONFIG_TITLE, body: renderBody([]), labels: [CONFIG_LABEL] }),
  });
  configIssueNumber = created.number;
  return created;
}

let cache: { at: number; empresas: Empresa[]; issueNumber: number } | null = null;

export async function loadEmpresas(force = false): Promise<{ empresas: Empresa[]; issueNumber: number }> {
  if (cache && !force && Date.now() - cache.at < 15_000) return { empresas: cache.empresas, issueNumber: cache.issueNumber };
  const issue = await ensureConfigIssue();
  const empresas = parseBody(issue.body);
  cache = { at: Date.now(), empresas, issueNumber: issue.number };
  return { empresas, issueNumber: issue.number };
}

export async function saveEmpresas(empresas: Empresa[]): Promise<void> {
  const issue = await ensureConfigIssue();
  await gh(`/repos/${REPO}/issues/${issue.number}`, { method: "PATCH", body: JSON.stringify({ body: renderBody(empresas) }) });
  cache = { at: Date.now(), empresas, issueNumber: issue.number };
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  const { empresas } = await loadEmpresas();
  return empresas.find((e) => e.id === id) ?? null;
}

/** Construye el cuerpo con líneas @source de TODAS las fuentes de una empresa, para resolverlas. */
export function empresaSourcesBody(empresa: Empresa): string {
  return empresa.sources.map((s) => `@source: ${s.directive}`).join("\n");
}

// slug simple para ids
export function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "empresa";
}
