import { expect, test } from "@playwright/test";

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";
const ADMIN_PIN = process.env.E2E_ADMIN_PIN ?? "1234";

/**
 * E2E Mode Cermin.
 *
 * Persyaratan environment:
 * - Backend FastAPI hidup di `BACKEND_INTERNAL_URL` (default 127.0.0.1:8000).
 * - Frontend Next.js dev server hidup di `E2E_BASE_URL` (default 127.0.0.1:3000).
 * - User admin tersedia. Username & PIN di-set lewat env `E2E_ADMIN_USERNAME` /
 *   `E2E_ADMIN_PIN`. 2FA harus disabled untuk akun ini.
 */
test.describe("Mode Cermin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login/admin");

    // Username field — placeholder berbahasa ID/EN: "Masukkan username" / "Enter username".
    const username = page.getByPlaceholder(/masukkan username|enter username/i);
    await expect(username).toBeVisible();
    await username.fill(ADMIN_USERNAME);

    // PIN field — placeholder literal "••••••••" + type=password.
    const pin = page.locator('input[type="password"], input[placeholder="••••••••"]').first();
    await expect(pin).toBeVisible();
    await pin.fill(ADMIN_PIN);

    await page.getByRole("button", { name: /masuk|sign in/i }).first().click();
    await expect(page).not.toHaveURL(/\/login\//);
  });

  test("admin can enter, see banner, hit read-only block, and exit", async ({ page }) => {
    await page.getByRole("button", { name: /pemilik|owner/i }).first().click();

    const banner = page.getByTestId("mirror-mode-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/melihat sebagai|viewing as/i);

    const watermark = page.getByTestId("mirror-mode-watermark");
    await expect(watermark).toBeVisible();

    const writeAttempt = await page.request.patch("/api/auth/me", {
      data: { full_name: "Should Not Persist" },
    });
    expect(writeAttempt.status()).toBe(403);
    const body = await writeAttempt.json();
    expect(body.code).toBe("MIRROR_READ_ONLY");

    await banner.getByRole("button", { name: /keluar|exit/i }).click();
    await expect(banner).not.toBeVisible();
    await expect(watermark).not.toBeVisible();
  });
});