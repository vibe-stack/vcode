import React, { useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/project';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    MessageSquare,
    ChevronDown,
    ChevronRight,
    FileText,
    Sparkles,
    X
} from 'lucide-react';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { useEditorContentStore } from '@/stores/editor-content';

interface SemanticSearchResult {
    filePath: string;
    content: string;
    score: number;
    lineNumber?: number;
    snippet?: string;
}

interface GroupedSemanticResults {
    [filePath: string]: SemanticSearchResult[];
}

export function AskPanel() {
    const { currentProject } = useProjectStore();
    const { openFile: openFileInSplit } = useEditorSplitStore();
    const setView = useEditorContentStore((s) => s.setView);
    
    const [question, setQuestion] = useState('');
    const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [indexStatus, setIndexStatus] = useState<{ isBuilt: boolean; isBuilding: boolean }>({ 
        isBuilt: false, 
        isBuilding: false 
    });

    // Check index status on mount
    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await window.indexApi?.getStatus();
                if (status) {
                    setIndexStatus({ isBuilt: status.isBuilt, isBuilding: false });
                }
            } catch (error) {
                console.error('Failed to check index status:', error);
            }
        };
        checkStatus();
    }, []);

    const handleAsk = useCallback(async () => {
        if (!question.trim() || !currentProject) {
            if (!currentProject) {
                console.warn('No project loaded for semantic search');
            }
            return;
        }

        // Check if index is built
        try {
            const status = await window.indexApi?.getStatus();
            if (!status?.isBuilt) {
                console.warn('Index not built. Building index first...');
                // Optionally trigger index building here
                // await window.indexApi?.buildIndex({ projectPath: currentProject });
                return;
            }
        } catch (error) {
            console.error('Failed to check index status:', error);
            return;
        }

        setIsSearching(true);
        try {
            const results = await window.indexApi?.search(question, 20);
            setSearchResults(results || []);
            
            // Auto-expand all files if there are results
            if (results && results.length > 0) {
                const uniqueFiles = [...new Set(results.map(r => r.filePath))];
                setExpandedFiles(new Set(uniqueFiles));
            }
        } catch (error) {
            console.error('Semantic search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [question, currentProject]);

    const handleResultClick = useCallback(async (result: SemanticSearchResult) => {
        try {
            setView('code');
            await openFileInSplit(result.filePath);
            
            // TODO: Navigate to specific line in the editor if lineNumber is available
            if (result.lineNumber) {
                console.log(`Navigate to line ${result.lineNumber} in ${result.filePath}`);
            }
        } catch (error) {
            console.error('Failed to open file:', error);
        }
    }, [openFileInSplit, setView]);

    const toggleFileExpansion = useCallback((filePath: string) => {
        setExpandedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filePath)) {
                newSet.delete(filePath);
            } else {
                newSet.add(filePath);
            }
            return newSet;
        });
    }, []);

    const clearSearch = useCallback(() => {
        setQuestion('');
        setSearchResults([]);
        setExpandedFiles(new Set());
    }, []);

    const buildIndex = useCallback(async () => {
        if (!currentProject) return;
        
        setIndexStatus({ isBuilt: false, isBuilding: true });
        try {
            await window.indexApi?.buildIndex({ projectPath: currentProject });
            setIndexStatus({ isBuilt: true, isBuilding: false });
        } catch (error) {
            console.error('Failed to build index:', error);
            setIndexStatus({ isBuilt: false, isBuilding: false });
        }
    }, [currentProject]);

    // Group results by file path
    const groupedResults: GroupedSemanticResults = searchResults.reduce((acc, result) => {
        if (!acc[result.filePath]) {
            acc[result.filePath] = [];
        }
        acc[result.filePath].push(result);
        return acc;
    }, {} as GroupedSemanticResults);

    const totalResults = searchResults.length;
    const totalFiles = Object.keys(groupedResults).length;

    const getRelativePath = (filePath: string) => {
        if (currentProject && filePath.startsWith(currentProject)) {
            return filePath.substring(currentProject.length + 1);
        }
        return filePath;
    };

    return (
        <div className="h-full flex flex-col">
            {/* Ask Form */}
            <div className="border-b p-3 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <MessageSquare className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Ask your codebase a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAsk();
                                } else if (e.key === 'Escape') {
                                    clearSearch();
                                }
                            }}
                            className="pl-7 h-8 text-sm"
                        />
                    </div>
                    <Button 
                        onClick={handleAsk} 
                        disabled={!question.trim() || isSearching || !currentProject || !indexStatus.isBuilt}
                        size="sm"
                        className="h-8"
                    >
                        {isSearching ? 'Thinking...' : 'Ask'}
                    </Button>
                    {searchResults.length > 0 && (
                        <Button onClick={clearSearch} variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Index Status */}
                {!indexStatus.isBuilt && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                        <Sparkles className="h-3 w-3" />
                        <span className="flex-1">
                            {indexStatus.isBuilding 
                                ? "Building semantic index..." 
                                : "Semantic index not available"
                            }
                        </span>
                        {!indexStatus.isBuilding && (
                            <Button 
                                onClick={buildIndex} 
                                size="sm" 
                                variant="outline" 
                                className="h-6 px-2 text-xs"
                                disabled={!currentProject}
                            >
                                Build Index
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {totalResults > 0 && (
                <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                    {totalResults} relevant result{totalResults !== 1 ? 's' : ''} in {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                </div>
            )}

            {/* Search Results */}
            <ScrollArea className="flex-1">
                <div className="p-1">
                    {isSearching && (
                        <div className="text-center py-8">
                            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
                            <p className="text-muted-foreground text-sm">Analyzing your question...</p>
                        </div>
                    )}

                    {!isSearching && searchResults.length === 0 && question && indexStatus.isBuilt && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">No relevant code found</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                Try rephrasing your question or using different keywords
                            </p>
                        </div>
                    )}

                    {!isSearching && searchResults.length === 0 && !question && indexStatus.isBuilt && (
                        <div className="text-center py-8">
                            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">Ask your codebase anything</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                "Find authentication functions", "Show me React components", etc.
                            </p>
                        </div>
                    )}

                    {!isSearching && !indexStatus.isBuilt && !indexStatus.isBuilding && (
                        <div className="text-center py-8">
                            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">Semantic search requires an index</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                {currentProject 
                                    ? "Build an index to ask questions about your code"
                                    : "No project loaded. Open a project to build an index."
                                }
                            </p>
                        </div>
                    )}

                    {Object.entries(groupedResults).map(([filePath, results]) => {
                        const isExpanded = expandedFiles.has(filePath);
                        const relativePath = getRelativePath(filePath);
                        
                        return (
                            <div key={filePath} className="mb-2">
                                <Collapsible open={isExpanded} onOpenChange={() => toggleFileExpansion(filePath)}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-1 p-1 rounded hover:bg-accent cursor-pointer group">
                                            {isExpanded ? (
                                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            <FileText className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs font-medium truncate flex-1" title={relativePath}>
                                                {relativePath}
                                            </span>
                                            <Badge variant="secondary" className="h-4 text-xs px-1">
                                                {results.length}
                                            </Badge>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="ml-4 space-y-1">
                                            {results.map((result, index) => (
                                                <div
                                                    key={`${result.lineNumber || 0}-${index}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-accent group text-xs border-l border-muted"
                                                    title={result.lineNumber ? `Line ${result.lineNumber}` : 'Click to open file'}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        {result.lineNumber && (
                                                            <span className="text-muted-foreground font-mono text-xs min-w-[2rem] text-right select-none">
                                                                {result.lineNumber}
                                                            </span>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs text-muted-foreground mb-1">
                                                                Relevance: {Math.round(result.score * 100)}%
                                                            </div>
                                                            <div className="text-xs font-mono bg-muted/50 p-1 rounded">
                                                                {result.snippet || result.content.substring(0, 200)}
                                                                {(result.snippet || result.content).length > 200 && '...'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
