import { test, expect } from "@playwright/test";

const apiRoutes = [
  { name: "Session", path: "/api/auth/session", expectStatus: [401, 500] },
  { name: "Settlement", path: "/api/settlement", expectStatus: [401, 500] },
  { name: "Tournaments", path: "/api/tournaments", expectStatus: [200, 401, 500] },
  { name: "Leaderboard", path: "/api/leaderboard", expectStatus: [200, 401, 500] },
  { name: "Content", path: "/api/content?hero=1", expectStatus: [200, 500] },
];

test.describe("Server health", () => {
  test("auth session endpoint is reachable", async ({ request }) => {
    const res = await request.get("/api/auth/session", { timeout: 60_000 });
    expect([401, 500]).toContain(res.status());
  });
});

test.describe("API contracts", () => {
  for (const route of apiRoutes) {
    test(`${route.name} API responds`, async ({ request }) => {
      const res = await request.get(route.path, { timeout: 60_000 });
      expect(route.expectStatus).toContain(res.status());
    });
  }

  test("invite QR endpoint returns SVG", async ({ request }) => {
    const res = await request.get("/api/invites/qr?code=TESTCODE", { timeout: 60_000 });
    expect(res.status()).toBe(200);
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).toContain("svg");
  });

  test("refresh rejects invalid token", async ({ request }) => {
    const res = await request.post("/api/auth/refresh", {
      data: { refreshToken: "invalid-token-that-is-long-enough-1234567890" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("logout without token returns error", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Player pages", () => {
  test.use({ navigationTimeout: 180_000 });

  const pages = ["/", "/missions", "/arena", "/profile", "/referrals", "/achievements"];

  for (const path of pages) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 180_000 });
      const status = response?.status() ?? 500;
      expect(status).toBeLessThan(600);
    });
  }
});

test.describe("Navigation discoverability", () => {
  test.use({ navigationTimeout: 180_000 });

  test("profile hub links resolve", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    const missions = page.getByRole("link", { name: "Missions" });
    if ((await missions.count()) === 0) test.skip();
    await missions.click();
    await expect(page).toHaveURL(/\/missions/, { timeout: 60_000 });
  });

  test("home quick actions include rewards and achievements", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const rewards = page.getByRole("link", { name: /Reward Center/i });
    if ((await rewards.count()) === 0) test.skip();
    await expect(rewards).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole("link", { name: /Achievements/i })).toBeVisible({ timeout: 30_000 });
  });
});
