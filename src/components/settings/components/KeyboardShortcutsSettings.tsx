import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Keyboard, Search, Settings, Trash2, Plus, Edit, X, Check } from 'lucide-react';
import { useKeymapStore, useFormattedKeyBindings, useKeyBindingManager, useCommandManager, useKeymapProfiles } from '@/services/keymaps/main';
import type { KeyBinding } from '@/services/keymaps/types';
import { cn } from '@/utils/tailwind';

// Key capture component for VS Code-like experience
const KeyCaptureInput: React.FC<{
  value: string;
  onCapture: (keys: string) => void;
  onCancel: () => void;
  placeholder?: string;
}> = ({ value, onCapture, onCancel, placeholder = "Press desired keys..." }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentKeys, setCurrentKeys] = useState(value);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Meta': 'Cmd',
      'Alt': 'Alt',
      'Shift': 'Shift',
      ' ': 'Space',
      'Escape': 'Esc',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'Enter': 'Enter',
      'Tab': 'Tab',
    };
    return keyMap[key] || key.toUpperCase();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isCapturing) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Ignore certain keys that shouldn't be part of shortcuts
    const ignoredKeys = ['Dead', 'Unidentified', 'Process', 'Compose'];
    if (ignoredKeys.includes(e.key)) return;

    const newPressedKeys = new Set(pressedKeys);
    
    // Add modifier keys
    if (e.ctrlKey) newPressedKeys.add('Ctrl');
    if (e.metaKey) newPressedKeys.add('Cmd');
    if (e.altKey) newPressedKeys.add('Alt');
    if (e.shiftKey && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      newPressedKeys.add('Shift');
    }
    
    // Add the main key (if it's not a modifier)
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      newPressedKeys.add(formatKey(e.key));
    }
    
    setPressedKeys(newPressedKeys);
    
    // Create key combination string
    const modifiers = ['Ctrl', 'Cmd', 'Alt', 'Shift'].filter(mod => newPressedKeys.has(mod));
    const mainKeys = Array.from(newPressedKeys).filter(key => !['Ctrl', 'Cmd', 'Alt', 'Shift'].includes(key));
    const keyCombo = [...modifiers, ...mainKeys].join('+');
    
    setCurrentKeys(keyCombo);
    
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set timeout to finalize the key combination
    timeoutRef.current = setTimeout(() => {
      if (keyCombo && keyCombo !== '') {
        onCapture(keyCombo);
        setIsCapturing(false);
        setPressedKeys(new Set());
      }
      timeoutRef.current = null;
    }, 500); // Wait 500ms after last key press
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (!isCapturing) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Remove the released key from pressed keys
    const newPressedKeys = new Set(pressedKeys);
    
    if (!e.ctrlKey) newPressedKeys.delete('Ctrl');
    if (!e.metaKey) newPressedKeys.delete('Cmd');
    if (!e.altKey) newPressedKeys.delete('Alt');
    if (!e.shiftKey) newPressedKeys.delete('Shift');
    
    // If it's not a modifier key, remove it
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      newPressedKeys.delete(formatKey(e.key));
    }
    
    setPressedKeys(newPressedKeys);

    // If all keys are released and we have a combination, finalize it faster
    if (newPressedKeys.size === 0 && currentKeys) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onCapture(currentKeys);
      setIsCapturing(false);
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
    setCurrentKeys('');
    setPressedKeys(new Set());
    inputRef.current?.focus();
  };

  const stopCapture = () => {
    setIsCapturing(false);
    setPressedKeys(new Set());
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onCancel();
  };

  useEffect(() => {
    if (isCapturing) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keyup', handleKeyUp, true);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keyup', handleKeyUp, true);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [isCapturing, pressedKeys, currentKeys]);

  return (
    <div className="flex items-center gap-2">
      <div
        ref={inputRef}
        tabIndex={0}
        className={cn(
          "flex-1 min-h-[36px] px-3 py-2 text-sm border rounded-md cursor-text",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          isCapturing 
            ? "border-primary bg-primary/5 text-primary" 
            : "border-input bg-background"
        )}
        onClick={startCapture}
      >
        {isCapturing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Press keys:</span>
            <span className="font-mono font-medium">
              {currentKeys || placeholder}
            </span>
            {pressedKeys.size > 0 && (
              <div className="flex gap-1">
                {Array.from(pressedKeys).map(key => (
                  <Badge key={key} variant="secondary" className="text-xs px-1 py-0">
                    {key}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={cn(
            "font-mono",
            currentKeys ? "text-foreground" : "text-muted-foreground"
          )}>
            {currentKeys || placeholder}
          </span>
        )}
      </div>
      
      {isCapturing ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={stopCapture}
          className="px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={startCapture}
          className="px-2"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const KeyboardShortcutsSettings: React.FC = () => {
  const { activeProfile, enabled } = useKeymapStore();
  const { profiles, setActiveProfile } = useKeymapProfiles();
  const { getAllBindings, getBindingsByCategory, searchBindings } = useFormattedKeyBindings();
  const { addKeyBinding, removeKeyBinding, updateKeyBinding } = useKeyBindingManager();
  const { executeCommand } = useCommandManager();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingBinding, setEditingBinding] = useState<KeyBinding | null>(null);

  const categories = ['all', 'file', 'edit', 'view', 'navigation', 'debug', 'terminal', 'custom'];

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

  const handleStartEdit = (binding: KeyBinding) => {
    setEditingBinding(binding);
  };

  const handleKeyCaptured = (binding: KeyBinding, newKey: string) => {
    updateKeyBinding(binding.id, { key: newKey });
    setEditingBinding(null);
  };

  const handleCancelEdit = () => {
    setEditingBinding(null);
  };

  const handleRemoveBinding = (binding: KeyBinding) => {
    if (confirm(`Remove shortcut for "${binding.description}"?`)) {
      removeKeyBinding(binding.id);
    }
  };

  const formatKeyBinding = (key: string) => {
    return key
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join(' + ');
  };

  const activeProfileData = profiles.find(p => p.name === activeProfile);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize your keyboard shortcuts and create your own key bindings
        </p>
      </div>

      <Tabs defaultValue="shortcuts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shortcuts">Current Shortcuts</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Active Shortcuts
              </CardTitle>
              <CardDescription>
                All available keyboard shortcuts for the current profile ({activeProfile})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search shortcuts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by description, command, or key..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredBindings().map((binding) => (
                  <div
                    key={binding.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg transition-colors",
                      binding.enabled ? "hover:bg-muted/50" : "opacity-50 bg-muted/30"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{binding.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {binding.category}
                        </Badge>
                        {!binding.enabled && (
                          <Badge variant="destructive" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{binding.command}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingBinding?.id === binding.id ? (
                        <div className="w-64">
                          <KeyCaptureInput
                            value={binding.key}
                            onCapture={(newKey) => handleKeyCaptured(binding, newKey)}
                            onCancel={handleCancelEdit}
                            placeholder="Press key combination..."
                          />
                        </div>
                      ) : (
                        <>
                          <Badge variant="secondary" className="font-mono">
                            {formatKeyBinding(binding.key)}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleBinding(binding)}
                              title={binding.enabled ? "Disable" : "Enable"}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(binding)}
                              title="Edit shortcut"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTestCommand(binding)}
                              title="Test command"
                            >
                              Test
                            </Button>
                            {binding.category === 'custom' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveBinding(binding)}
                                title="Remove shortcut"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </>
                      )}
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
                Switch between different keymap configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.name}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                      profile.isActive ? "border-primary bg-primary/10" : "hover:bg-muted/50"
                    )}
                    onClick={() => setActiveProfile(profile.name)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{profile.name}</h4>
                        {profile.isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {profile.bindings.length} shortcuts
                      </div>
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
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Custom Shortcuts
              </CardTitle>
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
