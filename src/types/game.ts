export type Gender = "female" | "male";

export type VoiceType =
  | "gentle-female"
  | "cool-female"
  | "cute-female"
  | "deep-male"
  | "gentle-male";

export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface Option {
  id: string;
  content: string;
  score: number;
}

export interface Message {
  id: string;
  role: "user" | "partner";
  content: string;
}

export interface GameState {
  step: number;
  affection: number;
  gender: Gender | null;
  scenario: Scenario | null;
  voiceType: VoiceType | null;
  messages: Message[];
  currentOptions: Option[];
  gameOver: boolean;
  won: boolean;
  loading: boolean;
  error: string | null;
}

export interface ChatRequest {
  gender: Gender;
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string;
  messages: Message[];
  affection: number;
  step: number;
  isGameOver: boolean;
  won: boolean;
}

export interface ChatResponse {
  partnerMessage: string;
  options: Option[];
}

export interface TTSRequest {
  text: string;
  voiceType: VoiceType;
}

export interface TTSResponse {
  audioUri: string;
  audioSize?: number;
}

export type GamePhase = "start" | "playing" | "gameOver";
