import * as monaco from 'monaco-editor';

export interface BenchmarkResult {
    testName: string;
    loadTime: number;
    memoryUsage: number;
    fileSize: number;
    language: string;
    editorOptions: string[];
    success: boolean;
    error?: string;
}

export interface BenchmarkSuite {
    name: string;
    results: BenchmarkResult[];
    summary: {
        averageLoadTime: number;
        totalMemoryUsage: number;
        successRate: number;
        failedTests: string[];
    };
}

export interface ComparisonResult {
    baseline: BenchmarkSuite;
    optimized: BenchmarkSuite;
    improvement: {
        loadTimeImprovement: number;
        memoryImprovement: number;
        overallScore: number;
    };
}

export class MonacoBenchmark {
    private container: HTMLElement;
    private testFiles: { name: string; content: string; language: string }[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.setupTestFiles();
    }

    private setupTestFiles(): void {
        this.testFiles = [
            {
                name: 'large-typescript',
                content: 'a'.repeat(50000),
                language: 'typescript'
            },
            {
                name: 'medium-javascript',
                content: 'b'.repeat(10000),
                language: 'javascript'
            },
            {
                name: 'small-json',
                content: '{"test": "value"}',
                language: 'json'
            }
        ];
    }

    async runBenchmarkSuite(): Promise<BenchmarkSuite> {
        const results: BenchmarkResult[] = [];
        
        for (const testFile of this.testFiles) {
            const result = await this.runSingleBenchmark(testFile);
            results.push(result);
        }

        return this.generateSummary('Performance Benchmark', results);
    }

    private async runSingleBenchmark(testFile: { name: string; content: string; language: string }): Promise<BenchmarkResult> {
        const startTime = performance.now();
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

        try {
            const editor = monaco.editor.create(this.container, {
                value: testFile.content,
                language: testFile.language,
                theme: 'vs-dark',
                minimap: { enabled: false },
                scrollBeyondLastLine: false
            });

            const endTime = performance.now();
            const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

            const result: BenchmarkResult = {
                testName: testFile.name,
                loadTime: endTime - startTime,
                memoryUsage: endMemory - startMemory,
                fileSize: testFile.content.length,
                language: testFile.language,
                editorOptions: ['minimap.enabled: false', 'scrollBeyondLastLine: false'],
                success: true
            };

            editor.dispose();
            return result;
        } catch (error) {
            return {
                testName: testFile.name,
                loadTime: 0,
                memoryUsage: 0,
                fileSize: testFile.content.length,
                language: testFile.language,
                editorOptions: [],
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private generateSummary(name: string, results: BenchmarkResult[]): BenchmarkSuite {
        const successfulResults = results.filter(r => r.success);
        const failedTests = results.filter(r => !r.success).map(r => r.testName);

        return {
            name,
            results,
            summary: {
                averageLoadTime: successfulResults.reduce((sum, r) => sum + r.loadTime, 0) / successfulResults.length || 0,
                totalMemoryUsage: successfulResults.reduce((sum, r) => sum + r.memoryUsage, 0),
                successRate: (successfulResults.length / results.length) * 100,
                failedTests
            }
        };
    }

    async compareConfigurations(): Promise<ComparisonResult> {
        const baseline = await this.runBenchmarkSuite();
        // TODO: Implement optimized configuration comparison
        const optimized = await this.runBenchmarkSuite();

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

    generateReport(suite: BenchmarkSuite): string {
        let report = `# ${suite.name} Report\n\n`;
        
        report += `## Summary\n`;
        report += `- Average Load Time: ${suite.summary.averageLoadTime.toFixed(2)}ms\n`;
        report += `- Total Memory Usage: ${(suite.summary.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
        report += `- Success Rate: ${suite.summary.successRate.toFixed(1)}%\n`;
        
        if (suite.summary.failedTests.length > 0) {
            report += `- Failed Tests: ${suite.summary.failedTests.join(', ')}\n`;
        }
        
        report += `\n## Detailed Results\n\n`;
        
        for (const result of suite.results) {
            report += `### ${result.testName}\n`;
            report += `- Load Time: ${result.loadTime.toFixed(2)}ms\n`;
            report += `- Memory Usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
            report += `- File Size: ${(result.fileSize / 1024).toFixed(2)}KB\n`;
            report += `- Language: ${result.language}\n`;
            report += `- Enabled Options: ${result.editorOptions.join(', ')}\n`;
            report += `- Status: ${result.success ? '✅ Success' : '❌ Failed'}\n`;
            
            if (result.error) {
                report += `- Error: ${result.error}\n`;
            }
            
            report += `\n`;
        }
        
        return report;
    }
}

// Utility function to run a quick benchmark
export async function runQuickBenchmark(container: HTMLElement): Promise<string> {
    const benchmark = new MonacoBenchmark(container);
    const suite = await benchmark.runBenchmarkSuite();
    return benchmark.generateReport(suite);
}

// Utility function to compare configurations
export async function compareMonacoConfigurations(container: HTMLElement): Promise<string> {
    const benchmark = new MonacoBenchmark(container);
    const comparison = await benchmark.compareConfigurations();
    
    let report = `# Monaco Configuration Comparison\n\n`;
    
    report += `## Performance Improvement\n`;
    report += `- Load Time Improvement: ${comparison.improvement.loadTimeImprovement.toFixed(1)}%\n`;
    report += `- Memory Improvement: ${comparison.improvement.memoryImprovement.toFixed(1)}%\n`;
    report += `- Overall Score: ${comparison.improvement.overallScore.toFixed(1)}%\n\n`;
    
    report += `## Baseline Results\n`;
    report += benchmark.generateReport(comparison.baseline);
    
    report += `\n## Optimized Results\n`;
    report += benchmark.generateReport(comparison.optimized);
    
    return report;
}