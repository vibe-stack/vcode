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
    <div className="w-80 max-h-full bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Objects</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-sm text-white/60 mt-1">
          {objects.length} object{objects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Object List */}
      {!isCollapsed && (
        <div className="overflow-y-auto max-h-96">
          {objects.length === 0 ? (
            <div className="p-4 text-center text-white/60">
              <p>No objects in the scene</p>
              <p className="text-xs mt-1 text-white/40">Add objects using the toolbar above</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {objects.map((object) => {
                const Icon = getObjectIcon(object.type);
                const isSelected = selectedObjectIds.includes(object.id);
                const isVisible = object.material?.opacity !== 0;

                return (
                  <div
                    key={object.id}
                    onClick={(e) => handleObjectClick(object.id, e)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-l-2 border-emerald-400'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Icon className="w-4 h-4 text-white/60 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-white">
                            {object.name || `${object.type}_${object.id.slice(0, 6)}`}
                          </p>
                          <p className="text-xs text-white/50 capitalize">
                            {object.type}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Visibility Toggle */}
                        <button
                          onClick={(e) => handleVisibilityToggle(object.id, e)}
                          className={`p-1 rounded-lg transition-colors ${
                            isVisible
                              ? 'text-white/70 hover:bg-white/10 hover:text-white'
                              : 'text-white/40 hover:bg-white/10 hover:text-white/60'
                          }`}
                          title={isVisible ? 'Hide object' : 'Show object'}
                        >
                          {isVisible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3" />
                          )}
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={(e) => handleDuplicate(object.id, e)}
                          className="p-1 rounded-lg transition-colors text-white/70 hover:bg-white/10 hover:text-white"
                          title="Duplicate object"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(object.id, e)}
                          className="p-1 rounded-lg transition-colors text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          title="Delete object"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Object Details */}
                    {isSelected && (
                      <div className="mt-2 text-xs text-white/60 space-y-1">
                        <div>
                          Position: ({object.position.map(v => v.toFixed(1)).join(', ')})
                        </div>
                        <div>
                          Scale: ({object.scale.map(v => v.toFixed(1)).join(', ')})
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Color:</span>
                          <div
                            className="w-3 h-3 rounded border border-white/30"
                            style={{ backgroundColor: object.color }}
                          />
                          <span>{object.color}</span>
                        </div>
                      </div>
                    )}
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
