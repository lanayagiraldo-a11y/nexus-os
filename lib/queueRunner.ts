/**
 * Queue runner de Open Engine: procesa UNA petición por ejecución.
 *
 * Flujo: toma el issue más antiguo en `agent-todo` → lo marca `agent-working`
 * y deja recibo CLAIMED → lo resuelve con el orquestador (Hermes por defecto) →
 * deja recibo DONE con el resultado y lo pasa a `agent-review`. Si algo falla,
 * deja recibo BLOCKED y lo pasa a `agent-blocked`.
 */
import { addReceipt, getIssue, listQueue, setAgentState, setAgentBy, type QueueIssue } from "@/lib/openEngine";
import { orchestrateMission } from "@/lib/orchestrator";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { resolveSources } from "@/lib/sources";
import { getEmpresa, empresaSourcesBody } from "@/lib/empresas";

const RUNNER_NAME = "NEXUS Queue Runner";

/** Agentes que resuelven cada petición. Configurable con OPEN_ENGINE_AGENTS (lista separada por comas). */
function runnerAgents(): ProviderId[] {
  const raw = process.env.OPEN_ENGINE_AGENTS || "hermes";
  const wanted = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const valid = wanted.filter((a): a is ProviderId => PROVIDERS.some((p) => p.id === a));
  return valid.length ? valid : ["hermes"];
}

export interface RunResult {
  ran: boolean;
  issue?: { number: number; title: string; url: string; finalState: string };
  synthesis?: string;
  error?: string;
  message?: string;
}

function missionFromIssue(issue: QueueIssue): string {
  const body = issue.body.trim();
  return body ? `${issue.title}\n\n${body}` : issue.title;
}

/** Procesa la siguiente petición pendiente. Devuelve {ran:false} si la cola está vacía. */
export async function runNext(opts: { mode?: string } = {}): Promise<RunResult> {
  const pending = (await listQueue("agent-todo")).filter((i) => i.state === "open");
  if (!pending.length) return { ran: false, message: "No hay peticiones en agent-todo." };

  const issue = pending[0];
  const agents = runnerAgents();
  const mode = opts.mode ?? "committee";

  // Reclamar
  await setAgentState(issue.number, "agent-working");
  await setAgentBy(issue.number, agents[0]); // agente principal a cargo

  // Resolver fuentes: las de la empresa del issue (label empresa:<id>) + las declaradas en el cuerpo (@source:).
  let sourcesContext = "";
  let sourcesNote = "";
  try {
    const empresaLabel = issue.labels.find((l) => l.startsWith("empresa:"));
    let combinedBody = issue.body;
    let empresaNote = "";
    if (empresaLabel) {
      const empresa = await getEmpresa(empresaLabel.slice("empresa:".length));
      if (empresa && empresa.sources.length) {
        combinedBody = `${empresaSourcesBody(empresa)}\n${issue.body}`;
        empresaNote = `Empresa: ${empresa.nombre}. `;
      }
    }
    const { context, results } = await resolveSources(combinedBody);
    if (results.length) {
      sourcesContext = context;
      const ok = results.filter((r) => r.ok).map((r) => r.label);
      const bad = results.filter((r) => !r.ok).map((r) => `${r.label}: ${r.error}`);
      sourcesNote = [
        empresaNote,
        ok.length ? `Fuentes consultadas: ${ok.join(", ")}.` : "",
        bad.length ? `Fuentes con error: ${bad.join(" · ")}.` : "",
      ].filter(Boolean).join(" ");
    } else {
      sourcesNote = empresaNote;
    }
  } catch (e) {
    sourcesNote = `Aviso: fallo resolviendo fuentes (${e instanceof Error ? e.message : String(e)}).`;
  }

  await addReceipt(issue.number, "CLAIMED", RUNNER_NAME, [`Procesando con: ${agents.join(", ")}.`, sourcesNote].filter(Boolean).join(" "));

  try {
    const mission = sourcesContext ? `${missionFromIssue(issue)}\n\n---\n\n${sourcesContext}` : missionFromIssue(issue);
    const result = await orchestrateMission(mission, mode, agents);
    const completed = result.results.filter((r) => r.status === "completed");

    // Si NINGÚN agente completó, no es un "done": es un bloqueo (p. ej. Hermes caído o sin API key).
    if (completed.length === 0) {
      const reasons = result.results.map((r) => `- ${r.name}: ${r.error ?? "sin respuesta"}`).join("\n");
      await addReceipt(
        issue.number,
        "BLOCKED",
        RUNNER_NAME,
        `Ningún agente pudo resolver la petición. Revisa configuración/conexión:\n\n${reasons.slice(0, 2000)}`,
      );
      await setAgentState(issue.number, "agent-blocked");
      return {
        ran: true,
        issue: { number: issue.number, title: issue.title, url: issue.url, finalState: "agent-blocked" },
        error: "Ningún agente disponible completó la petición.",
      };
    }

    const synthesis = result.synthesis || "(sin síntesis)";
    const body = [
      synthesis,
      "",
      "---",
      `_Resuelto por ${agents.join(", ")} · modo ${mode}. Pendiente de revisión humana antes de marcar agent-done._`,
    ].join("\n");
    await addReceipt(issue.number, "DONE", RUNNER_NAME, body.slice(0, 60_000));
    await setAgentState(issue.number, "agent-review");
    return {
      ran: true,
      issue: { number: issue.number, title: issue.title, url: issue.url, finalState: "agent-review" },
      synthesis,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await addReceipt(issue.number, "BLOCKED", RUNNER_NAME, `No pude completar la petición:\n\n\`\`\`\n${message.slice(0, 2000)}\n\`\`\``);
    await setAgentState(issue.number, "agent-blocked");
    return {
      ran: true,
      issue: { number: issue.number, title: issue.title, url: issue.url, finalState: "agent-blocked" },
      error: message,
    };
  }
}

/** Aprueba una petición en review → la marca agent-done y cierra el issue. */
export async function approve(number: number, by = "Liliana"): Promise<RunResult> {
  const issue = await getIssue(number);
  await addReceipt(number, "NOTE", by, "Aprobado. Marcando como agent-done.");
  await setAgentState(number, "agent-done");
  return { ran: true, issue: { number: issue.number, title: issue.title, url: issue.url, finalState: "agent-done" } };
}
