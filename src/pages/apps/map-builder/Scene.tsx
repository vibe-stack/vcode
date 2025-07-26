import React, { useRef, useEffect, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, TransformControls, Plane } from '@react-three/drei';
import { useMapBuilderStore } from './store';
import MapObjects from './components/MapObjects';
import ObjectCreators from './components/creators';
import SelectionBox from './components/SelectionBox';
import TransformGizmo from './components/TransformGizmo';
import { WebGPURenderer } from 'three/webgpu'
import * as THREE from 'three/webgpu';
import Grid2 from './components/Grid2';
import { useThree } from '@react-three/fiber';

extend(THREE as any);

interface SceneProps {
    onObjectClick?: (objectId: string, event: any) => void;
    onSceneClick?: (event: any) => void;
}

export default function Scene({ onObjectClick, onSceneClick }: SceneProps) {
    const [frameloop, setFrameloop] = useState<'never' | 'always' | 'demand'>('never');
    const { grid, cameraPosition, cameraTarget, isCreating, activeTool, selectedObjectIds } = useMapBuilderStore();

    return (
        <div className="w-full h-full">
            <Canvas
                frameloop={frameloop}
                camera={{
                    position: cameraPosition,
                    fov: 75,
                    near: 0.1,
                    far: 1000,
                }}
                gl={canvas => {
                    const renderer = new WebGPURenderer({
                        canvas: canvas.canvas as HTMLCanvasElement,
                        powerPreference: 'high-performance',
                        antialias: true,
                        alpha: true,
                    })
                    renderer.init().then(() => setFrameloop('always'))
                    return renderer
                }}
                onCreated={({ gl, camera }) => {
                    // WebGPU renderer setup
                    if ('gpu' in navigator) {
                        console.log('WebGPU renderer initialized');
                    }

                    // Enable shadows for WebGPU
                    if (gl.shadowMap) {
                        gl.shadowMap.enabled = true;
                        gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    }

                    // Set camera to look at target
                    camera.lookAt(...cameraTarget);
                }}
                shadows
                onClick={onSceneClick}
            >
                {/* Lighting */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={0.5}
                    shadow-camera-far={500}
                    shadow-camera-left={-50}
                    shadow-camera-right={50}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                />

                {/* Environment */}
                <Environment preset="city" />

                {/* Grid */}
                {grid.visible && (
                    <Grid2
                        args={[grid.size, grid.size]}
                        cellColor="#6f6f6f"
                        sectionColor="#9d4b4b"
                        fadeDistance={100}
                        fadeStrength={1}
                    />
                )}

                {/* Ground plane for shadows */}
                <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -0.01, 0]}
                >
                    <planeGeometry args={[1000, 1000]} />
                    <shadowMaterial transparent opacity={0.2} />
                </mesh>

                {/* Map Objects */}
                <MapObjects onObjectClick={onObjectClick} />

                {/* Transform Controls */}
                <TransformGizmo />

                {/* Object Creators (handles all creation logic) */}
                <ObjectCreators />

                {/* Selection Visualization */}
                <SelectionBox />

                {/* Camera Controls */}
                <OrbitControls
                    target={cameraTarget}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    makeDefault
                    enabled={!isCreating && (activeTool === 'select' || !selectedObjectIds.length)} // Disable when transforming
                />
            </Canvas>
        </div>
    );
}

