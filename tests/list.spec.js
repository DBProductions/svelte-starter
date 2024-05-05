import { test, expect } from '@playwright/test';

test.describe('List Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://dbproductions.github.io/svelte-starter/')
    })
    test('Click list items', async ({ page }) => {
        page.locator('div.list-container > ul > li:nth-child(2) > div:nth-child(2)').click()

        await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText('Clicked item Rollup Id: 2')
    })
})