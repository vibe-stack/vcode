import React, { useState } from 'react';
import { useMapBuilderStore } from '../store';
import { 
  Eye, 
  EyeOff, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  Square,
  Circle,
  Cylinder,
  Triangle,
  RectangleHorizontal 
} from 'lucide-react';

export default function ObjectList() {
  const {
    objects,
    selectedObjectIds,
    selectObject,
    updateObject,
    deleteObject,
    duplicateSelected,
  } = useMapBuilderStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'box': return Square;
      case 'sphere': return Circle;
      case 'cylinder': return Cylinder;
      case 'cone': return Triangle;
      case 'plane': return RectangleHorizontal;
      default: return Square;
    }
  };

  const handleObjectClick = (objectId: string, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    selectObject(objectId, isMultiSelect);
  };

  const handleVisibilityToggle = (objectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const object = objects.find(obj => obj.id === objectId);
    if (object) {
      updateObject(objectId, {
        material: {
          ...object.material,
          transparent: true,
          opacity: object.material?.opacity === 0 ? 1 : 0,
        }
      });
    }
  };

  const handleDelete = (objectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    deleteObject(objectId);
  };

  const handleDuplicate = (objectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    selectObject(objectId, false);
    duplicateSelected();
  };

  return (
    <div className="w-80 h-[85dvh] max-h-full bg-gradient-to-r from-black/50 via-gray-900/20 to-gray-800/30 backdrop-blur-xl border border-white/15 rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-black/60 to-gray-900/60">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white tracking-tight">Objects</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors shadow-sm"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-sm text-white/50 mt-2 font-medium">
          {objects.length} object{objects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Object List */}
      {!isCollapsed && (
        <div className="overflow-y-auto max-h-96 px-3 py-2">
          {objects.length === 0 ? (
            <div className="p-6 text-center text-white/60">
              <p className="text-base font-medium">No objects in the scene</p>
              <p className="text-xs mt-2 text-white/40">Add objects using the toolbar above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {objects.map((object) => {
                const Icon = getObjectIcon(object.type);
                const isSelected = selectedObjectIds.includes(object.id);
                const isVisible = object.material?.opacity !== 0;

                return (
                  <div
                    key={object.id}
                    onClick={(e) => handleObjectClick(object.id, e)}
                    className={`group relative p-4 rounded-2xl shadow-sm cursor-pointer transition-all border border-transparent ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-400/60 ring-2 ring-emerald-400/40'
                        : 'bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10">
                          <Icon className="w-5 h-5 text-white/70" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold truncate text-white">
                            {object.name || `${object.type}_${object.id.slice(0, 6)}`}
                          </p>
                          <p className="text-xs text-white/50 capitalize mt-0.5">
                            {object.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => handleVisibilityToggle(object.id, e)}
                          className={`p-2 rounded-xl transition-colors shadow-sm ${
                            isVisible
                              ? 'text-white/80 bg-white/5 hover:bg-white/15 hover:text-white'
                              : 'text-white/40 bg-white/5 hover:bg-white/10 hover:text-white/60'
                          }`}
                          title={isVisible ? 'Hide object' : 'Show object'}
                        >
                          {isVisible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={(e) => handleDuplicate(object.id, e)}
                          className="p-2 rounded-xl transition-colors shadow-sm text-white/70 bg-white/5 hover:bg-white/15 hover:text-white"
                          title="Duplicate object"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(object.id, e)}
                          className="p-2 rounded-xl transition-colors shadow-sm text-red-400 bg-white/5 hover:bg-red-500/20 hover:text-red-300"
                          title="Delete object"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
