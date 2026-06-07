import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHermesApiKey, getHermesBaseUrl, getHermesModel, getHermesSessionKey } from "@/lib/nexusConfig";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function sseStream(fn: (controller: ReadableStreamDefaultController) => Promise<void>): Response {
  const stream = new ReadableStream({
    async start(controller) {
      await fn(controller);
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

function send(controller: ReadableStreamDefaultController, data: object) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

async function streamClaude(messages: ChatMessage[]): Promise<Response> {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) return Response.json({ error: "CLAUDE_API_KEY not set" }, { status: 401 });
  const client = new Anthropic({ apiKey: key });
  return sseStream(async (ctrl) => {
    try {
      const s = client.messages.stream({
        model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "You are Claude, the finance, strategy and code core inside NEXUS OS for Liliana. Respond in Spanish unless asked otherwise.",
        messages,
      });
      for await (const chunk of s) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") send(ctrl, { text: chunk.delta.text });
      }
      const final = await s.finalMessage();
      send(ctrl, { done: true, usage: { input: final.usage.input_tokens, output: final.usage.output_tokens } });
    } catch (error) {
      send(ctrl, { error: String(error) });
    }
  });
}

async function streamOpenAI(messages: ChatMessage[]): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 401 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return sseStream(async (ctrl) => {
    try {
      const s = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5.5",
        stream: true,
        messages: [
          { role: "system", content: "You are ChatGPT inside NEXUS OS for Liliana: marketing, content, email and creative execution. Respond in Spanish unless asked otherwise." },
          ...messages,
        ],
      });
      for await (const chunk of s) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) send(ctrl, { text });
      }
      send(ctrl, { done: true });
    } catch (error) {
      send(ctrl, { error: String(error) });
    }
  });
}

async function streamGemini(messages: ChatMessage[]): Promise<Response> {
  if (!process.env.GEMINI_API_KEY) return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 401 });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const requestedModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const modelNames = Array.from(new Set([requestedModel, "gemini-2.0-flash", "gemini-1.5-flash"]));
  return sseStream(async (ctrl) => {
    const history = messages.slice(0, -1).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const prompt = messages[messages.length - 1]?.content ?? "";
    const errors: string[] = [];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const chat = model.startChat({
          history,
          systemInstruction: { role: "user", parts: [{ text: "You are Gemini inside NEXUS OS for Liliana: research, real-time search and multimodal analysis. Respond in Spanish unless asked otherwise." }] },
        });
        const result = await chat.sendMessageStream(prompt);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) send(ctrl, { text });
        }
        send(ctrl, { done: true, model: modelName });
        return;
      } catch (error) {
        const message = String(error);
        errors.push(`${modelName}: ${message}`);
        if (message.includes("API_KEY_INVALID")) break;
      }
    }

    send(ctrl, { error: errors.join("\n") || "Gemini unavailable" });
  });
}

async function streamHermes(messages: ChatMessage[]): Promise<Response> {
  const baseUrl = getHermesBaseUrl().replace(/\/$/, "");
  const model = getHermesModel();
  const key = getHermesApiKey();
  if (!key) return Response.json({ error: "HERMES_API_KEY not set" }, { status: 401 });
  return sseStream(async (ctrl) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      };
      const sessionKey = getHermesSessionKey();
      if (sessionKey) headers["X-Hermes-Session-Key"] = sessionKey;

      const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: "system", content: "Eres Hermi/Hermes Agent conectado al Mission Control de NEXUS OS de Liliana. Responde en español directo, usa tu memoria/herramientas cuando estén disponibles y no digas que ejecutaste acciones si no las ejecutaste." },
            ...messages,
          ],
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (!resp.ok || !resp.body) throw new Error(`Hermes Agent ${resp.status}: ${await resp.text()}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") {
            send(ctrl, { done: true });
            continue;
          }
          const data = JSON.parse(raw) as { choices?: Array<{ delta?: { content?: string }, message?: { content?: string }, finish_reason?: string }>, usage?: { completion_tokens?: number; total_tokens?: number } };
          const text = data.choices?.[0]?.delta?.content ?? data.choices?.[0]?.message?.content ?? "";
          if (text) send(ctrl, { text });
          if (data.choices?.[0]?.finish_reason) send(ctrl, { done: true, usage: { output: data.usage?.completion_tokens, total: data.usage?.total_tokens } });
        }
      }
    } catch (error) {
      send(ctrl, { error: String(error) });
    }
  });
}

export async function POST(req: NextRequest) {
  const { provider, messages } = await req.json();
  switch (provider) {
    case "claude": return streamClaude(messages);
    case "openai": return streamOpenAI(messages);
    case "gemini": return streamGemini(messages);
    case "hermes": return streamHermes(messages);
    case "antigravity": return Response.json({ error: "Antigravity is an external IDE workspace. NEXUS has the agent card, but no chat bridge is configured yet." }, { status: 501 });
    default: return Response.json({ error: "Unknown provider" }, { status: 400 });
  }
}
