import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4310/api/v1/demo/reset');
});

test('the requested reset starts at puzzle one and clears only legacy game progress', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'hearth.word-groups.v1.demo.household_hearth_demo',
      JSON.stringify({
        version: 1,
        entries: [
          {
            id: 'word_groups_demo_3',
            progress: { attempts: [[0, 4, 8, 12]], order: Array.from({ length: 16 }, (_, i) => i) },
          },
        ],
      }),
    );
    localStorage.setItem('unrelated-preference', 'keep');
  });
  await page.goto('/games/connections');
  await expect(page.locator('.games-word')).toHaveCount(16);
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await expect(page.getByRole('button', { name: 'Earlier puzzle' })).toBeDisabled();
  await expect(page.locator('.games-group')).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem('hearth.word-groups.v1.demo.household_hearth_demo'),
    ),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated-preference'))).toBe('keep');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('0 completed');
  await expect(page.locator('.games-archive-list button').first()).toContainText('#1');
});

test('completion survives reopen and replay; advancing to the next puzzle is explicit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/connections');
  await expect(page.locator('.games-word')).toHaveCount(16);
  for (const words of [
    ['COVER', 'SPINE', 'INDEX', 'CHAPTER'],
    ['BATH', 'CURTAIN', 'CARD', 'BREATH'],
    ['SALES', 'MUSICAL', 'BASEBALL', 'ROOF'],
    ['TRAFFIC', 'SPOT', 'DAY', 'FLASH'],
  ]) {
    for (const word of words) await page.getByRole('button', { name: word, exact: true }).click();
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next puzzle' })).toBeFocused();
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('[data-focus-id="games-choose-1"]')).toContainText('Completed');
  await expect(page.getByRole('dialog')).toContainText('1 completed');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await expect(page.getByRole('button', { name: 'Next puzzle' })).toBeFocused();
  await page.getByRole('button', { name: 'Next puzzle' }).click();
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await page.getByRole('button', { name: 'Earlier puzzle' }).click();
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.games-word')).toHaveCount(16);
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('[data-focus-id="games-choose-1"]')).toContainText('Completed');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await expect(page.locator('.games-word')).toHaveCount(16);
  await page.getByRole('button', { name: 'Later puzzle' }).click();
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await page.goto('/today');
  await page.goto('/games/connections');
  await expect(page.locator('.games-toolbar')).toContainText('#2');
  await page.getByRole('button', { name: 'Earlier puzzle' }).click();
  await expect(page.locator('.games-toolbar')).toContainText('#1');
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.locator('[data-focus-id="games-choose-1"]')).toContainText('Completed');
  const pagination = await page.locator('.games-archive-pages').evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const label = element.querySelector('span')!.getBoundingClientRect();
    return { width: bounds.width, scrollWidth: element.scrollWidth, labelHeight: label.height };
  });
  expect(pagination.scrollWidth).toBeLessThanOrEqual(Math.ceil(pagination.width));
  expect(pagination.labelHeight).toBeLessThan(30);
  await page.screenshot({ path: '/tmp/hearth-games-completion-phone.png' });
});
