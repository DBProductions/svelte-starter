import { test, expect } from '@playwright/test';

test.describe('Table Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://dbproductions.github.io/svelte-starter/')
    })

    test('Click table row', async ({ page }) => {
        page.locator('table.tbl > tbody > tr:nth-child(2)').click()
        await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText('Clicked item Rollup Id: 2')

        page.locator('table.tbl > tbody > tr:nth-child(1)').click()
        await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText('Clicked item Svelte Id: 1')

        page.locator('table.tbl > tbody > tr:nth-child(3)').click()
        await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText('Clicked item Cypress Id: 3')
    })
    test('Sort table', async ({ page }) => {
        page.locator('table.tbl > thead > tr > th:nth-child(1)').click()

        await expect(page.locator('table.tbl > tbody > tr:nth-child(1) > td:nth-child(2)')).toHaveText('Svelte')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(2) > td:nth-child(2)')).toHaveText('Rollup')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(3) > td:nth-child(2)')).toHaveText('Cypress')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(4) > td:nth-child(2)')).toHaveText('Prettier')

        page.locator('table.tbl > thead > tr > th:nth-child(2)').click()

        await expect(page.locator('table.tbl > tbody > tr:nth-child(1) > td:nth-child(2)')).toHaveText('Cypress')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(2) > td:nth-child(2)')).toHaveText('Prettier')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(3) > td:nth-child(2)')).toHaveText('Rollup')
        await expect(page.locator('table.tbl > tbody > tr:nth-child(4) > td:nth-child(2)')).toHaveText('Svelte')
    })
})