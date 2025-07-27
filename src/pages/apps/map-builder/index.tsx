import React, { useState, useEffect } from 'react';
import AppLayout from "@/layouts/AppLayout";
import { GamepadIcon } from "lucide-react";
import Scene from './Scene';
import Toolbar from './components/Toolbar';
import ObjectList from './components/ObjectList';
import WelcomeModal from './components/WelcomeModal';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { useMapBuilderStore } from './store';
import RightPanel from './components/right-panel';

export default function MapBuilderPage() {
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const { shortcuts } = useKeyboardShortcuts();
    const { 
        selectObject, 
        clearSelection, 
        finishCreating, 
        cancelCreating, 
        isCreating,
        activeTool,
        objects,
        selectedObjectIds
    } = useMapBuilderStore();

    // Show welcome modal on first visit
    useEffect(() => {
        const hasVisited = localStorage.getItem('mapbuilder-visited');
        if (!hasVisited) {
            setShowWelcome(true);
            localStorage.setItem('mapbuilder-visited', 'true');
        }
    }, []);

    const handleObjectClick = (objectId: string, event: any) => {
        const isMultiSelect = event.nativeEvent?.ctrlKey || event.nativeEvent?.metaKey;
        selectObject(objectId, isMultiSelect);
    };

    const handleSceneClick = (event: any) => {
        // Only handle scene clicks when not creating objects
        if (!isCreating) {
            // Clear selection when clicking on empty space
            if (event.target === event.currentTarget) {
                clearSelection();
            }
        }
        // Note: Object creation is now handled by individual creator components
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape' && isCreating) {
            cancelCreating();
        }
    };

    return (
        <AppLayout
            title="Map Builder"
            description="Create and edit maps with an intuitive interface, perfect for game development or simulations."
            icon={GamepadIcon}
            backTo="/?section=apps"
        >
            <div 
                className="relative flex-1 h-full w-full bg-background"
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                {/* Full-width 3D Scene Background */}
                <div className="absolute inset-0">
                    <Scene 
                        onObjectClick={handleObjectClick}
                        onSceneClick={handleSceneClick}
                    />
                </div>
                
                {/* Floating Toolbar */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <Toolbar />
                </div>
                
                {/* Floating Object List Sidebar */}
                <div className="absolute left-4 top-20 bottom-4 z-10">
                    <ObjectList />
                </div>
                
                {/* Floating Properties Panel */}
                <div className="absolute right-4 top-20 bottom-4 z-10">
                    <RightPanel />
                </div>
                
                {/* Status Bar */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm z-10">
                    <div className="flex items-center gap-6">
                        <span>Tool: <strong className="capitalize text-emerald-400">{activeTool}</strong></span>
                        <span>Objects: <strong className="text-emerald-400">{objects.length}</strong></span>
                        {selectedObjectIds.length > 0 && (
                            <span>Selected: <strong className="text-emerald-400">{selectedObjectIds.length}</strong></span>
                        )}
                        {selectedObjectIds.length === 1 && ['move', 'rotate', 'scale'].includes(activeTool) && (
                            <span className="text-emerald-300">
                                Use gizmo to transform object
                            </span>
                        )}
                        {isCreating && (
                            <span className="text-emerald-300">
                                Creating object - Click & drag to size, ESC to cancel
                            </span>
                        )}
                        <button
                            onClick={() => setShowShortcuts(!showShortcuts)}
                            className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
                        >
                            Shortcuts
                        </button>
                        <button
                            onClick={() => setShowWelcome(true)}
                            className="text-emerald-400 hover:text-emerald-300 underline transition-colors"
                        >
                            Help
                        </button>
                    </div>
                </div>

                {/* Keyboard Shortcuts Overlay */}
                {showShortcuts && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                                <button
                                    onClick={() => setShowShortcuts(false)}
                                    className="text-white/60 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-3">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <span className="font-mono bg-white/10 text-emerald-300 px-3 py-1.5 rounded-lg">
                                            {shortcut.key}
                                        </span>
                                        <span className="text-white/80">
                                            {shortcut.description}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Welcome Modal */}
            <WelcomeModal 
                isOpen={showWelcome} 
                onClose={() => setShowWelcome(false)} 
            />
        </AppLayout>
    );
}