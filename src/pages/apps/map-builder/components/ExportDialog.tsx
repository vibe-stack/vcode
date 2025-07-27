import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileCode, Settings, Zap, Package } from 'lucide-react';
import { ExportService, ExportOptions, ExportData } from '../services/exportService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: ExportData;
}

const defaultOptions: ExportOptions = {
  format: 'typescript',
  target: 'threejs',
  exportType: 'complete-scene',
  includeGrid: true,
  includeCamera: true,
  includeLighting: true,
  includeHelpers: false,
  moduleFormat: 'es6',
  minified: false,
  bundleGeometries: false,
  generateComments: true,
  geometryOptimization: false,
  materialOptimization: false,
};

export default function ExportDialog({ isOpen, onClose, exportData }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>(defaultOptions);
  const [isExporting, setIsExporting] = useState(false);

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      const baseFilename = options.exportType === 'complete-scene' ? 'scene' : 'objects';

      if (options.format === 'typescript') {
        content = ExportService.exportAsTypeScript(exportData, options);
        filename = `${baseFilename}.ts`;
        mimeType = 'text/typescript';
      } else {
        content = ExportService.exportAsJavaScript(exportData, options);
        filename = `${baseFilename}.js`;
        mimeType = 'text/javascript';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    const content = ExportService.exportAsJSON(exportData);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEstimatedFileSize = () => {
    const objectCount = exportData.objects.length;
    const baseSize = 2; // KB base overhead
    const perObjectSize = options.generateComments ? 0.8 : 0.5; // KB per object
    const totalSize = baseSize + (objectCount * perObjectSize);
    return totalSize > 1000 ? `${(totalSize / 1000).toFixed(1)} MB` : `${Math.round(totalSize)} KB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Scene
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="format" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="format" className="flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Type & Format
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Type</CardTitle>
                <CardDescription>
                  Choose whether you want a complete scene setup or just objects to add to an existing scene
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="complete-scene"
                      name="exportType"
                      value="complete-scene"
                      checked={options.exportType === 'complete-scene'}
                      onChange={(e) => updateOption('exportType', e.target.value as 'complete-scene' | 'objects-only')}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500"
                    />
                    <Label htmlFor="complete-scene" className="flex-1">
                      <div className="font-medium">Complete Scene Setup</div>
                      <div className="text-xs text-muted-foreground">
                        Includes renderer setup, camera, lighting, controls, and render loop. Ready to run.
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="objects-only"
                      name="exportType"
                      value="objects-only"
                      checked={options.exportType === 'objects-only'}
                      onChange={(e) => updateOption('exportType', e.target.value as 'complete-scene' | 'objects-only')}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 focus:ring-emerald-500"
                    />
                    <Label htmlFor="objects-only" className="flex-1">
                      <div className="font-medium">Objects Only</div>
                      <div className="text-xs text-muted-foreground">
                        Just the objects to add to your existing scene. Accepts a scene parameter.
                      </div>
                    </Label>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={options.format} onValueChange={(value: 'typescript' | 'javascript') => updateOption('format', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="typescript">
                          <div className="flex items-center gap-2">
                            TypeScript
                            <Badge variant="secondary" className="text-xs">Recommended</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {options.format === 'javascript' && (
                    <div className="space-y-2">
                      <Label>Module Format</Label>
                      <Select value={options.moduleFormat} onValueChange={(value: ExportOptions['moduleFormat']) => updateOption('moduleFormat', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es6">ES6 Modules (import/export)</SelectItem>
                          <SelectItem value="commonjs">CommonJS (require/module.exports)</SelectItem>
                          <SelectItem value="umd">UMD (Universal Module)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scene Features</CardTitle>
                <CardDescription>
                  Select which components to include in your exported scene
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {options.exportType === 'complete-scene' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeCamera" 
                            checked={options.includeCamera}
                            onCheckedChange={(checked) => updateOption('includeCamera', checked as boolean)}
                          />
                          <Label htmlFor="includeCamera">Camera Setup</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeLighting" 
                            checked={options.includeLighting}
                            onCheckedChange={(checked) => updateOption('includeLighting', checked as boolean)}
                          />
                          <Label htmlFor="includeLighting">Professional Lighting</Label>
                        </div>
                      </>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeGrid" 
                        checked={options.includeGrid}
                        onCheckedChange={(checked) => updateOption('includeGrid', checked as boolean)}
                      />
                      <Label htmlFor="includeGrid">Grid Helper</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeHelpers" 
                        checked={options.includeHelpers}
                        onCheckedChange={(checked) => updateOption('includeHelpers', checked as boolean)}
                      />
                      <Label htmlFor="includeHelpers">Debug Helpers</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="generateComments" 
                        checked={options.generateComments}
                        onCheckedChange={(checked) => updateOption('generateComments', checked as boolean)}
                      />
                      <Label htmlFor="generateComments">Documentation Comments</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div className="flex flex-wrap gap-1">
                      {options.exportType === 'complete-scene' ? (
                        <>
                          {options.includeCamera && <Badge variant="secondary">Camera</Badge>}
                          {options.includeLighting && <Badge variant="secondary">Lighting</Badge>}
                          {options.includeGrid && <Badge variant="secondary">Grid</Badge>}
                          {options.includeHelpers && <Badge variant="secondary">Helpers</Badge>}
                          {options.generateComments && <Badge variant="secondary">Comments</Badge>}
                          <Badge variant="outline">Complete Scene</Badge>
                        </>
                      ) : (
                        <>
                          {options.includeGrid && <Badge variant="secondary">Grid</Badge>}
                          {options.includeHelpers && <Badge variant="secondary">Helpers</Badge>}
                          {options.generateComments && <Badge variant="secondary">Comments</Badge>}
                          <Badge variant="outline">Objects Only</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Optimization</CardTitle>
                <CardDescription>
                  Optimize the exported code for better performance and smaller file size
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="geometryOptimization" 
                        checked={options.geometryOptimization}
                        onCheckedChange={(checked) => updateOption('geometryOptimization', checked as boolean)}
                      />
                      <Label htmlFor="geometryOptimization">Reduce Geometry Detail</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="materialOptimization" 
                        checked={options.materialOptimization}
                        onCheckedChange={(checked) => updateOption('materialOptimization', checked as boolean)}
                      />
                      <Label htmlFor="materialOptimization">Material Factories</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="bundleGeometries" 
                        checked={options.bundleGeometries}
                        onCheckedChange={(checked) => updateOption('bundleGeometries', checked as boolean)}
                      />
                      <Label htmlFor="bundleGeometries">Geometry Factories</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="minified" 
                        checked={options.minified}
                        onCheckedChange={(checked) => updateOption('minified', checked as boolean)}
                      />
                      <Label htmlFor="minified">Minify Output</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Performance Impact</span>
                  </div>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>• Geometry optimization reduces triangle count by ~50%</li>
                    <li>• Material factories enable instance reuse</li>
                    <li>• Geometry factories reduce memory usage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Fine-tune the export behavior and output format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-md">
                      <div className="font-medium">Objects</div>
                      <div className="text-2xl font-bold text-primary">{exportData.objects.length}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="font-medium">Estimated Size</div>
                      <div className="text-2xl font-bold text-primary">{getEstimatedFileSize()}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="font-medium">Export Type</div>
                      <div className="text-lg font-bold text-primary">{options.exportType === 'complete-scene' ? 'Complete' : 'Objects Only'}</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Export Options Summary</Label>
                    <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                      <div><span className="font-medium">Format:</span> {options.format.toUpperCase()}</div>
                      <div><span className="font-medium">Export Type:</span> {options.exportType === 'complete-scene' ? 'Complete Scene' : 'Objects Only'}</div>
                      <div><span className="font-medium">Module:</span> {options.moduleFormat?.toUpperCase()}</div>
                      <div><span className="font-medium">Features:</span> {[
                        options.exportType === 'complete-scene' && options.includeCamera && 'Camera',
                        options.exportType === 'complete-scene' && options.includeLighting && 'Lighting', 
                        options.includeGrid && 'Grid',
                        options.includeHelpers && 'Helpers'
                      ].filter(Boolean).join(', ')}</div>
                      <div><span className="font-medium">Optimizations:</span> {[
                        options.geometryOptimization && 'Geometry',
                        options.materialOptimization && 'Materials',
                        options.bundleGeometries && 'Bundling',
                        options.minified && 'Minified'
                      ].filter(Boolean).join(', ') || 'None'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            Export JSON
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : `Export ${options.format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
