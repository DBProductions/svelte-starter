import { test, expect } from '@playwright/test';

test.describe('Content Editable Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://dbproductions.github.io/svelte-starter/')
    })
    test.skip('Content editable', async ({ page }) => {
        page.locator('div.contentBox').click()

        page.locator('div.contentBox').fill('Content Edit')
        await expect(page.locator('div.contentBox')).toHaveText('Content Edit')
    })
})