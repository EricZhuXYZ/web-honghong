import Link from "next/link";
import pool from "@/lib/db";

interface BlogArticle {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

async function getArticles(): Promise<BlogArticle[]> {
  const { rows } = await pool.query<{
    slug: string;
    title: string;
    summary: string;
    created_at: Date;
  }>(
    `SELECT slug, title, summary, created_at
     FROM blog_posts
     ORDER BY created_at DESC`
  );

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    date: row.created_at.toISOString().slice(0, 10),
  }));
}

function NavBar() {
  return (
    <div className="bg-[#2B2B2B] text-white text-center py-3 px-4 relative">
      <Link
        href="/"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-[20px] leading-none"
      >
        ←
      </Link>
      <span className="text-[17px] font-medium">恋爱攻略</span>
    </div>
  );
}

export default async function BlogListPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <NavBar />

      <div className="px-4 pt-5 pb-10 space-y-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="block w-full text-left bg-white rounded-lg p-4 border border-[#E5E5E5] active:bg-[#F7F7F7] transition-colors"
          >
            <h2 className="text-[16px] font-medium text-[#1A1A1A] leading-snug">
              {article.title}
            </h2>
            <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
              {article.summary}
            </p>
            <p className="text-[12px] text-gray-300 mt-2">
              {article.date}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
