import type { VoiceType } from "@/types/game";

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[「」『』]/g, "")
    .trim();
}

const ttsCache = new Map<string, string>();
const ttsInFlight = new Map<string, Promise<string | null>>();

function ttsCacheKey(text: string, voiceType: VoiceType): string {
  return `${voiceType}|${text}`;
}

export function getTtsCache(text: string, voiceType: VoiceType): string | undefined {
  return ttsCache.get(ttsCacheKey(text, voiceType));
}

export function setTtsCache(text: string, voiceType: VoiceType, audioUri: string): void {
  ttsCache.set(ttsCacheKey(text, voiceType), audioUri);
}

export async function fetchTts(text: string, voiceType: VoiceType): Promise<string | null> {
  const key = ttsCacheKey(text, voiceType);

  const cached = ttsCache.get(key);
  if (cached) return cached;

  const inFlight = ttsInFlight.get(key);
  if (inFlight) return inFlight;

  const promise = fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceType }),
  })
    .then(async (res) => {
      const data = await res.json();
      if (data.audioUri) {
        ttsCache.set(key, data.audioUri);
        return data.audioUri as string;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      ttsInFlight.delete(key);
    });

  ttsInFlight.set(key, promise);
  return promise;
}
