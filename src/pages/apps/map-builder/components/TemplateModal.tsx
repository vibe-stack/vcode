import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useMapBuilderStore } from '../store';
import { mapTemplates, createObjectsFromTemplate } from '../templates';
import { 
  Sparkles, 
  Home, 
  Gamepad2, 
  Grid3X3, 
  Shapes,
  X 
} from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateModal({ isOpen, onClose }: TemplateModalProps) {
  const { generateId, objects } = useMapBuilderStore();

  // Dialog handles open state

  const templateIcons = {
    'empty': Sparkles,
    'simple-room': Home,
    'platform-game': Gamepad2,
    'maze-start': Grid3X3,
    'showcase': Shapes,
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = mapTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Check if user wants to replace existing objects
    if (objects.length > 0) {
      const confirmed = window.confirm(
        'Loading a template will replace all current objects. Are you sure?'
      );
      if (!confirmed) return;
    }

    // Clear existing objects and load template
    const { clearSelection, importFromJSON } = useMapBuilderStore.getState();
    clearSelection();
    
    const templateObjects = createObjectsFromTemplate(template, generateId);
    const templateData = {
      objects: templateObjects,
      grid: {
        size: 50,
        divisions: 50,
        visible: true,
        snapToGrid: true,
      },
    };

    importFromJSON(JSON.stringify(templateData));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-6xl md:max-w-7xl w-full max-h-[90vh] overflow-y-auto p-0" showCloseButton={false}>
        <DialogHeader className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Choose a Template</DialogTitle>
              <DialogDescription className="text-white/60">
                Start with a pre-built scene or begin from scratch
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6">
          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapTemplates.map((template) => {
              const Icon = templateIcons[template.id as keyof typeof templateIcons] || Shapes;
              return (
                <button
                  key={template.id}
                  onClick={() => handleLoadTemplate(template.id)}
                  className="group bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-emerald-300 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-white/60 mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <span>{template.objects.length} objects</span>
                        {template.id === 'empty' && (
                          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">
                            Clean Start
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Warning for existing objects */}
          {objects.length > 0 && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-amber-300">
                    Replace Current Scene?
                  </h4>
                  <p className="text-sm text-amber-200/80 mt-1">
                    You currently have {objects.length} object{objects.length !== 1 ? 's' : ''} in your scene. 
                    Loading a template will replace all existing objects.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-white/20 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
