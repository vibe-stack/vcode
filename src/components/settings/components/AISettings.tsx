import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/stores/settings';
import { Save, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AISettings: React.FC = () => {
  const {
    settings,
    secureSettings,
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

  useEffect(() => {
    loadApiKeys();
  }, []);

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
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
  };

  const isXaiConfigured = secureSettings.apiKeys.xai && secureSettings.apiKeys.xai !== '***';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Providers</h3>
        
        {/* XAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>XAI (Grok)</span>
              {isXaiConfigured && (
                <Badge variant="default" className="text-xs">
                  Configured
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure your XAI API key to use Grok models for AI assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xai-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="xai-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="Enter your XAI API key"
                  value={xaiApiKey}
                  onChange={(e) => setXaiApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={saveApiKey}
                disabled={saving || !xaiApiKey.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save API Key'}
              </Button>
              {isXaiConfigured && (
                <Button
                  variant="outline"
                  onClick={removeApiKey}
                  disabled={saving}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
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

        {/* AI Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Configure AI behavior and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-model">Default Model</Label>
              <Input
                id="ai-model"
                value={settings.ai.providers.xai.model}
                onChange={(e) => handleGeneralSettingChange('ai.providers.xai.model', e.target.value)}
                placeholder="grok-4-0709"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
