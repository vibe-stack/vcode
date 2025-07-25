import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/settings';
import { Settings, FileText, Save, RotateCcw } from 'lucide-react';

export const GeneralSettings: React.FC = () => {
  const { settings, setSetting, resetSettings } = useSettingsStore();

  const handleSettingChange = async (key: string, value: any) => {
    try {
      await setSetting(key, value);
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      try {
        await resetSettings();
      } catch (err) {
        console.error('Failed to reset settings:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">General Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application behavior and preferences
        </p>
      </div>

      {/* Editor Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editor Configuration
          </CardTitle>
          <CardDescription>
            Customize the code editor behavior and appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                min="8"
                max="32"
                value={settings.editor.fontSize}
                onChange={(e) => handleSettingChange('editor.fontSize', parseInt(e.target.value) || 14)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tab-size">Tab Size</Label>
              <Select
                value={settings.editor.tabSize.toString()}
                onValueChange={(value) => handleSettingChange('editor.tabSize', parseInt(value))}
              >
                <SelectTrigger id="tab-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 spaces</SelectItem>
                  <SelectItem value="4">4 spaces</SelectItem>
                  <SelectItem value="8">8 spaces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Input
              id="font-family"
              value={settings.editor.fontFamily}
              onChange={(e) => handleSettingChange('editor.fontFamily', e.target.value)}
              placeholder="'Fira Code', Consolas, 'Courier New', monospace"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="word-wrap">Word Wrap</Label>
              <p className="text-xs text-muted-foreground">
                Automatically wrap long lines
              </p>
            </div>
            <Switch
              id="word-wrap"
              checked={settings.editor.wordWrap}
              onCheckedChange={(checked) => handleSettingChange('editor.wordWrap', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Application Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Behavior
          </CardTitle>
          <CardDescription>
            Configure how the application behaves and starts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto Save</Label>
              <p className="text-xs text-muted-foreground">
                Automatically save files when changes are made
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={settings.general.autoSave}
              onCheckedChange={(checked) => handleSettingChange('general.autoSave', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="confirm-close">Confirm Before Close</Label>
              <p className="text-xs text-muted-foreground">
                Show confirmation dialog when closing unsaved files
              </p>
            </div>
            <Switch
              id="confirm-close"
              checked={settings.general.confirmBeforeClose}
              onCheckedChange={(checked) => handleSettingChange('general.confirmBeforeClose', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="startup-behavior">Startup Behavior</Label>
            <Select
              value={settings.general.startupBehavior}
              onValueChange={(value) => handleSettingChange('general.startupBehavior', value)}
            >
              <SelectTrigger id="startup-behavior">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="welcome">Show Welcome Screen</SelectItem>
                <SelectItem value="lastProject">Restore Last Project</SelectItem>
                <SelectItem value="empty">Start with Empty Workspace</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
          <CardDescription>
            Advanced configuration options and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Reset All Settings</Label>
              <p className="text-xs text-muted-foreground">
                Reset all settings to their default values
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Export Settings</Label>
              <p className="text-xs text-muted-foreground">
                Download your settings as a JSON file
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Save className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Import Settings</Label>
              <p className="text-xs text-muted-foreground">
                Load settings from a JSON file
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Import
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Information */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Editor Font Size:</span>
              <span>{settings.editor.fontSize}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tab Size:</span>
              <span>{settings.editor.tabSize} spaces</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto Save:</span>
              <span>{settings.general.autoSave ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Word Wrap:</span>
              <span>{settings.editor.wordWrap ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Startup Behavior:</span>
              <span className="capitalize">{settings.general.startupBehavior.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
