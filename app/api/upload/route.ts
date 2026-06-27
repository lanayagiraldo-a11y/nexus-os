import { NextRequest, NextResponse } from "next/server";
import { parseUpload } from "@/lib/sources";

export const runtime = "nodejs";

const MAX_BYTES = 8_000_000; // 8 MB
const MAX_CHARS = 24_000;
const ALLOWED = [".xlsx", ".xls", ".csv", ".tsv", ".txt", ".json", ".md", ".html", ".htm"];

/**
 * Sube un archivo y lo convierte a texto para usarlo como fuente en el chat/consejo/cola.
 * multipart/form-data con campo "file".
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo (campo 'file')" }, { status: 400 });

    const name = file.name || "archivo";
    const lower = name.toLowerCase();
    if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
      return NextResponse.json({ error: `Tipo no soportado. Permitidos: ${ALLOWED.join(", ")} (los PDF aún no).` }, { status: 415 });
    }
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: "Archivo demasiado grande (>8MB)" }, { status: 413 });

    let text = (await parseUpload(buffer, name)).replace(/\u0000/g, "").trim();
    const truncated = text.length > MAX_CHARS;
    if (truncated) text = `${text.slice(0, MAX_CHARS)}\n\n[...truncado: archivo más grande que el contexto permitido]`;

    return NextResponse.json({ name, chars: text.length, truncated, text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
