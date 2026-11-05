import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DEFAULT_MODULE_FLAGS } from '../../packages/shared/src/modules';
const api = 'http://127.0.0.1:4310/api/v1';
const home = `${api}/households/household_hearth_demo`;
const adult = { 'X-Hearth-Demo-Actor': 'member_maya' };
test.beforeEach(async ({ request }) => {
  expect((await request.post(`${api}/demo/reset`)).ok()).toBe(true);
});

test('adult selects a child’s chore; both routines share check/undo and catch up from Chores @a11y', async ({
  page,
  request,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const id of ['morningRoutine', 'afternoonRoutine'])
    expect(
      (
        await request.put(`${home}/modules/${id}`, {
          headers: adult,
          data: { requestId: `enable_${id.toLowerCase()}`, enabled: true },
        })
      ).ok(),
    ).toBe(true);
  const created = await request.post(`${home}/chore-templates`, {
    headers: adult,
    data: {
      requestId: 'create_garden',
      title: 'Water herb garden',
      description: null,
      assigneeIds: ['member_ezra'],
      routineLabel: 'Anytime',
      repeat: 'weekly',
      repeatDays: ['MO', 'WE', 'FR'],
      activeFrom: '2026-08-03',
    },
  });
  expect(created.ok()).toBe(true);
  const templateId = (await created.json()).template.id as string;
  await page.goto('/admin/afternoon-routine');
  await expect(page.getByRole('heading', { name: 'Afternoon Routine', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Use a countdown' })).not.toBeChecked();
  await page.getByLabel('Add chore for Ezra').selectOption(templateId);
  await page.getByRole('button', { name: 'Add step for Ezra' }).click();
  await page.getByRole('textbox', { name: 'Ezra step 2', exact: true }).fill('Put shoes away');
  await page.getByRole('button', { name: 'Save Afternoon Routine' }).click();
  await expect(page.getByText('Afternoon Routine saved.', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('afternoon-editor-phone.png'), fullPage: true });
  const settings = await (
    await request.get(`${home}/afternoon-routine/settings`, { headers: adult })
  ).json();
  expect(
    (
      await request.put(`${home}/morning-routine/settings`, {
        headers: adult,
        data: { requestId: 'morning_shared', expectedRevision: 0, profiles: settings.profiles },
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/afternoon-routine');
  const chore = page.getByRole('button', { name: 'Ezra: Water herb garden', exact: true });
  await expect(chore).toHaveAttribute('aria-pressed', 'false');
  await chore.click();
  await expect(chore).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/morning-routine');
  await expect(chore).toHaveAttribute('aria-pressed', 'true');
  await chore.click();
  await expect(chore).toHaveAttribute('aria-pressed', 'false');
  const overview = await (await request.get(`${home}/morning-routine`)).json();
  const occurrence = overview.people[0].steps.find(
    (step: { choreTemplateId?: string }) => step.choreTemplateId === templateId,
  ).chore.occurrenceId;
  expect(
    (
      await request.post(`${home}/chore-occurrences/${occurrence}/completions`, {
        data: { requestId: 'external_chore_check' },
      })
    ).ok(),
  ).toBe(true);
  await expect(chore).toHaveAttribute('aria-pressed', 'true');
  expect(
    (
      await request.put(`${home}/modules/chores`, {
        headers: adult,
        data: { requestId: 'hide_chores', enabled: false },
      })
    ).ok(),
  ).toBe(true);
  await expect(chore).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ezra: Put shoes away' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    ),
  ).toEqual([]);
});

test('ambiguous linked check retains the exact canonical request for Retry check', async ({
  page,
  request,
}) => {
  for (const id of ['morningRoutine', 'afternoonRoutine'])
    await request.put(`${home}/modules/${id}`, {
      headers: adult,
      data: { requestId: `enable_${id.toLowerCase()}`, enabled: true },
    });
  const template = (
    await (await request.get(`${home}/chore-templates`, { headers: adult })).json()
  ).templates.find((item: { assignees: { id: string }[] }) =>
    item.assignees.some((person) => person.id === 'member_ezra'),
  );
  await request.put(`${home}/afternoon-routine/settings`, {
    headers: adult,
    data: {
      requestId: 'save_retry',
      expectedRevision: 0,
      configuration: {
        startTime: '15:00',
        endTime: '17:00',
        selectedMemberIds: ['member_ezra'],
        routines: [
          {
            memberId: 'member_ezra',
            steps: [{ id: 'step_link', title: 'Linked chore', choreTemplateId: template.id }],
          },
        ],
      },
    },
  });
  const requests: string[] = [];
  await page.route('**/chore-occurrences/*/completions', async (route) => {
    requests.push(route.request().postData()!);
    const response = await route.fetch();
    if (requests.length === 1) await route.abort('failed');
    else {
      expect((await response.json()).replayed).toBe(true);
      await route.fulfill({ response });
    }
  });
  await page.goto('/afternoon-routine');
  await page.getByRole('button', { name: `Ezra: ${template.title}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry check', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry check', exact: true }).click();
  await expect(
    page.getByRole('button', { name: `Ezra: ${template.title}`, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(requests).toHaveLength(2);
  expect(requests[0]).toBe(requests[1]);
});

for (const viewport of [
  { width: 1280, height: 640 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
])
  for (const theme of ['light', 'dark'] as const)
    test(`Afternoon seven steps fit ${viewport.width}x${viewport.height} ${theme} @visual @a11y`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.route('**/api/v1/households/*/modules', (route) =>
        route.fulfill({
          json: {
            householdId: 'household_hearth_demo',
            enabled: { ...DEFAULT_MODULE_FLAGS, afternoonRoutine: true },
          },
        }),
      );
      const titles = [
        'Put shoes away',
        'Unpack school bag',
        'Wash lunch box',
        'Water herb garden',
        'Change clothes',
        'Reading time',
        'Pack for tomorrow',
      ];
      await page.route('**/api/v1/households/*/afternoon-routine', (route) =>
        route.fulfill({
          json: {
            householdId: 'household_hearth_demo',
            generatedAt: '2026-08-03T07:42:00+08:00',
            timezone: 'Australia/Perth',
            localDate: '2026-08-03',
            isWeekday: true,
            profileId: 'schoolDays',
            countdownEnabled: false,
            settingsRevision: 1,
            startTime: '15:00',
            endTime: '17:00',
            people: ['Ari', 'Bo', 'Kai'].map((name, i) => ({
              person: {
                id: `member_${i}`,
                displayName: name,
                color: ['#1668b7', '#3f7251', '#c97900'][i],
                avatarUrl: i === 1 ? '/demo/maya.png' : '/demo/ezra.png',
                role: 'child',
              },
              steps: titles.map((title, j) => ({
                id: `step_${i}_${j}`,
                title,
                isCompleted: false,
                version: 0,
                ...(j === 3
                  ? {
                      choreTemplateId: 'template_garden',
                      chore: { occurrenceId: `occurrence_${i}`, completionId: null, locked: false },
                    }
                  : {}),
              })),
            })),
          },
        }),
      );
      await page.route('**/api/v1/households/*/daily-verse', (route) =>
        route.fulfill({
          json: {
            reference: 'Demo preview',
            text: 'Let kindness shape the way you speak and serve one another today.',
            translation: 'Demo',
            sourceUrl: null,
            freshness: 'current',
            statusMessage: null,
          },
        }),
      );
      await page.goto('/afternoon-routine');
      await expect(
        page.getByRole('heading', { name: 'Afternoon Routine', exact: true }),
      ).toBeVisible();
      await expect(page.locator('.morning-step')).toHaveCount(21);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      for (const avatar of await page.locator('.morning-person__header img').all())
        await expect
          .poll(() => avatar.evaluate((image) => (image as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
      if (viewport.width >= 1200) {
        for (const row of await page.locator('.morning-step').all()) {
          await expect(row).toBeInViewport({ ratio: 1 });
          expect(
            await row.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              const text = el.querySelector(':scope > span:nth-child(2)')!.getBoundingClientRect();
              return rect.height >= 56 && text.bottom <= rect.bottom;
            }),
          ).toBe(true);
        }
        expect(
          await page
            .locator('.app-content')
            .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
        ).toBe(true);
        const first = page.getByRole('button', { name: `Ari: ${titles[0]}`, exact: true });
        await first.focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('.tv-rail :focus')).toHaveCount(1);
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('.morning-screen :focus')).toHaveCount(1);
        const verseCard = page.getByRole('button', { name: 'Read Demo preview' });
        await verseCard.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog', { name: 'Demo preview' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(verseCard).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('.tv-rail :focus')).toHaveCount(1);
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('.morning-screen :focus')).toHaveCount(1);
      }
      expect(
        (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
          ['serious', 'critical'].includes(v.impact ?? ''),
        ),
      ).toEqual([]);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: info.outputPath('afternoon-routine.png'),
        fullPage: viewport.width < 1200,
      });
    });
