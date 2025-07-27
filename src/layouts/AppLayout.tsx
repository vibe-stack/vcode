import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon: React.ElementType;
  onBack?: () => void;
  backTo?: string;
}

export default function AppLayout({ 
  children, 
  title, 
  description, 
  icon: Icon,
  onBack,
  backTo = "/"
}: AppLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
