import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAutomationExerciseReady } from '../../support/automation-exercise-readiness';

export class LoginPage {
  private readonly page: Page;
  private readonly url: string;
  private readonly heading: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly signupLoginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly loggedInUser: Locator;

  constructor(page: Page, baseUrl = 'https://automationexercise.com') {
    this.page = page;
    this.url = new URL('/login', baseUrl).href;
    this.heading = page.getByRole('heading', { name: 'Login to your account', exact: true });
    this.emailInput = page.locator('form').filter({ hasText: 'Login' })
      .getByPlaceholder('Email Address', { exact: true });
    this.passwordInput = page.getByRole('textbox', { name: 'Password', exact: true });
    this.loginButton = page.getByRole('button', { name: 'Login', exact: true });
    this.signupLoginLink = page.getByRole('link', { name: ' Signup / Login', exact: true });
    this.logoutLink = page.getByRole('link', { name: ' Logout', exact: true });
    this.loggedInUser = page.locator('a').filter({
      hasText: 'Logged in as', has: page.locator('.fa-user'),
    });
  }

  async open() {
    await this.page.goto(this.url);
    await this.assertLoaded();
  }

  /** Login route, initialized handlers, unique heading, and editable credentials. */
  async assertLoaded() {
    await expect(this.page, 'Login URL matches').toHaveURL(this.url);
    await waitForAutomationExerciseReady(this.page);
    await expect(this.heading, 'Login form heading is visible').toBeVisible();
    await expect(this.emailInput, 'Login email is visible').toBeVisible();
    await expect(this.emailInput, 'Login email is editable').toBeEditable();
    await expect(this.passwordInput, 'Login password is visible').toBeVisible();
    await expect(this.passwordInput, 'Login password is editable').toBeEditable();
    await expect(this.loginButton, 'Login button is visible').toBeVisible();
    await expect(this.loginButton, 'Login button is enabled').toBeEnabled();
  }

  async fillEmail(value: string) { await this.emailInput.fill(value); }
  async fillPassword(value: string) { await this.passwordInput.fill(value); }

  /** Trigger only; the caller verifies destination readiness and authentication. */
  async clickLogin() { await this.loginButton.click(); }

  async getEmail() {
    await expect(this.emailInput).toBeVisible();
    return this.emailInput.inputValue();
  }

  async validateEmail(expected: string) {
    await expect(this.emailInput, 'Login email is visible').toBeVisible();
    await expect(this.emailInput, 'Login email matches exactly').toHaveValue(expected);
  }

  // No password validator: native expected/received output would disclose it.
  async validateHeading(expected: string) {
    await expect(this.heading, 'Login heading is visible').toBeVisible();
    await expect(this.heading, 'Complete login heading matches').toHaveText(expected);
  }

  async validateSignupLoginVisible() {
    await expect(this.signupLoginLink, 'Signup / Login is visible').toBeVisible();
  }

  async validateLogoutHidden() {
    await expect(this.logoutLink, 'Logout is hidden or absent').toBeHidden();
  }

  async validateLoggedInUserHidden() {
    await expect(this.loggedInUser, 'Authenticated user is hidden or absent').toBeHidden();
  }
}
