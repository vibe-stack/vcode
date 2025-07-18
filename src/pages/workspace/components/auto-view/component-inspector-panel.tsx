import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronRight, 
  Code, 
  FileText, 
  Target, 
  Component,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { IframeInspectionData, FrameworkInfo } from './iframe-inspector';
import { SourceLocation, ComponentSourceInfo } from './source-file-mapper';
import { EnhancedSourceMapper } from './enhanced-source-mapper';

interface ComponentInspectorPanelProps {
  inspectionData: IframeInspectionData | null;
  framework: FrameworkInfo | null;
  onOpenSourceFile?: (filePath: string, lineNumber?: number) => void;
}

export const ComponentInspectorPanel: React.FC<ComponentInspectorPanelProps> = ({
  inspectionData,
  framework,
  onOpenSourceFile
}) => {
  const [sourceInfo, setSourceInfo] = useState<ComponentSourceInfo | null>(null);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['component']));
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load source information when inspection data changes
  useEffect(() => {
    if (inspectionData?.component) {
      setIsLoadingSource(true);
      const mapper = new EnhancedSourceMapper('/Users/fairhat/Repositories/grok-ide'); // TODO: Get from context
      
      mapper.mapReactComponent(inspectionData.component)
        .then(setSourceInfo)
        .catch(console.error)
        .finally(() => setIsLoadingSource(false));
    } else {
      setSourceInfo(null);
    }
  }, [inspectionData]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null) return <span className="text-muted-foreground">null</span>;
    if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
    if (typeof value === 'string') return <span className="text-green-600">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-blue-600">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600">{value.toString()}</span>;
    if (typeof value === 'function') return <span className="text-orange-600">ƒ {value.name || 'anonymous'}</span>;
    
    if (typeof value === 'object' && depth < 3) {
      if (Array.isArray(value)) {
        return (
          <div className="ml-4">
            [
            {value.map((item, index) => (
              <div key={index} className="ml-2">
                {index}: {renderValue(item, depth + 1)}
              </div>
            ))}
            ]
          </div>
        );
      } else {
        return (
          <div className="ml-4">
            {'{'}
            {Object.entries(value).slice(0, 5).map(([key, val]) => (
              <div key={key} className="ml-2">
                <span className="text-blue-600">{key}</span>: {renderValue(val, depth + 1)}
              </div>
            ))}
            {Object.keys(value).length > 5 && (
              <div className="ml-2 text-muted-foreground">
                ... {Object.keys(value).length - 5} more
              </div>
            )}
            {'}'}
          </div>
        );
      }
    }
    
    return <span className="text-muted-foreground">{String(value)}</span>;
  };

  if (!inspectionData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Component Inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm">
            Click on an element in the preview to inspect it
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Component Inspector
          {framework && (
            <Badge variant="outline" className="ml-auto">
              {framework.type} {framework.version}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="component" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="component">Component</TabsTrigger>
            <TabsTrigger value="dom">DOM</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="component" className="h-full">
              <ScrollArea className="h-full">
                {inspectionData.component ? (
                  <div className="space-y-4">
                    {/* Component Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Component className="h-4 w-4" />
                          {inspectionData.component.componentName}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(inspectionData.component!.componentName, 'Component name')}
                        >
                          {copiedText === 'Component name' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {inspectionData.component.displayName && (
                        <p className="text-sm text-muted-foreground">
                          Display Name: {inspectionData.component.displayName}
                        </p>
                      )}
                    </div>

                    {/* Props */}
                    <Collapsible
                      open={expandedSections.has('props')}
                      onOpenChange={() => toggleSection('props')}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                        {expandedSections.has('props') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        Props ({Object.keys(inspectionData.component.props || {}).length})
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-1">
                        {Object.entries(inspectionData.component.props || {}).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-sm">
                            <span className="font-mono text-blue-600 min-w-0 flex-shrink-0">{key}:</span>
                            <div className="min-w-0 flex-1">{renderValue(value)}</div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* State */}
                    {inspectionData.component.state && (
                      <Collapsible
                        open={expandedSections.has('state')}
                        onOpenChange={() => toggleSection('state')}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                          {expandedSections.has('state') ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          State
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="text-sm">{renderValue(inspectionData.component.state)}</div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No component information available for this element
                  </p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dom" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {/* Element Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">&lt;{inspectionData.domNode.tagName}&gt;</h3>
                    {inspectionData.domNode.classList.length > 0 && (
                      <div>
                        <span className="font-medium">Classes: </span>
                        {inspectionData.domNode.classList.map(cls => (
                          <Badge key={cls} variant="secondary" className="mr-1 text-xs">
                            {cls}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attributes */}
                  <Collapsible
                    open={expandedSections.has('attributes')}
                    onOpenChange={() => toggleSection('attributes')}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                      {expandedSections.has('attributes') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      Attributes ({Object.keys(inspectionData.domNode.attributes).length})
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-1">
                      {Object.entries(inspectionData.domNode.attributes).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-blue-600">{key}:</span>
                          <span className="text-green-600">"{value}"</span>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Selectors */}
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">CSS Selector:</span>
                      <code className="ml-2 text-sm bg-muted px-1 rounded">
                        {inspectionData.domNode.cssSelector}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => copyToClipboard(inspectionData.domNode.cssSelector, 'CSS Selector')}
                      >
                        {copiedText === 'CSS Selector' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <span className="font-medium">XPath:</span>
                      <code className="ml-2 text-sm bg-muted px-1 rounded break-all">
                        {inspectionData.domNode.xpath}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => copyToClipboard(inspectionData.domNode.xpath, 'XPath')}
                      >
                        {copiedText === 'XPath' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="source" className="h-full">
              <ScrollArea className="h-full">
                {isLoadingSource ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground text-sm">Loading source information...</p>
                  </div>
                ) : sourceInfo ? (
                  <div className="space-y-4">
                    {sourceInfo.sourceLocation && (
                      <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Primary Source
                          <Badge variant={
                            sourceInfo.confidence === 'high' ? 'default' :
                            sourceInfo.confidence === 'medium' ? 'secondary' : 'outline'
                          }>
                            {sourceInfo.confidence}
                          </Badge>
                        </h3>
                        <div className="space-y-1">
                          <Button
                            variant="outline"
                            className="justify-start h-auto p-3 w-full"
                            onClick={() => onOpenSourceFile?.(
                              sourceInfo.sourceLocation!.filePath,
                              sourceInfo.sourceLocation!.lineNumber
                            )}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                <span className="font-mono text-sm">
                                  {sourceInfo.sourceLocation.relativePath || sourceInfo.sourceLocation.filePath}
                                </span>
                                <ExternalLink className="h-3 w-3" />
                              </div>
                              {sourceInfo.sourceLocation.lineNumber && (
                                <span className="text-xs text-muted-foreground">
                                  Line {sourceInfo.sourceLocation.lineNumber}
                                  {sourceInfo.sourceLocation.columnNumber && `, Column ${sourceInfo.sourceLocation.columnNumber}`}
                                </span>
                              )}
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {sourceInfo.possibleSources.length > 1 && (
                      <Collapsible
                        open={expandedSections.has('possible-sources')}
                        onOpenChange={() => toggleSection('possible-sources')}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                          {expandedSections.has('possible-sources') ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          Other Possible Sources ({sourceInfo.possibleSources.length - 1})
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 space-y-1">
                          {sourceInfo.possibleSources.slice(1).map((source: SourceLocation, index: number) => (
                            <Button
                              key={index}
                              variant="ghost"
                              className="justify-start h-auto p-2 w-full"
                              onClick={() => onOpenSourceFile?.(source.filePath, source.lineNumber)}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                <span className="font-mono text-xs">
                                  {source.relativePath || source.filePath}
                                </span>
                                <ExternalLink className="h-2 w-2" />
                              </div>
                            </Button>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No source information available
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
