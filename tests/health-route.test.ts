import { GET } from "@/app/api/health/route";

it("reports readiness without exposing runtime configuration", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
