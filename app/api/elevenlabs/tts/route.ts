import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Campo text requerido" }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY no configurada" }, { status: 500 });

    const voiceId = voice || process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `ElevenLabs error: ${resp.status}` }, { status: resp.status });
    }

    const audioBuffer = await resp.arrayBuffer();
    const fileName = `audio-${Date.now()}.mp3`;
    const publicDir = path.join(process.cwd(), "public", "downloads");
    await fs.mkdir(publicDir, { recursive: true });
    const filePath = path.join(publicDir, fileName);
    await fs.writeFile(filePath, Buffer.from(audioBuffer));

    return NextResponse.json({
      url: `/downloads/${fileName}`,
      fileName,
      format: "mp3",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
