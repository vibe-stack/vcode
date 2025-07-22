import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProjectCard, { ProjectCardData } from '../ProjectCard';
import { 
  TrendingUp, 
  Flame, 
  Clock, 
  Star,
  MessageSquare,
  Share2,
  ArrowRight,
  Users,
  Activity
} from 'lucide-react';

interface TrendingSectionProps {
  onProjectOpen?: (project: ProjectCardData) => void;
  onProjectLike?: (project: ProjectCardData) => void;
  onProjectStar?: (project: ProjectCardData) => void;
}

// Mock data for builders and their shared projects
const mockTrendingProjects: ProjectCardData[] = [
  {
    id: '1',
    name: 'Real-time Chat Application',
    description: 'Built a production-ready chat app with React, Socket.io and Redis. Currently scaling to 10k+ users!',
    author: {
      name: 'Sarah Chen',
      username: 'sarahdev',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop',
    tags: ['React', 'Socket.io', 'Redis', 'Production'],
    stats: {
      stars: 1284,
      forks: 234,
      downloads: 8900,
      views: 23400,
      likes: 567,
      comments: 89
    },
    featured: true,
    trending: true,
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: '2',
    name: 'AI Code Review Assistant',
    description: 'Sharing my side project that analyzes code quality and suggests improvements. Just launched beta!',
    author: {
      name: 'Alex Rodriguez',
      username: 'alexr',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
    tags: ['AI', 'Code Analysis', 'TypeScript', 'Beta'],
    stats: {
      stars: 892,
      forks: 145,
      downloads: 3200,
      views: 15600,
      likes: 423,
      comments: 67
    },
    trending: true,
    createdAt: new Date('2024-07-18'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: '3',
    name: 'Mobile Game Engine',
    description: 'Working on an indie game engine for mobile. Here\'s my progress after 6 months of development.',
    author: {
      name: 'Jordan Kim',
      username: 'jordandev',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&fit=crop',
    tags: ['Game Engine', 'C++', 'Mobile', 'Indie'],
    stats: {
      stars: 1567,
      forks: 89,
      downloads: 1200,
      views: 8900,
      likes: 789,
      comments: 234
    },
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-19')
  },
  {
    id: '4',
    name: 'E-commerce Analytics Dashboard',
    description: 'Built this for my startup - real-time analytics for e-commerce stores. Open sourcing the core!',
    author: {
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    tags: ['Analytics', 'React', 'D3.js', 'Open Source'],
    stats: {
      stars: 634,
      forks: 78,
      downloads: 2100,
      views: 12300,
      likes: 345,
      comments: 56
    },
    createdAt: new Date('2024-07-12'),
    updatedAt: new Date('2024-07-17')
  }
];

const trendingCategories = [
  { id: 'hot', label: 'Hot Right Now', icon: Flame },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'recent', label: 'Just Shared', icon: Clock },
  { id: 'rising', label: 'Rising Stars', icon: Star }
];

export default function TrendingSection({
  onProjectOpen,
  onProjectLike,
  onProjectStar
}: TrendingSectionProps) {
  const [activeCategory, setActiveCategory] = React.useState('hot');

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const builderActivity = [
    {
      id: '1',
      author: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
      action: 'shared a new project',
      project: 'Real-time Chat Application',
      time: new Date('2024-07-20T10:30:00'),
      engagement: { likes: 23, comments: 7 }
    },
    {
      id: '2',
      author: 'Alex Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      action: 'launched beta version of',
      project: 'AI Code Review Assistant',
      time: new Date('2024-07-20T08:15:00'),
      engagement: { likes: 45, comments: 12 }
    },
    {
      id: '3',
      author: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      action: 'open sourced core features of',
      project: 'E-commerce Analytics Dashboard',
      time: new Date('2024-07-19T16:45:00'),
      engagement: { likes: 34, comments: 9 }
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Trending</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover what builders are creating and sharing
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2">
          {trendingCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeCategory === category.id
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
              }`}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6 space-y-8">
          {/* Builder Activity Feed */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Latest from builders</h2>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                View all activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            <Card className="border-border/50">
              <CardContent className="p-0">
                {builderActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== builderActivity.length - 1 ? 'border-b border-border/50' : ''
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activity.avatar} />
                      <AvatarFallback>{activity.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.author}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium text-emerald-600">{activity.project}</span>
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(activity.time)}</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>{activity.engagement.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{activity.engagement.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Trending Projects Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Popular projects this week</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{mockTrendingProjects.length} builders sharing</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTrendingProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  size="medium"
                  onOpen={onProjectOpen}
                  onLike={onProjectLike}
                  onStar={onProjectStar}
                />
              ))}
            </div>
          </section>

          {/* Community Stats */}
          <section>
            <h2 className="text-lg font-medium mb-6">Community highlights</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">
                  {mockTrendingProjects.reduce((sum, p) => sum + p.stats.likes, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Likes this week
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {mockTrendingProjects.reduce((sum, p) => sum + p.stats.comments, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Comments shared
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-purple-600">
                  {mockTrendingProjects.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  New releases
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-yellow-600">
                  {mockTrendingProjects.reduce((sum, p) => sum + p.stats.stars, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Stars earned
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
