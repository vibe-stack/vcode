import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, Database, RefreshCw, Trash2 } from 'lucide-react';

interface SearchResult {
  filePath: string;
  content: string;
  score: number;
  lineNumber?: number;
  snippet?: string;
}

interface IndexStats {
  totalFiles: number;
  totalChunks: number;
  indexSize: number;
  lastUpdated: Date;
}

export function SmartIndexManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [isIndexBuilt, setIsIndexBuilt] = useState(false);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check current project and index status
    checkIndexStatus();
    getCurrentProject();

    // Set up listeners for progress and errors
    window.indexApi?.onProgress((data) => {
      setProgress(data.progress);
      setProgressMessage(data.message || '');
    });

    window.indexApi?.onError((data) => {
      setError(data.error);
      setIsBuilding(false);
    });

    return () => {
      window.indexApi?.removeAllListeners();
    };
  }, []);

  const getCurrentProject = async () => {
    try {
      const project = await window.projectApi?.getCurrentProject();
      setCurrentProject(project);
    } catch (err) {
      console.error('Failed to get current project:', err);
    }
  };

  const checkIndexStatus = async () => {
    try {
      const status = await window.indexApi?.getStatus();
      setIsIndexBuilt(status?.isBuilt || false);
      
      if (status?.isBuilt) {
        const stats = await window.indexApi?.getStats();
        setIndexStats(stats);
      }
    } catch (err) {
      console.error('Failed to check index status:', err);
    }
  };

  const buildIndex = async () => {
    if (!currentProject) {
      setError('No project is currently open');
      return;
    }

    setIsBuilding(true);
    setError(null);
    setProgress(0);

    try {
      await window.indexApi?.buildIndex({
        projectPath: currentProject,
        chunkSize: 500,
        chunkOverlap: 50
      });

      await checkIndexStatus();
      setIsBuilding(false);
      setProgress(100);
      setProgressMessage('Index built successfully!');
    } catch (err) {
      setError(`Failed to build index: ${err}`);
      setIsBuilding(false);
    }
  };

  const clearIndex = async () => {
    try {
      await window.indexApi?.clearIndex();
      setIsIndexBuilt(false);
      setIndexStats(null);
      setSearchResults([]);
      setProgress(0);
      setProgressMessage('');
    } catch (err) {
      setError(`Failed to clear index: ${err}`);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim() || !isIndexBuilt) return;

    try {
      setError(null);
      const results = await window.indexApi?.search(searchQuery, 20);
      setSearchResults(results || []);
    } catch (err) {
      setError(`Search failed: ${err}`);
    }
  };

  const openFile = async (filePath: string, lineNumber?: number) => {
    try {
      // Open file in the editor (you'll need to implement this based on your editor integration)
      await window.projectApi?.openFile(filePath);
      console.log(`Opening ${filePath}${lineNumber ? ` at line ${lineNumber}` : ''}`);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Smart Project Index
          </CardTitle>
          <CardDescription>
            Build a semantic index of your project for intelligent code search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Project:</p>
              <p className="font-mono text-sm">{currentProject || 'No project open'}</p>
            </div>
            <Badge variant={isIndexBuilt ? 'default' : 'secondary'}>
              {isIndexBuilt ? 'Index Ready' : 'No Index'}
            </Badge>
          </div>

          {/* Index Stats */}
          {indexStats && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{indexStats.totalFiles}</p>
                <p className="text-sm text-muted-foreground">Files</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{indexStats.totalChunks}</p>
                <p className="text-sm text-muted-foreground">Chunks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{indexStats.indexSize}</p>
                <p className="text-sm text-muted-foreground">Vectors</p>
              </div>
            </div>
          )}

          {/* Build Progress */}
          {(isBuilding || progress > 0) && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progressMessage}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={buildIndex} 
              disabled={!currentProject || isBuilding}
              className="flex items-center gap-2"
            >
              {isBuilding ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isIndexBuilt ? 'Rebuild Index' : 'Build Index'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearIndex} 
              disabled={!isIndexBuilt || isBuilding}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Index
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Interface */}
      {isIndexBuilt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Semantic Search
            </CardTitle>
            <CardDescription>
              Search your codebase using natural language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for functions, components, algorithms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                className="flex-1"
              />
              <Button onClick={performSearch} disabled={!searchQuery.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openFile(result.filePath, result.lineNumber)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm text-muted-foreground truncate">
                            {result.filePath}
                            {result.lineNumber && `:${result.lineNumber}`}
                          </p>
                          <p className="text-sm mt-1 line-clamp-2">
                            {result.snippet || result.content}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {Math.round(result.score * 100)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No results found for "{searchQuery}"
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
