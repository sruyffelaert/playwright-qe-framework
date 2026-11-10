import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Add multiple items to shopping cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch('Blue Top');
  await productsPage.clickSearch();
  await productsPage.clickAddToCart('Blue Top');
  await productsPage.clickContinueShopping();

  await productsPage.fillSearch('Men tshirt');
  await productsPage.clickSearch();
  await productsPage.clickAddToCart('Men Tshirt');
  await productsPage.clickContinueShopping();

  const cartPage = await productsPage.navigateToCart();

  await cartPage.validateProductCount(2);
  await cartPage.validateProductVisible('Blue Top');
  await cartPage.validateProductVisible('Men Tshirt');
  await cartPage.validateProductTotal('Blue Top', 'Rs. 500');
  await cartPage.validateProductTotal('Men Tshirt', 'Rs. 400');
  await cartPage.validateProductQuantity('Blue Top', 1);
  await cartPage.validateProductQuantity('Men Tshirt', 1);
});
