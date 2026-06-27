import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const VAULT = "/root/obsidian-vault";

const FOLDERS: Record<string, { label: string; p: string }> = {
  "la-carolina": { label: "La Carolina", p: "empresas/la-carolina" },
  "dar-ibrahim": { label: "Dar Ibrahim", p: "proyectos/dar-ibrahim" },
  "fondo-sv": { label: "Fondo El Salvador", p: "proyectos/fondo-inversion-el-salvador" },
  "iera": { label: "IERA", p: "empresas/iera" },
  "taqwa": { label: "Taqwa Team", p: "proyectos/taqwa-team" },
  "personal": { label: "Personal", p: "personal" },
};

export async function GET() {
  const ctx = [
    { id: "none", label: "Sin contexto", hint: "Solo la misión", available: true },
    { id: "daily", label: "Daily note de hoy", hint: "Nota diaria", available: true },
  ];
  for (const [id, info] of Object.entries(FOLDERS)) {
    let avail = false;
    try { await fs.access(path.join(VAULT, info.p)); avail = true; } catch {}
    ctx.push({ id, label: info.label, hint: info.p, available: avail });
  }
  return NextResponse.json({ contexts: ctx });
}

export async function POST(req: NextRequest) {
  let contextId = "";
  try {
    const body = await req.json();
    contextId = body.contextId || "";
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!contextId || contextId === "none") {
    return NextResponse.json({ type: "empty", content: "" });
  }

  try {
    if (contextId === "daily") {
      const today = new Date().toISOString().slice(0, 10);
      for (const dir of ["daily", "daily-notes"]) {
        const fp = path.join(VAULT, dir, `${today}.md`);
        try {
          const c = await fs.readFile(fp, "utf-8");
          return NextResponse.json({ type: "file", content: c.slice(0, 2500) });
        } catch {}
      }
      return NextResponse.json({ type: "empty", content: "No daily note today" });
    }

    const info = FOLDERS[contextId];
    if (!info) return NextResponse.json({ type: "empty", content: "" });

    const dirPath = path.join(VAULT, info.p);
    const stat = await fs.stat(dirPath);

    if (stat.isDirectory()) {
      const files = (await fs.readdir(dirPath)).filter((f: string) => f.endsWith(".md")).slice(0, 10);
      const items = await Promise.all(files.map(async (f: string) => {
        try {
          const c = await fs.readFile(path.join(dirPath, f), "utf-8");
          const t = c.split("\n").find((l: string) => l.startsWith("# "))?.replace("# ", "").trim() || f.replace(".md", "");
          return { file: f, title: t };
        } catch { return { file: f, title: f.replace(".md", "") }; }
      }));
      return NextResponse.json({ type: "dir", items });
    }

    const content = await fs.readFile(dirPath, "utf-8");
    return NextResponse.json({ type: "file", content: content.slice(0, 2500) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
