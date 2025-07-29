import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Star, 
  GitFork, 
  Download, 
  Activity,
  MoreHorizontal,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { ProjectCardData } from './ProjectCard';
import { Link } from '@tanstack/react-router';

interface ProjectListViewProps {
  projects: ProjectCardData[];
  onProjectOpen?: (project: ProjectCardData) => void;
  onProjectLike?: (project: ProjectCardData) => void;
  onProjectStar?: (project: ProjectCardData) => void;
}

function formatDate(date: Date) {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

function formatNumber(num: number) {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

export default function ProjectListView({
  projects,
  onProjectOpen,
  onProjectLike,
  onProjectStar
}: ProjectListViewProps) {
  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const isLocal = (project as any).path;
        const card = (
          <Card 
            key={project.id} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer border-border/50"
            onClick={() => onProjectOpen?.(project)}
          >
            <div className="flex items-center gap-4">
              {/* Project thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 flex-shrink-0">
                {project.coverImage ? (
                  <img 
                    src={project.coverImage} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ExternalLink className="h-6 w-6 text-emerald-600" />
                  </div>
                )}
              </div>
              {/* Project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate" title={project.name}>
                        {project.name}
                      </h3>
                      {project.featured && (
                        <Badge variant="secondary" className="text-xs py-0 h-5">
                          Featured
                        </Badge>
                      )}
                      {project.trending && (
                        <Badge variant="outline" className="text-xs py-0 h-5 border-emerald-200 text-emerald-700">
                          Trending
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={project.author.avatar} />
                          <AvatarFallback className="text-[10px]">
                            {project.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{project.author.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {formatDate(project.updatedAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4 px-2">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{project.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>{formatNumber(project.stats.stars)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      <span>{formatNumber(project.stats.forks)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{formatNumber(project.stats.downloads)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-4 w-4" />
                      <span>{formatNumber(project.stats.likes)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectStar?.(project);
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectLike?.(project);
                      }}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
        if (isLocal) {
          return (
            <Link key={project.id} to="/workspace" search={{ project: (project as any).path }} style={{ textDecoration: 'none', display: 'block' }}>
              {card}
            </Link>
          );
        }
        return card;
      })}
    </div>
  );
}
