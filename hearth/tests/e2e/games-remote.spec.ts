import { expect, test } from '@playwright/test';

test('remote-only More to Games finds a group and Back restores Games in the menu', async ({
  page,
  request,
}) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/more');
  await expect(page.locator('[data-focus-id="more-reminders"]')).toBeFocused();
  for (let index = 0; index < 5; index++) await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="more-games"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.locator('[data-focus-id="games-connections"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/games\/connections$/);
  await expect(page.locator('[data-focus-id="games-word-0"]')).toBeFocused();
  for (let index = 0; index < 4; index++) {
    await page.keyboard.press('Enter');
    if (index < 3) await page.keyboard.press('ArrowDown');
  }
  await expect(page.locator('.games-word[aria-pressed="true"]')).toHaveCount(4);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-focus-id="games-shuffle"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-focus-id="games-submit"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.games-group')).toHaveCount(1);
  await expect(page.locator('[data-focus-id="games-word-1"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.locator('[data-focus-id="games-connections"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/more$/);
  await expect(page.locator('[data-focus-id="more-games"]')).toBeFocused();
});
