import { NextRequest, NextResponse } from "next/server";
import { parseUpload } from "@/lib/sources";
import { createDoc } from "@/lib/openEngine";
import { loadEmpresas, saveEmpresas } from "@/lib/empresas";

export const runtime = "nodejs";

const MAX_BYTES = 4_000_000; // ~4 MB (límite de body de funciones en Vercel)
const ALLOWED = [".xlsx", ".xls", ".docx", ".pdf", ".csv", ".tsv", ".txt", ".json", ".md", ".html", ".htm"];

/**
 * Sube un documento (Word/Excel/PDF/…) y lo añade como fuente PERSISTENTE de una empresa.
 * multipart/form-data: file, empresaId.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const empresaId = String(form.get("empresaId") || "");
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    if (!empresaId) return NextResponse.json({ error: "Falta empresaId" }, { status: 400 });

    const name = file.name || "documento";
    const lower = name.toLowerCase();
    if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
      return NextResponse.json({ error: `Tipo no soportado. Permitidos: ${ALLOWED.join(", ")}` }, { status: 415 });
    }
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: "Archivo demasiado grande (>4MB)" }, { status: 413 });

    const text = (await parseUpload(buffer, name)).replace(/\u0000/g, "").trim();
    if (!text) return NextResponse.json({ error: "No se pudo extraer texto del documento (¿PDF escaneado/imagen?)" }, { status: 422 });

    // Guardar el documento de forma persistente y referenciarlo desde la empresa.
    const issueNum = await createDoc(name, text);

    const { empresas } = await loadEmpresas();
    const empresa = empresas.find((e) => e.id === empresaId);
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    empresa.sources.push({ id: crypto.randomUUID().slice(0, 8), label: name, directive: `file issue=${issueNum}` });
    await saveEmpresas(empresas);

    return NextResponse.json({ empresas, doc: { name, issue: issueNum, chars: text.length } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
