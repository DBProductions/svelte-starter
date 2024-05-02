import { test, expect } from '@playwright/test';

test.describe('Radio Boxes Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:10001')
    })
    test('Click radio boxes', async ({ page }) => {
        page.locator('#A').click()
        await expect(page.locator('div.selection-container > div:nth-child(2)')).toHaveText('The user selected A.\n    This is the selection A.It shows the information for A.')

        page.locator('#B').click()
        await expect(page.locator('div.selection-container > div:nth-child(2)')).toHaveText('The user selected B.\n    This is the selection B.It shows the information for B.')

        page.locator('#C').click()
        await expect(page.locator('div.selection-container > div:nth-child(2)')).toHaveText('The user selected C.\n    This is the selection C.It shows the information for C.')
    })
})