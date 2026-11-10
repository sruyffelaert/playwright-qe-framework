import { test } from '@fixtures/fixtures';
import path from 'node:path';
import { HomePage } from '../pages/home/home-page';

test('Submit contact form with attachment', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.open();
  const contactUsPage = await homePage.navigateToContactUs();

  await contactUsPage.validateHeading('Contact Us');
  await contactUsPage.fillName('Joe Pelky');
  await contactUsPage.fillEmail('joseph.pelky@crap.com');
  await contactUsPage.fillSubject('This is a contact form subject');
  await contactUsPage.fillMessage('This is a message for the contact form');

  const sampleInputFile = path.join(process.cwd(), 'test-data/uploads', 'sample.txt');
  await contactUsPage.uploadAttachment(sampleInputFile);

  await contactUsPage.clickSubmitAndAcceptConfirmation();
  await contactUsPage.validateSuccessMessage(
    'Success! Your details have been submitted successfully.',
  );
});
