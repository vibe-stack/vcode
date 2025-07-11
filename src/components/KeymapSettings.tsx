import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  useKeymapProfiles, 
  useFormattedKeyBindings,
  useKeyBindingManager,
  useCommandManager 
} from '@/services/keymaps/hooks';
import { KeyBinding } from '@/services/keymaps/types';
import { getHumanReadableKey } from '@/services/keymaps/utils';

export const KeymapSettings: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile } = useKeymapProfiles();
  const { getAllBindings, getBindingsByCategory, searchBindings } = useFormattedKeyBindings();
  const { addKeyBinding, removeKeyBinding, updateKeyBinding } = useKeyBindingManager();
  const { executeCommand } = useCommandManager();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'file', 'edit', 'view', 'navigation', 'debug', 'custom'];

  const getFilteredBindings = () => {
    let bindings = getAllBindings();
    
    if (searchQuery) {
      bindings = searchBindings(searchQuery);
    }
    
    if (selectedCategory !== 'all') {
      bindings = bindings.filter(b => b.category === selectedCategory);
    }
    
    return bindings;
  };

  const handleToggleBinding = (binding: KeyBinding) => {
    updateKeyBinding(binding.id, { enabled: !binding.enabled });
  };

  const handleTestCommand = (binding: KeyBinding) => {
    executeCommand(binding.command, binding.args);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Keyboard Shortcuts</h1>
        <p className="text-muted-foreground">
          Customize your keyboard shortcuts and create your own key bindings
        </p>
      </div>

      <Tabs defaultValue="shortcuts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Shortcuts</CardTitle>
              <CardDescription>
                All available keyboard shortcuts for the current profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search shortcuts</Label>
                  <Input
                    id="search"
                    placeholder="Search by description, command, or key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="min-w-[120px]">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                {getFilteredBindings().map((binding) => (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{binding.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {binding.category}
                        </Badge>
                        {binding.context && binding.context !== 'global' && (
                          <Badge variant="secondary" className="text-xs">
                            {binding.context}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {binding.command}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {getHumanReadableKey(binding.key)}
                      </Badge>
                      {binding.altKeys && binding.altKeys.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{binding.altKeys.length} more
                        </span>
                      )}
                      <Switch
                        checked={binding.enabled}
                        onCheckedChange={() => handleToggleBinding(binding)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestCommand(binding)}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keymap Profiles</CardTitle>
              <CardDescription>
                Switch between different keymap profiles or create your own
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.name}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      profile.isActive 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveProfile(profile.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.description}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {profile.bindings.length} shortcuts
                        </div>
                      </div>
                      {profile.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Shortcuts</CardTitle>
              <CardDescription>
                Create your own custom keyboard shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Custom shortcut creation coming soon!
                </p>
                <p className="text-sm text-muted-foreground">
                  You can extend the keymap system by adding new commands and bindings
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
