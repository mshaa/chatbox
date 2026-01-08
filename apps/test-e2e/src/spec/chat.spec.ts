import { expect, test } from '@playwright/test';

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByTestId('login-username').fill('user_main');
    await page.getByTestId('login-password').fill('password');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/chat/);
  });

  test('should display list of rooms', async ({ page }) => {
    await expect(page.getByTestId('room-item-General')).toBeVisible();
    await expect(page.getByTestId('room-item-Join Target')).toBeVisible();
  });

  test('should allow joining a room and sending a message', async ({ page }) => {
    await page.getByTestId('room-item-General').click();

    const messageInput = page.getByTestId('message-input');
    const testMessage = `Hello from Playwright ${Date.now()}`;

    await messageInput.fill(testMessage);
    await page.getByTestId('message-submit').click();

    await expect(page.getByTestId('message-list')).toContainText(testMessage);
  });
});
