import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Timeline } from '@/components/timeline';
import Sidebar from '@/components/timeline/sidebar';
import ProjectCard, { ProjectCardData } from '../ProjectCard';
import {
  ArrowRight,
  Activity,
  Star,
  ExternalLink,
  Code2,
  BookOpen,
  TrendingUp,
  Users
} from 'lucide-react';
import { RecentProject } from '@/services/project-api';

interface HomeSectionProps {
  onProjectOpen?: (project: ProjectCardData) => void;
  onSectionNavigate?: (section: string) => void;
  recentProjects?: RecentProject[];
}

// Mock data for featured content
const featuredProjects: ProjectCardData[] = [
  {
    id: 'featured1',
    name: 'AI Code Assistant Pro',
    description: 'Revolutionary AI-powered coding assistant with context awareness and intelligent refactoring capabilities',
    author: {
      name: 'TechFlow Labs',
      username: 'techflow',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=300&fit=crop',
    tags: ['AI', 'TypeScript', 'Machine Learning', 'Featured'],
    stats: {
      stars: 5400,
      forks: 890,
      downloads: 25600,
      views: 89000,
      likes: 2340,
      comments: 456
    },
    featured: true,
    trending: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-07-20')
  }
];

export default function HomeSection({
  onProjectOpen,
  onSectionNavigate,
  recentProjects = []
}: HomeSectionProps) {
  const quickStats = [
    { label: 'Projects', value: recentProjects.length.toString(), color: 'text-emerald-600', icon: <Code2 className="h-4 w-4" /> },
    { label: 'Community', value: '180K+', color: 'text-blue-600', icon: <Users className="h-4 w-4" /> },
    { label: 'Templates', value: '5.2K+', color: 'text-purple-600', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Stars', value: '12M+', color: 'text-yellow-600', icon: <Star className="h-4 w-4" /> }
  ];

  // TODO: Replace with real user session
  const mockUser = {
    id: 1,
    name: 'Demo User',
    username: 'demouser',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
  };

  const handleUserClick = (username: string) => {
    console.log('Navigate to user:', username);
    // TODO: Implement user profile navigation
  };

  const handleTopicClick = (topic: string) => {
    console.log('Navigate to topic:', topic);
    // TODO: Implement topic/hashtag navigation
  };

  return (
    <div className="flex h-full">
      {/* Left: Timeline Feed */}
      <div className="w-full max-w-xl border-r border-border/50 bg-background">
        <Timeline user={mockUser} />
      </div>

      {/* Center: Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header & Stats Bar */}
        <div className="px-5 py-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-medium text-foreground">Welcome back</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Continue building and discover new projects</p>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => onSectionNavigate?.('my-projects')}
            >
              Continue coding
              <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>
          {/* Minimal Stats Bar */}
          <div className="flex gap-3 items-center mt-3">
            {quickStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 dark:bg-muted/30">
                {React.cloneElement(stat.icon, { className: "h-3 w-3" })}
                <span className={`font-medium text-xs ${stat.color}`}>{stat.value}</span>
                <span className="text-xs text-muted-foreground font-normal">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="px-8 py-6 space-y-8">
            {/* Featured Project */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Featured this week</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSectionNavigate?.('trending')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View all
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              {featuredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border/50">
                  <div className="relative w-full max-h-96 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                    <img
                      src={project.coverImage}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 text-white">
                      <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                      <p className="text-white/90 mb-4 max-w-2xl text-sm">{project.description}</p>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.author.avatar} />
                            <AvatarFallback>{project.author.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{project.author.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {project.stats.stars.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            {project.stats.likes.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="absolute bottom-6 right-6 bg-white text-black hover:bg-white/90"
                      onClick={() => onProjectOpen?.(project)}
                    >
                      Explore
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </section>
            
            {/* Navigation Grid */}
            <section>
              <h2 className="text-lg font-medium mb-6">Quick access</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card
                  className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group"
                  onClick={() => onSectionNavigate?.('my-projects')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <Code2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">My Projects</h3>
                      <p className="text-xs text-muted-foreground">Your workspace</p>
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group"
                  onClick={() => onSectionNavigate?.('trending')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Trending</h3>
                      <p className="text-xs text-muted-foreground">What's popular</p>
                    </div>
                  </div>
                </Card>
                <Card
                  className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group"
                  onClick={() => onSectionNavigate?.('templates')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Templates</h3>
                      <p className="text-xs text-muted-foreground">Start faster</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 cursor-pointer hover:shadow-md transition-all duration-200 border-border/50 group opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <Users className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Community</h3>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}