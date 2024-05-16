import { test, expect } from '@playwright/test'

test.describe('List Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://dbproductions.github.io/svelte-starter/')
  })
  test('Click list items', async ({ page }) => {
    await expect(
      page.locator('div.list-container > ul > li:nth-child(2)')
    ).not.toHaveClass(/active/)
    await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText(
      'Svelte-Starter'
    )

    page
      .locator('div.list-container > ul > li:nth-child(2) > div:nth-child(2)')
      .click()

    await expect(
      page.locator('div.list-container > ul > li:nth-child(2)')
    ).toHaveClass(/active/)
    await expect(page.locator('#container > div:nth-child(1) > h1')).toHaveText(
      'Clicked item Rollup Id: 2'
    )
  })
  test('Click to edit list item', async ({ page }) => {
    page
      .locator('div.list-container > ul > li:nth-child(2) > div:nth-child(1)')
      .click()
    await expect(
      page.locator('#modalForm > div:nth-child(2) > input')
    ).toHaveValue('Rollup')

    page.locator('#modalForm > button.sendBtn').click()
    await expect(page.locator('#modalForm')).toBeHidden()
  })
})
