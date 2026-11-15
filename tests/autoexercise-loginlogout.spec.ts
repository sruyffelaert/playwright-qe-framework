import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Login and log out verification', async ({ page, environmentData, hashicorpVault }) => {
  const account = environmentData.ACCOUNTS['Registered account for login and logout'];
  const { username, password } = await hashicorpVault.getSecret(account.vaultSecret);

  const homePage = new HomePage(page);
  await homePage.open();
  const loginPage = await homePage.navigateToSignupLogin();

  await loginPage.validateHeading('Login to your account');
  await loginPage.fillEmail(username);
  await loginPage.fillPassword(password);
  const authenticatedHomePage = await loginPage.navigateToLogin();

  await authenticatedHomePage.validateLoggedInUser(account.displayName);
  await authenticatedHomePage.validateSignupLoginHidden();
  const loggedOutLoginPage = await authenticatedHomePage.navigateToLogout();

  await loggedOutLoginPage.validateLogoutHidden();
  await loggedOutLoginPage.validateSignupLoginVisible();
});
