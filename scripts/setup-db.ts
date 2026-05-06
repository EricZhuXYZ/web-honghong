import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const [{ default: pool }, { BLOG_ARTICLES }] = await Promise.all([
    import("@/lib/db"),
    import("@/data/blog"),
  ]);

  console.log("开始数据库迁移...");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("blog_posts 表创建成功");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
      ) THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
      END IF;
    END $$;
  `);

  console.log("users 表创建成功");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scenario VARCHAR(255) NOT NULL,
      final_score INTEGER NOT NULL DEFAULT 0,
      result VARCHAR(50) NOT NULL,
      played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("game_records 表创建成功");

  console.log("开始数据迁移...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const article of BLOG_ARTICLES) {
      await client.query(
        `INSERT INTO blog_posts (slug, title, summary, content, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           content = EXCLUDED.content`,
        [article.slug, article.title, article.summary, article.content, article.date]
      );
      console.log(`  已迁移: ${article.title}`);
    }

    await client.query("COMMIT");
    console.log("数据迁移完成");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("数据迁移失败:", err);
    process.exit(1);
  } finally {
    client.release();
  }

  await pool.end();
}

main().catch((err) => {
  console.error("迁移脚本执行失败:", err);
  process.exit(1);
});
