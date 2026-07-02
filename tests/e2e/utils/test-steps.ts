import { Page } from '@playwright/test';

export class TestSteps {
  /**
   * Navigate to a page and wait for it to load
   */
  static async navigateTo(page: Page, path: string): Promise<void> {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a grid/list to load
   */
  static async waitForGridLoad(page: Page, selector = '[data-testid="data-grid"], table, [role="grid"]'): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout: 10000 }).catch(() => {
      // If no grid found, just wait for content
      page.waitForLoadState('domcontentloaded');
    });
  }

  /**
   * Click a button by text or testid
   */
  static async clickButton(page: Page, text: string): Promise<void> {
    const button = page.getByRole('button', { name: new RegExp(text, 'i') })
      .or(page.locator(`[data-testid="${text}"]`))
      .or(page.locator(`button:has-text("${text}")`));
    await button.click();
  }

  /**
   * Fill a form field
   */
  static async fillField(page: Page, label: string, value: string): Promise<void> {
    const input = page.getByLabel(new RegExp(label, 'i'))
      .or(page.locator(`[data-testid="${label}"]`))
      .or(page.locator(`input[name="${label}"], input[id="${label}"]`));
    await input.fill(value);
  }

  /**
   * Select an option in a dropdown
   */
  static async selectOption(page: Page, label: string, value: string): Promise<void> {
    const select = page.getByLabel(new RegExp(label, 'i'))
      .or(page.locator(`select[name="${label}"]`));
    await select.selectOption(value);
  }

  /**
   * Submit a form
   */
  static async submitForm(page: Page, buttonText = 'Salvar'): Promise<void> {
    await this.clickButton(page, buttonText);
    await page.waitForLoadState('networkidle');
  }

  /**
   * Verify success message appears
   */
  static async verifySuccess(page: Page, message: string): Promise<void> {
    const successEl = page.locator(`text=${message}`, { hasText: message })
      .or(page.locator('[data-testid="success-message"]', { hasText: message }));
    await expect(successEl).toBeVisible();
  }

  /**
   * Verify error message appears
   */
  static async verifyError(page: Page, message: string): Promise<void> {
    const errorEl = page.locator(`text=${message}`, { hasText: message })
      .or(page.locator('[data-testid="error-message"]', { hasText: message }))
      .or(page.locator('[role="alert"]', { hasText: message }));
    await expect(errorEl).toBeVisible();
  }

  /**
   * Login as a user
   */
  static async login(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Fill form
    await page.locator('input[name="email"], input[type="email"]').fill(email);
    await page.locator('input[name="password"], input[type="password"]').fill(password);

    // Click login button
    await page.locator('button[type="submit"], button:has-text("Entrar")').click();

    // Wait for either success (redirect) or error
    try {
      // Wait for navigation to authenticated pages
      await page.waitForURL(/\/(dashboard|master|escritorio|admin)/, { timeout: 10000 });
    } catch {
      // Check for error message
      const errorAlert = page.locator('[role="alert"], .error, [data-testid="error"]');
      if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorAlert.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }
      // If no error visible, maybe already logged in - check current URL
      const url = page.url();
      if (!url.includes('/login')) {
        return; // Success - we're on another page
      }
      throw new Error(`Login timeout - still on: ${url}`);
    }
  }

  /**
   * Logout
   */
  static async logout(page: Page): Promise<void> {
    try {
      const selectors = [
        '[data-testid="user-menu"]',
        '[data-testid="avatar"]',
        '[data-testid="user-avatar"]',
      ];

      for (const selector of selectors) {
        const el = page.locator(selector);
        if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
          await el.first().click();
          await page.waitForTimeout(300);
          break;
        }
      }

      const sairBtn = page.locator('button:has-text("Sair"), a:has-text("Sair"), [href="/login"]');
      if (await sairBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sairBtn.first().click();
        await page.waitForURL('**/login**', { timeout: 3000 }).catch(() => {});
      }
    } catch {
      await page.goto('/login').catch(() => {});
    }
  }

  /**
   * Take a screenshot
   */
  static async screenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({ path: `tests/e2e/reports/screenshots/${name}.png`, fullPage: true });
  }
}

import { expect } from '@playwright/test';
