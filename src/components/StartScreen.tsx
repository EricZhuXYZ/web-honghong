"use client";

import type { Gender, Scenario, VoiceType } from "@/types/game";
import { SCENARIOS } from "@/constants/scenarios";
import { getVoicesByGender } from "@/constants/voices";
import Link from "next/link";

interface StartScreenProps {
  gender: Gender | null;
  scenario: Scenario | null;
  voiceType: VoiceType | null;
  onGenderChange: (gender: Gender) => void;
  onScenarioChange: (scenario: Scenario) => void;
  onVoiceTypeChange: (voiceType: VoiceType) => void;
  onStart: () => void;
  onBlogClick: () => void;
  user: { id: number; username: string } | null;
  userLoading: boolean;
  onLogout: () => void;
}

function NavBar({
  user,
  userLoading,
  onLogout,
}: {
  user: { id: number; username: string } | null;
  userLoading: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 text-white py-3 px-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="text-[22px]">💕</span>
        <span className="text-[16px] font-bold tracking-wide">
          哄哄模拟器
        </span>
      </div>

      <div className="flex items-center gap-2">
        {userLoading ? (
          <span className="text-[12px] text-white/70">加载中...</span>
        ) : user ? (
          <>
            <Link
              href="/profile"
              className="text-[13px] text-white/90 hover:text-white active:text-white transition-colors bg-white/15 rounded-full px-3 py-1"
            >
              👤 {user.username}
            </Link>
            <button
              onClick={onLogout}
              className="text-[12px] text-white/70 hover:text-white active:text-white transition-colors"
            >
              退出
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-[13px] text-white/90 hover:text-white active:text-white transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="text-[13px] bg-white/20 text-white rounded-full px-3 py-1 hover:bg-white/30 active:bg-white/40 transition-colors font-medium"
            >
              注册
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-6 pb-2 text-xs text-gray-400">
      {children}
    </div>
  );
}

export default function StartScreen({
  gender,
  scenario,
  voiceType,
  onGenderChange,
  onScenarioChange,
  onVoiceTypeChange,
  onStart,
  onBlogClick,
  user,
  userLoading,
  onLogout,
}: StartScreenProps) {
  const canStart = gender !== null && scenario !== null && voiceType !== null;
  const availableVoices = gender ? getVoicesByGender(gender) : [];

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      <NavBar user={user} userLoading={userLoading} onLogout={onLogout} />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-t border-b border-gray-200">
          <SectionTitle>选择对方性别</SectionTitle>
          <div className="px-4 pb-4 space-y-2">
            <div className="flex gap-3">
              <button
                onClick={() => onGenderChange("female")}
                className={`flex-1 py-3 rounded-md text-[15px] font-medium transition-colors ${
                  gender === "female"
                    ? "bg-[#07C160] text-white"
                    : "bg-[#F7F7F7] text-gray-700"
                }`}
              >
                👧 女朋友
              </button>
              <button
                onClick={() => onGenderChange("male")}
                className={`flex-1 py-3 rounded-md text-[15px] font-medium transition-colors ${
                  gender === "male"
                    ? "bg-[#07C160] text-white"
                    : "bg-[#F7F7F7] text-gray-700"
                }`}
              >
                👦 男朋友
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-white border-t border-b border-gray-200">
          <SectionTitle>选择场景</SectionTitle>
          <div className="px-4 pb-4 space-y-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => onScenarioChange(s)}
                className={`w-full text-left py-3 px-4 rounded-md transition-colors ${
                  scenario?.id === s.id
                    ? "bg-[#07C160] text-white"
                    : "bg-[#F7F7F7] text-gray-700"
                }`}
              >
                <span className="text-[15px] font-medium block">
                  {s.title}
                </span>
                <span
                  className={`text-[13px] mt-0.5 block ${
                    scenario?.id === s.id
                      ? "text-white/80"
                      : "text-gray-400"
                  }`}
                >
                  {s.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {!!gender && (
          <div className="mt-5 bg-white border-t border-b border-gray-200">
            <SectionTitle>选择语音类型</SectionTitle>
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {availableVoices.map((v) => (
                  <button
                    key={v.voiceType}
                    onClick={() => onVoiceTypeChange(v.voiceType)}
                    className={`py-2.5 px-4 rounded-md text-[14px] font-medium transition-colors ${
                      voiceType === v.voiceType
                        ? "bg-[#07C160] text-white"
                        : "bg-[#F7F7F7] text-gray-700"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="px-4 pt-8 pb-10">
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`w-full py-3 rounded-md text-[16px] font-medium transition-colors ${
              canStart
                ? "bg-[#07C160] text-white active:bg-[#06AD56]"
                : "bg-[#E0E0E0] text-gray-400"
            }`}
          >
            开始聊天
          </button>
          <button
            onClick={onBlogClick}
            className="w-full mt-3 py-3 rounded-md text-[15px] font-medium bg-white text-[#576B95] border border-[#E5E5E5] active:bg-[#F7F7F7] transition-colors"
          >
            📖 恋爱攻略
          </button>

          <Link
            href="/leaderboard"
            className="block w-full mt-3 py-3 rounded-md text-[15px] font-medium text-center bg-white text-[#576B95] border border-[#E5E5E5] active:bg-[#F7F7F7] transition-colors"
          >
            🏆 排行榜
          </Link>
        </div>
      </div>
    </div>
  );
}
