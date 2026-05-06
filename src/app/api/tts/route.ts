import { NextResponse } from "next/server";
import type { TTSRequest, TTSResponse } from "@/types/game";
import { getSpeakerByVoiceType } from "@/constants/voices";
import { cleanTextForSpeech } from "@/lib/tts";

const DOUBAO_TTS_API_KEY = process.env.DOUBAO_TTS_API_KEY ?? "";
const DOUBAO_TTS_RESOURCE_ID =
  process.env.DOUBAO_TTS_RESOURCE_ID ?? "seed-tts-2.0";

export async function POST(request: Request) {
  try {
    const body: TTSRequest = await request.json();

    if (!body.text || !body.voiceType) {
      return NextResponse.json(
        { error: "缺少必要参数：text 和 voiceType" },
        { status: 400 }
      );
    }

    const speaker = getSpeakerByVoiceType(body.voiceType);
    const cleanedText = cleanTextForSpeech(body.text);

    if (!cleanedText) {
      return NextResponse.json(
        { error: "文本清理后为空" },
        { status: 400 }
      );
    }

    if (!DOUBAO_TTS_API_KEY) {
      console.warn("TTS API key not configured, returning empty audio");
      return NextResponse.json({
        audioUri: "",
        audioSize: 0,
      } satisfies TTSResponse);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        "https://openspeech.bytedance.com/api/v3/tts/unidirectional",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": DOUBAO_TTS_API_KEY,
            "X-Api-Resource-Id": DOUBAO_TTS_RESOURCE_ID,
          },
          body: JSON.stringify({
            user: {
              uid: "honghong-simulator",
            },
            namespace: "TTS",
            req_params: {
              text: cleanedText,
              speaker,
              audio_params: {
                format: "mp3",
                sample_rate: 24000,
                bit_rate: 128000,
              },
              additions: JSON.stringify({
                context_texts: ["自然、有情绪的对话语气"],
              }),
            },
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        console.error(
          "TTS API error:",
          response.status,
          await response.text().catch(() => "")
        );
        return NextResponse.json({
          audioUri: "",
          audioSize: 0,
        } satisfies TTSResponse);
      }

      const responseText = await response.text();
      const lines = responseText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const base64Chunks: string[] = [];

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);

          if (parsed.code !== 0 && parsed.code !== 20000000) {
            console.error("TTS chunk error:", line);
            continue;
          }

          if (parsed.data && typeof parsed.data === "string") {
            base64Chunks.push(parsed.data);
          }
        } catch {
          console.warn("TTS: failed to parse line:", line.slice(0, 100));
        }
      }

      if (base64Chunks.length === 0) {
        console.error("TTS: no audio data received");
        return NextResponse.json({
          audioUri: "",
          audioSize: 0,
        } satisfies TTSResponse);
      }

      const combinedBase64 = base64Chunks.join("");
      const audioBuffer = Buffer.from(combinedBase64, "base64");
      const audioUri = `data:audio/mp3;base64,${combinedBase64}`;

      return NextResponse.json({
        audioUri,
        audioSize: audioBuffer.byteLength,
      } satisfies TTSResponse);
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("/api/tts error:", err);
    return NextResponse.json({
      audioUri: "",
      audioSize: 0,
    } satisfies TTSResponse);
  }
}
