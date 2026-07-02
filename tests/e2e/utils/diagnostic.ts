import { Page } from '@playwright/test';

export type DiagnosisType =
  | 'PAGE_NOT_FOUND'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ELEMENT_NOT_FOUND'
  | 'UNKNOWN';

export interface Diagnosis {
  type: DiagnosisType;
  description: string;
  suggestion: string;
  canAutoFix: boolean;
}

export class TestDiagnostic {
  /**
   * Diagnose an error from test failure
   */
  static async diagnose(error: Error, page: Page): Promise<Diagnosis> {
    const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
    const consoleErrors = await this.getConsoleErrors(page);
    const url = page.url();
    const status = await this.getPageStatus(page);

    const errorMessage = error.message.toLowerCase();
    const pageContent = await page.content().catch(() => '');

    // Determine error type
    let type: DiagnosisType = 'UNKNOWN';
    let description = error.message;
    let canAutoFix = false;

    if (errorMessage.includes('404') || pageContent.includes('404') || pageContent.includes('not found')) {
      type = 'PAGE_NOT_FOUND';
      description = `Rota não encontrada: ${url}`;
    } else if (errorMessage.includes('500') || pageContent.includes('500') || pageContent.includes('internal server error')) {
      type = 'SERVER_ERROR';
      description = `Erro interno do servidor em: ${url}`;
    } else if (errorMessage.includes('validation') || errorMessage.includes('required') || pageContent.includes('validation')) {
      type = 'VALIDATION_ERROR';
      description = 'Erro de validação de formulário';
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('login')) {
      type = 'AUTH_ERROR';
      description = 'Erro de autenticação';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      type = 'TIMEOUT';
      description = 'Tempo limite excedido';
    } else if (errorMessage.includes('not visible') || errorMessage.includes('not found') || errorMessage.includes('no element')) {
      type = 'ELEMENT_NOT_FOUND';
      description = 'Elemento não encontrado na página';
    } else if (status >= 400) {
      type = 'SERVER_ERROR';
      description = `HTTP Error ${status} em: ${url}`;
    }

    // Generate suggestion based on type
    const suggestion = this.generateSuggestion(type, url, consoleErrors);

    return {
      type,
      description,
      suggestion,
      canAutoFix: this.canAutoFix(type),
    };
  }

  private static async getConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  private static async getPageStatus(page: Page): Promise<number> {
    try {
      const response = await page.request.get(page.url());
      return response.status();
    } catch {
      return 0;
    }
  }

  private static generateSuggestion(type: DiagnosisType, url: string, consoleErrors: string[]): string {
    switch (type) {
      case 'PAGE_NOT_FOUND':
        return `Criar a rota em src/app${url.replace('http://localhost:3000', '')}/page.tsx`;
      case 'SERVER_ERROR':
        return `Verificar logs do servidor. Erros: ${consoleErrors.slice(0, 3).join(', ')}`;
      case 'VALIDATION_ERROR':
        return 'Verificar validação do formulário e campos obrigatórios';
      case 'AUTH_ERROR':
        return 'Verificar autenticação e permissões do usuário';
      case 'TIMEOUT':
        return 'Aumentar timeout ou verificar conexão com banco de dados';
      case 'ELEMENT_NOT_FOUND':
        return 'Verificar seletor CSS ou adicionar data-testid ao elemento';
      default:
        return 'Investigação manual necessária';
    }
  }

  private static canAutoFix(type: DiagnosisType): boolean {
    const autoFixable: DiagnosisType[] = ['ELEMENT_NOT_FOUND'];
    return autoFixable.includes(type);
  }
}
