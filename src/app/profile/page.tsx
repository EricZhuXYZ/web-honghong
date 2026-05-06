"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GameRecord {
  id: number;
  scenario: string;
  finalScore: number;
  result: string;
  playedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setUser(data.user);
        return fetch("/api/game-records");
      })
      .then((res) => {
        if (!res) return;
        return res.json();
      })
      .then((data) => {
        if (data?.records) {
          setRecords(data.records);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("创建支付会话失败，请重试");
      }
    } catch {
      alert("网络错误，请重试");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center">
        <p className="text-[15px] text-gray-400">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const winCount = records.filter((r) => r.result === "通关").length;
  const loseCount = records.filter((r) => r.result === "失败").length;

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <div className="bg-[#2B2B2B] text-white text-center py-3 px-4 relative">
        <Link
          href="/"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-[20px] leading-none"
        >
          ←
        </Link>
        <span className="text-[17px] font-medium">我的</span>
      </div>

      <div className="px-4 pt-5">
        <div className="bg-white rounded-lg p-5 border border-[#E5E5E5] mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] font-medium text-[#1A1A1A]">
              👤 {user.username}
            </span>
            <button
              onClick={handleLogout}
              className="text-[14px] text-gray-400 active:text-gray-600"
            >
              退出登录
            </button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 text-center bg-[#F7F7F7] rounded-md py-3">
              <p className="text-[20px] font-bold text-[#07C160]">{winCount}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">通关</p>
            </div>
            <div className="flex-1 text-center bg-[#F7F7F7] rounded-md py-3">
              <p className="text-[20px] font-bold text-[#ef4444]">{loseCount}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">失败</p>
            </div>
            <div className="flex-1 text-center bg-[#F7F7F7] rounded-md py-3">
              <p className="text-[20px] font-bold text-[#1A1A1A]">{records.length}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">总局数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border border-[#E5E5E5] mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[16px] font-medium text-[#1A1A1A]">
                ⭐ 会员中心
              </p>
              <p className="text-[12px] text-gray-400 mt-1">
                开通会员，享受更多功能
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="bg-gradient-to-r from-[#FF9500] to-[#FF5E3A] text-white text-[14px] font-medium px-5 py-2 rounded-full active:opacity-80 disabled:opacity-50"
            >
              {checkoutLoading ? "加载中..." : "升级会员"}
            </button>
          </div>
        </div>

        <h2 className="text-[14px] text-gray-400 mb-3 px-1">游戏记录</h2>

        {records.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-[#E5E5E5] text-center">
            <p className="text-[14px] text-gray-400">还没有游戏记录</p>
            <Link
              href="/"
              className="inline-block mt-3 text-[14px] text-[#576B95]"
            >
              去玩一局 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2 pb-10">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-lg p-4 border border-[#E5E5E5]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[15px] font-medium text-[#1A1A1A]">
                    {record.scenario}
                  </span>
                  <span
                    className={`text-[13px] font-medium ${
                      record.result === "通关"
                        ? "text-[#07C160]"
                        : "text-[#ef4444]"
                    }`}
                  >
                    {record.result}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-400">
                    好感度: {record.finalScore}
                  </span>
                  <span className="text-[12px] text-gray-300">
                    {new Date(record.playedAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
