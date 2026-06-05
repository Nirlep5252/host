import { neon } from "@neondatabase/serverless";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATION_TABLE = "formality_schema_migrations";
const BASELINE_DRIZZLE_INDEX = 6;
const LEGACY_API_KEYS_ID = "legacy_001_api_keys";

const apiRoot = fileURLToPath(new URL("..", import.meta.url));

function migrationIndex(id) {
  const [prefix] = id.split("_");
  const index = Number(prefix);
  return Number.isInteger(index) ? index : null;
}

function shouldBaselineExistingDb(id) {
  if (id === LEGACY_API_KEYS_ID) return true;
  const index = migrationIndex(id);
  return index !== null && index <= BASELINE_DRIZZLE_INDEX;
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function loadMigrations() {
  const drizzleDir = join(apiRoot, "drizzle");
  const drizzleFiles = (await readdir(drizzleDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const migrations = [];
  for (const file of drizzleFiles) {
    const id = basename(file, ".sql");
    migrations.push({ id, path: join(drizzleDir, file) });

    if (id.startsWith("0000_")) {
      const legacyPath = join(apiRoot, "migrations", "001_api_keys.sql");
      if (await pathExists(legacyPath)) {
        migrations.push({ id: LEGACY_API_KEYS_ID, path: legacyPath });
      }
    }
  }

  return migrations;
}

function splitSql(content) {
  return content
    .replace(/-->\s*statement-breakpoint/g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => {
      if (!statement) return false;
      return !["BEGIN", "COMMIT"].includes(statement.toUpperCase());
    });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const sql = neon(databaseUrl);
  await sql.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id text PRIMARY KEY,
      file_path text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrations = await loadMigrations();
  const appliedRows = await sql.query(`SELECT id FROM ${MIGRATION_TABLE}`);
  const applied = new Set(appliedRows.map((row) => row.id));

  const [{ exists: hasUsersTable }] = await sql.query(
    "SELECT to_regclass('public.users') IS NOT NULL AS exists"
  );

  const [{ exists: hasLegacyApiKeyHash }] = await sql.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'api_key_hash'
    ) AS exists
  `);

  const [{ exists: hasApiKeysTable }] = await sql.query(
    "SELECT to_regclass('public.api_keys') IS NOT NULL AS exists"
  );

  if (applied.size === 0 && hasUsersTable) {
    const legacyMigration = migrations.find(
      (migration) => migration.id === LEGACY_API_KEYS_ID
    );
    if (legacyMigration && hasLegacyApiKeyHash && !hasApiKeysTable) {
      await applyMigration(sql, legacyMigration);
      applied.add(legacyMigration.id);
    }

    const baseline = migrations.filter((migration) =>
      shouldBaselineExistingDb(migration.id)
    );

    for (const migration of baseline) {
      await sql.query(
        `INSERT INTO ${MIGRATION_TABLE} (id, file_path) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [migration.id, migration.path]
      );
      applied.add(migration.id);
    }

    console.log(
      `Baselined ${baseline.length} existing migrations through 000${BASELINE_DRIZZLE_INDEX}`
    );
  }

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    await applyMigration(sql, migration);
  }

  console.log("Database migrations complete");
}

async function applyMigration(sql, migration) {
  const content = await readFile(migration.path, "utf8");
  const statements = splitSql(content);
  if (statements.length === 0) return;

  console.log(`Applying ${migration.id}`);
  await sql.transaction((tx) => [
    ...statements.map((statement) => tx.query(statement)),
    tx.query(
      `INSERT INTO ${MIGRATION_TABLE} (id, file_path) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [migration.id, migration.path]
    ),
  ]);
  console.log(`Applied ${migration.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
