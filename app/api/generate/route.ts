import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Campo prompt requerido" }, { status: 400 });

    // Try FAL key from env
    const falKey = process.env.FAL_KEY;
    if (!falKey) return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 500 });

    const resp = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        num_images: 1,
        safety_check: false,
        image_size: "landscape_4_3",
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `FAL error: ${resp.status}` }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json({
      imageUrl: data.images?.[0]?.url,
      seed: data.seed,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
