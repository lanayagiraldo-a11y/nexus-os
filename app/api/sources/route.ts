import { NextRequest, NextResponse } from "next/server";
import { parseSourceDirectives, resolveOneSource, resolveSources, type SourceDirective } from "@/lib/sources";

export const runtime = "nodejs";

/**
 * Pruebas y previsualización de conectores de fuentes de datos.
 *
 *  - { action: "test", type: "supabase", args: { table: "viajes" } }
 *  - { action: "test", line: "supabase table=viajes limit=10" }
 *  - { action: "preview", body: "...texto del issue con @source:..." }
 *  - { action: "status" }  -> qué conectores están configurados
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const action = payload.action as string;

    if (action === "status") {
      return NextResponse.json({
        connectors: {
          supabase: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)),
          apify: Boolean(process.env.APIFY_TOKEN),
          sharepoint: Boolean(process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET),
          gestivo: Boolean(process.env.GESTIVO_API_KEY),
          url: true,
        },
      });
    }

    if (action === "preview") {
      const result = await resolveSources(String(payload.body || ""));
      return NextResponse.json(result);
    }

    if (action === "test") {
      let directive: SourceDirective | undefined;
      if (typeof payload.line === "string") {
        directive = parseSourceDirectives(`@source: ${payload.line}`)[0];
      } else if (payload.type) {
        directive = { type: String(payload.type).toLowerCase(), args: payload.args || {}, rest: "" };
      }
      if (!directive) return NextResponse.json({ error: "Falta 'line' o 'type'." }, { status: 400 });
      const result = await resolveOneSource(directive);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
