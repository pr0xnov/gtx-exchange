import { execSync } from "node:child_process";

// Runs once, before any test file, in the main Vitest process (not a
// worker) — so this is the right place to apply pending migrations to the
// test database before anything tries to query it.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://gtx:gtx_password@localhost:5433/gtx_exchange_test";

export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
