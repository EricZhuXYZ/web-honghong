"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  finalScore: number;
  playedAt: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setCurrentUserId(data.currentUserId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-[#07C160]";
    if (score >= 50) return "text-[#3b82f6]";
    if (score >= 0) return "text-[#eab308]";
    return "text-[#ef4444]";
  };

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <div className="bg-[#2B2B2B] text-white text-center py-3 px-4 relative">
        <Link
          href="/"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-[20px] leading-none"
        >
          ←
        </Link>
        <span className="text-[17px] font-medium">排行榜</span>
      </div>

      <div className="px-4 pt-5 pb-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[14px] text-gray-400">加载中...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-[#E5E5E5] text-center">
            <p className="text-[32px] mb-3">🏆</p>
            <p className="text-[14px] text-gray-400">还没有人上榜</p>
            <Link
              href="/"
              className="inline-block mt-3 text-[14px] text-[#576B95]"
            >
              成为第一名 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
            {leaderboard.map((entry) => {
              const isMe = entry.userId === currentUserId;

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center px-4 py-3 border-b border-[#EBEBEB] last:border-b-0 ${
                    isMe ? "bg-[#ECF9F1]" : ""
                  }`}
                >
                  <div className="w-8 text-center text-[16px] font-bold text-gray-400">
                    {rankEmoji(entry.rank)}
                  </div>

                  <div className="flex-1 ml-3">
                    <p className="text-[15px] font-medium text-[#1A1A1A]">
                      {entry.username}
                      {isMe && (
                        <span className="ml-1.5 text-[11px] text-[#07C160] font-normal">
                          我
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-gray-300 mt-0.5">
                      {new Date(entry.playedAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className={`text-[16px] font-bold ${scoreColor(entry.finalScore)}`}>
                    {entry.finalScore}
                    <span className="text-[12px] font-normal text-gray-400 ml-0.5">
                      分
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
