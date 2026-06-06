import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";
import { orchestrateMission } from "@/lib/orchestrator";
import type { ProviderId } from "@/lib/providers";

export const runtime = "nodejs";

type ContextType = "none" | "pasted" | "daily" | "vault-path" | "url";

interface MissionContextInput {
  type?: ContextType;
  label?: string;
  text?: string;
  path?: string;
  url?: string;
}

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getVaultPath(): string | null {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) return null;
  return vaultPath.replace(/^~/, process.env.HOME ?? "/root");
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

function trimContext(text: string, max = 24_000): string {
  const clean = text.replace(/\u0000/g, "").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}\n\n[Contexto truncado por tamaño: se enviaron los primeros ${max} caracteres.]`;
}

function looksPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = ipv4.slice(1).map(Number);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

function normalizeShareUrl(rawUrl: string): URL {
  const candidate = rawUrl.trim();
  const parsed = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("El link debe ser http o https.");
  if (looksPrivateHost(parsed.hostname)) throw new Error("Por seguridad, no puedo leer links locales/privados desde el Orquestador.");

  const folderMatch = parsed.href.match(/drive\.google\.com\/drive\/folders\/([^/?#]+)/);
  if (folderMatch) {
    throw new Error("Ese link es una carpeta de Google Drive. El Orquestador no puede listar carpetas externas de Drive todavía; pega el link directo del archivo dentro de la carpeta (Doc/Sheet/PDF) o pega el contenido. Para carpetas completas, muévelas a Obsidian y usa Ruta de Obsidian.");
  }

  const docMatch = parsed.href.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
  if (docMatch) {
    const [, kind, id] = docMatch;
    if (kind === "document") return new URL(`https://docs.google.com/document/d/${id}/export?format=txt`);
    if (kind === "spreadsheets") return new URL(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`);
    if (kind === "presentation") return new URL(`https://docs.google.com/presentation/d/${id}/export/txt`);
  }

  const driveMatch = parsed.href.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&]+)/);
  if (driveMatch) return new URL(`https://drive.google.com/uc?export=download&id=${driveMatch[1]}`);

  return parsed;
}

function htmlToReadableText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|section|article|li|h\d|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function looksLikeXlsx(buffer: ArrayBuffer, contentType: string, url: URL): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  return isZip || contentType.includes("spreadsheet") || url.searchParams.get("format") === "xlsx" || url.pathname.toLowerCase().endsWith(".xlsx");
}

async function xlsxToReadableText(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer" });
  const blocks: string[] = [];
  for (const sheetName of workbook.SheetNames.slice(0, 8)) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    const preview = rows
      .slice(0, 80)
      .map((row) => row.map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim()).join(" | "))
      .filter((line) => line.replace(/[|\s]/g, "").length > 0)
      .join("\n");
    blocks.push(`## Hoja: ${sheetName}\nFilas leídas para contexto: ${Math.min(rows.length, 80)} de ${rows.length}\n\n${preview}`);
  }
  return blocks.join("\n\n---\n\n");
}

async function resolveUrlContext(rawUrl: string): Promise<{ label: string; content: string; sources: string[] }> {
  if (!rawUrl?.trim()) throw new Error("Falta el link externo.");
  const url = normalizeShareUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "NEXUS-OS-Orchestrator/1.0 (+context-fetch)",
        "Accept": "text/plain,text/markdown,text/csv,text/html,application/json,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8",
      },
    });
    if (!response.ok) throw new Error(`No pude leer el link (${response.status} ${response.statusText}). Si es Drive/OneDrive, compártelo como público o pega el texto.`);

    const contentType = response.headers.get("content-type") ?? "";
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 3_000_000) throw new Error("El archivo es demasiado grande para leerlo directo. Súbelo a Obsidian o pega un extracto.");
    const text = looksLikeXlsx(arrayBuffer, contentType, url)
      ? await xlsxToReadableText(arrayBuffer)
      : contentType.includes("text/html")
        ? htmlToReadableText(new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer))
        : new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer);
    const normalized = trimContext(text);
    const lower = normalized.toLowerCase();
    if (!normalized || lower.includes("you need access") || lower.includes("request access") || (lower.includes("sign in") && lower.includes("google"))) {
      throw new Error("El link parece privado o requiere iniciar sesión. Cambia permisos a público/cualquiera con enlace, o pega el contenido.");
    }
    return { label: `Link externo: ${url.hostname}`, content: normalized, sources: [url.toString()] };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveDailyContext(vaultPath: string): Promise<{ label: string; content: string; sources: string[] }> {
  const today = todayStr();
  const candidates = [
    path.join(vaultPath, "daily", `${today}.md`),
    path.join(vaultPath, "daily-notes", `${today}.md`),
  ];
  for (const candidate of candidates) {
    const content = await readIfExists(candidate);
    if (content) return { label: `Daily note de hoy (${today})`, content: trimContext(content), sources: [candidate] };
  }
  return { label: `Daily note de hoy (${today})`, content: "No se encontró la daily note de hoy en daily/ ni daily-notes/.", sources: [] };
}

