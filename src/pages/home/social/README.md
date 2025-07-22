# Social IDE Components

This directory contains the components for the social IDE interface, reimagining the start screen as a social space for developers.

## Overview

The social IDE combines GitHub-like project discovery with Steam-like user experience, creating a community-driven development environment.

## Components

### Core Layout
- **SocialApp** - Main container component that manages the application state
- **SocialLayout** - Layout wrapper that provides the sidebar + content structure
- **SocialSidebar** - Navigation sidebar with sections and settings

### UI Components
- **ProjectCard** - Reusable card component for displaying projects with social stats
- **utils/projectHelpers** - Utility functions for converting data types

### Sections

#### Home (`HomeSection`)
- Steam-like home view combining the best of all sections
- Featured projects with hero display
- Quick action cards for navigation
- Recent community activity feed
- Personal project stats

#### My Projects (`MyProjectsSection`)
- Personal project library (like Steam's library)
- Grid/list view toggles
- Search and filtering
- Integration with existing recent projects
- Project statistics dashboard

#### Trending (`TrendingSection`)
- Community project discovery
- Hot, trending, recent, and popular filters
- Large project cards with cover images
- Social engagement features (stars, likes, comments)

#### Templates (`TemplatesSection`)
- Starter template marketplace
- Free and premium templates
- Category filtering and search
- Template usage with one-click setup

#### Messages (`MessagesSection`)
- Coming soon - Community messaging
- Collaboration features planned

#### MCP (`MCPSection`)
- Coming soon - Model Context Protocol integration
- AI-powered development tools

## Features

### Social Features
- Project starring and liking
- Community trending projects
- Author profiles and avatars
- Social stats (stars, forks, downloads, views, likes, comments)
- Template marketplace with free/premium options

### Design System
- Black/white/emerald color scheme
- Consistent card-based layouts
- Hover effects and smooth transitions
- Mobile-responsive design
- Accessibility considerations

### Integration
- Real recent projects from project store
- Navigation to workspace when opening projects
- Template usage for new project creation
- Settings integration

## Usage

```tsx
import { SocialApp } from '@/components/social';

export default function HomePage() {
  return <SocialApp />;
}
```

## Future Enhancements

1. **API Integration** - Connect to backend services for social features
2. **Real Templates** - Template repository with cloning functionality
3. **Messaging System** - Real-time communication between developers
4. **MCP Integration** - AI-powered code assistance and analysis
5. **Project Sharing** - Publish and discover community projects
6. **Collaboration Tools** - Multi-developer project features
