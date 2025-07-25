import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useThemeStore, type ThemePreset } from '@/stores/theme';
import { Palette, Monitor, Sun, Moon, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/tailwind';

export const ThemeSettings: React.FC = () => {
  const { 
    currentTheme, 
    presets, 
    customThemes, 
    setTheme, 
    initializeThemes 
  } = useThemeStore();

  React.useEffect(() => {
    initializeThemes();
  }, [initializeThemes]);

  const allThemes = [...presets, ...customThemes];
  const activeTheme = allThemes.find(t => t.id === currentTheme);

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
  };

  const getThemeIcon = (theme: ThemePreset) => {
    switch (theme.type) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
        return <Sun className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const renderThemeCard = (theme: ThemePreset, isCustom = false) => (
    <div
      key={theme.id}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md",
        currentTheme === theme.id
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
      onClick={() => handleThemeChange(theme.id)}
    >
      {currentTheme === theme.id && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getThemeIcon(theme)}
          <h4 className="font-medium">{theme.name}</h4>
          {isCustom && (
            <Badge variant="secondary" className="text-xs">
              Custom
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {theme.type}
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        {theme.description}
      </p>
      
      {/* Theme preview */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Preview</div>
        <div className="grid grid-cols-6 gap-1 h-6">
          {Object.entries(theme.cssVariables).slice(0, 6).map(([key, value], index) => (
            <div
              key={key}
              className="rounded-sm"
              style={{ backgroundColor: value.replace('oklch(', 'oklch(').replace(')', ')') }}
              title={`${key}: ${value}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Theme & Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the visual appearance of the editor and UI
        </p>
      </div>

      {/* Current Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Theme
          </CardTitle>
          <CardDescription>
            Your currently active theme configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTheme && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getThemeIcon(activeTheme)}
                <div>
                  <div className="font-medium">{activeTheme.name}</div>
                  <div className="text-sm text-muted-foreground">{activeTheme.description}</div>
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <Badge variant="outline">{activeTheme.type}</Badge>
                <Badge variant="secondary">Monaco: {activeTheme.monacoTheme}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Presets</CardTitle>
          <CardDescription>
            Choose from built-in theme presets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map(theme => renderThemeCard(theme))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Themes */}
      {customThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Themes</CardTitle>
            <CardDescription>
              Your custom theme configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customThemes.map(theme => renderThemeCard(theme, true))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Configuration</CardTitle>
          <CardDescription>
            Advanced theme settings and customization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Automatic Theme Switching</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically switch themes based on system preference
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Custom Theme Editor</Label>
                <p className="text-xs text-muted-foreground">
                  Create and edit your own custom themes
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Import/Export Themes</Label>
                <p className="text-xs text-muted-foreground">
                  Share themes with other users
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Information */}
      <Card>
        <CardHeader>
          <CardTitle>Theme System Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Themes:</span>
              <span>{allThemes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Built-in Presets:</span>
              <span>{presets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custom Themes:</span>
              <span>{customThemes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current UI Theme:</span>
              <span>{activeTheme?.uiTheme || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Monaco Theme:</span>
              <span>{activeTheme?.monacoTheme || 'Unknown'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
