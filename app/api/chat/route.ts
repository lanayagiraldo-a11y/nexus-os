import { NextRequest } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHermesApiKey, getHermesBaseUrl, getHermesModel, getHermesSessionKey } from "@/lib/nexusConfig";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function sseStream(fn: (controller: ReadableStreamDefaultController) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ heartbeat: true })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 10_000);
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "connecting" })}\n\n`));
        await fn(controller);
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
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
  const key = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "CLAUDE_API_KEY not set" }, { status: 401 });
  return sseStream(async (ctrl) => {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 4096,
          stream: true,
          system: "You are Claude, the finance, strategy and code core inside NEXUS OS for Liliana. Respond in Spanish unless asked otherwise.",
          messages,
        }),
        signal: AbortSignal.timeout(180_000),
      });

      if (!resp.ok || !resp.body) {
        const body = await resp.text();
        if (resp.status === 401 || body.includes("authentication_error")) send(ctrl, { error: "Claude no pudo autenticarse con la llave de producción. Actualiza CLAUDE_API_KEY/ANTHROPIC_API_KEY en Netlify." });
        else if (body.includes("not_found_error") || body.includes("model")) send(ctrl, { error: "El modelo Claude configurado no está disponible para esta llave. Cambia CLAUDE_MODEL en Netlify." });
        else send(ctrl, { error: `Claude ${resp.status}: ${body.slice(0, 420)}` });
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let inputTokens: number | undefined;
      let outputTokens: number | undefined;
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
          if (!raw || raw === "[DONE]") continue;
          const data = JSON.parse(raw) as { type?: string; delta?: { type?: string; text?: string }; usage?: { input_tokens?: number; output_tokens?: number } };
          if (data.type === "message_start") inputTokens = data.usage?.input_tokens;
          if (data.type === "content_block_delta" && data.delta?.type === "text_delta" && data.delta.text) send(ctrl, { text: data.delta.text });
          if (data.type === "message_delta") outputTokens = data.usage?.output_tokens;
          if (data.type === "message_stop") send(ctrl, { done: true, usage: { input: inputTokens, output: outputTokens } });
        }
      }
    } catch (error) {
      const message = String(error);
      if (message.includes("401 status code") || message.includes("authentication_error")) send(ctrl, { error: "Claude no pudo autenticarse con la llave de producción. Actualiza CLAUDE_API_KEY/ANTHROPIC_API_KEY en Netlify." });
      else send(ctrl, { error: message });
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
  const modelNames = [requestedModel];
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

function normalizeMessages(payload: { messages?: ChatMessage[]; message?: string }): ChatMessage[] {
  if (Array.isArray(payload.messages) && payload.messages.length > 0) return payload.messages;
  const text = typeof payload.message === "string" ? payload.message.trim() : "";
  return text ? [{ role: "user", content: text }] : [];
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const { provider } = payload;
  const messages = normalizeMessages(payload);
  if (!messages.length) return Response.json({ error: "Missing message" }, { status: 400 });
  switch (provider) {
    case "claude": return streamClaude(messages);
    case "openai": return streamOpenAI(messages);
    case "gemini": return streamGemini(messages);
    case "hermes": return streamHermes(messages);
    default: return Response.json({ error: "Unknown provider" }, { status: 400 });
  }
}
