import { test, expect } from '@playwright/test';

test.describe('Modal Component', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:10001')
    })
    test.skip('Open and close modal dialog', async ({ page }) => {
        page.locator('#modalDialog').click()

        //await expect(page.locator("text=modal title")).toBeVisible()

        page.locator('#modalCloseBtn').click()

        //await expect(page.locator("text=modal title")).toBeHidden()

        page.locator('#modalDialog').click()

        page.locator('div.modal-background').click()
    })
})