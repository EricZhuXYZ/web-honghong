import { NextResponse } from "next/server";
import { generateChatResponse } from "@/lib/llm";
import type { ChatRequest } from "@/types/game";

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.gender || !body.scenarioId) {
      return NextResponse.json(
        { error: "缺少必要参数：gender 和 scenarioId" },
        { status: 400 }
      );
    }

    if (!["female", "male"].includes(body.gender)) {
      return NextResponse.json(
        { error: "无效的 gender 参数" },
        { status: 400 }
      );
    }

    const response = await generateChatResponse(body);

    return NextResponse.json(response);
  } catch (err) {
    console.error("/api/chat error:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