function safeVaultTarget(vaultPath: string, rawPath: string): string {
  const requested = rawPath.trim().replace(/^~\/?/, "");
  const absolute = path.isAbsolute(requested) ? requested : path.join(vaultPath, requested);
  const resolvedVault = path.resolve(vaultPath);
  const resolvedTarget = path.resolve(absolute);
  if (!resolvedTarget.startsWith(resolvedVault)) {
    throw new Error("Por seguridad, el contexto debe estar dentro de OBSIDIAN_VAULT_PATH.");
  }
  return resolvedTarget;
}

async function resolveVaultPathContext(vaultPath: string, rawPath: string): Promise<{ label: string; content: string; sources: string[] }> {
  const target = safeVaultTarget(vaultPath, rawPath);
  const stat = await fs.stat(target);
  if (stat.isFile()) {
    const content = await fs.readFile(target, "utf-8");
    return { label: `Archivo: ${path.relative(vaultPath, target)}`, content: trimContext(content), sources: [target] };
  }
  if (!stat.isDirectory()) throw new Error("La ruta de contexto no es archivo ni carpeta.");

  const allowed = new Set([".md", ".txt", ".csv", ".json"]);
  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase()))
    .slice(0, 12)
    .map((entry) => path.join(target, entry.name));

  const blocks: string[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    blocks.push(`## Fuente: ${path.relative(vaultPath, file)}\n\n${trimContext(content, 4_000)}`);
  }

  const skipped = entries.filter((entry) => entry.isFile()).length - files.length;
  const intro = `Inventario de carpeta: ${path.relative(vaultPath, target)}\nArchivos leídos: ${files.length}${skipped > 0 ? ` · omitidos por límite/formato: ${skipped}` : ""}`;
  return { label: `Carpeta: ${path.relative(vaultPath, target)}`, content: trimContext([intro, ...blocks].join("\n\n---\n\n")), sources: files };
}

async function buildMissionWithContext(mission: string, context?: MissionContextInput) {
  if (!context || !context.type || context.type === "none") {
    return { missionWithContext: mission, contextSummary: null };
  }

  let resolved: { label: string; content: string; sources: string[] };
  if (context.type === "pasted") {
    const content = trimContext(context.text ?? "");
    resolved = { label: context.label || "Texto pegado", content: content || "[Sin texto pegado]", sources: [] };
  } else if (context.type === "url") {
    resolved = await resolveUrlContext(context.url ?? context.text ?? "");
  } else {
    const vaultPath = getVaultPath();
    if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH no está configurado; no puedo leer contexto de Obsidian.");
    if (context.type === "daily") {
      resolved = await resolveDailyContext(vaultPath);
    } else if (context.type === "vault-path") {
      if (!context.path?.trim()) throw new Error("Falta la ruta del archivo/carpeta de Obsidian.");
      resolved = await resolveVaultPathContext(vaultPath, context.path);
    } else {
      resolved = { label: "Contexto", content: "", sources: [] };
    }
  }

  const missionWithContext = [
    mission,
    "",
    "---",
    `CONTEXTO SELECCIONADO PARA EL CONSEJO DE AGENTES: ${resolved.label}`,
    "Usa este contexto como fuente de trabajo. Si falta evidencia, dilo explícitamente y no inventes.",
    "",
    resolved.content,
  ].join("\n");

  return {
    missionWithContext,
    contextSummary: {
      type: context.type,
      label: resolved.label,
      sourceCount: resolved.sources.length,
      sources: resolved.sources.map((source) => source.replace(getVaultPath() ?? "", "").replace(/^\//, "")),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mission = typeof body.mission === "string" ? body.mission : "";
    const mode = typeof body.mode === "string" ? body.mode : "committee";
    const agents = Array.isArray(body.agents) ? body.agents as ProviderId[] : undefined;
    const context = typeof body.context === "object" && body.context !== null ? body.context as MissionContextInput : undefined;

    if (!mission.trim()) {
      return Response.json({ error: "Mission is required" }, { status: 400 });
    }

    const { missionWithContext, contextSummary } = await buildMissionWithContext(mission.trim(), context);
    const data = await orchestrateMission(missionWithContext, mode, agents);
    return Response.json({ ...data, mission: mission.trim(), context: contextSummary });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
