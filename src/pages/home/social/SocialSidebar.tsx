import React from 'react';
import { cn } from '@/utils/tailwind';
import { 
  Home, 
  FolderOpen, 
  TrendingUp, 
  FileText, 
  MessageCircle, 
  Cpu,
  Grid3X3,
  Settings,
  GamepadIcon
} from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  active?: boolean;
  comingSoon?: boolean;
}

interface SocialSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'my-projects', label: 'My Projects', icon: FolderOpen },
  { id: 'apps', label: 'Apps', icon: Grid3X3 },
  { id: 'trending', label: 'Trending', icon: TrendingUp, comingSoon: true },
  { id: 'games', label: 'Games', icon: GamepadIcon, comingSoon: true },
  { id: 'templates', label: 'Templates', icon: FileText, comingSoon: true },
];

export default function SocialSidebar({ 
  activeSection, 
  onSectionChange, 
  className 
}: SocialSidebarProps) {
  return (
    <div className={cn(
      "flex flex-col w-64 bg-background border-r border-border",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">Vibes Social</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover, create, collaborate</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => !item.comingSoon && onSectionChange(item.id)}
                disabled={item.comingSoon}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeSection === item.id && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  item.comingSoon && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {item.comingSoon && (
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-md">
                    Soon
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-accent hover:text-accent-foreground">
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
