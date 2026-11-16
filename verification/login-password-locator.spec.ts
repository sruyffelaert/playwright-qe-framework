import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login/login-page';

test('fills the actual password input in the login form only', async ({ page }) => {
  await page.setContent(`
    <form>
      <h2>Login</h2>
      <input type="password" name="password" placeholder="Password" data-qa="login-password">
      <button type="button">Login</button>
    </form>
    <form>
      <h2>Signup</h2>
      <input type="password" placeholder="Password">
    </form>
  `);
  const loginPage = new LoginPage(page);
  await loginPage.fillPassword('synthetic-locator-value');
  await expect(page.locator('[data-qa="login-password"]')).toHaveValue('synthetic-locator-value');
  await expect(page.locator('form').filter({ hasText: 'Signup' }).locator('input')).toHaveValue('');
});
