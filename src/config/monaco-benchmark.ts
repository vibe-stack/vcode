import * as monaco from 'monaco-editor';
import { MonacoEditorConfig, getMonacoEditorOptions } from './monaco-config';
import { monacoIntegration } from './monaco-integration';

interface BenchmarkResult {
    testName: string;
    loadTime: number;
    memoryUsage: number;
    fileSize: number;
    language: string;
    editorOptions: string[];
    success: boolean;
    error?: string;
}

interface BenchmarkSuite {
    name: string;
    results: BenchmarkResult[];
    summary: {
        averageLoadTime: number;
        totalMemoryUsage: number;
        successRate: number;
        failedTests: string[];
    };
}

export class MonacoBenchmark {
    private container: HTMLElement;
    private testData: Map<string, string> = new Map();

    constructor(container: HTMLElement) {
        this.container = container;
        this.generateTestData();
    }

    private generateTestData(): void {
        // Small JavaScript file
        this.testData.set('small-js', `
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`);

        // Medium TypeScript file
        this.testData.set('medium-ts', `
interface User {
    id: number;
    name: string;
    email: string;
    preferences: {
        theme: 'light' | 'dark';
        notifications: boolean;
    };
}

class UserService {
    private users: User[] = [];
    
    constructor() {
        this.loadUsers();
    }
    
    private async loadUsers(): Promise<void> {
        try {
            const response = await fetch('/api/users');
            this.users = await response.json();
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }
    
    public getUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
    
    public updateUser(id: number, updates: Partial<User>): boolean {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            return true;
        }
        return false;
    }
}

const userService = new UserService();
`.repeat(5));

        // Large JSON file
        const largeJsonData = {
            users: Array.from({ length: 1000 }, (_, i) => ({
                id: i + 1,
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                address: {
                    street: `${i + 1} Main St`,
                    city: 'Anytown',
                    zipCode: `${10000 + i}`
                },
                preferences: {
                    theme: i % 2 === 0 ? 'light' : 'dark',
                    notifications: i % 3 === 0
                }
            }))
        };
        this.testData.set('large-json', JSON.stringify(largeJsonData, null, 2));

        // Very large text file
        const largeText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10000);
        this.testData.set('large-text', largeText);

