import { expect, type Locator, type Page } from '@playwright/test';
import { CartPage } from '../cart/cart-page';
import { ContactUsPage } from '../contact-us/contact-us-page';
import { LoginPage } from '../login/login-page';
import { ProductsPage } from '../products/products-page';

export class HomePage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly productsLink: Locator;
  private readonly cartLink: Locator;
  private readonly contactUsLink: Locator;
  private readonly signupLoginLink: Locator;
  private readonly logoutLink: Locator;
  private readonly loggedInUser: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = '/';
    this.heading = page.getByRole('heading', { name: 'Features Items', exact: true });
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
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Features Items');
  }

  async clickProducts() {
    await this.productsLink.click();
    const destination = new ProductsPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async clickCart() {
    await this.cartLink.click();
    const destination = new CartPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async clickContactUs() {
    await this.contactUsLink.click();
    const destination = new ContactUsPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async clickSignupLogin() {
    await this.signupLoginLink.click();
    const destination = new LoginPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async clickLogout() {
    await this.logoutLink.click();
    const destination = new LoginPage(this.page);
    await destination.assertLoaded();
    return destination;
  }

  async validateLoggedInUser(expectedName: string) {
    await expect(this.loggedInUser).toBeVisible();
    await expect(this.loggedInUser).toHaveText(`Logged in as ${expectedName}`);
  }

  async validateLoggedInUserHidden() {
    await expect(this.loggedInUser).toBeHidden();
  }

  async validateSignupLoginVisible() {
    await expect(this.signupLoginLink).toBeVisible();
  }

  async validateSignupLoginHidden() {
    await expect(this.signupLoginLink).toBeHidden();
  }

  async validateLogoutVisible() {
    await expect(this.logoutLink).toBeVisible();
  }

  async validateLogoutHidden() {
    await expect(this.logoutLink).toBeHidden();
  }
}
