/**
 * Conectores de fuentes de datos para Open Engine.
 *
 * El agente consulta estas fuentes al resolver una petición. En el cuerpo del
 * issue se declaran con líneas `@source:` — el runner las resuelve y antepone
 * el contenido como contexto antes de llamar al agente.
 *
 * Sintaxis (una por línea, en el cuerpo del issue):
 *   @source: url https://...
 *   @source: supabase table=viajes select=* limit=20 query=order=fecha.desc
 *   @source: apify dataset=<datasetId> limit=50
 *   @source: apify actor=<actorId> input={"search":"helados"}
 *   @source: sharepoint url=<link-de-compartir-de-Excel>
 */

const MAX_PER_SOURCE = 12_000;

function trim(text: string, max = MAX_PER_SOURCE): string {
  const clean = text.replace(/\u0000/g, "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}\n\n[...truncado: ${clean.length - max} caracteres más]`;
}

export interface SourceResult {
  type: string;
  label: string;
  ok: boolean;
  content: string;
  error?: string;
}

// ---------- Parser de directivas ----------

export interface SourceDirective {
  type: string;
  args: Record<string, string>;
  rest: string;
}

/** Extrae las líneas `@source:` del cuerpo de un issue. */
export function parseSourceDirectives(body: string): SourceDirective[] {
  const out: SourceDirective[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*@source:\s*(\S+)\s*(.*)$/i);
    if (!m) continue;
    const type = m[1].toLowerCase();
    const rest = m[2].trim();
    const args: Record<string, string> = {};
    // key=value (value puede ir entre comillas o ser JSON {...})
    const re = /(\w+)=("[^"]*"|\{[^}]*\}|\S+)/g;
    let km: RegExpExecArray | null;
    while ((km = re.exec(rest)) !== null) {
      args[km[1].toLowerCase()] = km[2].replace(/^"|"$/g, "");
    }
    out.push({ type, args, rest });
  }
  return out;
}

// ---------- URL genérica (incluye Google Docs/Sheets export y .xlsx) ----------

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|section|article|li|h\d|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n/g, "\n\n").trim();
}

async function xlsxToText(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const blocks: string[] = [];
  for (const name of wb.SheetNames.slice(0, 8)) {
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(wb.Sheets[name], { header: 1, blankrows: false, defval: "" });
    const preview = rows.slice(0, 80)
      .map((r) => r.map((c) => String(c ?? "").replace(/\s+/g, " ").trim()).join(" | "))
      .filter((l) => l.replace(/[|\s]/g, "").length > 0)
      .join("\n");
    blocks.push(`## Hoja: ${name} (${Math.min(rows.length, 80)}/${rows.length} filas)\n${preview}`);
  }
  return blocks.join("\n\n---\n\n");
}

async function bufferToReadable(buf: ArrayBuffer, contentType: string, url?: string): Promise<string> {
  const bytes = new Uint8Array(buf.slice(0, 4));
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isXlsx = isZip || contentType.includes("spreadsheet") || (url ?? "").toLowerCase().endsWith(".xlsx");
  if (isXlsx) return xlsxToText(buf);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
  return contentType.includes("text/html") ? htmlToText(text) : text;
}

