import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Remove item from cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.clickProducts();

  await productsPage.fillSearch('Blue Top');
  await productsPage.clickSearch();
  await productsPage.clickAddToCart('Blue Top');
  await productsPage.clickContinueShopping();

  await productsPage.fillSearch('Men Tshirt');
  await productsPage.clickSearch();
  await productsPage.clickAddToCart('Men Tshirt');
  await productsPage.clickContinueShopping();

  const cartPage = await productsPage.clickCart();

  await cartPage.validateProductCount(2);
  await cartPage.validateProductPrice('Blue Top', 'Rs. 500');
  await cartPage.validateProductQuantity('Blue Top', 1);
  await cartPage.validateProductPrice('Men Tshirt', 'Rs. 400');
  await cartPage.validateProductQuantity('Men Tshirt', 1);
  await cartPage.validateProductVisible('Blue Top');

  await cartPage.removeProduct('Blue Top');

  await cartPage.validateProductRemoved('Blue Top');
  await cartPage.validateProductCount(1);
  await cartPage.validateProductVisible('Men Tshirt');
  await cartPage.validateProductPrice('Men Tshirt', 'Rs. 400');
  await cartPage.validateProductQuantity('Men Tshirt', 1);
});
