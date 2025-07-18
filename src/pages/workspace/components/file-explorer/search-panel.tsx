import React, { useState, useCallback, useEffect } from 'react';
import { useProjectStore } from '@/stores/project';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    ChevronDown,
    ChevronRight,
    Settings,
    X,
    FileText,
    MoreHorizontal,
    Filter,
    FilterX
} from 'lucide-react';
import { useEditorSplitStore } from '@/stores/editor-splits';
import { useEditorContentStore } from '@/stores/editor-content';

interface SearchResult {
    filePath: string;
    line: number;
    column: number;
    content: string;
    lineContent: string;
}

interface GroupedResults {
    [filePath: string]: SearchResult[];
}

export function SearchPanel() {
    const { currentProject } = useProjectStore();
    const { openFile: openFileInSplit } = useEditorSplitStore();
    const setView = useEditorContentStore((s) => s.setView);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [includePatterns, setIncludePatterns] = useState('');
    const [excludePatterns, setExcludePatterns] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [useExcludeSettings, setUseExcludeSettings] = useState(true);

    // Default exclude patterns based on gitignore + common patterns
    const defaultExcludePatterns = [
        'node_modules',
        'dist',
        'build',
        '.git',
        '.next',
        '.nuxt',
        'out',
        'coverage',
        '.nyc_output',
        '*.log',
        '*.lock'
    ];

    // Don't auto-populate the exclude field anymore
    // useEffect(() => {
    //     if (!excludePatterns) {
    //         setExcludePatterns(defaultExcludePatterns.join(', '));
    //     }
    // }, []);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2 || !currentProject) {
            if (!currentProject) {
                console.warn('No project loaded for search');
            }
            return;
        }

        setIsSearching(true);
        try {
            const filePatterns = includePatterns
                ? includePatterns.split(',').map(p => p.trim()).filter(Boolean)
                : undefined;

            // Combine user excludes with default excludes if toggle is enabled
            let excludePatternsArray = excludePatterns
                ? excludePatterns.split(',').map(p => p.trim()).filter(Boolean)
                : [];
            
            if (useExcludeSettings) {
                excludePatternsArray = [...excludePatternsArray, ...defaultExcludePatterns];
            }

            const results = await window.projectApi.searchInFiles(searchQuery, currentProject, {
                filePatterns,
                excludePatterns: excludePatternsArray.length > 0 ? excludePatternsArray : undefined
            });

            setSearchResults(results);
            
            // Auto-expand all files if there are results
            if (results.length > 0) {
                const uniqueFiles = [...new Set(results.map(r => r.filePath))];
                setExpandedFiles(new Set(uniqueFiles));
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, currentProject, includePatterns, excludePatterns, useExcludeSettings, defaultExcludePatterns]);

    const handleResultClick = useCallback(async (result: SearchResult) => {
        try {
            setView('code');
            await openFileInSplit(result.filePath);
            
            // TODO: Navigate to specific line/column in the editor
            // This would require additional functionality in the editor component
            // For now, the file will open and user can manually navigate to line {result.line}
            console.log(`Navigate to line ${result.line}, column ${result.column} in ${result.filePath}`);
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
        setSearchQuery('');
        setSearchResults([]);
        setExpandedFiles(new Set());
    }, []);

    // Group results by file path
    const groupedResults: GroupedResults = searchResults.reduce((acc, result) => {
        if (!acc[result.filePath]) {
            acc[result.filePath] = [];
        }
        acc[result.filePath].push(result);
        return acc;
    }, {} as GroupedResults);

    const totalResults = searchResults.length;
    const totalFiles = Object.keys(groupedResults).length;

    const getRelativePath = (filePath: string) => {
        if (currentProject && filePath.startsWith(currentProject)) {
            return filePath.substring(currentProject.length + 1);
        }
        return filePath;
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query) return text;
        
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        
        return (
            <>
                {text.slice(0, index)}
                <span className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
                    {text.slice(index, index + query.length)}
                </span>
                {text.slice(index + query.length)}
            </>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search Form */}
            <div className="border-b p-3 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                } else if (e.key === 'Escape') {
                                    clearSearch();
                                }
                            }}
                            className="pl-7 h-8 text-sm"
                        />
                    </div>
                    <Button 
                        onClick={handleSearch} 
                        disabled={!searchQuery.trim() || searchQuery.trim().length < 2 || isSearching || !currentProject}
                        size="sm"
                        className="h-8"
                        title={searchQuery.trim().length < 2 ? "Enter at least 2 characters to search" : ""}
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                    {searchResults.length > 0 && (
                        <Button onClick={clearSearch} variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {/* Advanced Options */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 p-1 justify-start w-full">
                            {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <Settings className="h-3 w-3 ml-1" />
                            <span className="text-xs ml-1">Advanced Options</span>
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                        <div>
                            <Label htmlFor="include-patterns" className="text-xs">Files to include</Label>
                            <Input
                                id="include-patterns"
                                placeholder="*.js, *.ts, *.tsx (leave empty for all)"
                                value={includePatterns}
                                onChange={(e) => setIncludePatterns(e.target.value)}
                                className="h-7 text-xs mt-1"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="exclude-patterns" className="text-xs">Files to exclude</Label>
                            </div>
                            <div className="relative mt-1">
                                <Input
                                    id="exclude-patterns"
                                    placeholder="Custom exclusions: *.test.js, temp/"
                                    value={excludePatterns}
                                    onChange={(e) => setExcludePatterns(e.target.value)}
                                    className="h-7 text-xs pr-24" // add right padding for button
                                />
                                <Button
                                    type="button"
                                    variant={useExcludeSettings ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setUseExcludeSettings(!useExcludeSettings)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-5 px-2 text-xs z-10"
                                    title={useExcludeSettings ? "Disable default exclusions" : "Enable default exclusions"}
                                    tabIndex={-1}
                                >
                                    {useExcludeSettings ? <Filter className="h-3 w-3" /> : <FilterX className="h-3 w-3" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {useExcludeSettings && (
                                    <>Default exclusions are active (node_modules, .git, etc.)</>
                                )}
                                {!useExcludeSettings && (
                                    <>Only custom exclusions will be used</>
                                )}
                            </p>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            {/* Results Summary */}
            {totalResults > 0 && (
                <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                    {totalResults} result{totalResults !== 1 ? 's' : ''} in {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                </div>
            )}

            {/* Search Results */}
            <ScrollArea className="flex-1">
                <div className="p-1">
                    {isSearching && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">Searching...</p>
                        </div>
                    )}

                    {!isSearching && searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground text-sm">No results found</p>
                        </div>
                    )}

                    {!isSearching && searchResults.length === 0 && !searchQuery && (
                        <div className="text-center py-8">
                            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">Search across files</p>
                            <p className="text-muted-foreground text-xs mt-1">
                                {currentProject 
                                    ? "Enter a search term to find text in your project files"
                                    : "No project loaded. Open a project to search files."
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
                                                    key={`${result.line}-${result.column}-${index}`}
                                                    onClick={() => handleResultClick(result)}
                                                    className="flex items-start gap-2 p-1 rounded cursor-pointer hover:bg-accent group text-xs"
                                                    title={`Line ${result.line}, Column ${result.column}`}
                                                >
                                                    <span className="text-muted-foreground font-mono text-xs min-w-[2rem] text-right select-none">
                                                        {result.line}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="truncate font-mono text-xs">
                                                            {highlightMatch(result.lineContent.trim(), searchQuery)}
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
