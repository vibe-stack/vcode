import React, { useState } from 'react';
import { useMapBuilderStore } from '../store';
import TemplateModal from './TemplateModal';
import ExportDialog from './ExportDialog';
import {
  MousePointer2,
  Move,
  RotateCcw,
  Scale,
  Square,
  Circle,
  Cylinder,
  Triangle,
  RectangleHorizontal,
  Copy,
  Trash2,
  Grid3X3,
  Download,
  Upload,
  FileCode,
  Sparkles,
  Scale3d,
  Move3d,
  Rotate3d,
  DoorOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Toolbar() {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const {
    activeTool,
    activeShape,
    selectedObjectIds,
    grid,
    objects,
    cameraPosition,
    cameraTarget,
    setActiveTool,
    setActiveShape,
    updateGrid,
    duplicateSelected,
    deleteSelected,
    importFromJSON,
    startCreating,
    generateId,
  } = useMapBuilderStore();

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'move', icon: Move3d, label: 'Move' },
    { id: 'rotate', icon: Rotate3d, label: 'Rotate' },
    { id: 'scale', icon: Scale3d, label: 'Scale' },
  ] as const;

  const shapes = [
    { id: 'box', icon: Square, label: 'Box' },
    { id: 'sphere', icon: Circle, label: 'Sphere' },
    { id: 'cylinder', icon: Cylinder, label: 'Cylinder' },
    { id: 'cone', icon: Triangle, label: 'Cone' },
    { id: 'plane', icon: RectangleHorizontal, label: 'Plane' },
    { id: 'door', icon: DoorOpen, label: 'Door' },
  ] as const;

  const handleCreateShape = (shapeType: typeof activeShape) => {
    setActiveShape(shapeType);
    startCreating(shapeType);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          importFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const exportData = {
    objects,
    grid,
    camera: {
      position: cameraPosition,
      target: cameraTarget,
    },
  };

return (
    <div className="bg-gradient-to-br from-black/70 via-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-white/15 rounded-3xl shadow-xl p-5">
      <div className="flex gap-3 items-center flex-wrap">
        {/* Template Button */}
        <Button
          onClick={() => setShowTemplateModal(true)}
          variant="ghost"
          className="rounded-2xl"
        >
          <Sparkles className="w-5 h-5" />
          Templates
        </Button>

        {/* Tools */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 shadow-sm">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-3 rounded-xl transition-all text-lg ${
                  activeTool === tool.id
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={tool.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Shapes */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 shadow-sm">
          {shapes.map((shape) => {
            const Icon = shape.icon;
            return (
              <button
                key={shape.id}
                onClick={() => handleCreateShape(shape.id)}
                className={`p-3 rounded-xl transition-all text-lg ${
                  activeShape === shape.id && activeTool === 'add'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
                title={`Add ${shape.label}`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Grid Controls */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 shadow-sm">
          <button
            onClick={() => updateGrid({ visible: !grid.visible })}
            className={`p-2 rounded-xl transition-all ${
              grid.visible
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <label className="flex items-center gap-1 text-base text-white/80">
            <input
              type="checkbox"
              checked={grid.snapToGrid}
              onChange={(e) => updateGrid({ snapToGrid: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            Snap
          </label>
          <input
            type="number"
            value={grid.divisions}
            onChange={(e) => updateGrid({ divisions: parseInt(e.target.value) || 10 })}
            className="w-20 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 shadow-sm"
            min="1"
            max="100"
            title="Grid Divisions"
          />
        </div>

        {/* Object Actions */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 shadow-sm">
          <button
            onClick={duplicateSelected}
            disabled={selectedObjectIds.length === 0}
            className="p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:bg-white/10 hover:text-white disabled:hover:bg-transparent disabled:hover:text-white/70"
            title="Duplicate Selected"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedObjectIds.length === 0}
            className="p-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:hover:bg-transparent disabled:hover:text-red-400"
            title="Delete Selected"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Export/Import */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setShowExportDialog(true)}
            className="p-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white"
            title="Export Scene"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleImportJSON}
            className="p-3 rounded-xl transition-all text-white/70 hover:bg-white/10 hover:text-white"
            title="Import JSON"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal 
        isOpen={showTemplateModal} 
        onClose={() => setShowTemplateModal(false)} 
      />

      {/* Export Dialog */}
      <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        exportData={exportData}
      />
    </div>
  );
}
