import { test } from '@fixtures/fixtures';
import { HomePage } from '../pages/home/home-page';

test('Add multiple quantities to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const productsPage = await homePage.navigateToProducts();

  await productsPage.fillSearch('Blue Top');
  await productsPage.clickSearch();
  const productDetailsPage = await productsPage.navigateToViewProduct('Blue Top');

  await productDetailsPage.fillQuantity('4');
  await productDetailsPage.clickAddToCart();
  await productDetailsPage.clickContinueShopping();
  const cartPage = await productDetailsPage.navigateToCart();

  await cartPage.validateProductCount(1);
  await cartPage.validateProductQuantity('Blue Top', 4);
  await cartPage.validateProductTotal('Blue Top', 'Rs. 2000');
});
