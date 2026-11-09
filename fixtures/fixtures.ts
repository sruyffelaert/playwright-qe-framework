import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ blockAds: void }>({
    blockAds: [async ({ context }, use) => {
        await context.route(
            /googleads|doubleclick\.net|googlesyndication\.com|googletagservices\.com/i,
        route => route.abort()
    );

    context.on('dialog', dialog => {
        console.error(`Dialog detected: ${dialog.message()}`);
    });

    await use();
        
    }, { auto: true }]
});

export { expect };