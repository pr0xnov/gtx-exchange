import { apiSuccess } from "@/lib/api-response";

// Liveness check for Docker's HEALTHCHECK (see Dockerfile's runner stage)
// and any future load balancer/orchestrator. Deliberately does not touch
// the database — this only confirms the Next.js HTTP server itself is up
// and responding, which is exactly what a healthcheck polling every few
// seconds should verify. A DB-down condition is already surfaced by
// postgres's own healthcheck and by real requests failing individually,
// not by pulling every request behind an extra query here.
export async function GET() {
  return apiSuccess({ status: "ok" });
}
