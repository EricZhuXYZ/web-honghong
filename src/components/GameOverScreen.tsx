"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { VoiceType } from "@/types/game";
import { fetchTts } from "@/lib/tts";

interface GameOverScreenProps {
  won: boolean;
  partnerMessage: string;
  voiceType: VoiceType | null;
  onReplay: () => void;
  user: { id: number; username: string } | null;
  userLoading: boolean;
  scenario: string;
  affection: number;
}

function GameOverVoiceButton({
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
      className="inline-flex items-center gap-1.5 text-[13px] text-[#576B95] active:text-[#4A5F85] transition-colors"
    >
      {loading ? (
        <span className="text-gray-400">加载中...</span>
      ) : playing ? (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          暂停
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          听TA的最后一句
        </>
      )}
    </button>
  );
}

export default function GameOverScreen({
  won,
  partnerMessage,
  voiceType,
  onReplay,
  user,
  userLoading,
  scenario,
  affection,
}: GameOverScreenProps) {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "guest">("idle");

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      setSaveStatus("guest");
      return;
    }

    if (saveStatus !== "idle") return;

    setSaveStatus("saving");

    fetch("/api/game-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario,
        finalScore: affection,
        result: won ? "通关" : "失败",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSaveMessage("您的游戏记录已经保存");
          setSaveStatus("saved");
        }
      })
      .catch(() => {
        setSaveStatus("guest");
      });
  }, [user, userLoading, scenario, affection, won, saveStatus]);

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      <div className="bg-[#2B2B2B] text-white text-center py-2.5 px-4 flex-shrink-0">
        <span className="text-[17px] font-medium">聊天结束</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{won ? "😊" : "💔"}</div>
            <h1 className="text-[20px] font-medium text-[#1A1A1A] mb-1">
              {won ? "哄好了！" : "还是分开了..."}
            </h1>
            <p className="text-[13px] text-gray-400">
              {won ? "恭喜通关！分享给朋友试试？" : "再试一次吧"}
            </p>
          </div>

          {partnerMessage && (
            <div className="bg-white rounded-[4px] px-4 py-3 mb-6 relative">
              <div className="absolute left-[-5px] top-3 w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-white border-b-[5px] border-b-transparent" />
              <p className="text-[15px] text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                {partnerMessage}
              </p>
              {voiceType && (
                <div className="mt-2">
                  <GameOverVoiceButton
                    text={partnerMessage}
                    voiceType={voiceType}
                  />
                </div>
              )}
            </div>
          )}

          {saveStatus === "saved" && saveMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-[14px] text-green-600">{saveMessage}</p>
            </div>
          )}

          {saveStatus === "guest" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
              <p className="text-[14px] text-blue-600">登录后可保存你的游戏记录</p>
            </div>
          )}

          <button
            onClick={onReplay}
            className="w-full py-3 rounded-md text-[16px] font-medium bg-[#07C160] text-white active:bg-[#06AD56] transition-colors"
          >
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
