import { test, expect } from '@fixtures/fixtures';

test('Add multiple quantities to cart', async ( { page } ) => {
    const products_LNK = page.getByRole('link', { name: ' Products' });
    const productSearchBox_TXT = page.getByRole('textbox', { name: 'Search Product' });
    const productSearch_BTN = page.locator('#submit_search');

    const productListing_CRD = page.locator('.product-image-wrapper');
    const blueTop_CRD = productListing_CRD.filter( { hasText: 'Blue Top' } );
    const blueTopDetails_LNK = blueTop_CRD.locator('.choose');
    const productQuantity_TXT = page.locator('#quantity');
    const addToCart_BTN = page.getByRole('button', { name: ' Add to cart' });
    const continueShopping_BTN = page.getByRole('button', { name: 'Continue Shopping' });
    const shoppingCart_LNK = page.getByRole('link', { name: ' Cart' });
    
    const shoppingCart_ROW = page.getByRole('row');
    const blueTop_ROW = shoppingCart_ROW.filter( { hasText: 'Blue Top' } );
    const blueTopQuantity_TXT = blueTop_ROW.getByRole('cell').and(blueTop_ROW.locator('.cart_quantity'));
    const blueTopCalcTotal_TXT = blueTop_ROW.getByRole('cell').and(blueTop_ROW.locator('.cart_total'));

    await page.goto('https://automationexercise.com');

    await products_LNK.click();
    await productSearchBox_TXT.fill('Blue Top');
    await productSearch_BTN.click();
    await blueTopDetails_LNK.click();
    await productQuantity_TXT.fill('4');
    await addToCart_BTN.click();
    await continueShopping_BTN.click();
    await shoppingCart_LNK.click();

    await expect(shoppingCart_ROW).toHaveCount(2);
    await expect(blueTopQuantity_TXT).toHaveText('4');
    await expect(blueTopCalcTotal_TXT).toHaveText('Rs. 2000');


});