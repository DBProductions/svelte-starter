import { test, expect } from '@playwright/test'

test.describe('Modal Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://dbproductions.github.io/svelte-starter/')
  })
  test.skip('Open and close modal dialog', async ({ page }) => {
    await expect(page.locator('#modalForm')).toBeHidden()
    page.locator('#modalDialogBtn').click()

    await expect(page.locator('#modalDialog')).toBeVisible()

    page.locator('#modalCloseBtn').click()

    await expect(page.locator('#modalForm')).toBeHidden()

    page.locator('#modalDialogBtn').click()

    await expect(page.locator('#modalForm')).toBeVisible()

    page.locator('div.modal-background').click()

    await expect(page.locator('#modalForm')).toBeHidden()
  })
})
