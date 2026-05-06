import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query<{
      user_id: number;
      username: string;
      final_score: number;
      played_at: Date;
    }>(
      `WITH best_records AS (
         SELECT DISTINCT ON (g.user_id)
           g.user_id,
           g.final_score,
           g.played_at
         FROM game_records g
         ORDER BY g.user_id, g.final_score DESC, g.played_at ASC
       )
       SELECT
         br.user_id,
         u.username,
         br.final_score,
         br.played_at
       FROM best_records br
       JOIN users u ON u.id = br.user_id
       ORDER BY br.final_score DESC, br.played_at ASC
       LIMIT 20`
    );

    const leaderboard = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      username: r.username,
      finalScore: r.final_score,
      playedAt: r.played_at.toISOString(),
    }));

    const user = await getAuthUser();

    return NextResponse.json({
      leaderboard,
      currentUserId: user?.id ?? null,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    );
  }
}
