import { expect, type Locator, type Page } from '@playwright/test';
import { waitForAutomationExerciseReady } from '../../support/automation-exercise-readiness';

export class HomePage {
  private readonly page: Page;
  private readonly url: string;
  private readonly productsLink: Locator;
  private readonly cartLink: Locator;
  private readonly contactUsLink: Locator;
  private readonly signupLoginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly loggedInUser: Locator;

  constructor(page: Page, baseUrl = 'https://automationexercise.com') {
    this.page = page;
    this.url = new URL('/', baseUrl).href;
    this.productsLink = page.getByRole('link', { name: ' Products', exact: true });
    this.cartLink = page.getByRole('link', { name: ' Cart', exact: true });
    this.contactUsLink = page.getByRole('link', { name: ' Contact us', exact: true });
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

  /** Home route, initialized jQuery handlers, and visible navigation. */
  async assertLoaded() {
    await expect(this.page, 'Home URL matches').toHaveURL(this.url);
    await waitForAutomationExerciseReady(this.page);
    await expect(this.productsLink, 'Products navigation is visible').toBeVisible();
    await expect(this.cartLink, 'Cart navigation is visible').toBeVisible();
    await expect(this.contactUsLink, 'Contact navigation is visible').toBeVisible();
  }

  async clickProducts() { await this.productsLink.click(); }
  async clickCart() { await this.cartLink.click(); }
  async clickContactUs() { await this.contactUsLink.click(); }
  async clickSignupLogin() { await this.signupLoginLink.click(); }
  async clickLogout() { await this.logoutLink.click(); }

  async validateLoggedInUser(expectedName: string) {
    await expect(this.loggedInUser, 'Authenticated user is visible').toBeVisible();
    await expect(this.loggedInUser, 'Authenticated user name matches exactly')
      .toHaveText(`Logged in as ${expectedName}`);
  }

  async validateLoggedInUserHidden() {
    await expect(this.loggedInUser, 'Authenticated user is hidden or absent').toBeHidden();
  }

  async validateSignupLoginVisible() {
    await expect(this.signupLoginLink, 'Signup / Login is visible').toBeVisible();
  }

  async validateSignupLoginHidden() {
    await expect(this.signupLoginLink, 'Signup / Login is hidden or absent').toBeHidden();
  }

  async validateLogoutVisible() {
    await expect(this.logoutLink, 'Logout is visible').toBeVisible();
  }

  async validateLogoutHidden() {
    await expect(this.logoutLink, 'Logout is hidden or absent').toBeHidden();
  }
}
