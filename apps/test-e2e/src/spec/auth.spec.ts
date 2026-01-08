import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated user to /auth', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should allow user to sign in and redirect to /chat', async ({ page }) => {
    await page.goto('/auth');

    await page.getByTestId('login-username').fill('user_main');
    await page.getByTestId('login-password').fill('password');

    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/chat/);
  });

  test('should allow user to sign out', async ({ page }) => {
    await page.goto('/auth');
    await page.getByTestId('login-username').fill('user_main');
    await page.getByTestId('login-password').fill('password');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/chat/);

    await page.getByRole('button', { name: 'user_main user_main user@example.com' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/auth/);
  });
});
