import React from 'react';
import { useMapBuilderStore } from '../store';

export default function PropertiesPanel() {
  const { 
    selectedObjectIds, 
    objects, 
    updateObject,
    getObjectById 
  } = useMapBuilderStore();

  if (selectedObjectIds.length === 0) {
    return (
      <div className="w-80 max-h-full bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
        <p className="text-white/60">Select an object to edit its properties</p>
      </div>
    );
  }

  if (selectedObjectIds.length > 1) {
    return (
      <div className="w-80 max-h-full bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
        <p className="text-white/60">
          Multiple objects selected ({selectedObjectIds.length})
        </p>
        <p className="text-sm text-white/40 mt-2">
          Multi-object editing coming soon...
        </p>
      </div>
    );
  }

  const selectedObject = getObjectById(selectedObjectIds[0]);
  if (!selectedObject) return null;

  const handleUpdateProperty = (property: string, value: any) => {
    updateObject(selectedObject.id, { [property]: value });
  };

  const handleUpdatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = [...selectedObject.position] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[axisIndex] = value;
    updateObject(selectedObject.id, { position: newPosition });
  };

  const handleUpdateRotation = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation = [...selectedObject.rotation] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newRotation[axisIndex] = (value * Math.PI) / 180; // Convert degrees to radians
    updateObject(selectedObject.id, { rotation: newRotation });
  };

  const handleUpdateScale = (axis: 'x' | 'y' | 'z', value: number) => {
    const newScale = [...selectedObject.scale] as [number, number, number];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newScale[axisIndex] = Math.max(0.1, value);
    updateObject(selectedObject.id, { scale: newScale });
  };

  const handleUniformScale = (value: number) => {
    const scale = Math.max(0.1, value);
    updateObject(selectedObject.id, { 
      scale: [scale, scale, scale] as [number, number, number] 
    });
  };

  return (
    <div className="w-80 max-h-full bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
      
      {/* Object Info */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Name</label>
        <input
          type="text"
          value={selectedObject.name || ''}
          onChange={(e) => handleUpdateProperty('name', e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Type</label>
        <div className="px-3 py-2 bg-white/10 rounded-lg text-sm capitalize text-white/80">
          {selectedObject.type}
        </div>
      </div>

      {/* Position */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Position</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-white/50 mb-1">X</label>
            <input
              type="number"
              step="0.1"
              value={selectedObject.position[0].toFixed(2)}
              onChange={(e) => handleUpdatePosition('x', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Y</label>
            <input
              type="number"
              step="0.1"
              value={selectedObject.position[1].toFixed(2)}
              onChange={(e) => handleUpdatePosition('y', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Z</label>
            <input
              type="number"
              step="0.1"
              value={selectedObject.position[2].toFixed(2)}
              onChange={(e) => handleUpdatePosition('z', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Rotation (degrees)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-white/50 mb-1">X</label>
            <input
              type="number"
              step="1"
              value={((selectedObject.rotation[0] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('x', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Y</label>
            <input
              type="number"
              step="1"
              value={((selectedObject.rotation[1] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('y', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Z</label>
            <input
              type="number"
              step="1"
              value={((selectedObject.rotation[2] * 180) / Math.PI).toFixed(1)}
              onChange={(e) => handleUpdateRotation('z', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Scale</label>
        
        {/* Uniform Scale */}
        <div className="mb-3">
          <label className="block text-xs text-white/50 mb-1">Uniform</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={selectedObject.scale[0].toFixed(2)}
            onChange={(e) => handleUniformScale(parseFloat(e.target.value) || 0.1)}
            className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Individual Scale */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-white/50 mb-1">X</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={selectedObject.scale[0].toFixed(2)}
              onChange={(e) => handleUpdateScale('x', parseFloat(e.target.value) || 0.1)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Y</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={selectedObject.scale[1].toFixed(2)}
              onChange={(e) => handleUpdateScale('y', parseFloat(e.target.value) || 0.1)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Z</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={selectedObject.scale[2].toFixed(2)}
              onChange={(e) => handleUpdateScale('z', parseFloat(e.target.value) || 0.1)}
              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedObject.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="w-12 h-8 border border-white/20 rounded-lg cursor-pointer bg-white/10"
          />
          <input
            type="text"
            value={selectedObject.color}
            onChange={(e) => handleUpdateProperty('color', e.target.value)}
            className="flex-1 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Material Properties */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Material</label>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">Metalness</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedObject.material?.metalness || 0}
              onChange={(e) => handleUpdateProperty('material', {
                ...selectedObject.material,
                metalness: parseFloat(e.target.value)
              })}
              className="w-full accent-emerald-500"
            />
            <span className="text-xs text-white/60">
              {(selectedObject.material?.metalness || 0).toFixed(1)}
            </span>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Roughness</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedObject.material?.roughness || 0.5}
              onChange={(e) => handleUpdateProperty('material', {
                ...selectedObject.material,
                roughness: parseFloat(e.target.value)
              })}
              className="w-full accent-emerald-500"
            />
            <span className="text-xs text-white/60">
              {(selectedObject.material?.roughness || 0.5).toFixed(1)}
            </span>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedObject.material?.transparent || false}
                onChange={(e) => handleUpdateProperty('material', {
                  ...selectedObject.material,
                  transparent: e.target.checked
                })}
                className="rounded accent-emerald-500"
              />
              <span className="text-sm text-white/80">Transparent</span>
            </label>
          </div>

          {selectedObject.material?.transparent && (
            <div>
              <label className="block text-xs text-white/50 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedObject.material?.opacity || 1}
                onChange={(e) => handleUpdateProperty('material', {
                  ...selectedObject.material,
                  opacity: parseFloat(e.target.value)
                })}
                className="w-full accent-emerald-500"
              />
              <span className="text-xs text-white/60">
                {(selectedObject.material?.opacity || 1).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
