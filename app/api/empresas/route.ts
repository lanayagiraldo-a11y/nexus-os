import { NextRequest, NextResponse } from "next/server";
import { loadEmpresas, saveEmpresas, getEmpresa, empresaSourcesBody, slug, type Empresa } from "@/lib/empresas";
import { resolveSources } from "@/lib/sources";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const p = await req.json();
    const action = p.action as string;

    switch (action) {
      case "list": {
        const { empresas } = await loadEmpresas(true);
        return NextResponse.json({ empresas });
      }

      case "upsert-empresa": {
        const { empresas } = await loadEmpresas();
        const nombre = String(p.nombre || "").trim();
        if (!nombre) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
        const id = p.id || slug(nombre);
        const idx = empresas.findIndex((e) => e.id === id);
        if (idx >= 0) empresas[idx] = { ...empresas[idx], nombre };
        else empresas.push({ id, nombre, sources: [] });
        await saveEmpresas(empresas);
        return NextResponse.json({ empresas, id });
      }

      case "delete-empresa": {
        const { empresas } = await loadEmpresas();
        const next = empresas.filter((e) => e.id !== p.id);
        await saveEmpresas(next);
        return NextResponse.json({ empresas: next });
      }

      case "add-source": {
        const { empresas } = await loadEmpresas();
        const e = empresas.find((x) => x.id === p.empresaId);
        if (!e) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        const directive = String(p.directive || "").trim().replace(/^@source:\s*/i, "");
        if (!directive) return NextResponse.json({ error: "Falta la directiva de fuente" }, { status: 400 });
        e.sources.push({ id: crypto.randomUUID().slice(0, 8), label: String(p.label || directive).trim(), directive });
        await saveEmpresas(empresas);
        return NextResponse.json({ empresas });
      }

      case "delete-source": {
        const { empresas } = await loadEmpresas();
        const e = empresas.find((x) => x.id === p.empresaId);
        if (e) e.sources = e.sources.filter((s) => s.id !== p.sourceId);
        await saveEmpresas(empresas);
        return NextResponse.json({ empresas });
      }

      case "save": {
        const empresas = Array.isArray(p.empresas) ? (p.empresas as Empresa[]) : [];
        await saveEmpresas(empresas);
        return NextResponse.json({ empresas });
      }

      case "preview": {
        const e = await getEmpresa(p.empresaId);
        if (!e) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        const { results } = await resolveSources(empresaSourcesBody(e));
        return NextResponse.json({ empresa: e.nombre, results });
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
