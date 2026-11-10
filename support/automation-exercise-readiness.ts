import type { Page } from '@playwright/test';

/**
 * Automation Exercise uses jQuery ready handlers rather than an application-ready
 * marker. Wait for document assets and a queued ready callback before interacting.
 * This covers initial handler registration, not completion of subsequent AJAX
 * operations; their owning objects must wait for the resulting UI separately.
 */
export async function waitForAutomationExerciseReady(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => {
    const applicationWindow = window as typeof window & {
      jQuery?: { isReady?: boolean };
    };
    return applicationWindow.jQuery?.isReady === true;
  });
  await page.evaluate(() => new Promise<void>(resolve => {
    const applicationWindow = window as typeof window & {
      jQuery: (callback: () => void) => void;
    };
    applicationWindow.jQuery(() => resolve());
  }));
}
