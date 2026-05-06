import { NextResponse } from "next/server";
import pool from "@/lib/db";

const LLM_API_KEY = process.env.LLM_API_KEY ?? "";
const LLM_BASE_URL = process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1";
const LLM_MODEL =
  process.env.LLM_MODEL ?? "google/gemini-3-flash-preview-20251217";

const ARTICLE_PROMPT = `你是一位情感专栏作家，擅长写恋爱沟通技巧文章。请生成一篇关于恋爱沟通技巧的文章。

要求：
1. 文章要有吸引力，开头要有趣，能让读者有共鸣
2. 内容要实用、有干货，提供具体的沟通技巧
3. 语言风格要轻松幽默，像朋友聊天一样
4. 字数在600-1000字左右
5. 文章要分段落，每段要有明确的观点
6. 举一些生活中的小例子让文章更生动

你必须以JSON格式回复，不要包含markdown代码块标记：
{
  "slug": "英文短横线连接的url友好slug",
  "title": "文章标题（中文）",
  "summary": "文章摘要，一句话概括，50字以内",
  "content": "文章正文，用\\n分隔段落"
}`;

export async function POST() {
  if (!LLM_API_KEY) {
    return NextResponse.json(
      { error: "LLM_API_KEY 未配置" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "user", content: ARTICLE_PROMPT },
        ],
        temperature: 0.9,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LLM API error:", response.status, errorText);
      return NextResponse.json(
        { error: "LLM API 请求失败" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("LLM response parse error, raw:", rawContent.slice(0, 300));
      return NextResponse.json(
        { error: "解析LLM响应失败" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (
      !parsed.slug ||
      !parsed.title ||
      !parsed.summary ||
      !parsed.content
    ) {
      return NextResponse.json(
        { error: "LLM 返回的文章数据不完整" },
        { status: 500 }
      );
    }

    const { rows } = await pool.query<{
      id: number;
      slug: string;
      title: string;
      summary: string;
      content: string;
      created_at: Date;
    }>(
      `INSERT INTO blog_posts (slug, title, summary, content)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         summary = EXCLUDED.summary,
         content = EXCLUDED.content,
         created_at = NOW()
       RETURNING id, slug, title, summary, content, created_at`,
      [parsed.slug, parsed.title, parsed.summary, parsed.content]
    );

    return NextResponse.json({
      success: true,
      article: {
        id: rows[0].id,
        slug: rows[0].slug,
        title: rows[0].title,
        summary: rows[0].summary,
        date: rows[0].created_at.toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    console.error("/api/blog/generate error:", err);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
