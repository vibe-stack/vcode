import React from 'react';
import { cn } from '@/utils/tailwind';

interface SocialLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function SocialLayout({ 
  sidebar, 
  children, 
  className 
}: SocialLayoutProps) {
  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Sidebar */}
      {sidebar}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
