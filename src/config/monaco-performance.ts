interface PerformanceMetrics {
    loadTime: number;
    memoryUsage: number;
    fileSize: number;
    language: string;
    timestamp: number;
}

interface EditorPerformanceData {
    editorId: string;
    metrics: PerformanceMetrics[];
    totalMemory: number;
    averageLoadTime: number;
}

class MonacoPerformanceMonitor {
    private static instance: MonacoPerformanceMonitor;
    private performanceData: Map<string, EditorPerformanceData> = new Map();
    private memoryThreshold: number = 100 * 1024 * 1024; // 100MB
    private loadTimeThreshold: number = 1000; // 1 second

    static getInstance(): MonacoPerformanceMonitor {
        if (!MonacoPerformanceMonitor.instance) {
            MonacoPerformanceMonitor.instance = new MonacoPerformanceMonitor();
        }
        return MonacoPerformanceMonitor.instance;
    }

    // Track editor initialization performance
    trackEditorLoad(editorId: string, fileSize: number, language: string): () => void {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        return () => {
            const endTime = performance.now();
            const endMemory = this.getMemoryUsage();
            
            const loadTime = endTime - startTime;
            const memoryUsage = endMemory - startMemory;

            this.recordMetrics(editorId, {
                loadTime,
                memoryUsage,
                fileSize,
                language,
                timestamp: Date.now()
            });

            // Check for performance issues
            this.checkPerformanceThresholds(editorId, loadTime, memoryUsage);
        };
    }

    // Record performance metrics
    private recordMetrics(editorId: string, metrics: PerformanceMetrics): void {
        if (!this.performanceData.has(editorId)) {
            this.performanceData.set(editorId, {
                editorId,
                metrics: [],
                totalMemory: 0,
                averageLoadTime: 0
            });
        }

        const editorData = this.performanceData.get(editorId)!;
        editorData.metrics.push(metrics);
        
        // Update aggregated data
        editorData.totalMemory = editorData.metrics.reduce((sum, m) => sum + m.memoryUsage, 0);
        editorData.averageLoadTime = editorData.metrics.reduce((sum, m) => sum + m.loadTime, 0) / editorData.metrics.length;

        // Keep only last 100 metrics to prevent memory bloat
        if (editorData.metrics.length > 100) {
            editorData.metrics = editorData.metrics.slice(-100);
        }
    }

    // Check if performance thresholds are exceeded
    private checkPerformanceThresholds(editorId: string, loadTime: number, memoryUsage: number): void {
        const warnings: string[] = [];

        if (loadTime > this.loadTimeThreshold) {
            warnings.push(`Slow loading time: ${loadTime.toFixed(2)}ms (threshold: ${this.loadTimeThreshold}ms)`);
        }

        if (memoryUsage > this.memoryThreshold) {
            warnings.push(`High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: ${this.memoryThreshold / 1024 / 1024}MB)`);
        }

        if (warnings.length > 0) {
            console.warn(`Monaco Editor Performance Warning [${editorId}]:`, warnings);
        }
    }

    // Get current memory usage (approximate)
    private getMemoryUsage(): number {
        if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return 0; // Fallback when memory API is not available
    }

    // Get performance report for an editor
    getPerformanceReport(editorId: string): EditorPerformanceData | null {
        return this.performanceData.get(editorId) || null;
    }

    // Get overall performance summary
    getOverallPerformanceSummary(): {
        totalEditors: number;
        totalMemory: number;
        averageLoadTime: number;
        slowestEditor: string | null;
        heaviestEditor: string | null;
    } {
        const editors = Array.from(this.performanceData.values());
        
        if (editors.length === 0) {
            return {
                totalEditors: 0,
                totalMemory: 0,
                averageLoadTime: 0,
                slowestEditor: null,
                heaviestEditor: null
            };
        }

        const totalMemory = editors.reduce((sum, editor) => sum + editor.totalMemory, 0);
        const averageLoadTime = editors.reduce((sum, editor) => sum + editor.averageLoadTime, 0) / editors.length;
        
        const slowestEditor = editors.reduce((slowest, current) => 
            current.averageLoadTime > slowest.averageLoadTime ? current : slowest
        );
        
        const heaviestEditor = editors.reduce((heaviest, current) => 
            current.totalMemory > heaviest.totalMemory ? current : heaviest
        );

        return {
            totalEditors: editors.length,
            totalMemory,
            averageLoadTime,
            slowestEditor: slowestEditor.editorId,
            heaviestEditor: heaviestEditor.editorId
        };
    }

    // Clear performance data for a specific editor
    clearEditorData(editorId: string): void {
        this.performanceData.delete(editorId);
    }

    // Clear all performance data
    clearAllData(): void {
        this.performanceData.clear();
    }

    // Set custom thresholds
    setThresholds(memoryThreshold: number, loadTimeThreshold: number): void {
        this.memoryThreshold = memoryThreshold;
        this.loadTimeThreshold = loadTimeThreshold;
    }

    // Export performance data for analysis
    exportPerformanceData(): string {
        const data = Array.from(this.performanceData.values());
        return JSON.stringify(data, null, 2);
    }

    // Get performance recommendations
    getPerformanceRecommendations(): string[] {
        const recommendations: string[] = [];
        const summary = this.getOverallPerformanceSummary();

        if (summary.totalMemory > 200 * 1024 * 1024) { // 200MB
            recommendations.push('Consider reducing the number of open editors or file sizes');
        }

        if (summary.averageLoadTime > 500) { // 500ms
            recommendations.push('Consider enabling lazy loading for better performance');
        }

        const editors = Array.from(this.performanceData.values());
        const largeFileEditors = editors.filter(editor => 
            editor.metrics.some(metric => metric.fileSize > 1 * 1024 * 1024) // 1MB
        );

        if (largeFileEditors.length > 0) {
            recommendations.push('Large files detected - consider using read-only mode or syntax highlighting optimization');
        }

        return recommendations;
    }
}

// Utility functions for performance optimization
export function optimizeEditorForLargeFiles(fileSize: number): Partial<import('monaco-editor').editor.IStandaloneEditorConstructionOptions> {
    if (fileSize > 5 * 1024 * 1024) { // 5MB
        return {
            minimap: { enabled: false },
            folding: false,
            wordWrap: 'off',
            renderWhitespace: 'none',
            renderValidationDecorations: 'off',
            codeLens: false,
            colorDecorators: false,
            links: false,
            occurrencesHighlight: 'off',
            selectionHighlight: false,
            bracketPairColorization: { enabled: false },
            guides: {
                bracketPairs: false,
                indentation: false,
                highlightActiveBracketPair: false,
                highlightActiveIndentation: false
            }
        };
    }
    
    if (fileSize > 1 * 1024 * 1024) { // 1MB
        return {
            minimap: { enabled: false },
            renderWhitespace: 'none',
            occurrencesHighlight: 'singleFile',
            codeLens: false
        };
    }
    
    return {};
}

export function shouldEnableLazyLoading(fileCount: number, totalMemory: number): boolean {
    return fileCount > 10 || totalMemory > 50 * 1024 * 1024; // 50MB
}

export const performanceMonitor = MonacoPerformanceMonitor.getInstance();

// Export performance monitoring decorators
export function withPerformanceTracking<T extends any[], R>(
    fn: (...args: T) => R,
    operationName: string
): (...args: T) => R {
    return (...args: T): R => {
        const startTime = performance.now();
        const result = fn(...args);
        const endTime = performance.now();
        
        console.log(`${operationName} took ${(endTime - startTime).toFixed(2)}ms`);
        return result;
    };
}
