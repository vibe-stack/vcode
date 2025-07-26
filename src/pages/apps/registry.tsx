import { GamepadIcon, Video } from 'lucide-react';
import React from 'react';

export interface AppCardData {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  requiresProject?: boolean;
  featured?: boolean;
  tags: string[];
  route: string;
}

export const devApps: AppCardData[] = [
  {
    id: 'screen-recorder',
    name: 'Screen Recorder',
    description: 'Record your screen and create demos, tutorials, or bug reports with native performance.',
    icon: Video,
    category: 'Media',
    requiresProject: false,
    featured: false,
    tags: ['recording', 'demo', 'tutorial', 'native'],
    route: '/apps/screen-recorder'
  },
  {
    id: "map-builder",
    name: "Map Builder",
    description: "Create and edit maps with an intuitive interface, perfect for game development or simulations.",
    icon: GamepadIcon,
    category: "3D Tools",
    requiresProject: false,
    featured: true,
    tags: ["map", "editor", "game", "simulation"],
    route: "/apps/map-builder"
  }
];