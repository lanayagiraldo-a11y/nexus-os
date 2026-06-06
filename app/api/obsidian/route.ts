import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function getVaultPath(): string {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) throw new Error("OBSIDIAN_VAULT_PATH not set in .env.local");
  return vaultPath.replace(/^~/, process.env.HOME ?? "/Users/lilianaanaya");
}

function todayStr(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function formatTime(): string {
  return new Date().toLocaleTimeString("es-CO", { hour12: false, timeZone: "America/Bogota" });
}

async function resolveDailyFile(vaultPath: string, create = false): Promise<string> {
  const today = todayStr();
  const preferredDir = path.join(vaultPath, "daily");
  const preferred = path.join(preferredDir, `${today}.md`);
  const legacy = path.join(vaultPath, "daily-notes", `${today}.md`);

  if (create) {
    await fs.mkdir(preferredDir, { recursive: true });
    return preferred;
  }

  try {
    await fs.access(preferred);
    return preferred;
  } catch {
    try {
      await fs.access(legacy);
      return legacy;
    } catch {
      return preferred;
    }
  }
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

interface SaveDailyCaptureBody {
  entry: string;
  rawEntry?: string;
  category?: string;
  kind?: string;
  action?: string;
}

interface SaveOrchestrationBody {
  mission: string;
  mode?: string;
  contextLabel?: string;
  synthesis: string;
  tasks?: string[];
  execution?: "save-synthesis" | "create-tasks" | "save-and-create-tasks";
}

interface DailyTask {
  id: string;
  title: string;
  section: string;
  checked: boolean;
  inProgress: boolean;
  priority: "high" | "medium" | "normal" | "waiting";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type } = body;

  try {
    const vaultPath = getVaultPath();
    const agenticDir = path.join(vaultPath, "Agentic OS");

    await fs.mkdir(agenticDir, { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Chats"), { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Goals"), { recursive: true });
    await fs.mkdir(path.join(agenticDir, "Journal"), { recursive: true });

    if (type === "chat") return await saveChat(body as SaveChatBody & { type: string }, agenticDir);
    if (type === "goals") return await saveGoals(body as SaveGoalBody & { type: string }, agenticDir);
    if (type === "journal") return await saveJournal(body as SaveJournalBody & { type: string }, agenticDir);
    if (type === "daily-capture") return await saveDailyCapture(body as SaveDailyCaptureBody & { type: string }, vaultPath);
    if (type === "orchestration") return await saveOrchestration(body as SaveOrchestrationBody & { type: string }, vaultPath);

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[obsidian]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function saveChat(body: SaveChatBody & { type: string }, agenticDir: string) {
  const today = todayStr();
  const filePath = path.join(agenticDir, "Chats", `${today}.md`);
  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const separator = existing ? "\n\n---\n\n" : "";
  const header = existing ? "" : `# 💬 Chats — ${today}\n\`\`\`tags: nexus-os, agentic-os, chat\`\`\`\n\n`;
  const block = [
    `## 🤖 ${body.providerName} — ${formatTime()}`,
    "",
    ...body.messages.map(m => m.role === "user" ? `**Tú:** ${m.content}` : `**${body.providerName}:** ${m.content}`),
    "",
  ].join("\n");

  await fs.writeFile(filePath, header + existing + separator + block, "utf-8");
  return NextResponse.json({ ok: true, file: filePath, today });
}

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

async function saveJournal(body: SaveJournalBody & { type: string }, agenticDir: string) {
  const today = todayStr();
  const filePath = path.join(agenticDir, "Journal", `${today}.md`);
  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const header = existing ? "" : `# 📓 Journal — ${today}\n\`\`\`tags: nexus-os, journal, diario\`\`\`\n\n`;
  const separator = existing ? "\n\n---\n\n" : "";
  const voiceTag = body.voiceInput ? " 🎤" : "";
  const entry = `### ${formatTime()}${voiceTag}\n\n${body.entry}\n`;

  await fs.writeFile(filePath, header + existing + separator + entry, "utf-8");
  return NextResponse.json({ ok: true, file: filePath, today });
}

async function saveDailyCapture(body: SaveDailyCaptureBody & { type: string }, vaultPath: string) {
  const today = todayStr();
  const filePath = await resolveDailyFile(vaultPath, true);
  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const header = existing ? "" : `---\ntitle: Daily ${today}\ndate: ${today}\ntags:\n  - daily\n---\n\n# ${today}\n\n## Capturas / entradas\n\n## Trabajo realizado\n\n## Pendientes\n\n## 🔗 Relacionado\n\n- [[PANEL DE CONTROL]]\n`;
  const shouldCreateTask = body.action === "Crear pendiente";
  const rawTask = (body.rawEntry ?? body.entry).trim().split("\n").map(line => line.trim()).filter(Boolean).join(" ");
  const taskTitle = rawTask.length > 220 ? `${rawTask.slice(0, 220)}…` : rawTask;
  const taskMeta = [body.category, body.kind].filter(Boolean).join(" · ");
  const taskLine = shouldCreateTask && taskTitle
    ? `\n\n### ✅ Pendiente creado desde Inbox\n\n- [ ] ${taskTitle}${taskMeta ? ` — ${taskMeta}` : ""}`
    : "";
  const entry = `\n\n## ⚡ Captura rápida — ${formatTime()}\n\n${body.entry.trim()}${taskLine}\n`;
  await fs.writeFile(filePath, existing ? `${existing}${entry}` : `${header}${entry}`, "utf-8");
  return NextResponse.json({ ok: true, file: filePath, today, createdTask: shouldCreateTask });
}

async function saveOrchestration(body: SaveOrchestrationBody & { type: string }, vaultPath: string) {
  const today = todayStr();
  const filePath = await resolveDailyFile(vaultPath, true);
  let existing = "";
  try { existing = await fs.readFile(filePath, "utf-8"); } catch { /* new file */ }

  const header = existing ? "" : `---\ntitle: Daily ${today}\ndate: ${today}\ntags:\n  - daily\n---\n\n# ${today}\n\n## Capturas / entradas\n\n## Trabajo realizado\n\n## Pendientes\n\n## 🔗 Relacionado\n\n- [[PANEL DE CONTROL]]\n`;
  const execution = body.execution ?? "save-synthesis";
  const shouldSaveSynthesis = execution === "save-synthesis" || execution === "save-and-create-tasks";
  const shouldCreateTasks = execution === "create-tasks" || execution === "save-and-create-tasks";
  const cleanTasks = (body.tasks ?? [])
    .map(task => task.replace(/^\s*(?:[-*]|\d+\.)\s*/, "").replace(/^\[[ xX/-]\]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 12);

  const lines: string[] = [
    `\n\n## 🧠 Orquestador NEXUS — ${formatTime()}`,
    "",
    `**Modo:** ${body.mode ?? "committee"}`,
    body.contextLabel ? `**Contexto:** ${body.contextLabel}` : "**Contexto:** sin fuente adicional",
    "",
    "**Misión:**",
    body.mission.trim(),
    "",
  ];

  if (shouldSaveSynthesis) {
    lines.push("### Síntesis de Hermi", "", body.synthesis.trim(), "");
  }

  if (shouldCreateTasks && cleanTasks.length) {
    lines.push("### ✅ Pendientes creados desde Orquestador", "");
    cleanTasks.forEach(task => lines.push(`- [ ] ${task} — Orquestador NEXUS`));
    lines.push("");
  }

  await fs.writeFile(filePath, existing ? `${existing}${lines.join("\n")}` : `${header}${lines.join("\n")}`, "utf-8");
  return NextResponse.json({ ok: true, file: filePath, today, createdTasks: shouldCreateTasks ? cleanTasks.length : 0, savedSynthesis: shouldSaveSynthesis });
}

function stripMarkdownTask(text: string): string {
  return text
    .replace(/^\s*[-*]\s+\[[xX /-]\]\s*/, "")
    .replace(/^\s*\d+\.\s+\[[xX /-]\]\s*/, "")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/→\s*\[\[[^\]]+\]\]/g, "")
    .replace(/✅\s*\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function uniqueTasks(items: DailyTask[]): DailyTask[] {
  return items.filter((item, index, array) => array.findIndex(other => other.title === item.title) === index);
}

function parseDailySummary(content: string) {
  const lines = content.split("\n");
  const tasks: DailyTask[] = [];
  let section = "General";

  lines.forEach((line, index) => {
    const heading = line.match(/^#{2,5}\s+(.+)$/);
    if (heading) section = heading[1].replace(/[🔴🟠🟡🚌🇸🇻📖⏳🎯✅📌]/g, "").trim();

    const sectionText = section.toLowerCase();
    const task = line.match(/^\s*(?:[-*]|\d+\.)\s+\[([xX /-])\]\s+(.+)$/);
    if (!task) {
      const waitingBullet = sectionText.includes("esperando") ? line.match(/^\s*[-*]\s+(.+)$/) : null;
      if (waitingBullet) {
        const rawTitle = stripMarkdownTask(line);
        if (!rawTitle) return;
        tasks.push({
          id: `${index}`,
          title: rawTitle,
          section,
          checked: false,
          inProgress: false,
          priority: "waiting",
        });
      }
      return;
    }

    const state = task[1];
    const checked = state.toLowerCase() === "x";
    const inProgress = state === "/";
    const rawTitle = stripMarkdownTask(line);
    if (!rawTitle) return;

    const priority: DailyTask["priority"] = checked
      ? "normal"
      : sectionText.includes("alta") || sectionText.includes("crítico") || sectionText.includes("destrabar")
      ? "high"
      : sectionText.includes("importante") || sectionText.includes("carolina")
      ? "medium"
      : sectionText.includes("esperando")
      ? "waiting"
      : "normal";

    tasks.push({
      id: `${index}`,
      title: rawTitle,
      section,
      checked,
      inProgress,
      priority,
    });
  });

  const openTasks = tasks.filter(t => !t.checked);
  const high = openTasks.filter(t => t.priority === "high").slice(0, 8);
  const projectRegex = /carolina|rubén|edith|transmetro|portal|gustavo|fabio|buses|foton|fotón|mtc|metrocaribe|marilé|constructora|deuda|crédito|credito|buzzi|iera|dar ibrahim|el salvador|emerson|fondo|sociedad|isa|isamel|ismael|patrimonio|ivón|ivon|pedro moscarella|paypal|visa|protocolo|cartas de amor|app|cursor|consulting partners|guazapa|aro(ca)?|sharia|sharía/i;
  const isProjectOrCompany = (t: DailyTask) => projectRegex.test(`${t.section} ${t.title}`);
  const isLaCarolina = (t: DailyTask) => /carolina|rubén|edith|transmetro|portal|gustavo|fabio|buses|foton|fotón|mtc|metrocaribe|marilé|constructora|deuda|crédito|credito/i.test(`${t.section} ${t.title}`);
  const inboxCreated = openTasks.filter(t => /pendiente creado desde inbox/i.test(t.section)).slice(-6).reverse();
  const projectCompany = uniqueTasks([...inboxCreated, ...openTasks.filter(isProjectOrCompany)]).slice(0, 12);
  const projectCompanyInProgress = openTasks.filter(t => t.inProgress && isProjectOrCompany(t)).slice(0, 6);
  const projectCompanyDone = tasks.filter(t => t.checked && isProjectOrCompany(t)).slice(-8).reverse();
  const laCarolina = uniqueTasks([...inboxCreated.filter(isLaCarolina), ...openTasks.filter(isLaCarolina)]).slice(0, 8);
  const laCarolinaInProgress = openTasks.filter(t => t.inProgress && isLaCarolina(t)).slice(0, 4);
  const laCarolinaDone = tasks.filter(t => t.checked && isLaCarolina(t)).slice(-6).reverse();
  const waiting = openTasks.filter(t => t.priority === "waiting" || /esperando|pendiente|respuesta/i.test(t.section)).slice(0, 10);
  const suggestedFromSection = openTasks.filter(t => /máximo 3|sugeridos/i.test(t.section)).slice(0, 3);
  const suggested = suggestedFromSection.length ? suggestedFromSection : openTasks.filter(t => /rubén|edith|emerson|dashboard sociedad|dar ibrahim|cartas de amor|patrimonio/i.test(t.title)).slice(0, 3);
  const urgentProjects = [...suggested, ...high, ...projectCompany]
    .filter((task, index, array) => array.findIndex(other => other.title === task.title) === index)
    .slice(0, 10);

  return {
    totalTasks: tasks.length,
    openTasks: openTasks.length,
    doneTasks: tasks.length - openTasks.length,
    high,
    urgentProjects,
    projectCompany,
    projectCompanyInProgress,
    projectCompanyDone,
    laCarolina,
    laCarolinaInProgress,
    laCarolinaDone,
    waiting,
    suggested: suggested.length ? suggested : high.slice(0, 3),
  };
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  try {
    const vaultPath = getVaultPath();
    const agenticDir = path.join(vaultPath, "Agentic OS");

    if (type === "goals") {
      const filePath = path.join(agenticDir, "Goals", "goals.md");
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const goals = content.split("\n").filter(l => l.startsWith("- [")).map((l, i) => ({
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

    if (type === "daily" || type === "daily-summary") {
      const today = todayStr();
      const filePath = await resolveDailyFile(vaultPath, false);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        if (type === "daily-summary") return NextResponse.json({ content, today, file: filePath, summary: parseDailySummary(content) });
        return NextResponse.json({ content, today, file: filePath });
      } catch {
        const empty = { totalTasks: 0, openTasks: 0, doneTasks: 0, high: [], urgentProjects: [], projectCompany: [], projectCompanyInProgress: [], projectCompanyDone: [], laCarolina: [], laCarolinaInProgress: [], laCarolinaDone: [], waiting: [], suggested: [] };
        if (type === "daily-summary") return NextResponse.json({ content: "", today, file: filePath, summary: empty });
        return NextResponse.json({ content: "", today, file: filePath });
      }
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
