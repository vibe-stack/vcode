import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettingsStore } from '@/stores/settings';
import { Settings, Key, Palette, Sliders } from 'lucide-react';

// Import modular components
import { AISettings } from './components/AISettings';
import { KeyboardShortcutsSettings } from './components/KeyboardShortcutsSettings';
import { ThemeSettings } from './components/ThemeSettings';
import { GeneralSettings } from './components/GeneralSettings';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { initialize } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (open) {
      initialize();
    }
  }, [open, initialize]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl md:max-w-6xl w-full h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Sidebar - Categories */}
          <div className="w-64 border-r pr-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="h-full">
              <TabsList className="grid w-full grid-rows-4 h-auto bg-transparent p-0 space-y-1">
                <TabsTrigger 
                  value="general" 
                  className="justify-start w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="theme" 
                  className="justify-start w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Theme & Appearance
                </TabsTrigger>
                <TabsTrigger 
                  value="shortcuts" 
                  className="justify-start w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Keyboard Shortcuts
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="justify-start w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  AI & Agents
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="h-full">
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'theme' && <ThemeSettings />}
              {activeTab === 'shortcuts' && <KeyboardShortcutsSettings />}
              {activeTab === 'ai' && <AISettings />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
