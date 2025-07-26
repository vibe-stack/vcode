import React from 'react';
import { 
  Info, 
  MousePointer, 
  Zap, 
  Grid3X3, 
  Download, 
  Keyboard, 
  X 
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      icon: MousePointer,
      title: 'Click & Drag Creation',
      description: 'Select a shape from the toolbar and click-drag in the scene to create objects with precise sizing.',
    },
    {
      icon: Grid3X3,
      title: 'Grid Snapping',
      description: 'Enable grid snapping for precise placement. Adjust grid size and divisions for different levels of precision.',
    },
    {
      icon: Zap,
      title: 'Rapid Prototyping',
      description: 'Quickly build graybox maps with primitives. Perfect for blocking out game levels or architectural layouts.',
    },
    {
      icon: Download,
      title: 'Export Options',
      description: 'Export your maps as JSON for sharing or as TypeScript files ready to drop into your Three.js projects.',
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description: 'Use V (select), G (move), R (rotate), S (scale), and number keys 1-5 for quick shape creation.',
    },
  ];

  const quickStart = [
    'Click on a shape in the toolbar (Box, Sphere, Cylinder, etc.)',
    'Click and drag in the 3D scene to create the object',
    'Use the properties panel on the right to fine-tune object properties',
    'Enable grid snapping for precise placement',
    'Use keyboard shortcuts for faster workflow',
    'Export your map when ready using the toolbar buttons',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome to Map Builder</h2>
              <p className="text-white/60">
                Your Three.js rapid prototyping tool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">{feature.title}</h3>
                      <p className="text-sm text-white/60">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Start Guide */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-emerald-400" />
              Quick Start Guide
            </h3>
            <ol className="space-y-2">
              {quickStart.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-white/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* WebGPU Notice */}
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-300">
                  WebGPU Renderer
                </h4>
                <p className="text-sm text-amber-200/80 mt-1">
                  This Map Builder is configured to use WebGPU when available for better performance. 
                  It will automatically fall back to WebGL if WebGPU is not supported in your browser.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
