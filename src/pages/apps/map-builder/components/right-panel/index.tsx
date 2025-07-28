import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PropertiesTab } from './properties/index';
import { ChatPanel } from '../chat';
// import { NewChatPanel } from '../chat/new-chat-panel';

export default function RightPanel() {
    return (
        <div className="w-96 h-[85dvh] max-h-full bg-gradient-to-br from-black/70 via-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/15 rounded-3xl shadow-xl p-6 overflow-hidden flex flex-col">
            <Tabs defaultValue="properties" className="flex-1 flex flex-col bg-transparent h-full max-h-full">
                <TabsList className="flex w-full gap-2 bg-white/5 border border-white/15 rounded-xl p-1 mb-2 shadow-sm">
                    <TabsTrigger
                        value="properties"
                        className="flex-1 py-2 px-4 rounded-lg text-base font-semibold text-white/80 transition-colors data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-200 data-[state=active]:shadow data-[state=active]:border-emerald-400 border border-transparent"
                    >
                        Properties
                    </TabsTrigger>
                    <TabsTrigger
                        value="chat"
                        className="flex-1 py-2 px-4 rounded-lg text-base font-semibold text-white/80 transition-colors data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-200 data-[state=active]:shadow data-[state=active]:border-emerald-400 border border-transparent"
                    >
                        Chat
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="flex-1 overflow-y-auto mt-4">
                    <PropertiesTab />
                </TabsContent>

                <TabsContent value="chat" className="flex-1 overflow-hidden mt-4 flex flex-col h-full">
                    <ChatPanel />
                    {/* <NewChatPanel /> */}
                </TabsContent>
            </Tabs>
        </div>
    );
}
