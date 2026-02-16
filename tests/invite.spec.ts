import { test, expect } from "@playwright/test";

test.describe("Invitation Flow", () => {
    test("should show error for invalid or expired token", async ({ page }) => {
        // Navigate to invite page with a bogus token
        await page.goto("/auth/invite?token=bogus_token_123");

        // Should see an error message
        await expect(page.locator("text=Invitation Failed")).toBeVisible();
        await expect(page.locator("text=Invite not found or expired")).toBeVisible();

        // Link back to dashboard/home should be present
        await expect(page.locator("a", { hasText: "Return to Dashboard" })).toBeVisible();
    });

    test("should show error if token is missing", async ({ page }) => {
        await page.goto("/auth/invite");
        await expect(page.locator("text=Invalid Invitation")).toBeVisible();
        await expect(page.locator("text=No invitation token provided")).toBeVisible();
    });
});
