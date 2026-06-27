import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Campo prompt requerido" }, { status: 400 });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "PERPLEXITY_API_KEY no configurada" }, { status: 500 });

    const isReasoning = mode === "reason";
    const model = isReasoning ? "sonar-reasoning-pro" : "sonar-pro";
    const maxTokens = isReasoning ? 4096 : 2048;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Eres un asistente de investigación experto. Responde en español con datos concretos y citando fuentes cuando sea posible." },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `Perplexity API error: ${resp.status} - ${errText}` }, { status: resp.status });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      content,
      model: data.model,
      citations: data.citations || [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
