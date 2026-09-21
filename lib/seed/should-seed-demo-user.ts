/**
 * Pure, side-effect-free decision extracted from prisma/seed.ts so the
 * one thing that actually matters here — "does production really skip
 * the demo user" — is directly unit-testable without importing seed.ts
 * itself (which runs for real, against whatever DATABASE_URL is active,
 * the moment it's imported — not something a test should ever trigger).
 */
export function shouldSeedDemoUser(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "production";
}
