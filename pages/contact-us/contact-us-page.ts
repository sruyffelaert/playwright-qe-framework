import { expect, type Locator, type Page } from '@playwright/test';

export class ContactUsPage {
  private readonly page: Page;
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
    this.heading = page.getByRole('heading', { name: 'Contact Us', exact: true });
    this.nameInput = page.getByRole('textbox', { name: 'Name', exact: true });
    this.emailInput = page.getByRole('textbox', { name: 'Email', exact: true });
    this.subjectInput = page.getByRole('textbox', { name: 'Subject', exact: true });
    this.messageInput = page.getByRole('textbox', { name: 'Your Message Here', exact: true });
    this.fileInput = page.getByRole('button', { name: 'Choose File', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Submit', exact: true });
    this.successMessage = page.locator('.status').and(page.locator('.alert-success'));
  }

  /** Verifies the title and the original contact form's document-load contract. */
  async assertLoaded() {
    await this.page.waitForLoadState('load');
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText('Contact Us');
  }

  async fillName(value: string) {
    await this.nameInput.fill(value);
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async fillSubject(value: string) {
    await this.subjectInput.fill(value);
  }

  async fillMessage(value: string) {
    await this.messageInput.fill(value);
  }

  async uploadAttachment(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /** Validates this submission's confirmation before accepting it. */
  async clickSubmitAndAcceptConfirmation() {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout: 5000 });
    const clickPromise = this.submitButton.click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toBe('Press OK to proceed!');
    expect(dialog.type()).toBe('confirm');

    await dialog.accept();
    await clickPromise;
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
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toHaveText(expected);
  }

  async validateName(expected: string) {
    await expect(this.nameInput).toBeVisible();
    await expect(this.nameInput).toHaveValue(expected);
  }

  async validateEmail(expected: string) {
    await expect(this.emailInput).toBeVisible();
    await expect(this.emailInput).toHaveValue(expected);
  }

  async validateSubject(expected: string) {
    await expect(this.subjectInput).toBeVisible();
    await expect(this.subjectInput).toHaveValue(expected);
  }

  async validateMessage(expected: string) {
    await expect(this.messageInput).toBeVisible();
    await expect(this.messageInput).toHaveValue(expected);
  }

  async validateSuccessMessage(expected: string) {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toHaveText(expected);
  }
}
