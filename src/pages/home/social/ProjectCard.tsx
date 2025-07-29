import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  GitFork, 
  Download, 
  Eye,
  Heart,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

export interface ProjectCardData {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    username: string;
  };
  coverImage?: string;
  tags: string[];
  stats: {
    stars: number;
    forks: number;
    downloads: number;
    views: number;
    likes: number;
    comments: number;
  };
  featured?: boolean;
  trending?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectCardProps {
  project: ProjectCardData;
  size?: 'small' | 'medium' | 'large';
  onOpen?: (project: ProjectCardData) => void;
  onLike?: (project: ProjectCardData) => void;
  onStar?: (project: ProjectCardData) => void;
  className?: string;
}

export default function ProjectCard({ 
  project, 
  size = 'medium',
  onOpen,
  onLike,
  onStar,
  className 
}: ProjectCardProps) {
  const handleCardClick = () => {
    onOpen?.(project);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const cardHeight = {
    small: 'h-48',
    medium: 'h-64',
    large: 'h-80'
  }[size];

  // If the project is local, wrap the card in a link to /workspace?project=...
  const isLocal = (project as any).path;
  const cardContent = (
    <>
      {/* Cover Image */}
      {project.coverImage && (
        <div className="relative h-36 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-t-lg overflow-hidden">
          <img 
            src={project.coverImage} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-colors" />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {project.featured && (
              <Badge variant="secondary" className="bg-white/90 text-gray-900 border-0 text-xs py-0 h-5">
                Featured
              </Badge>
            )}
            {project.trending && (
              <Badge variant="outline" className="bg-white/90 border-emerald-200 text-emerald-700 text-xs py-0 h-5">
                Trending
              </Badge>
            )}
            {isLocal && (
              <Badge variant="outline" className="bg-white/90 border-blue-200 text-blue-700 text-xs py-0 h-5">
                Local
              </Badge>
            )}
          </div>
          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => handleActionClick(e, () => onStar?.(project))}
            >
              <Star className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary"
              className="h-7 w-7 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => handleActionClick(e, () => onLike?.(project))}
            >
              <Heart className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate" title={project.name}>
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-7 w-7 shrink-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-5 w-5">
            <AvatarImage src={project.author.avatar} />
            <AvatarFallback className="text-[10px]">
              {project.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {project.author.name}
          </span>
        </div>
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4 px-2">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="outline" className="text-[10px] py-0 h-4 px-2">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>{formatNumber(project.stats.stars)}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3" />
              <span>{formatNumber(project.stats.forks)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{formatNumber(project.stats.downloads)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{formatNumber(project.stats.likes)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{formatNumber(project.stats.comments)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // FIX: Only one return statement, valid JSX
  return isLocal ? (
    <Link to="/workspace" search={{ project: (project as any).path }} style={{ textDecoration: 'none', display: 'block' }}>
      <Card className={`group cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 ${cardHeight} ${className}`}>{cardContent}</Card>
    </Link>
  ) : (
    <Card className={`group cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 ${cardHeight} ${className}`} onClick={handleCardClick}>
      {cardContent}
    </Card>
  );

}
