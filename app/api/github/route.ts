import { NextRequest, NextResponse } from "next/server";
import {
  addReceipt,
  createPeticion,
  getIssue,
  listQueue,
  setAgentState,
  setupLabels,
  AGENT_STATES,
  type AgentState,
  type ReceiptKind,
} from "@/lib/openEngine";
import { approve, runNext } from "@/lib/queueRunner";

export const runtime = "nodejs";

const DEFAULT_ASSIGNEE = process.env.OPEN_ENGINE_ASSIGNEE || "lanayagiraldo-a11y";

function isAgentState(v: unknown): v is AgentState {
  return typeof v === "string" && (AGENT_STATES as string[]).includes(v);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const action = payload.action as string;

    switch (action) {
      // --- Compatibilidad con el frontend actual ---
      case "create-issue": {
        const issue = await createPeticion({
          title: payload.title,
          body: payload.body || "",
          extraLabels: Array.isArray(payload.labels) ? payload.labels : undefined,
          assignee: DEFAULT_ASSIGNEE,
        });
        return NextResponse.json({ issue });
      }

      case "list-issues": {
        const issues = await listQueue();
        return NextResponse.json({ issues });
      }

      // --- Open Engine ---
      case "list-queue": {
        const state = isAgentState(payload.state) ? payload.state : undefined;
        const issues = await listQueue(state);
        return NextResponse.json({ issues });
      }

      case "get-issue": {
        const issue = await getIssue(Number(payload.number));
        return NextResponse.json({ issue });
      }

      case "set-state": {
        if (!isAgentState(payload.state)) {
          return NextResponse.json({ error: `state inválido. Usa uno de: ${AGENT_STATES.join(", ")}` }, { status: 400 });
        }
        const issue = await setAgentState(Number(payload.number), payload.state);
        return NextResponse.json({ issue });
      }

      case "receipt": {
        const kind = payload.kind as ReceiptKind;
        await addReceipt(Number(payload.number), kind, payload.by || "NEXUS", payload.body || "");
        return NextResponse.json({ ok: true });
      }

      case "run-next": {
        const result = await runNext({ mode: payload.mode });
        return NextResponse.json(result);
      }

      case "approve": {
        const result = await approve(Number(payload.number), payload.by || "Liliana");
        return NextResponse.json(result);
      }

      case "setup-labels": {
        const result = await setupLabels();
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
