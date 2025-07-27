import React from 'react';
import { useMapBuilderStore } from '../../../store';
import { ObjectInfo } from './object-info';
import { TransformSettings } from './transform-settings';
import { MaterialSettings } from './material-settings';
import { GeometrySettings } from './geometry-settings';

export function PropertiesTab() {
    const { selectedObjectIds, getObjectById } = useMapBuilderStore();

    if (selectedObjectIds.length === 0) {
        return (
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
                <div className="flex items-center justify-center h-32">
                    <p className="text-white/60 text-center">Select an object to edit its properties</p>
                </div>
            </div>
        );
    }

    if (selectedObjectIds.length > 1) {
        return (
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-white">Properties</h3>
                <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <p className="text-white/60">
                            Multiple objects selected ({selectedObjectIds.length})
                        </p>
                        <p className="text-sm text-white/40 mt-2">
                            Please select a single object to view and edit its properties.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const selectedObject = getObjectById(selectedObjectIds[0]);
    if (!selectedObject) return null;

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Properties</h3>

            <ObjectInfo object={selectedObject} />
            <TransformSettings object={selectedObject} />
            <GeometrySettings object={selectedObject} />
            <MaterialSettings object={selectedObject} />
        </div>
    );
}
