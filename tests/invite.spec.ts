import { test, expect } from "@playwright/test";

test.describe("Invitation Flow", () => {
    test("should redirect to sign-in when token is present but not authenticated", async ({ page }) => {
        // Navigate to invite page with a bogus token
        const token = "bogus_token_123";
        await page.goto(`/auth/invite?token=${token}`);

        // Should be redirected to sign-in with the next param
        await expect(page).toHaveURL(new RegExp(`/auth/sign-in\\?next=.*invite.*token=${token}`));
    });

    test("should show error if token is missing", async ({ page }) => {
        await page.goto("/auth/invite");
        await expect(page.locator("text=Invalid Invitation")).toBeVisible();
        await expect(page.locator("text=No invitation token provided")).toBeVisible();
    });
});
