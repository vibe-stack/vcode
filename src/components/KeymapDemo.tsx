import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useKeymap, useKeymapProfiles } from '@/services/keymaps/main';
import { getHumanReadableKey } from '@/services/keymaps/utils';

export const KeymapDemo: React.FC = () => {
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);
  const [keyPressCount, setKeyPressCount] = useState(0);
  const { profiles, activeProfile, setActiveProfile } = useKeymapProfiles();
  const keymap = useKeymap();

  // Demo of registering a custom command
  useEffect(() => {
    keymap.registerCommand('demo.hello', {
      execute: () => {
        setLastTriggered('demo.hello - Hello World!');
        setKeyPressCount(prev => prev + 1);
      },
      canExecute: () => true
    });

    // Add a custom key binding
    keymap.addKeyBinding({
      id: 'demo.hello.binding',
      description: 'Demo: Say Hello',
      key: 'cmd+shift+h',
      command: 'demo.hello',
      enabled: true,
      category: 'custom',
      context: 'global'
    });

    // Cleanup
    return () => {
      keymap.unregisterCommand('demo.hello');
      keymap.removeKeyBinding('demo.hello.binding');
    };
  }, [keymap]);

  const activeProfileData = profiles.find(p => p.name === activeProfile);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Keymap System Demo</CardTitle>
          <CardDescription>
            Try some keyboard shortcuts to see the keymap system in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Profile:</span>
                <Badge variant="default">{activeProfile}</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Key presses detected:</span>
                <Badge variant="secondary">{keyPressCount}</Badge>
              </div>
              {lastTriggered && (
                <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
                  Last triggered: {lastTriggered}
                </div>
              )}
            </div>

            {/* Profile switcher */}
            <div className="space-y-2">
              <h3 className="font-medium">Switch Profile:</h3>
              <div className="flex gap-2">
                {profiles.map(profile => (
                  <Button
                    key={profile.name}
                    variant={profile.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveProfile(profile.name)}
                  >
                    {profile.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sample shortcuts */}
            <div className="space-y-2">
              <h3 className="font-medium">Try these shortcuts:</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Create new file</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+n')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Save current file</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+s')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Close current tab</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+w')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Demo: Say Hello</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+shift+h')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Next tab</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+tab')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background border rounded">
                  <span className="text-sm">Go to tab 1</span>
                  <Badge variant="outline" className="font-mono">
                    {getHumanReadableKey('cmd+1')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Profile info */}
            {activeProfileData && (
              <div className="space-y-2">
                <h3 className="font-medium">Current Profile Info:</h3>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">
                    <strong>{activeProfileData.name}</strong>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activeProfileData.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {activeProfileData.bindings.length} shortcuts available
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
