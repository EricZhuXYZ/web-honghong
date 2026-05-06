import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";

interface BlogArticle {
  title: string;
  content: string;
  date: string;
}

async function getArticle(slug: string): Promise<BlogArticle | null> {
  const { rows } = await pool.query<{
    title: string;
    content: string;
    created_at: Date;
  }>(
    `SELECT title, content, created_at
     FROM blog_posts
     WHERE slug = $1`,
    [slug]
  );

  if (rows.length === 0) return null;

  return {
    title: rows[0].title,
    content: rows[0].content,
    date: rows[0].created_at.toISOString().slice(0, 10),
  };
}

function NavBar({ title }: { title: string }) {
  return (
    <div className="bg-[#2B2B2B] text-white text-center py-3 px-4 relative">
      <Link
        href="/blog"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-[20px] leading-none"
      >
        ←
      </Link>
      <span className="text-[17px] font-medium">{title}</span>
    </div>
  );
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const paragraphs = article.content
    .split("\n")
    .filter((p) => p.trim() !== "");

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <NavBar title={article.title} />

      <div className="px-4 pt-6 pb-10">
        <div className="bg-white rounded-lg px-5 py-6 border border-[#E5E5E5]">
          <h1 className="text-[20px] font-bold text-[#1A1A1A] leading-snug">
            {article.title}
          </h1>
          <p className="text-[13px] text-gray-400 mt-2">
            {article.date}
          </p>

          <div className="mt-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-[15px] text-[#333] leading-loose mb-4 last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-[12px] text-gray-300">
          哄哄模拟器 · 恋爱攻略
        </div>
      </div>
    </div>
  );
}
