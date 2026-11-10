import { expect, type Locator, type Page } from '@playwright/test';

export class ContactUsPage {
  private readonly page: Page;
  private readonly path: string;
  private readonly heading: Locator;
  private readonly nameInput: Locator;
  private readonly emailInput: Locator;
  private readonly subjectInput: Locator;
  private readonly messageInput: Locator;
  private readonly fileInput: Locator;
  private readonly submitButton: Locator;
  private readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.path = '/contact_us';
    this.heading = page.getByRole('heading', { name: 'Contact Us', exact: true });
    this.nameInput = page.getByRole('textbox', { name: 'Name', exact: true });
    this.emailInput = page.getByRole('textbox', { name: 'Email', exact: true });
    this.subjectInput = page.getByRole('textbox', { name: 'Subject', exact: true });
    this.messageInput = page.getByRole('textbox', { name: 'Your Message Here', exact: true });
    this.fileInput = page.getByRole('button', { name: 'Choose File', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true });
    this.successMessage = page.locator('.status').and(page.locator('.alert-success'));
  }

  async open() {
    await this.page.goto(this.path);
    await this.assertLoaded();
    return this;
  }

  /** Verifies the page's distinct title is visible and correct. */
  async assertLoaded() {
    await expect(this.heading, 'Contact Us heading is visible').toBeVisible();
    await expect(this.heading, 'Contact Us heading matches exactly').toHaveText('Contact Us');
  }

  async fillName(value: string) { await this.nameInput.fill(value); }
  async fillEmail(value: string) { await this.emailInput.fill(value); }
  async fillSubject(value: string) { await this.subjectInput.fill(value); }
  async fillMessage(value: string) { await this.messageInput.fill(value); }
  async uploadAttachment(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /**
   * Owns only this submission's confirm dialog; validates its complete message and
   * type before accepting. The existing fixture's logging listener can coexist.
   * Caller validates the resulting success text explicitly.
   */
  async clickSubmitAndAcceptConfirmation() {
    const confirmation = this.page.waitForEvent('dialog', { timeout: 5_000 })
      .then(async dialog => {
        try {
          expect(dialog.type(), 'Contact submission uses a confirmation').toBe('confirm');
          expect(dialog.message(), 'Contact confirmation message matches exactly')
            .toBe('Press OK to proceed!');
        } catch (error) {
          // Release the browser even when the contract fails; retain that error.
          await dialog.dismiss().catch(() => undefined);
          throw error;
        }
        await dialog.accept();
      });
    await Promise.all([confirmation, this.submitButton.click()]);
    await this.assertLoaded();
    return this;
  }

  async getName() {
    await expect(this.nameInput).toBeVisible();
    return this.nameInput.inputValue();
  }

  async getEmail() {
    await expect(this.emailInput).toBeVisible();
    return this.emailInput.inputValue();
  }

  async getSubject() {
    await expect(this.subjectInput).toBeVisible();
    return this.subjectInput.inputValue();
  }

  async getMessage() {
    await expect(this.messageInput).toBeVisible();
    return this.messageInput.inputValue();
  }

  async validateHeading(expected: string) {
    await expect(this.heading, 'Contact heading is visible').toBeVisible();
    await expect(this.heading, 'Complete contact heading matches').toHaveText(expected);
  }

  async validateName(expected: string) {
    await expect(this.nameInput, 'Contact name is visible').toBeVisible();
    await expect(this.nameInput, 'Contact name matches exactly').toHaveValue(expected);
  }

  async validateEmail(expected: string) {
    await expect(this.emailInput, 'Contact email is visible').toBeVisible();
    await expect(this.emailInput, 'Contact email matches exactly').toHaveValue(expected);
  }

  async validateSubject(expected: string) {
    await expect(this.subjectInput, 'Contact subject is visible').toBeVisible();
    await expect(this.subjectInput, 'Contact subject matches exactly').toHaveValue(expected);
  }

  async validateMessage(expected: string) {
    await expect(this.messageInput, 'Contact message is visible').toBeVisible();
    await expect(this.messageInput, 'Contact message matches exactly').toHaveValue(expected);
  }

  async validateSuccessMessage(expected: string) {
    await expect(this.successMessage, 'Contact success message is visible').toBeVisible();
    await expect(this.successMessage, 'Complete contact success message matches')
      .toHaveText(expected);
  }
}
