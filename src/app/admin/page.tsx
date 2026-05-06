"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    slug: string;
    title: string;
    summary: string;
    date: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "生成失败");
        return;
      }

      setResult(data.article);
    } catch {
      setError("网络请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <div className="bg-[#2B2B2B] text-white text-center py-3 px-4 relative">
        <Link
          href="/blog"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-[20px] leading-none"
        >
          ←
        </Link>
        <span className="text-[17px] font-medium">文章生成</span>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-white rounded-lg p-6 border border-[#E5E5E5]">
          <p className="text-[14px] text-gray-500 mb-4">
            点击按钮，AI 将自动生成一篇新的恋爱沟通技巧文章并保存到数据库。
          </p>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-3 rounded-md text-[16px] font-medium transition-colors ${
              loading
                ? "bg-[#E0E0E0] text-gray-400"
                : "bg-[#07C160] text-white active:bg-[#06AD56]"
            }`}
          >
            {loading ? "正在生成中..." : "生成新文章"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-[14px] text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-[14px] text-green-700 font-medium mb-2">
                ✅ 文章生成成功！
              </p>
              <p className="text-[15px] font-medium text-[#1A1A1A] mb-1">
                {result.title}
              </p>
              <p className="text-[13px] text-gray-500 mb-3">
                {result.summary}
              </p>
              <Link
                href={`/blog/${result.slug}`}
                className="inline-block text-[14px] text-[#576B95] active:text-[#4A5F85]"
              >
                查看文章 →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
