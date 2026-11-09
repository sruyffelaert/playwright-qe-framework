import { test, expect } from '@fixtures/fixtures';

test('Remove item from cart', async ( { page } ) => {

    const products_LNK = page.getByRole('link', { name: ' Products' });
    const shoppingCart_LNK = page.getByRole('link', { name: ' Cart' });
    const searchBox_TXT = page.getByRole('textbox', { name: 'Search Product' });
    const searchProduct_BTN = page.locator('#submit_search');
    const continueShopping_BTN = page.getByRole('button', { name: 'Continue Shopping' });
    const product_CRD = page.locator('.single-products');
    const menTshirtAdd_BTN = product_CRD.filter( { hasText: 'Men Tshirt' }).locator('.productinfo').locator('.btn');
    const blueTopAdd_BTN = product_CRD.filter( { hasText: 'Blue Top' }).locator('.productinfo').locator('.btn');

    await page.goto('https://automationexercise.com');

    await products_LNK.click();
    
    await searchBox_TXT.fill('Blue Top');
    await searchProduct_BTN.click();
    await blueTopAdd_BTN.click();
    await continueShopping_BTN.click();

    await searchBox_TXT.fill('Men Tshirt');
    await searchProduct_BTN.click();
    await menTshirtAdd_BTN.click();
    await continueShopping_BTN.click();

    await shoppingCart_LNK.click();

    const cartRow_ROW = page.getByRole('row');
    const cartRowBlueTop_ROW = cartRow_ROW.filter( { hasText: 'Blue Top' } );
    const cartRowMenTshirt_ROW = cartRow_ROW.filter( { hasText: 'Men Tshirt' } );
    const blueTopPrice_TXT = cartRowBlueTop_ROW.getByRole('cell').and(cartRowBlueTop_ROW.locator('.cart_price'));
    const menTshirtPrice_TXT = cartRowMenTshirt_ROW.getByRole('cell').and(cartRowMenTshirt_ROW.locator('.cart_price'));
    const blueTopQty_TXT = cartRowBlueTop_ROW.getByRole('cell').and(cartRowBlueTop_ROW.locator('.cart_quantity'));
    const menTshirtQty_TXT = cartRowMenTshirt_ROW.getByRole('cell').and(cartRowMenTshirt_ROW.locator('.cart_quantity'));

    const blueTopRemove_BTN = cartRowBlueTop_ROW.getByRole('cell').and(cartRowBlueTop_ROW.locator('.cart_delete')).locator('.cart_quantity_delete');

    await expect(cartRow_ROW).toHaveCount(3);
    await expect(blueTopPrice_TXT).toHaveText('Rs. 500');
    await expect(blueTopQty_TXT).toHaveText('1');
    
    await expect(menTshirtPrice_TXT).toHaveText('Rs. 400');
    await expect(menTshirtQty_TXT).toHaveText('1');

    await expect(cartRowBlueTop_ROW).toBeVisible();
    await expect(cartRowBlueTop_ROW).toBeAttached();


    await blueTopRemove_BTN.highlight();

    await blueTopRemove_BTN.click();

    await expect(cartRowBlueTop_ROW).not.toBeAttached();

    await expect(cartRow_ROW).toHaveCount(2);

    await expect(cartRowMenTshirt_ROW).toBeVisible();
    await expect(menTshirtPrice_TXT).toHaveText('Rs. 400');
    await expect(menTshirtQty_TXT).toHaveText('1');

});


