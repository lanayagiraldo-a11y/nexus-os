import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
export const runtime = "nodejs";
interface ChatMessage { role: "user"|"assistant"; content: string; }
function sseStream(fn: (controller: ReadableStreamDefaultController) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await fn(controller);
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type":"text/event-stream", "Cache-Control":"no-cache", Connection:"keep-alive" } });
}
function send(controller: ReadableStreamDefaultController, data: object) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}
async function streamClaude(messages: ChatMessage[]): Promise<Response> {
  if (!process.env.CLAUDE_API_KEY) return Response.json({ error:"CLAUDE_API_KEY not set" }, { status:401 });
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  return sseStream(async (ctrl) => {
    try {
      const s = client.messages.stream({ model:"claude-sonnet-4-6", max_tokens:4096, system:"You are Claude, the AI command core of NEXUS OS — a neural mission control dashboard.", messages });
      for await (const chunk of s) {
        if (chunk.type==="content_block_delta" && chunk.delta.type==="text_delta") send(ctrl, { text: chunk.delta.text });
      }
      const final = await s.finalMessage();
      send(ctrl, { done:true, usage:{ input:final.usage.input_tokens, output:final.usage.output_tokens } });
    } catch(e) { send(ctrl, { error: String(e) }); }
  });
}
async function streamOpenAI(messages: ChatMessage[]): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) return Response.json({ error:"OPENAI_API_KEY not set" }, { status:401 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return sseStream(async (ctrl) => {
    try {
      const s = await client.chat.completions.create({ model:"gpt-4o", stream:true, messages:[{ role:"system", content:"You are ChatGPT inside NEXUS OS — an AI mission control dashboard." }, ...messages] });
      for await (const chunk of s) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) send(ctrl, { text });
      }
      send(ctrl, { done:true });
    } catch(e) { send(ctrl, { error: String(e) }); }
  });
}
async function streamGemini(messages: ChatMessage[]): Promise<Response> {
  if (!process.env.GEMINI_API_KEY) return Response.json({ error:"GEMINI_API_KEY not set" }, { status:401 });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model:"gemini-2.0-flash" });
  return sseStream(async (ctrl) => {
    try {
      const history = messages.slice(0,-1).map(m => ({ role: m.role==="assistant"?"model":"user", parts:[{ text:m.content }] }));
      const chat = model.startChat({ history, systemInstruction:{ role:"user", parts:[{ text:"You are Gemini inside NEXUS OS — an AI mission control dashboard." }] } });
      const result = await chat.sendMessageStream(messages[messages.length-1].content);
      for await (const chunk of result.stream) { const t = chunk.text(); if (t) send(ctrl, { text:t }); }
      send(ctrl, { done:true });
    } catch(e) { send(ctrl, { error: String(e) }); }
  });
}
async function streamHermes(messages: ChatMessage[]): Promise<Response> {
  const baseUrl = process.env.HERMES_BASE_URL ?? "http://localhost:11434";
  const model = process.env.HERMES_MODEL ?? "gpt-5.5";
  return sseStream(async (ctrl) => {
    try {
      const resp = await fetch(`${baseUrl}/v1/chat/completions`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model, stream:true, messages:[{ role:"system", content:"You are Hermes, running on a VPS inside NEXUS OS." }, ...messages] }),
      });
      if (!resp.ok || !resp.body) throw new Error(`Hermes VPS responded ${resp.status}`);
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ") || line==="data: [DONE]") continue;
          try { const j = JSON.parse(line.slice(6)); const t = j.choices?.[0]?.delta?.content ?? ""; if (t) send(ctrl, { text:t }); } catch {}
        }
      }
      send(ctrl, { done:true });
    } catch(e) { send(ctrl, { error: String(e) }); }
  });
}
export async function POST(req: NextRequest) {
  const { provider, messages } = await req.json();
  switch (provider) {
    case "claude":  return streamClaude(messages);
    case "openai":  return streamOpenAI(messages);
    case "gemini":  return streamGemini(messages);
    case "hermes":  return streamHermes(messages);
    default: return Response.json({ error:"Unknown provider" }, { status:400 });
  }
}
