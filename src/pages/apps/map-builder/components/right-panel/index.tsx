import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PropertiesTab } from './properties/index';
import { ChatPanel } from '../chat';

export default function RightPanel() {
  return (
    <div className="w-80 h-[85dvh] max-h-full bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-4 overflow-hidden flex flex-col">
      <Tabs defaultValue="properties" className="flex-1 flex flex-col bg-transparent">
        <TabsList className="grid w-full grid-cols-2 bg-white/10 border border-white/20">
          <TabsTrigger 
            value="properties" 
            className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20"
          >
            Properties
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/20"
          >
            Chat
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="flex-1 overflow-y-auto mt-4">
          <PropertiesTab />
        </TabsContent>
        
        <TabsContent value="chat" className="flex-1 overflow-y-auto mt-4">
            <ChatPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
   