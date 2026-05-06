"use client";

import { affectionToProgress, getProgressColor } from "@/lib/game";

interface AffectionBarProps {
  affection: number;
}

export default function AffectionBar({ affection }: AffectionBarProps) {
  const progress = affectionToProgress(affection);
  const color = getProgressColor(affection);

  const emoji =
    affection < 0
      ? "😡"
      : affection < 50
        ? "😤"
        : affection < 80
          ? "😐"
          : "😊";

  return (
    <div className="flex items-center gap-2.5 px-3 py-2">
      <span className="text-[12px] text-gray-400 whitespace-nowrap flex-shrink-0">好感度</span>
      <div className="flex-1 h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-[12px] flex-shrink-0">{emoji}</span>
    </div>
  );
}
