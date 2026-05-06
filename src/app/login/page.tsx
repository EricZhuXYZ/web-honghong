"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("网络请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
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
        <span className="text-[17px] font-medium">登录</span>
      </div>

      <div className="px-4 pt-10">
        <div className="bg-white rounded-lg p-6 border border-[#E5E5E5]">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[14px] text-gray-500 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full py-3 px-4 rounded-md border border-[#E5E5E5] text-[15px] text-[#1A1A1A] outline-none focus:border-[#07C160] transition-colors"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-[14px] text-gray-500 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full py-3 px-4 rounded-md border border-[#E5E5E5] text-[15px] text-[#1A1A1A] outline-none focus:border-[#07C160] transition-colors"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-[14px] text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md text-[16px] font-medium transition-colors ${
                loading
                  ? "bg-[#E0E0E0] text-gray-400"
                  : "bg-[#07C160] text-white active:bg-[#06AD56]"
              }`}
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="mt-4 text-center text-[14px] text-gray-400">
            还没有账号？
            <Link
              href="/register"
              className="text-[#576B95] ml-1"
            >
              去注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
