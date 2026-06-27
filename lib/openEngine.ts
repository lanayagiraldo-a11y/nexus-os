/**
 * Open Engine — cola de peticiones para los agentes de NEXUS OS sobre GitHub Issues.
 *
 * Cada issue del repo de cola es una "petición". Su estado vive en una etiqueta
 * `agent-*` y cada acción del agente deja un "recibo" como comentario.
 *
 * Patrón inspirado en Open Engine (Nate B. Jones), adaptado de Linear a GitHub.
 */

export type AgentState =
  | "agent-todo"
  | "agent-working"
  | "agent-needs-input"
  | "agent-review"
  | "agent-done"
  | "agent-blocked";

export const AGENT_STATES: AgentState[] = [
  "agent-todo",
  "agent-working",
  "agent-needs-input",
  "agent-review",
  "agent-done",
  "agent-blocked",
];

/** Definición de etiquetas (nombre, color hex sin #, descripción) para crearlas en el repo. */
export const STATE_LABELS: { name: AgentState; color: string; description: string }[] = [
  { name: "agent-todo", color: "ededed", description: "Petición en cola, lista para que un agente la tome" },
  { name: "agent-working", color: "fbca04", description: "Un agente está trabajando en esta petición" },
  { name: "agent-needs-input", color: "d4c5f9", description: "El agente necesita información o una decisión humana" },
  { name: "agent-review", color: "1d76db", description: "Trabajo terminado, esperando revisión humana" },
  { name: "agent-done", color: "0e8a16", description: "Petición completada y aprobada" },
  { name: "agent-blocked", color: "d73a4a", description: "El agente quedó bloqueado y no pudo continuar" },
];

export const REPO = process.env.OPEN_ENGINE_REPO || "lanayagiraldo-a11y/ia-masters-os";

const API = "https://api.github.com";

function token(): string {
  const t = process.env.GITHUB_TOKEN || "";
  if (!t) throw new Error("GITHUB_TOKEN no está configurado");
  return t;
}

export async function gh<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : null;
  if (!resp.ok) {
    const msg = (data && (data.message as string)) || resp.statusText;
    throw new Error(`GitHub ${resp.status}: ${msg}`);
  }
  return data as T;
}

// ---------- Tipos ----------

interface RawLabel { name: string }
interface RawIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: RawLabel[];
  assignee: { login: string } | null;
  created_at: string;
  updated_at: string;
}

export interface QueueIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  state: string;
  agentState: AgentState | null;
  agent: string | null;
  labels: string[];
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapIssue(i: RawIssue): QueueIssue {
  const labels = i.labels.map((l) => l.name);
  const agentState = (AGENT_STATES.find((s) => labels.includes(s)) as AgentState) ?? null;
  // Agente a cargo: etiqueta by:<agente> (la pone el runner) o, si no, el patrón [agente] del título.
  const byLabel = labels.find((l) => l.startsWith("by:"));
  const titleMatch = i.title.match(/\[(hermes|claude|codex|gemini|openai|deepseek|perplexity|manus)\]/i);
  const agent = byLabel ? byLabel.slice(3) : (titleMatch ? titleMatch[1].toLowerCase() : null);
  return {
    number: i.number,
    title: i.title,
    body: i.body ?? "",
    url: i.html_url,
    state: i.state,
    agentState,
    agent,
    labels,
    assignee: i.assignee?.login ?? null,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  };
}

// ---------- Lectura ----------

/**
 * Lista issues de la cola. Opcionalmente filtra por estado de agente.
 *
 * El filtro por estado se aplica del lado del cliente (no con `?labels=`) porque
 * el índice de etiquetas de GitHub es eventualmente consistente y puede omitir
 * issues recién creados o reetiquetados.
 */
