import { test, expect } from '@fixtures/fixtures';
import path from 'node:path';

test('Submit contact form with attachment', async ( { page } ) => {

    const contactUs_LNK = page.getByRole('link', { name: ' Contact us' });
    const contactUs_HDR = page.getByRole('heading', { name: 'Contact Us' });
    const name_TXT = page.getByRole('textbox', { name: 'Name' });
    const email_TXT = page.getByRole('textbox', { name: 'Email', exact: true });
    const subject_TXT = page.getByRole('textbox', { name: 'Subject' });
    const message_TXT = page.getByRole('textbox', { name: 'Your Message Here' });
    const chooseFile_BTN = page.getByRole('button', { name: 'Choose File' });
    const submit_BTN = page.getByRole('button', { name: 'Submit' });

    await page.goto('https://automationexercise.com');
    await contactUs_LNK.click();
    await expect(contactUs_HDR).toHaveText('Contact Us');
    await page.waitForLoadState('load');

    await name_TXT.fill('Joe Pelky');
    await email_TXT.fill('joseph.pelky@crap.com');
    await subject_TXT.fill('This is a contact form subject');
    await message_TXT.fill('This is a message for the contact form');
    
    const sampleInputFile = path.join(process.cwd(), 'test-data/uploads', 'sample.txt');
    console.log(sampleInputFile);
    await chooseFile_BTN.setInputFiles(sampleInputFile);

    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 });
    const clickPromise = submit_BTN.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Press OK to proceed!');
    expect(dialog.type()).toBe('confirm');

    await dialog.accept();
    await clickPromise;

    const contactFormSuccessMessage = page.locator('.status').and(page.locator('.alert-success'));
    await expect(contactFormSuccessMessage).toHaveText('Success! Your details have been submitted successfully.');

});