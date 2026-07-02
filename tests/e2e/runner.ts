#!/usr/bin/env node
/**
 * Test Runner - Executa os testes E2E seguindo o roteiro manual
 *
 * Uso:
 *   npm run test:e2e           # Executa todos os testes
 *   npm run test:e2e:master    # Executa só Master
 *   npm run test:e2e:watch     # Modo watch
 *   npm run test:e2e:debug     # Debug com UI
 */

import { spawn } from 'child_process';
import * as path from 'path';

const SPECS_DIR = path.join(__dirname, '../specs');

// Mapeamento de módulos para arquivos de spec
const MODULE_SPECS: Record<string, string[]> = {
  master: ['master.spec.ts'],
  admin: ['admin.spec.ts'],
  escritorio: ['escritorio.spec.ts'],
  auth: ['auth.spec.ts'],
  dashboard: ['dashboard.spec.ts'],
  security: ['security.spec.ts'],
  all: Object.values(MODULE_SPECS).flat(),
};

interface RunnerOptions {
  module?: string;
  grep?: string;
  headed?: boolean;
  debug?: boolean;
  ui?: boolean;
  updateSnapshots?: boolean;
}

class TestRunner {
  private projectRoot: string;

  constructor() {
    this.projectRoot = path.join(__dirname, '../../..');
  }

  async run(options: RunnerOptions = {}): Promise<number> {
    const {
      module = 'all',
      grep,
      headed = false,
      debug = false,
      ui = false,
      updateSnapshots = false,
    } = options;

    // Build Playwright arguments
    const args: string[] = ['playwright', 'test'];

    // Add specs based on module
    if (module !== 'all' && MODULE_SPECS[module]) {
      MODULE_SPECS[module].forEach(spec => {
        args.push(path.join(SPECS_DIR, spec));
      });
    }

    // Add grep filter
    if (grep) {
      args.push('--grep', grep);
    }

    // Add flags
    if (headed) {
      args.push('--headed');
    }

    if (debug) {
      args.push('--debug');
    }

    if (ui) {
      args.push('--ui');
    }

    if (updateSnapshots) {
      args.push('--update-snapshots');
    }

    // Add reporter
    args.push('--reporter', 'list,html');

    console.log(`\n🚀 Running: ${args.join(' ')}\n`);

    // Run Playwright
    return new Promise((resolve) => {
      const proc = spawn('npx', args, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        shell: true,
      });

      proc.on('close', (code) => {
        resolve(code || 0);
      });

      proc.on('error', (err) => {
        console.error('Error running tests:', err);
        resolve(1);
      });
    });
  }

  /**
   * Report test results
   */
  async report(): Promise<void> {
    console.log('\n📊 Generating report...\n');

    // Import and run the reporter
    const { ProgressReporter } = await import('./progress-report');
    const reporter = new (ProgressReporter as any)();
    reporter.generate();
  }
}

// CLI parsing
const args = process.argv.slice(2);
const options: RunnerOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '--module':
    case '-m':
      options.module = args[++i];
      break;
    case '--grep':
    case '-g':
      options.grep = args[++i];
      break;
    case '--headed':
      options.headed = true;
      break;
    case '--debug':
      options.debug = true;
      break;
    case '--ui':
      options.ui = true;
      break;
    case '--update-snapshots':
      options.updateSnapshots = true;
      break;
    case 'master':
    case 'admin':
    case 'escritorio':
    case 'auth':
    case 'dashboard':
    case 'security':
      options.module = arg;
      break;
    case 'report':
      // Special command to generate report
      const { ProgressReporter } = await import('./progress-report');
      const reporter = new (ProgressReporter as any)();
      reporter.generate();
      process.exit(0);
    default:
      if (!arg.startsWith('-')) {
        options.module = arg;
      }
  }
}

// Run tests
const runner = new TestRunner();
runner.run(options).then((exitCode) => {
  process.exit(exitCode);
});