export async function listQueue(agentState?: AgentState): Promise<QueueIssue[]> {
  const params = new URLSearchParams({ state: "all", per_page: "100", sort: "created", direction: "asc" });
  const data = await gh<RawIssue[]>(`/repos/${REPO}/issues?${params.toString()}`);
  // La API de issues también devuelve PRs; los filtramos.
  const issues = data.filter((i) => !(i as unknown as { pull_request?: unknown }).pull_request).map(mapIssue);
  return agentState ? issues.filter((i) => i.agentState === agentState) : issues;
}

export async function getIssue(number: number): Promise<QueueIssue> {
  return mapIssue(await gh<RawIssue>(`/repos/${REPO}/issues/${number}`));
}

// ---------- Escritura ----------

/** Crea una nueva petición en la cola (estado inicial agent-todo). */
export async function createPeticion(opts: {
  title: string;
  body?: string;
  extraLabels?: string[];
  assignee?: string;
  empresaId?: string;
}): Promise<QueueIssue> {
  const empresaLabel = opts.empresaId ? [`empresa:${opts.empresaId}`] : [];
  const labels = Array.from(new Set(["agent-todo", ...empresaLabel, ...(opts.extraLabels ?? [])]));
  const issue = await gh<RawIssue>(`/repos/${REPO}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: opts.title,
      body: opts.body ?? "",
      labels,
      ...(opts.assignee ? { assignee: opts.assignee } : {}),
    }),
  });
  return mapIssue(issue);
}

/** Cambia el estado del agente: quita cualquier etiqueta agent-* y pone la nueva, conservando el resto. */
export async function setAgentState(number: number, to: AgentState): Promise<QueueIssue> {
  const issue = await getIssue(number);
  const kept = issue.labels.filter((l) => !AGENT_STATES.includes(l as AgentState));
  const next = Array.from(new Set([...kept, to]));
  const updated = await gh<RawIssue>(`/repos/${REPO}/issues/${number}/labels`, {
    method: "PUT",
    body: JSON.stringify({ labels: next }),
  });
  // El endpoint de labels devuelve el array de labels, no el issue; releemos para devolver el issue completo.
  void updated;
  return getIssue(number);
}

/** Marca qué agente está a cargo del issue con la etiqueta by:<agente> (reemplaza la anterior). */
export async function setAgentBy(number: number, agent: string): Promise<void> {
  const issue = await getIssue(number);
  const kept = issue.labels.filter((l) => !l.startsWith("by:"));
  await gh(`/repos/${REPO}/issues/${number}/labels`, {
    method: "PUT",
    body: JSON.stringify({ labels: [...kept, `by:${agent}`] }),
  });
}

export type ReceiptKind = "CLAIMED" | "DONE" | "BLOCKED" | "NEEDS-INPUT" | "NOTE";

const RECEIPT_PREFIX: Record<ReceiptKind, string> = {
  CLAIMED: "🤖 **AGENT CLAIMED**",
  DONE: "✅ **AGENT DONE**",
  BLOCKED: "⛔ **AGENT BLOCKED**",
  "NEEDS-INPUT": "🟣 **AGENT NEEDS INPUT**",
  NOTE: "📝 **AGENT NOTE**",
};

/** Deja un recibo (comentario) en el issue, con el vocabulario de Open Engine. */
export async function addReceipt(number: number, kind: ReceiptKind, by: string, body = ""): Promise<void> {
  const header = `${RECEIPT_PREFIX[kind]} · _${by}_`;
  const comment = body ? `${header}\n\n${body}` : header;
  await gh(`/repos/${REPO}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body: comment }),
  });
}

/** Cierra el issue (se usa al pasar a done). */
export async function closeIssue(number: number): Promise<void> {
  await gh(`/repos/${REPO}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

/** Crea (o asegura) las etiquetas de estado en el repo. Idempotente. */
export async function setupLabels(): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];
  for (const label of STATE_LABELS) {
    try {
      await gh(`/repos/${REPO}/labels`, {
        method: "POST",
        body: JSON.stringify(label),
      });
      created.push(label.name);
    } catch (e) {
      // 422 = ya existe
      if (e instanceof Error && /422/.test(e.message)) existing.push(label.name);
      else throw e;
    }
  }
  return { created, existing };
}
