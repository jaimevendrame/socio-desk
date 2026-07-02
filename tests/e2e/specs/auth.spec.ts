import { test } from '../utils/base-test';
import { expect } from '@playwright/test';
import { TestSteps } from '../utils/test-steps';

test.describe('4. AUTENTICAÇÃO', () => {
  test.describe('4.1 Registro de Novo Usuário', () => {
    test('4.1.1 - Deve carregar formulário de registro', async ({ page }) => {
      await TestSteps.navigateTo(page, '/register');
      await page.waitForLoadState('domcontentloaded');

      const hasForm = await page.locator('form, input').count() > 0;
      expect(hasForm).toBeTruthy();
    });

    test('4.1.2 - Deve aceitar entrada nos campos', async ({ page }) => {
      await TestSteps.navigateTo(page, '/register');

      const nameInput = page.locator('input[name="name"], input[id="name"], input[placeholder*="nome" i]');

      if (await nameInput.isVisible()) {
        await nameInput.fill('Usuário Teste');
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toContain('Usuário');
      }
    });
  });

  test.describe('4.2 Login', () => {
    test('4.2.1 - Deve carregar formulário de login', async ({ page }) => {
      await TestSteps.navigateTo(page, '/login');
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    });

    test('4.2.2 - Deve permanecer na página com credenciais inválidas', async ({ page }) => {
      await TestSteps.navigateTo(page, '/login');

      await page.locator('input[name="email"], input[type="email"]').fill('invalid@test.com');
      await page.locator('input[name="password"], input[type="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1500);

      const isOnLogin = page.url().includes('/login');
      expect(isOnLogin).toBeTruthy();
    });

    test('4.2.3 - Deve autenticar com credenciais válidas', async ({ page }) => {
      await TestSteps.login(page, 'admin@dev.com', 'Admin123!');
      const url = page.url();
      expect(url).not.toContain('/login');
    });
  });

  test.describe('4.3 Sessão', () => {
    test('4.3.1 - Deve manter sessão após navegação', async ({ page }) => {
      await TestSteps.login(page, 'admin@dev.com', 'Admin123!');
      await page.goto('/escritorio/associados');
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/login');
    });
  });
});
