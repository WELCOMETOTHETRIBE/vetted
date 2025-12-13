import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.locator('h2')).toContainText('Sign in to Vetted')
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.click('text=create a new account')
    await expect(page).toHaveURL(/.*auth\/signup/)
  })
})


