import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settings';
import { Settings, Key, Save, AlertCircle, Eye, EyeOff, Palette, Type, Terminal, Puzzle, Users, Shield, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/tailwind';
import { Switch } from '@/components/ui/switch';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsSection = 'appearance' | 'editor' | 'terminal' | 'ai' | 'extensions' | 'accounts' | 'security' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const {
    settings,
    secureSettings,
    initialize,
    setSetting,
    setSecureSetting,
    deleteSecureSetting,
    getSecureSetting,
  } = useSettingsStore();

  const [xaiApiKey, setXaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  
  // Display settings - Initialize from store
  const [selectedAppFont, setSelectedAppFont] = useState(settings.appearance?.font?.family || 'system');
  const [selectedCodeFont, setSelectedCodeFont] = useState(settings.editor?.font?.family || 'sf-mono');
  const [appFontSize, setAppFontSize] = useState(settings.appearance?.font?.size?.toString() || '14');
  const [codeFontSize, setCodeFontSize] = useState(settings.editor?.font?.size?.toString() || '13');
  const [appFontBold, setAppFontBold] = useState(settings.appearance?.font?.bold || false);
  const [codeFontBold, setCodeFontBold] = useState(settings.editor?.font?.bold || false);
  const [selectedTerminalFont, setSelectedTerminalFont] = useState(settings.terminal?.font?.family || 'sf-mono');
  const [terminalFontSize, setTerminalFontSize] = useState(settings.terminal?.font?.size?.toString() || '13');
  const [terminalFontBold, setTerminalFontBold] = useState(settings.terminal?.font?.bold || false);
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'dimmed' | 'tinted'>(settings.appearance?.theme || 'dark');
  const [selectedAccent, setSelectedAccent] = useState(settings.appearance?.accentColor || 'blue');

  useEffect(() => {
    if (open) {
      initialize();
      loadApiKeys();
    }
  }, [open, initialize]);
  
  // Only sync settings from store when modal first opens
  useEffect(() => {
    if (open && !selectedAppFont) {
      setSelectedAppFont(settings.appearance?.font?.family || 'system');
      setSelectedCodeFont(settings.editor?.font?.family || 'sf-mono');
      setAppFontSize(settings.appearance?.font?.size?.toString() || '14');
      setCodeFontSize(settings.editor?.font?.size?.toString() || '13');
      setAppFontBold(settings.appearance?.font?.bold || false);
      setCodeFontBold(settings.editor?.font?.bold || false);
      setSelectedTheme(settings.appearance?.theme || 'dark');
      setSelectedAccent(settings.appearance?.accentColor || 'blue');
    }
  }, [open]);

  const loadApiKeys = async () => {
    try {
      const key = await getSecureSetting('apiKeys.xai');
      if (key && key !== '***') {
        setXaiApiKey(key);
      } else {
        setXaiApiKey('');
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    }
  };

  const saveApiKey = async () => {
    if (!xaiApiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await setSecureSetting('apiKeys.xai', xaiApiKey.trim());
      setSuccess('API key saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save API key');
      console.error('Save API key error:', err);
    } finally {
      setSaving(false);
    }
  };

  const removeApiKey = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await deleteSecureSetting('apiKeys.xai');
      setXaiApiKey('');
      setSuccess('API key removed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove API key');
      console.error('Remove API key error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralSettingChange = async (key: string, value: any) => {
    try {
      await setSetting(key, value);
      // Update CSS variables for instant feedback
      if (key.includes('font') || key.includes('Font')) {
        updateCSSVariables();
      } else if (key === 'appearance.theme') {
        updateTheme();
      }
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const updateCSSVariables = () => {
    const root = document.documentElement;
    
    // Font mapping
    const fontMap: Record<string, string> = {
      'system': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'inter': 'Inter, sans-serif',
      'helvetica': 'Helvetica, Arial, sans-serif',
      'arial': 'Arial, sans-serif',
      'segoe': '"Segoe UI", Tahoma, sans-serif',
      'roboto': 'Roboto, sans-serif',
      'tektur': 'Tektur, sans-serif'
    };
    
    const codeFontMap: Record<string, string> = {
      'sf-mono': "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
      'fira-code': "'Fira Code', 'Cascadia Code', 'SF Mono', monospace",
      'jetbrains': "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      'cascadia': "'Cascadia Code', 'Fira Code', 'SF Mono', monospace",
      'source-code-pro': "'Source Code Pro', 'SF Mono', 'Fira Code', monospace",
      'ubuntu-mono': "'Ubuntu Mono', 'SF Mono', monospace",
      'consolas': "Consolas, 'SF Mono', monospace",
      'menlo': "Menlo, 'SF Mono', monospace",
      'monaco': "Monaco, 'SF Mono', monospace",
      'courier': "'Courier New', Courier, monospace"
    };
    
    // Update font families
    if (selectedAppFont && selectedAppFont !== 'system') {
      root.style.setProperty('--font-sans', fontMap[selectedAppFont] || fontMap['system']);
    }
    
    if (selectedCodeFont) {
      root.style.setProperty('--font-mono', codeFontMap[selectedCodeFont] || codeFontMap['sf-mono']);
    }
    
    // Update font sizes
    root.style.setProperty('--app-font-size', `${appFontSize}px`);
    root.style.setProperty('--code-font-size', `${codeFontSize}px`);
    
    // Update font weights
    root.style.setProperty('--app-font-weight', appFontBold ? '600' : '400');
    root.style.setProperty('--code-font-weight', codeFontBold ? '600' : '400');
  };
  
  const updateTheme = () => {
    const root = document.documentElement;
    
    // Update theme separately from fonts
    if (selectedTheme === 'light') {
      root.classList.remove('dark', 'dimmed', 'tinted');
    } else if (selectedTheme === 'dark') {
      root.classList.remove('dimmed', 'tinted');
      root.classList.add('dark');
    } else if (selectedTheme === 'dimmed') {
      root.classList.remove('dark', 'tinted');
      root.classList.add('dimmed');
    } else if (selectedTheme === 'tinted') {
      root.classList.remove('dark', 'dimmed');
      root.classList.add('tinted');
    }
  };

  const isXaiConfigured = secureSettings.apiKeys.xai && secureSettings.apiKeys.xai !== '***';

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Customize how vCode looks and feels</p>
            </div>
            
            {/* Font Settings */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Fonts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose fonts for the interface and code editor</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* App Font */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Interface Font</Label>
                  <Select value={selectedAppFont} onValueChange={async (value) => {
                    setSelectedAppFont(value);
                    await handleGeneralSettingChange('appearance.font.family', value);
                  }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                      <SelectItem value="arial">Arial</SelectItem>
                      <SelectItem value="segoe">Segoe UI</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="tektur">Tektur</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={appFontSize} onValueChange={async (value) => {
                    setAppFontSize(value);
                    await handleGeneralSettingChange('appearance.font.size', parseInt(value));
                  }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11px</SelectItem>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="13">13px</SelectItem>
                      <SelectItem value="14">14px (Default)</SelectItem>
                      <SelectItem value="15">15px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-font-bold" className="text-xs">Bold</Label>
                    <Switch
                      id="app-font-bold"
                      checked={appFontBold}
                      onCheckedChange={async (checked) => {
                        setAppFontBold(checked);
                        await handleGeneralSettingChange('appearance.font.bold', checked);
                      }}
                      className="h-4 w-8"
                    />
                  </div>
                </div>
                
                {/* Code Font */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Code Font</Label>
                  <Select value={selectedCodeFont} onValueChange={async (value) => {
                    setSelectedCodeFont(value);
                    await handleGeneralSettingChange('editor.font.family', value);
                  }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sf-mono">SF Mono</SelectItem>
                      <SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
                      <SelectItem value="fira-code">Fira Code</SelectItem>
                      <SelectItem value="menlo">Menlo</SelectItem>
                      <SelectItem value="consolas">Consolas</SelectItem>
                      <SelectItem value="monaco">Monaco</SelectItem>
                      <SelectItem value="cascadia-code">Cascadia Code</SelectItem>
                      <SelectItem value="source-code-pro">Source Code Pro</SelectItem>
                      <SelectItem value="tektur">Tektur</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={codeFontSize} onValueChange={async (value) => {
                    setCodeFontSize(value);
                    await handleGeneralSettingChange('editor.font.size', parseInt(value));
                  }}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11px</SelectItem>
                      <SelectItem value="12">12px</SelectItem>
                      <SelectItem value="13">13px (Default)</SelectItem>
                      <SelectItem value="14">14px</SelectItem>
                      <SelectItem value="15">15px</SelectItem>
                      <SelectItem value="16">16px</SelectItem>
                      <SelectItem value="18">18px</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code-font-bold" className="text-xs">Bold</Label>
                    <Switch
                      id="code-font-bold"
                      checked={codeFontBold}
                      onCheckedChange={async (checked) => {
                        setCodeFontBold(checked);
                        await handleGeneralSettingChange('editor.font.bold', checked);
                      }}
                      className="h-4 w-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3 pt-3 border-t">
              <div>
                <h3 className="text-sm font-medium">Theme</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Select your preferred color theme</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme('light');
                    await handleGeneralSettingChange('appearance.theme', 'light');
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 transition-all text-left",
                    selectedTheme === "light" ? "border-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="text-xs font-medium mb-2">Light</div>
                  <div className="h-8 rounded-sm bg-white border" />
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme('dark');
                    await handleGeneralSettingChange('appearance.theme', 'dark');
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 transition-all text-left",
                    selectedTheme === "dark" ? "border-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="text-xs font-medium mb-2">Dark</div>
                  <div className="h-8 rounded-sm bg-zinc-900 border border-zinc-800" />
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme('dimmed');
                    await handleGeneralSettingChange('appearance.theme', 'dimmed');
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 transition-all text-left",
                    selectedTheme === "dimmed" ? "border-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="text-xs font-medium mb-2">Dimmed</div>
                  <div className="h-8 rounded-sm bg-zinc-800 border border-zinc-700" />
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedTheme('tinted');
                    await handleGeneralSettingChange('appearance.theme', 'tinted');
                    updateTheme();
                  }}
                  className={cn(
                    "relative rounded-md border-2 p-4 transition-all text-left",
                    selectedTheme === "tinted" ? "border-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="text-xs font-medium mb-2">Tinted</div>
                  <div className="h-8 rounded-sm bg-indigo-950 border border-indigo-900" />
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-3 pt-3 border-t">
              <div>
                <h3 className="text-sm font-medium">Accent Color</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Choose an accent color for interactive elements</p>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {[
                  { name: 'blue', color: 'bg-blue-500' },
                  { name: 'purple', color: 'bg-purple-500' },
                  { name: 'pink', color: 'bg-pink-500' },
                  { name: 'red', color: 'bg-red-500' },
                  { name: 'orange', color: 'bg-orange-500' },
                  { name: 'yellow', color: 'bg-yellow-500' },
                  { name: 'green', color: 'bg-green-500' },
                  { name: 'teal', color: 'bg-teal-500' },
                  { name: 'cyan', color: 'bg-cyan-500' },
                  { name: 'gray', color: 'bg-gray-500' },
                ].map((accent) => (
                  <button
                    key={accent.name}
                    type="button"
                    onClick={() => {
                      setSelectedAccent(accent.name);
                      handleGeneralSettingChange('appearance.accentColor', accent.name);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-md transition-all",
                      accent.color,
                      selectedAccent === accent.name && "ring-2 ring-offset-1 ring-offset-background ring-primary"
                    )}
                    aria-label={`Select ${accent.name} accent`}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">AI Providers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure AI models and API keys</p>
            </div>
            
            {/* XAI/Grok Configuration */}
            <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>XAI (Grok)</span>
                  {isXaiConfigured && (
                    <Badge variant="default" className="text-[10px] h-5">
                      Configured
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure XAI/Grok for AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="xai-api-key" className="text-xs">API Key</Label>
                    <div className="relative">
                      <Input
                        id="xai-api-key"
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your XAI API key"
                        value={xaiApiKey}
                        onChange={(e) => setXaiApiKey(e.target.value)}
                        className="pr-8 h-8 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="xai-model" className="text-xs">Model</Label>
                    <Select 
                      value={settings.ai?.providers?.xai?.model || 'grok-beta'}
                      onValueChange={(value) => handleGeneralSettingChange('ai.providers.xai.model', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grok-beta">Grok Beta</SelectItem>
                        <SelectItem value="grok-2-beta">Grok 2 Beta</SelectItem>
                        <SelectItem value="grok-2-vision-beta">Grok 2 Vision Beta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="xai-endpoint" className="text-xs">API Endpoint (Optional)</Label>
                  <Input
                    id="xai-endpoint"
                    placeholder="https://api.x.ai/v1"
                    className="h-8 text-xs"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50 py-2">
                    <AlertCircle className="h-3 w-3 text-green-600" />
                    <AlertDescription className="text-xs text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={saveApiKey}
                    disabled={saving || !xaiApiKey.trim()}
                    className="flex-1 h-8 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1.5" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  {isXaiConfigured && (
                    <Button
                      variant="outline"
                      onClick={removeApiKey}
                      disabled={saving}
                      className="h-8 text-xs"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>
                    Get your API key from the{' '}
                    <a
                      href="https://console.x.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      XAI Console
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* OpenAI Configuration */}
            <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>OpenAI</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    Not Configured
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure OpenAI GPT models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="openai-api-key" className="text-xs">API Key</Label>
                    <div className="relative">
                      <Input
                        id="openai-api-key"
                        type="password"
                        placeholder="sk-..."
                        className="pr-8 h-8 text-xs"
                        disabled
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        disabled
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="openai-model" className="text-xs">Model</Label>
                    <Select disabled>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="openai-endpoint" className="text-xs">API Endpoint (Optional)</Label>
                  <Input
                    id="openai-endpoint"
                    placeholder="https://api.openai.com/v1"
                    className="h-8 text-xs"
                    disabled
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Anthropic Configuration */}
            <Card className="border-muted">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Anthropic (Claude)</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    Not Configured
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure Anthropic Claude models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="anthropic-api-key" className="text-xs">API Key</Label>
                    <div className="relative">
                      <Input
                        id="anthropic-api-key"
                        type="password"
                        placeholder="sk-ant-..."
                        className="pr-8 h-8 text-xs"
                        disabled
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        disabled
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="anthropic-model" className="text-xs">Model</Label>
                    <Select disabled>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="anthropic-endpoint" className="text-xs">API Endpoint (Optional)</Label>
                  <Input
                    id="anthropic-endpoint"
                    placeholder="https://api.anthropic.com"
                    className="h-8 text-xs"
                    disabled
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">About vCode</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Version and system information</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium">Version</p>
                <p className="text-xs text-muted-foreground">0.0.1</p>
              </div>
              <div>
                <p className="text-xs font-medium">Electron</p>
                <p className="text-xs text-muted-foreground">v{typeof process !== 'undefined' && process.versions ? process.versions.electron : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium">Node.js</p>
                <p className="text-xs text-muted-foreground">v{typeof process !== 'undefined' && process.versions ? process.versions.node : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium">Chrome</p>
                <p className="text-xs text-muted-foreground">v{typeof process !== 'undefined' && process.versions ? process.versions.chrome : 'N/A'}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold capitalize">{activeSection}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{activeSection} settings coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[75vh] flex flex-col bg-background border-border/50 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-base">Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Left Sidebar - Categories */}
          <div className="w-56 bg-muted/30 border-r border-border/50 p-2">
            <div className="space-y-0.5">
              {/* General */}
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">General</p>
              </div>
              <button
                onClick={() => setActiveSection('appearance')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'appearance' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                Appearance
              </button>
              <button
                onClick={() => setActiveSection('editor')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'editor' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Type className="h-3.5 w-3.5" />
                Editor
              </button>
              <button
                onClick={() => setActiveSection('terminal')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'terminal' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Terminal className="h-3.5 w-3.5" />
                Terminal
              </button>
              
              {/* AI & Extensions */}
              <div className="px-2 py-1.5 pt-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI & Extensions</p>
              </div>
              <button
                onClick={() => setActiveSection('ai')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'ai' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Key className="h-3.5 w-3.5" />
                AI Providers
              </button>
              <button
                onClick={() => setActiveSection('extensions')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'extensions' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Puzzle className="h-3.5 w-3.5" />
                Extensions
              </button>
              
              {/* System */}
              <div className="px-2 py-1.5 pt-3">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System</p>
              </div>
              <button
                onClick={() => setActiveSection('accounts')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'accounts' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Accounts
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'security' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Shield className="h-3.5 w-3.5" />
                Security
              </button>
              <button
                onClick={() => setActiveSection('about')}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                  activeSection === 'about' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Info className="h-3.5 w-3.5" />
                About
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};