import { test, expect } from '../fixtures';

test('user can login', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});

test('redirect to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
