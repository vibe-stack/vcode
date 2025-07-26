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
    <div className="flex h-screen flex-col">
      {/* App Header */}
      <div className="border-b border-border/30 bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {onBack ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Link to={backTo}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* App Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
