import { expect, test } from '@playwright/test';

test.afterEach(async ({ page }) => page.unrouteAll({ behavior: 'ignoreErrors' }));

for (const width of [390, 1920]) {
  test(`startup recovers from gateway failures automatically at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1080 });
    let reads = 0;
    let householdReads = 0;
    let readsAtHouseholdStart: number | undefined;
    page.on('request', (request) => {
      if (request.url().includes('/households/')) {
        readsAtHouseholdStart ??= reads;
        householdReads++;
      }
    });
    await page.route('**/api/v1/runtime', (route) => {
      reads++;
      return reads < 3
        ? route.fulfill({ status: 503, contentType: 'text/html', body: 'Fixture unavailable' })
        : route.continue();
    });
    await page.goto('/today');
    await expect(page.getByText('Waiting for Hearth… Retrying automatically.')).toBeVisible();
    expect(householdReads).toBe(0);
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/hearth-startup-recovery-${width}.png` });
    await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible({
      timeout: 10_000,
    });
    // Successful startup enables the normal SSE reconnect refresh; count only the gate.
    expect(readsAtHouseholdStart).toBe(3);
    await expect(page.getByRole('heading', { name: 'Hearth could not start' })).toHaveCount(0);
  });
}

for (const status of [401, 403]) {
  test(`startup does not repeatedly request denied access (${status})`, async ({ page }) => {
    let reads = 0;
    await page.route('**/api/v1/runtime', (route) => {
      reads++;
      return route.fulfill({ status, body: 'Denied fixture' });
    });
    await page.goto('/today');
    await expect(page.getByRole('heading', { name: 'Hearth could not start' })).toBeVisible();
    await page.waitForTimeout(2_500);
    expect(reads).toBe(1);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
}