async function fetchUrlSource(rawUrl: string): Promise<SourceResult> {
  const type = "url";
  try {
    if (!rawUrl) throw new Error("Falta la URL");
    let url = rawUrl;
    // Atajos de Google
    const doc = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (doc) {
      const [, kind, id] = doc;
      if (kind === "document") url = `https://docs.google.com/document/d/${id}/export?format=txt`;
      else if (kind === "spreadsheets") url = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
      else url = `https://docs.google.com/presentation/d/${id}/export/txt`;
    }
    const resp = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "NEXUS-OS-OpenEngine/1.0" } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buf = await resp.arrayBuffer();
    if (buf.byteLength > 5_000_000) throw new Error("Archivo demasiado grande (>5MB)");
    const content = trim(await bufferToReadable(buf, resp.headers.get("content-type") ?? "", url));
    return { type, label: `URL: ${new URL(url).hostname}`, ok: true, content };
  } catch (e) {
    return { type, label: "URL", ok: false, content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- Supabase / Postgres (vía PostgREST) ----------

async function fetchSupabaseSource(args: Record<string, string>): Promise<SourceResult> {
  const type = "supabase";
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  try {
    if (!url || !key) throw new Error("Configura SUPABASE_URL y SUPABASE_SERVICE_KEY (o SUPABASE_ANON_KEY) en .env.local");
    const table = args.table;
    if (!table) throw new Error("Falta table= (ej: @source: supabase table=viajes)");
    const params = new URLSearchParams();
    params.set("select", args.select || "*");
    params.set("limit", args.limit || "50");
    if (args.order) params.set("order", args.order);
    // query= permite querystring PostgREST cruda extra (ej: query=status=eq.activo)
    if (args.query) for (const part of args.query.split("&")) { const [k, v] = part.split("="); if (k) params.append(k, v ?? ""); }
    const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}?${params.toString()}`;
    const resp = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`Supabase ${resp.status}: ${text.slice(0, 300)}`);
    const rows = JSON.parse(text) as unknown[];
    const content = trim(`Tabla ${table} — ${rows.length} filas:\n\n${JSON.stringify(rows, null, 2)}`);
    return { type, label: `Supabase: ${table} (${rows.length})`, ok: true, content };
  } catch (e) {
    return { type, label: "Supabase", ok: false, content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- Apify ----------

async function fetchApifySource(args: Record<string, string>): Promise<SourceResult> {
  const type = "apify";
  const token = process.env.APIFY_TOKEN;
  try {
    if (!token) throw new Error("Configura APIFY_TOKEN en .env.local");
    const limit = args.limit || "50";
    let items: unknown[];
    let label: string;
    if (args.dataset) {
      const resp = await fetch(`https://api.apify.com/v2/datasets/${args.dataset}/items?clean=true&limit=${limit}&token=${token}`, { signal: AbortSignal.timeout(30_000) });
      if (!resp.ok) throw new Error(`Apify dataset ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
      items = await resp.json();
      label = `Apify dataset ${args.dataset}`;
    } else if (args.actor) {
      const input = args.input ? JSON.parse(args.input) : {};
      const resp = await fetch(`https://api.apify.com/v2/acts/${args.actor.replace("/", "~")}/run-sync-get-dataset-items?token=${token}&limit=${limit}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(120_000),
      });
      if (!resp.ok) throw new Error(`Apify actor ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
      items = await resp.json();
      label = `Apify actor ${args.actor}`;
    } else {
      throw new Error("Usa dataset=<id> o actor=<id> (ej: @source: apify actor=apify/web-scraper input={...})");
    }
    const content = trim(`${label} — ${items.length} items:\n\n${JSON.stringify(items, null, 2)}`);
    return { type, label: `${label} (${items.length})`, ok: true, content };
  } catch (e) {
    return { type, label: "Apify", ok: false, content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- SharePoint / OneDrive Excel (Microsoft Graph) ----------

async function graphToken(): Promise<string> {
  const tenant = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const secret = process.env.MS_CLIENT_SECRET;
  if (!tenant || !clientId || !secret) throw new Error("Configura MS_TENANT_ID, MS_CLIENT_ID y MS_CLIENT_SECRET en .env.local");
  const body = new URLSearchParams({ client_id: clientId, client_secret: secret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" });
  const resp = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Graph auth ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return data.access_token as string;
}

/** Codifica un sharing link al formato share id de Graph (u! + base64url). */
function encodeShareUrl(shareUrl: string): string {
  const b64 = Buffer.from(shareUrl).toString("base64").replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
  return `u!${b64}`;
}

async function fetchSharepointSource(args: Record<string, string>): Promise<SourceResult> {
  const type = "sharepoint";
  try {
    const shareUrl = args.url;
    if (!shareUrl) throw new Error("Falta url=<link de compartir de Excel> (ej: @source: sharepoint url=https://...sharepoint.com/...)");
    const token = await graphToken();
    const shareId = encodeShareUrl(shareUrl);
    const resp = await fetch(`https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem/content`, {
      headers: { Authorization: `Bearer ${token}` }, redirect: "follow", signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) throw new Error(`Graph ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
    const buf = await resp.arrayBuffer();
    const content = trim(await xlsxToText(buf));
    return { type, label: `SharePoint Excel`, ok: true, content };
  } catch (e) {
    return { type, label: "SharePoint", ok: false, content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- GESTIVO (Data API propia de solo lectura) ----------

const GESTIVO_BASE = process.env.GESTIVO_API_URL || "https://saas-six-vert.vercel.app";

interface GestivoFilter { column: string; op: string; value: string }

/**
 * Conector de la Data API GESTIVO.
 *   @source: gestivo schema=true
 *   @source: gestivo resource=conductores_con_grupo where=estado:eq:ACTIVO limit=20
 *   @source: gestivo resource=cierres_diarios where=fecha:gte:2026-06-01 order=fecha limit=50
 * Admite varios filtros repitiendo where=columna:operador:valor.
 */
async function fetchGestivoSource(d: SourceDirective): Promise<SourceResult> {
  const type = "gestivo";
  const key = process.env.GESTIVO_API_KEY;
  try {
    if (!key) throw new Error("Configura GESTIVO_API_KEY en .env.local");
    const headers = { "x-api-key": key, "Content-Type": "application/json" };

    // Esquema: lista de recursos y columnas disponibles.
    if (d.args.schema || (!d.args.resource && /\bschema\b/i.test(d.rest))) {
      const resp = await fetch(`${GESTIVO_BASE}/api/external/v1/schema`, { headers, signal: AbortSignal.timeout(20_000) });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`GESTIVO schema ${resp.status}: ${text.slice(0, 300)}`);
      return { type, label: "GESTIVO: esquema", ok: true, content: trim(text) };
    }

    const resource = d.args.resource;
    if (!resource) throw new Error("Falta resource= (ej: @source: gestivo resource=conductores_con_grupo) o usa schema=true");

    // Filtros: where=columna:operador:valor (admite varios).
    const filters: GestivoFilter[] = [];
    const re = /where=(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(d.rest)) !== null) {
      const parts = m[1].split(":");
      if (parts.length >= 3) filters.push({ column: parts[0], op: parts[1], value: parts.slice(2).join(":") });
    }

    const body: Record<string, unknown> = { resource, filters, limit: Number(d.args.limit || 50) };
    if (d.args.order) body.order = d.args.order;

    const resp = await fetch(`${GESTIVO_BASE}/api/external/v1/query`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`GESTIVO ${resp.status}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text) as { data?: unknown[]; count?: number; total?: number };
    const rows = json.data ?? (json as unknown[]);
    const n = json.count ?? (Array.isArray(rows) ? rows.length : 0);
    const content = trim(`Recurso ${resource} — ${n} de ${json.total ?? "?"} filas${filters.length ? ` (filtros: ${filters.map((f) => `${f.column} ${f.op} ${f.value}`).join(", ")})` : ""}:\n\n${JSON.stringify(rows, null, 2)}`);
    return { type, label: `GESTIVO: ${resource} (${n}/${json.total ?? "?"})`, ok: true, content };
  } catch (e) {
    return { type, label: "GESTIVO", ok: false, content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ---------- Resolución ----------

export async function resolveOneSource(d: SourceDirective): Promise<SourceResult> {
  switch (d.type) {
    case "url": return fetchUrlSource(d.args.url || d.rest.trim());
    case "supabase": case "postgres": return fetchSupabaseSource(d.args);
    case "apify": return fetchApifySource(d.args);
    case "sharepoint": case "excel": return fetchSharepointSource(d.args);
    case "gestivo": case "api": return fetchGestivoSource(d);
    default: return { type: d.type, label: d.type, ok: false, content: "", error: `Fuente desconocida: ${d.type}. Usa url, supabase, apify, sharepoint o gestivo.` };
  }
}

/** Resuelve todas las directivas @source de un cuerpo de issue y devuelve el bloque de contexto. */
export async function resolveSources(body: string): Promise<{ context: string; results: SourceResult[] }> {
  const directives = parseSourceDirectives(body);
  if (!directives.length) return { context: "", results: [] };
  const results = await Promise.all(directives.map(resolveOneSource));
  const blocks = results.map((r) =>
    r.ok ? `### Fuente — ${r.label}\n${r.content}` : `### Fuente — ${r.label} (ERROR)\n${r.error}`,
  );
  const context = ["## CONTEXTO DE FUENTES DE DATOS", "Usa estos datos como evidencia. No inventes lo que no esté aquí.", "", ...blocks].join("\n\n");
  return { context, results };
}
