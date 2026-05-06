import type { VoiceType, Gender } from "@/types/game";

export interface VoiceConfig {
  voiceType: VoiceType;
  speaker: string;
  label: string;
  gender: Gender;
}

export const VOICES: VoiceConfig[] = [
  {
    voiceType: "gentle-female",
    speaker: "zh_female_xiaohe_uranus_bigtts",
    label: "温柔女声",
    gender: "female",
  },
  {
    voiceType: "cool-female",
    speaker: "zh_female_vv_uranus_bigtts",
    label: "霸道御姐",
    gender: "female",
  },
  {
    voiceType: "cute-female",
    speaker: "saturn_zh_female_keainvsheng_tob",
    label: "可爱软妹",
    gender: "female",
  },
  {
    voiceType: "deep-male",
    speaker: "zh_male_m191_uranus_bigtts",
    label: "低沉男声",
    gender: "male",
  },
  {
    voiceType: "gentle-male",
    speaker: "zh_male_taocheng_uranus_bigtts",
    label: "温柔男声",
    gender: "male",
  },
];

export function getVoicesByGender(gender: Gender): VoiceConfig[] {
  return VOICES.filter((v) => v.gender === gender);
}

export function getSpeakerByVoiceType(voiceType: VoiceType): string {
  const found = VOICES.find((v) => v.voiceType === voiceType);
  return found?.speaker ?? "zh_female_xiaohe_uranus_bigtts";
}
