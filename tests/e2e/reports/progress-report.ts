import * as fs from 'fs';
import * as path from 'path';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  duration: number;
}

export interface ProgressReport {
  generatedAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: Record<string, { total: number; passed: number; failed: number }>;
  bugs: BugReport[];
  suites: SuiteResult[];
}

export interface BugReport {
  id: string;
  module: string;
  testName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'fixed' | 'wontfix';
  createdAt: string;
}

class ProgressReporter {
  private reportsDir = path.join(__dirname, '../reports');
  private resultsFile = path.join(this.reportsDir, 'results.json');
  private bugsFile = path.join(this.reportsDir, 'bugs.json');

  constructor() {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate progress report from test results
   */
  generate(): ProgressReport {
    const results = this.loadResults();
    const bugs = this.loadBugs();

    const suiteCoverage = this.calculateSuiteCoverage(results);
    const summary = this.calculateSummary(results);

    const report: ProgressReport = {
      generatedAt: new Date().toISOString(),
      totalTests: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      coverage: suiteCoverage,
      bugs,
      suites: results,
    };

    this.saveReport(report);
    this.printReport(report);

    return report;
  }

  /**
   * Add a bug report
   */
  addBug(bug: Omit<BugReport, 'id' | 'createdAt'>): string {
    const bugs = this.loadBugs();
    const id = `BUG-${String(bugs.length + 1).padStart(3, '0')}`;

    bugs.push({
      ...bug,
      id,
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(this.bugsFile, JSON.stringify(bugs, null, 2));
    return id;
  }

  /**
   * Update bug status
   */
  updateBug(id: string, status: BugReport['status']): void {
    const bugs = this.loadBugs();
    const bug = bugs.find(b => b.id === id);
    if (bug) {
      bug.status = status;
      fs.writeFileSync(this.bugsFile, JSON.stringify(bugs, null, 2));
    }
  }

  private loadResults(): SuiteResult[] {
    try {
      if (fs.existsSync(this.resultsFile)) {
        const data = JSON.parse(fs.readFileSync(this.resultsFile, 'utf-8'));
        return this.parseResults(data);
      }
    } catch (e) {
      console.error('Error loading results:', e);
    }
    return [];
  }

  private parseResults(data: unknown): SuiteResult[] {
    if (!data || typeof data !== 'object') return [];

    // Handle different Playwright report formats
    const suites: SuiteResult[] = [];

    if (Array.isArray(data)) {
      data.forEach((item: unknown) => {
        if (item && typeof item === 'object' && 'specs' in item) {
          const spec = item as Record<string, unknown>;
          suites.push({
            name: String(spec.title || 'Unknown Suite'),
            tests: this.parseTests(spec.specs as unknown[]),
            duration: 0,
          });
        }
      });
    }

    return suites;
  }

  private parseTests(specs: unknown[]): TestResult[] {
    if (!Array.isArray(specs)) return [];

    return specs.flatMap((spec: unknown) => {
      if (!spec || typeof spec !== 'object') return [];
      const s = spec as Record<string, unknown>;
      if (!Array.isArray(s.tests)) return [];

      return s.tests.map((test: unknown) => {
        if (!test || typeof test !== 'object') {
          return { name: 'Unknown', status: 'skipped' as const, duration: 0 };
        }
        const t = test as Record<string, unknown>;
        return {
          name: String(t.title || 'Unknown Test'),
          status: t.status === 'passed' ? 'passed' : t.status === 'failed' ? 'failed' : 'skipped',
          duration: Number(t.duration || 0),
          error: t.errors?.toString(),
        };
      });
    });
  }

  private loadBugs(): BugReport[] {
    try {
      if (fs.existsSync(this.bugsFile)) {
        return JSON.parse(fs.readFileSync(this.bugsFile, 'utf-8'));
      }
    } catch (e) {
      console.error('Error loading bugs:', e);
    }
    return [];
  }

  private calculateSuiteCoverage(results: SuiteResult[]): Record<string, { total: number; passed: number; failed: number }> {
    const coverage: Record<string, { total: number; passed: number; failed: number }> = {};

    results.forEach(suite => {
      const moduleName = this.extractModuleName(suite.name);
      if (!coverage[moduleName]) {
        coverage[moduleName] = { total: 0, passed: 0, failed: 0 };
      }

      coverage[moduleName].total += suite.tests.length;
      coverage[moduleName].passed += suite.tests.filter(t => t.status === 'passed').length;
      coverage[moduleName].failed += suite.tests.filter(t => t.status === 'failed').length;
    });

    return coverage;
  }

  private extractModuleName(suiteName: string): string {
    // Extract module name from suite title
    // e.g., "1. MASTER - Base do Sistema" -> "master"
    const match = suiteName.match(/(\d+)\.\s*(\w+)/);
    if (match) {
      return match[2].toLowerCase();
    }
    return suiteName.split(' ')[0].toLowerCase();
  }

  private calculateSummary(results: SuiteResult[]) {
    let total = 0, passed = 0, failed = 0, skipped = 0;

    results.forEach(suite => {
      total += suite.tests.length;
      passed += suite.tests.filter(t => t.status === 'passed').length;
      failed += suite.tests.filter(t => t.status === 'failed').length;
      skipped += suite.tests.filter(t => t.status === 'skipped').length;
    });

    return { total, passed, failed, skipped };
  }

  private saveReport(report: ProgressReport): void {
    const reportFile = path.join(this.reportsDir, 'progress-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }

  private printReport(report: ProgressReport): void {
    console.log('\n📊 PROGRESS REPORT\n');
    console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
    console.log('─'.repeat(50));
    console.log(`Total: ${report.totalTests} | ✅ Passed: ${report.passed} | ❌ Failed: ${report.failed} | ⏭️  Skipped: ${report.skipped}`);
    console.log('─'.repeat(50));
    console.log('\n📈 Coverage by Module:\n');

    const modules = ['master', 'admin', 'escritorio', 'auth', 'dashboard', 'security'];
    modules.forEach(module => {
      const coverage = report.coverage[module];
      if (coverage) {
        const pct = coverage.total > 0 ? Math.round((coverage.passed / coverage.total) * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        console.log(`  ${module.padEnd(12)} ${bar} ${pct}% (${coverage.passed}/${coverage.total})`);
      }
    });

    if (report.bugs.length > 0) {
      console.log('\n🐛 Open Bugs:\n');
      report.bugs.filter(b => b.status === 'open').forEach(bug => {
        console.log(`  [${bug.id}] ${bug.module}: ${bug.testName}`);
        console.log(`         Severity: ${bug.severity}`);
        console.log(`         ${bug.description}`);
      });
    }

    console.log('\n');
  }
}

// CLI execution
const reporter = new ProgressReporter();
reporter.generate();
