import { test as base } from './fixtures';
import { CartPage } from '../pages/cart/cart-page';
import { ContactUsPage } from '../pages/contact-us/contact-us-page';
import { HomePage } from '../pages/home/home-page';
import { LoginPage } from '../pages/login/login-page';
import { ProductDetailsPage } from '../pages/product-details/product-details-page';
import { ProductsPage } from '../pages/products/products-page';

type PageObjectFixtures = {
  cartPage: CartPage;
  contactUsPage: ContactUsPage;
  homePage: HomePage;
  loginPage: LoginPage;
  productDetailsPage: ProductDetailsPage;
  productsPage: ProductsPage;
};

type PageObjectOptions = {
  /** Blue Top is product 1 in the existing quantity scenario. */
  productId: number;
};

/**
 * Optional test-scoped injection for future POM consumers. Extends the existing
 * automatic ad-blocking fixture. Construction does not navigate or read secrets.
 * Existing specs retain their current imports and inline implementations.
 */
export const test = base.extend<PageObjectFixtures & PageObjectOptions>({
  productId: [1, { option: true }],
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },
  contactUsPage: async ({ page }, use) => { await use(new ContactUsPage(page)); },
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  productDetailsPage: async ({ page, productId }, use) => {
    await use(new ProductDetailsPage(page, productId));
  },
  productsPage: async ({ page }, use) => { await use(new ProductsPage(page)); },
});

export { expect } from './fixtures';
