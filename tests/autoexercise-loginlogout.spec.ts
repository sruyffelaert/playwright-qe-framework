import { test } from '@fixtures/fixtures';
import process from 'node:process';
import { HomePage } from '../pages/home/home-page';

test('Login and log out verification', async ({ page }) => {
  const sitePassword = process.env.TEST_PASSWORD;

  if (!sitePassword) {
    throw new Error('TEST_PASSWORD environment variable is missing');
  }

  const homePage = new HomePage(page);
  await homePage.open();
  const loginPage = await homePage.navigateToSignupLogin();

  await loginPage.validateHeading('Login to your account');
  await loginPage.fillEmail('a@asdfasdf.com');
  await loginPage.fillPassword(sitePassword);
  const authenticatedHomePage = await loginPage.navigateToLogin();

  await authenticatedHomePage.validateLoggedInUser('ba');
  await authenticatedHomePage.validateSignupLoginHidden();
  const loggedOutLoginPage = await authenticatedHomePage.navigateToLogout();

  await loggedOutLoginPage.validateLogoutHidden();
  await loggedOutLoginPage.validateSignupLoginVisible();
});