        // YAML configuration
        this.testData.set('yaml-config', `
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
      
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
      
  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - pgdata:/var/lib/postgresql/data
      
volumes:
  pgdata:
`);
    }

    async runBenchmarkSuite(): Promise<BenchmarkSuite> {
        const results: BenchmarkResult[] = [];
        
        // Test different file sizes and languages
        const testCases = [
            { name: 'Small JavaScript', data: 'small-js', language: 'javascript' },
            { name: 'Medium TypeScript', data: 'medium-ts', language: 'typescript' },
            { name: 'Large JSON', data: 'large-json', language: 'json' },
            { name: 'Large Text', data: 'large-text', language: 'plaintext' },
            { name: 'YAML Config', data: 'yaml-config', language: 'yaml' }
        ];

        // Test different configurations
        const configVariations = [
            { name: 'Default', config: {} },
            { name: 'Performance Optimized', config: { 
                minimap: false, 
                performance: { enableLazyLoading: true, maxFileSize: 1024 * 1024 }
            }},
            { name: 'AI Enabled', config: { 
                ai: { enabled: true, completions: true, codeActions: true }
            }},
            { name: 'Minimal', config: { 
                minimap: false, 
                folding: false, 
                bracketPairColorization: false 
            }}
        ];

        for (const testCase of testCases) {
            for (const configVariation of configVariations) {
                const result = await this.runSingleBenchmark(
                    `${testCase.name} - ${configVariation.name}`,
                    this.testData.get(testCase.data)!,
                    testCase.language,
                    configVariation.config
                );
                results.push(result);
            }
        }

        return this.generateSummary('Monaco Editor Benchmark Suite', results);
    }

    private async runSingleBenchmark(
        testName: string,
        content: string,
        language: string,
        config: Partial<MonacoEditorConfig>
    ): Promise<BenchmarkResult> {
        const fileSize = new Blob([content]).size;
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        try {
            // Clear container
            this.container.innerHTML = '';

            // Create editor with benchmark configuration
            const options = getMonacoEditorOptions(config);
            const editor = monaco.editor.create(this.container, {
                ...options,
                value: content,
                language: language,
                automaticLayout: true
            });

            // Wait for editor to fully load
            await new Promise(resolve => setTimeout(resolve, 100));

            // Measure performance
            const endTime = performance.now();
            const endMemory = this.getMemoryUsage();
            const loadTime = endTime - startTime;
            const memoryUsage = endMemory - startMemory;

            // Get enabled options for reporting
            const editorOptions = this.getEnabledOptions(options);

            // Clean up
            editor.dispose();
            this.container.innerHTML = '';

            return {
                testName,
                loadTime,
                memoryUsage,
                fileSize,
                language,
                editorOptions,
                success: true
            };

        } catch (error) {
            return {
                testName,
                loadTime: 0,
                memoryUsage: 0,
                fileSize,
                language,
                editorOptions: [],
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private getMemoryUsage(): number {
        if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
    }

    private getEnabledOptions(options: monaco.editor.IStandaloneEditorConstructionOptions): string[] {
        const enabledOptions: string[] = [];
        
        if (options.minimap?.enabled) enabledOptions.push('minimap');
        if (options.folding) enabledOptions.push('folding');
        if (options.bracketPairColorization?.enabled) enabledOptions.push('bracketPairColorization');
        if (options.codeLens) enabledOptions.push('codeLens');
        if (options.colorDecorators) enabledOptions.push('colorDecorators');
        if (options.links) enabledOptions.push('links');
        if (options.quickSuggestions) enabledOptions.push('quickSuggestions');
        
        return enabledOptions;
    }

    private generateSummary(name: string, results: BenchmarkResult[]): BenchmarkSuite {
        const successfulResults = results.filter(r => r.success);
        const failedTests = results.filter(r => !r.success).map(r => r.testName);
        
        const averageLoadTime = successfulResults.length > 0 
            ? successfulResults.reduce((sum, r) => sum + r.loadTime, 0) / successfulResults.length
            : 0;
            
        const totalMemoryUsage = successfulResults.reduce((sum, r) => sum + r.memoryUsage, 0);
        const successRate = (successfulResults.length / results.length) * 100;

        return {
            name,
            results,
            summary: {
                averageLoadTime,
                totalMemoryUsage,
                successRate,
                failedTests
            }
        };
    }

    // Performance comparison between old and new configurations
    async compareConfigurations(): Promise<{
        baseline: BenchmarkSuite;
        optimized: BenchmarkSuite;
        improvement: {
            loadTimeImprovement: number;
            memoryImprovement: number;
            overallScore: number;
        };
    }> {
        console.log('Running baseline benchmark...');
        const baseline = await this.runConfigurationBenchmark('Baseline', {});
        
        console.log('Running optimized benchmark...');
        const optimized = await this.runConfigurationBenchmark('Optimized', {
            performance: {
                enableLazyLoading: true,
                maxFileSize: 5 * 1024 * 1024,
                memoryThreshold: 100,
                workerStrategy: 'auto'
            },
            minimap: false,
            ai: {
                enabled: true,
                completions: true,
                codeActions: true,
                hover: true,
                diagnostics: false // Disable for performance
            }
        });

        const loadTimeImprovement = ((baseline.summary.averageLoadTime - optimized.summary.averageLoadTime) / baseline.summary.averageLoadTime) * 100;
        const memoryImprovement = ((baseline.summary.totalMemoryUsage - optimized.summary.totalMemoryUsage) / baseline.summary.totalMemoryUsage) * 100;
        const overallScore = (loadTimeImprovement + memoryImprovement) / 2;

        return {
            baseline,
            optimized,
            improvement: {
                loadTimeImprovement,
                memoryImprovement,
                overallScore
            }
        };
    }

    private async runConfigurationBenchmark(name: string, config: Partial<MonacoEditorConfig>): Promise<BenchmarkSuite> {
        const results: BenchmarkResult[] = [];
        
        const testCases = [
            { name: 'Small JS', data: 'small-js', language: 'javascript' },
            { name: 'Medium TS', data: 'medium-ts', language: 'typescript' },
            { name: 'Large JSON', data: 'large-json', language: 'json' }
        ];

        for (const testCase of testCases) {
            const result = await this.runSingleBenchmark(
                `${name} - ${testCase.name}`,
                this.testData.get(testCase.data)!,
                testCase.language,
                config
            );
            results.push(result);
        }

        return this.generateSummary(name, results);
    }

    // Generate performance report
    generateReport(suite: BenchmarkSuite): string {
        let report = `# ${suite.name} Report\\n\\n`;\n        \n        report += `## Summary\\n`;\n        report += `- Average Load Time: ${suite.summary.averageLoadTime.toFixed(2)}ms\\n`;\n        report += `- Total Memory Usage: ${(suite.summary.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB\\n`;\n        report += `- Success Rate: ${suite.summary.successRate.toFixed(1)}%\\n`;\n        \n        if (suite.summary.failedTests.length > 0) {\n            report += `- Failed Tests: ${suite.summary.failedTests.join(', ')}\\n`;\n        }\n        \n        report += `\\n## Detailed Results\\n\\n`;\n        \n        for (const result of suite.results) {\n            report += `### ${result.testName}\\n`;\n            report += `- Load Time: ${result.loadTime.toFixed(2)}ms\\n`;\n            report += `- Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB\\n`;\n            report += `- File Size: ${(result.fileSize / 1024).toFixed(2)}KB\\n`;\n            report += `- Language: ${result.language}\\n`;\n            report += `- Enabled Options: ${result.editorOptions.join(', ')}\\n`;\n            report += `- Status: ${result.success ? '✅ Success' : '❌ Failed'}\\n`;\n            \n            if (result.error) {\n                report += `- Error: ${result.error}\\n`;\n            }\n            \n            report += `\\n`;\n        }\n        \n        return report;\n    }\n}\n\n// Utility function to run a quick benchmark\nexport async function runQuickBenchmark(container: HTMLElement): Promise<string> {\n    const benchmark = new MonacoBenchmark(container);\n    const suite = await benchmark.runBenchmarkSuite();\n    return benchmark.generateReport(suite);\n}\n\n// Utility function to compare configurations\nexport async function compareMonacoConfigurations(container: HTMLElement): Promise<string> {\n    const benchmark = new MonacoBenchmark(container);\n    const comparison = await benchmark.compareConfigurations();\n    \n    let report = `# Monaco Configuration Comparison\\n\\n`;\n    \n    report += `## Performance Improvement\\n`;\n    report += `- Load Time Improvement: ${comparison.improvement.loadTimeImprovement.toFixed(1)}%\\n`;\n    report += `- Memory Improvement: ${comparison.improvement.memoryImprovement.toFixed(1)}%\\n`;\n    report += `- Overall Score: ${comparison.improvement.overallScore.toFixed(1)}%\\n\\n`;\n    \n    report += `## Baseline Results\\n`;\n    report += benchmark.generateReport(comparison.baseline);\n    \n    report += `\\n## Optimized Results\\n`;\n    report += benchmark.generateReport(comparison.optimized);\n    \n    return report;\n}\n"}}</function_results>

Now let me update the main editor component to use the new enhanced configuration:

<function_calls>
<invoke name="edit_files">
<parameter name="title">Update editor component to use enhanced Monaco configuration
