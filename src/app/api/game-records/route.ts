import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "请先登录" },
      { status: 401 }
    );
  }

  try {
    const { rows } = await pool.query<{
      id: number;
      scenario: string;
      final_score: number;
      result: string;
      played_at: Date;
    }>(
      `SELECT id, scenario, final_score, result, played_at
       FROM game_records
       WHERE user_id = $1
       ORDER BY played_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      records: rows.map((r) => ({
        id: r.id,
        scenario: r.scenario,
        finalScore: r.final_score,
        result: r.result,
        playedAt: r.played_at.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Get game records error:", err);
    return NextResponse.json(
      { error: "获取记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "请先登录" },
      { status: 401 }
    );
  }

  try {
    const { scenario, finalScore, result } = await request.json();

    if (!scenario || finalScore == null || !result) {
      return NextResponse.json(
        { error: "参数不完整" },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO game_records (user_id, scenario, final_score, result)
       VALUES ($1, $2, $3, $4)`,
      [user.id, scenario, finalScore, result]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Save game record error:", err);
    return NextResponse.json(
      { error: "保存失败" },
      { status: 500 }
    );
  }
}
