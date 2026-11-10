import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from '../home/home-page';

export class LoginPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly signupLoginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly loggedInUser: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = '/login';
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
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Login to your account');
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async fillPassword(value: string) {
    await this.passwordInput.fill(value);
  }

  /** Valid-login navigation returns the verified home page; user validation stays explicit. */
  async clickLogin() {
    await this.loginButton.click();
    const destination = new HomePage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async getEmail() {
    await expect(this.emailInput).toBeVisible();
    return this.emailInput.inputValue();
  }

  async validateEmail(expected: string) {
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveValue(expected);
  }

  // No password validator: native expected/received output would disclose it.
  async validateHeading(expected: string) {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText(expected);
  }

  async validateSignupLoginVisible() {
    await expect(this.signupLoginLink).toBeVisible();
  }

  async validateLogoutHidden() {
    await expect(this.logoutLink).toBeHidden();
  }

  async validateLoggedInUserHidden() {
    await expect(this.loggedInUser).toBeHidden();
  }
}
