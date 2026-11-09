import { test, expect } from '@fixtures/fixtures';
import process from 'node:process';

test('Login and log out verification', async( { page } ) => {

    const signupLogin_LNK = page.getByRole('link', { name: ' Signup / Login' });
    const accountLogin_HDR = page.getByRole('heading', { name: 'Login to your account' });
    const existingUserEmail_TXT = page.locator('form').filter({ hasText: 'Login' }).getByPlaceholder('Email Address');
    const existingUserPass_TXT = page.getByRole('textbox', { name: 'Password' });
    const login_BTN = page.getByRole('button', { name: 'Login' });
    const userAccount_LNK = page.locator('a').filter({ hasText: 'Logged in as', has: page.locator('.fa-user')});
    const logout_LNK = page.getByRole('link', { name: ' Logout' });

    const sitePassword = process.env.TEST_PASSWORD;

    if (!sitePassword) {
        throw new Error('TEST_PASSWORD environment variable is missing');
    }

    await page.goto('https://automationexercise.com');
    await signupLogin_LNK.click();
    await expect(accountLogin_HDR).toBeVisible();
    await page.waitForLoadState('load');
    await existingUserEmail_TXT.fill('a@asdfasdf.com');
    await existingUserPass_TXT.fill(sitePassword);
    await login_BTN.click();
    await expect(userAccount_LNK).toBeVisible();
    await expect(userAccount_LNK).toHaveText('Logged in as ba');
    await expect(signupLogin_LNK).not.toBeVisible();
    await logout_LNK.click();
    await expect(logout_LNK).not.toBeVisible();
    await expect(signupLogin_LNK).toBeVisible();
});