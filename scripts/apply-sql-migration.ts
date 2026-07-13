import "dotenv/config";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const migrationPath = join(process.cwd(), "prisma", "migrations", "0001_init", "migration.sql");
  const sql = await readFile(migrationPath, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  const existingTable = await client.query("select to_regclass('public.users') as table_name");

  if (existingTable.rows[0]?.table_name) {
    await client.end();
    console.log("SQL migration already applied. Skipping.");
    return;
  }

  await client.query(sql);
  await client.end();

  console.log("SQL migration applied successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
