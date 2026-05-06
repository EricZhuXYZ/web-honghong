"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { GameState, Option, VoiceType, Gender } from "@/types/game";
import { MAX_ROUNDS } from "@/lib/game";
import { fetchTts } from "@/lib/tts";
import AffectionBar from "./AffectionBar";

const PARTNER_AVATAR_FEMALE = "/female_Image.png";
const PARTNER_AVATAR_MALE = "/male_Image.png";
const USER_AVATAR = "/male_Image.png";

function getPartnerAvatar(gender: Gender | null): string {
  return gender === "male" ? PARTNER_AVATAR_MALE : PARTNER_AVATAR_FEMALE;
}

function ChatAvatar({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`bg-gray-300 flex-shrink-0 ${className || "w-10 h-10 rounded-md"}`}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`flex-shrink-0 object-cover ${className || "w-10 h-10 rounded-md"}`}
      onError={() => setError(true)}
    />
  );
}

interface GameScreenProps {
  state: GameState;
  onSelectOption: (option: Option) => void;
  onRetry: () => void;
}

function VoiceButton({
  text,
  voiceType,
}: {
  text: string;
  voiceType: VoiceType;
}) {
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function preload() {
      const audioUri = await fetchTts(text, voiceType);
      if (!cancelled) {
        if (audioUri) {
          setAudioUrl(audioUri);
        } else {
          setError(true);
        }
        setLoading(false);
      }
    }

    preload();
    return () => {
      cancelled = true;
    };
  }, [text, voiceType]);

  const handlePlay = useCallback(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      pendingPlayRef.current = true;
    }
  }, [playing]);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onPlay = () => setPlaying(true);
    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setError(true);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      audio.play();
    }

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  if (error) return null;

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[12px] text-gray-400 active:text-gray-500 transition-colors"
    >
      {loading ? (
        <span className="text-gray-300">加载中...</span>
      ) : playing ? (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          <span>暂停</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>播放语音</span>
        </>
      )}
    </button>
  );
}

function TypingIndicator({ partnerAvatar }: { partnerAvatar: string }) {
  return (
    <div className="flex items-start gap-2 mb-4">
      <ChatAvatar src={partnerAvatar} alt="对方" />
      <div className="bg-white rounded-[4px] px-3 h-10 flex items-center relative">
        <div className="absolute left-[-5px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-white border-b-[5px] border-b-transparent" />
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "0ms" }} />
          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "200ms" }} />
          <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-wechat-typing" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function GameScreen({
  state,
  onSelectOption,
  onRetry,
}: GameScreenProps) {
  const { affection, step, messages, currentOptions, loading, error, voiceType, gender } =
    state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const partnerName = state.scenario?.title ?? "对方";
  const partnerAvatar = getPartnerAvatar(gender);

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      <div className="bg-[#2B2B2B] text-white text-center py-2.5 px-4 relative flex-shrink-0">
        <span className="text-[17px] font-medium">{partnerName}</span>
      </div>

      <AffectionBar affection={affection} />

      <div className="text-center py-0.5 flex-shrink-0">
        <span className="text-[11px] text-gray-400">
          第 {step} / {MAX_ROUNDS} 轮
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.map((msg) =>
          msg.role === "partner" ? (
            <div key={msg.id} className="mb-3">
              <div className="flex items-start gap-2">
                <ChatAvatar src={partnerAvatar} alt="对方" />
                <div className="relative bg-white rounded-[4px] px-3 py-2 max-w-[75%]">
                  <div className="absolute left-[-5px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-white border-b-[5px] border-b-transparent" />
                  <p className="text-[16px] text-[#1A1A1A] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
              {voiceType && (
                <div className="flex items-start gap-2 mt-1">
                  <ChatAvatar src={partnerAvatar} alt="" className="w-10 h-10 rounded-md invisible" />
                  <VoiceButton text={msg.content} voiceType={voiceType} />
                </div>
              )}
            </div>
          ) : (
            <div key={msg.id} className="flex items-start justify-end gap-2 mb-3">
              <div className="relative bg-[#95EC69] rounded-[4px] px-3 py-2 max-w-[75%]">
                <div className="absolute right-[-5px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-l-[5px] border-l-[#95EC69] border-b-[5px] border-b-transparent" />
                <p className="text-[16px] text-[#1A1A1A] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
              <ChatAvatar src={USER_AVATAR} alt="我" />
            </div>
          )
        )}

        {loading && <TypingIndicator partnerAvatar={partnerAvatar} />}

        {error && (
          <div className="flex justify-center mb-3">
            <div className="bg-white rounded-[4px] px-4 py-2.5 text-center">
              <p className="text-[14px] text-red-500 mb-1.5">{error}</p>
              <button
                onClick={onRetry}
                className="text-[14px] text-[#576B95] active:text-[#4A5F85]"
              >
                点击重试
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {currentOptions.length > 0 && !loading && !error && (
        <div className="flex-shrink-0 bg-[#F7F7F7] border-t border-[#D9D9D9] px-3 py-2.5">
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {currentOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectOption(opt)}
                className="w-full text-left py-2.5 px-3.5 rounded-[4px] bg-white text-[15px] text-[#1A1A1A] leading-relaxed whitespace-pre-wrap break-words border border-[#E5E5E5] active:bg-[#ECECEC] transition-colors"
              >
                {opt.content}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
