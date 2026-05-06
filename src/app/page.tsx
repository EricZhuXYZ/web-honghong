"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GameState, Option, Gender, Scenario, VoiceType } from "@/types/game";
import {
  createInitialState,
  clampAffection,
  checkGameEnd,
} from "@/lib/game";
import StartScreen from "@/components/StartScreen";
import GameScreen from "@/components/GameScreen";
import GameOverScreen from "@/components/GameOverScreen";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<GameState>(createInitialState);
  const [startGender, setStartGender] = useState<Gender | null>(null);
  const [startScenario, setStartScenario] = useState<Scenario | null>(null);
  const [startVoiceType, setStartVoiceType] = useState<VoiceType | null>(null);
  const fetchingRef = useRef(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  const fetchChat = useCallback(
    async (
      currentState: GameState,
      selectedOption?: Option
    ): Promise<void> => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const newAffection = selectedOption
          ? clampAffection(currentState.affection + selectedOption.score)
          : currentState.affection;

        const newStep = selectedOption ? currentState.step + 1 : 1;

        if (selectedOption) {
          setState((prev) => ({
            ...prev,
            affection: newAffection,
            step: newStep,
          }));
        }

        const endCheck = checkGameEnd(newAffection, newStep);
        if (endCheck.gameOver) {
          setState((prev) => ({
            ...prev,
            gameOver: true,
            won: endCheck.won,
            loading: false,
            currentOptions: [],
          }));
          return;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gender: currentState.gender,
            scenarioId: currentState.scenario?.id,
            scenarioTitle: currentState.scenario?.title,
            scenarioDescription: currentState.scenario?.description,
            messages: currentState.messages,
            affection: newAffection,
            step: newStep,
            isGameOver: false,
            won: false,
          }),
        });

        if (!res.ok) {
          throw new Error("请求失败，请重试");
        }

        const data = await res.json();

        if (!data.partnerMessage || !data.options) {
          throw new Error("响应格式异常，请重试");
        }

        const partnerMsg = {
          id: generateId(),
          role: "partner" as const,
          content: data.partnerMessage,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, partnerMsg],
          currentOptions: data.options,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error ? err.message : "未知错误，请重试",
        }));
      } finally {
        fetchingRef.current = false;
      }
    },
    []
  );

  const handleStart = useCallback(() => {
    if (!startGender || !startScenario || !startVoiceType) return;
    const newState: GameState = {
      ...createInitialState(),
      gender: startGender,
      scenario: startScenario,
      voiceType: startVoiceType,
    };
    setState(newState);
    fetchChat(newState);
  }, [startGender, startScenario, startVoiceType, fetchChat]);

  const handleSelectOption = useCallback(
    (option: Option) => {
      if (state.loading || state.gameOver) return;

      const userMsg = {
        id: generateId(),
        role: "user" as const,
        content: option.content,
      };

      const newState: GameState = {
        ...state,
        messages: [...state.messages, userMsg],
        currentOptions: [],
      };

      setState(newState);
      fetchChat(newState, option);
    },
    [state, fetchChat]
  );

  const handleRetry = useCallback(() => {
    fetchChat(state);
  }, [state, fetchChat]);

  const handleReplay = useCallback(() => {
    setState(createInitialState());
    setStartGender(null);
    setStartScenario(null);
    setStartVoiceType(null);
  }, []);

  const handleBlogClick = useCallback(() => {
    router.push("/blog");
  }, [router]);

  if (state.gameOver) {
    const lastPartnerMsg = [...state.messages]
      .reverse()
      .find((m) => m.role === "partner");

    return (
      <GameOverScreen
        won={state.won}
        partnerMessage={lastPartnerMsg?.content ?? ""}
        voiceType={state.voiceType}
        onReplay={handleReplay}
        user={user}
        userLoading={userLoading}
        scenario={state.scenario?.title ?? ""}
        affection={state.affection}
      />
    );
  }

  if (state.gender === null) {
    return (
      <StartScreen
        gender={startGender}
        scenario={startScenario}
        voiceType={startVoiceType}
        onGenderChange={(g) => {
          setStartGender(g);
          setStartVoiceType(null);
        }}
        onScenarioChange={setStartScenario}
        onVoiceTypeChange={setStartVoiceType}
        onStart={handleStart}
        onBlogClick={handleBlogClick}
        user={user}
        userLoading={userLoading}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <GameScreen
      state={state}
      onSelectOption={handleSelectOption}
      onRetry={handleRetry}
    />
  );
}
