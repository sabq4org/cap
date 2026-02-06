import { pool } from "./db";
import fs from "fs";
import path from "path";

export async function seedProductionIfEmpty() {
  const client = await pool.connect();
  try {
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news') as exists"
    );
    if (!tableCheck.rows[0].exists) {
      console.log("News table does not exist yet, skipping seed.");
      return;
    }

    const result = await client.query("SELECT count(*) as cnt FROM news");
    const count = parseInt(result.rows[0].cnt, 10);

    if (count > 0) {
      console.log(`Database already has ${count} news records, skipping seed.`);
      return;
    }

    console.log("Database is empty, seeding with initial data...");

    let seedPath = path.resolve(import.meta.dirname, "data", "seed_data.sql");

    if (!fs.existsSync(seedPath)) {
      seedPath = path.resolve(import.meta.dirname, "..", "server", "data", "seed_data.sql");
    }

    if (!fs.existsSync(seedPath)) {
      console.log("No seed_data.sql file found, skipping seed.");
      return;
    }

    const sql = fs.readFileSync(seedPath, "utf-8");

    await client.query("BEGIN");
    try {
      const lines = sql.split("\n");
      let currentStatement = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("--")) continue;
        if (trimmed.startsWith("SET ") || trimmed.startsWith("SELECT ") || trimmed.startsWith("ALTER TABLE")) continue;

        currentStatement += line + "\n";

        if (trimmed.endsWith(";")) {
          const stmt = currentStatement.trim();
          if (stmt.toUpperCase().startsWith("INSERT")) {
            try {
              await client.query(stmt);
            } catch (err: any) {
              if (err.code === "23505") {
                // skip duplicates
              } else if (err.code === "23503") {
                console.warn(`FK constraint skip: ${err.detail?.slice(0, 80)}`);
              } else {
                console.error(`Seed statement error [${err.code}]: ${err.message?.slice(0, 120)}`);
              }
            }
          }
          currentStatement = "";
        }
      }

      await client.query("COMMIT");
      const finalCount = await client.query("SELECT count(*) as cnt FROM news");
      console.log(`Seeding complete. News records: ${finalCount.rows[0].cnt}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Seeding failed, rolled back:", err);
    }
  } catch (err) {
    console.error("Seed check failed:", err);
  } finally {
    client.release();
  }
}
