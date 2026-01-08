import { expect, test } from '@playwright/test';

test.describe('Realtime Chat', () => {
  test('should show messages in real-time to other users', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/auth');
    await pageA.getByTestId('login-username').fill('user_main');
    await pageA.getByTestId('login-password').fill('password');
    await pageA.getByTestId('login-submit').click();
    await expect(pageA).toHaveURL(/\/chat/);

    await pageB.goto('/auth');
    await pageB.getByTestId('login-username').fill('user_observer');
    await pageB.getByTestId('login-password').fill('password');
    await pageB.getByTestId('login-submit').click();
    await expect(pageB).toHaveURL(/\/chat/);

    await pageA.getByTestId('room-item-General').click();
    await pageB.getByTestId('room-item-General').click();

    const messageContentA = `Realtime test message ${Date.now()}`;
    const messageContentB = `Realtime test message ${Date.now()}`;
    await pageA.getByTestId('message-input').fill(messageContentA);
    await pageA.getByTestId('message-submit').click();

    await expect(pageA.getByTestId('message-list')).toContainText(messageContentA);
    await expect(pageB.getByTestId('message-list')).toContainText(messageContentA);

    await pageB.getByTestId('message-input').fill(messageContentB);
    await pageB.getByTestId('message-submit').click();

    await expect(pageA.getByTestId('message-list')).toContainText(messageContentB);
    await expect(pageB.getByTestId('message-list')).toContainText(messageContentB);

    await contextA.close();
    await contextB.close();
  });
});
