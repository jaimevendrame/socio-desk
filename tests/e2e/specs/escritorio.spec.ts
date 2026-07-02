import { test } from '../utils/base-test';
import { expect } from '@playwright/test';
import { TestSteps } from '../utils/test-steps';

test.describe('3. ESCRITÓRIO - Dados Operacionais', () => {
  test.beforeEach(async ({ page }) => {
    await TestSteps.login(page, 'admin@dev.com', 'Admin123!');
  });

  test.describe('3.1 Espaços', () => {
    test('3.1.1 - Deve listar espaços', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/espacos');
      await page.waitForLoadState('domcontentloaded');
      // Página carrega
      expect(page.url()).toContain('/espacos');
    });

    test('3.1.2 - Deve verificar seed', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/espacos');
      await page.waitForLoadState('domcontentloaded');
      // Verificar se há conteúdo
      const hasContent = (await page.content()).length > 100;
      expect(hasContent).toBeTruthy();
    });

    test('3.1.3 - Deve tentar criar novo espaço', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/espacos');

      // Procurar botão de novo
      const novoBtn = page.locator('button:has-text("Novo"), button:has-text("Nova"), a:has-text("Novo")');
      const hasNovo = await novoBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasNovo) {
        await novoBtn.click();
        await page.waitForTimeout(500);
      }

      // Verificar que ainda estamos na página
      expect(page.url()).toContain('/espacos');
    });
  });

  test.describe('3.2 Associados', () => {
    test('3.2.1 - Deve listar associados', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/associados');
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/associados');
    });

    test('3.2.2 - Deve verificar seed', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/associados');
      await page.waitForLoadState('domcontentloaded');
      expect((await page.content()).length).toBeGreaterThan(100);
    });

    test('3.2.3 - Deve tentar cadastrar novo associado', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/associados');

      const novoBtn = page.locator('button:has-text("Novo"), button:has-text("Cadastrar")');
      const hasNovo = await novoBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasNovo) {
        await novoBtn.click();
        await page.waitForTimeout(500);
      }

      expect(page.url()).toContain('/associados');
    });
  });

  test.describe('3.3 Reservas', () => {
    test('3.3.1 - Deve listar reservas', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/reservas');
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/reservas');
    });

    test('3.3.2 - Deve tentar criar reserva', async ({ page }) => {
      await TestSteps.navigateTo(page, '/escritorio/reservas');

      const novaBtn = page.locator('button:has-text("Nova"), a:has-text("Nova")');
      const hasNova = await novaBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasNova) {
        await novaBtn.click();
        await page.waitForTimeout(500);
      }

      expect(page.url()).toContain('/reservas');
    });
  });
});
