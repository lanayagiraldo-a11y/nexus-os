import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// Vault path from .env.local — set OBSIDIAN_VAULT_PATH
function getVaultPath(): string {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set in .env.local");
  return vaultPath.replace(/^~/, process.env.HOME ?? "/Users/lilianaanaya");
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]; // "2026-05-30"
}

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

interface SaveChatBody {
  provider: string;
  providerName: string;
  messages: Array<{ role: string; content: string; timestamp?: string }>;
}

interface SaveGoalBody {
  goals: Array<{ id: string; text: string; done: boolean; createdAt: string }>;
}

interface SaveJournalBody {
  entry: string;
  voiceInput?: boolean;
}

// ── POST /api/obsidian ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body;

  try {
    const vaultPath = getVaultPath();
    const agenticDir = path.join(vaultPath, "Agentic OS");

    // Ensure folders exist
    await fs.mkdir(agenticDir, { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Chats"), { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Goals"), { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Journal"), { recursive: true });

    if (type === "chat") {
      return await saveChat(body as SaveChatBody & { type: string }, agenticDir);
    } else if (type === "goals") {
      return await saveGoals(body as SaveGoalBody & { type: string }, agenticDir);
    } else if (type === "journal") {
      return await saveJournal(body as SaveJournalBody & { type: string }, agenticDir);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[obsidian]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Save chat ──────────────────────────────────────────────────────────────
async function saveChat(body: SaveChatBody & { type: string }, agenticDir: string) {
  const today = todayStr();
  const filePath = path.join(agenticDir, "Chats", `${today}.md`);

  // Read existing content or create new
  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const separator = existing ? "\n\n---\n\n" : "";
  const header = existing ? "" : `# 💬 Chats — ${today}\n\`\`\`tags: nexus-os, agentic-os, chat\`\`\`\n\n`;

  const block = [
    `## 🤖 ${body.providerName} — ${formatTime()}`,
    "",
    ...body.messages.map(m =>
      m.role === "user"
        ? `**Tú:** ${m.content}`
        : `**${body.providerName}:** ${m.content}`
    ),
    "",
  ].join("\n");

  const content = header + existing + separator + block;
  await fs.writeFile(filePath, content, "utf-8");

  return NextResponse.json({ ok: true, file: filePath, today });
}

// ── Save goals ─────────────────────────────────────────────────────────────
async function saveGoals(body: SaveGoalBody & { type: string }, agenticDir: string) {
  const today = todayStr();
  const filePath = path.join(agenticDir, "Goals", "goals.md");

  const lines = [
    "# 🎯 Goals — NEXUS OS",
    `\`updated: ${today} ${formatTime()}\``,
    "",
    ...body.goals.map(g => `- [${g.done ? "x" : " "}] ${g.text}${g.done ? " ✅" : ""}`),
    "",
  ].join("\n");

  await fs.writeFile(filePath, lines, "utf-8");
  return NextResponse.json({ ok: true, file: filePath });
}

// ── Save journal ───────────────────────────────────────────────────────────
async function saveJournal(body: SaveJournalBody & { type: string }, agenticDir: string) {
  const today = todayStr();
  const filePath = path.join(agenticDir, "Journal", `${today}.md`);

  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const header = existing ? "" : `# 📓 Journal — ${today}\n\`\`\`tags: nexus-os, journal, diario\`\`\`\n\n`;
  const separator = existing ? "\n\n---\n\n" : "";
  const voiceTag = body.voiceInput ? " 🎤" : "";

  const entry = `### ${formatTime()}${voiceTag}\n\n${body.entry}\n`;
  const content = header + existing + separator + entry;

  await fs.writeFile(filePath, content, "utf-8");
  return NextResponse.json({ ok: true, file: filePath, today });
}

// ── GET /api/obsidian?type=goals ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  try {
    const vaultPath = getVaultPath();
    const agenticDir = path.join(vaultPath, "Agentic OS");

    if (type === "goals") {
      const filePath = path.join(agenticDir, "Goals", "goals.md");
      try {
        const content = await fs.readFile(filePath, "utf-8");
        // Parse checkboxes
        const goals = content
          .split("\n")
          .filter(l => l.startsWith("- ["))
          .map((l, i) => ({
            id: String(i),
            done: l.startsWith("- [x]"),
            text: l.replace(/^- \[[x ]\] /, "").replace(" ✅", "").trim(),
            createdAt: new Date().toISOString(),
          }));
        return NextResponse.json({ goals });
      } catch {
        return NextResponse.json({ goals: [] });
      }
    }

    if (type === "journal") {
      const today = todayStr();
      const filePath = path.join(agenticDir, "Journal", `${today}.md`);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        return NextResponse.json({ content, today });
      } catch {
        return NextResponse.json({ content: "", today });
      }
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
