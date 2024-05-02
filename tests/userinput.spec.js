import { test, expect } from '@playwright/test';

test.describe('User Input Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://dbproductions.github.io/svelte-starter/')
    })
    test('User input', async ({ page }) => {
        await expect(page.locator('div.user-input > input')).toHaveValue('')
        await expect(page.locator('div.user-input > span')).toHaveText('')

        page.locator('div.user-input > input').fill('User Input')

        await expect(page.locator('div.user-input > input')).toHaveValue('User Input')
        await expect(page.locator('div.user-input > span')).toHaveText('User Input')
    })
})