import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Star, 
  Heart, 
  Shield, 
  Clock, 
  GitFork,
  ExternalLink,
  ArrowLeft,
  Copy,
  Code2,
  FileText,
  Image,
  DollarSign
} from 'lucide-react';
import { ProjectCardData } from './ProjectCard';

interface TemplateDetailViewProps {
  template: ProjectCardData;
  onBack: () => void;
  onUse: (template: ProjectCardData) => void;
  onStar?: (template: ProjectCardData) => void;
  onLike?: (template: ProjectCardData) => void;
}

export default function TemplateDetailView({
  template,
  onBack,
  onUse,
  onStar,
  onLike
}: TemplateDetailViewProps) {
  const isPremium = template.tags.includes('Premium');
  
  const features = [
    'Production-ready codebase',
    'Comprehensive documentation',
    'TypeScript support',
    'Testing suite included',
    'CI/CD configuration',
    'Docker containerization',
    'Environment setup scripts',
    'License included'
  ];

  const techStack = template.tags.filter(tag => !['Premium', 'Free', 'Featured'].includes(tag));

  const screenshots = [
    {
      id: '1',
      title: 'Dashboard View',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop'
    },
    {
      id: '2', 
      title: 'Settings Panel',
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
    },
    {
      id: '3',
      title: 'Mobile View',
      url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold">{template.name}</h1>
              {isPremium && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Premium
                </Badge>
              )}
              {template.featured && (
                <Badge variant="outline">Featured</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{template.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onStar?.(template)}
            >
              <Star className="h-4 w-4 mr-2" />
              {template.stats.stars}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onLike?.(template)}
            >
              <Heart className="h-4 w-4 mr-2" />
              {template.stats.likes}
            </Button>
            <Button 
              onClick={() => onUse(template)}
              className="h-9"
            >
              {isPremium ? (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Buy for $19
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Use Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6 space-y-8">
          {/* Hero Image */}
          <section>
            <div className="relative aspect-[2/1] rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
              <img 
                src={template.coverImage} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description & Features */}
              <section>
                <h2 className="text-lg font-medium mb-4">About this template</h2>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-6">
                      This comprehensive template provides everything you need to build a modern, 
                      production-ready application. It includes best practices, security configurations, 
                      and all the tools necessary for rapid development and deployment.
                    </p>
                    
                    <h3 className="font-medium mb-3">What's included:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Screenshots */}
              <section>
                <h2 className="text-lg font-medium mb-4">Screenshots</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {screenshots.map((screenshot) => (
                    <Card key={screenshot.id} className="overflow-hidden border-border/50">
                      <div className="aspect-video bg-muted">
                        <img 
                          src={screenshot.url}
                          alt={screenshot.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">{screenshot.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Tech Stack */}
              <section>
                <h2 className="text-lg font-medium mb-4">Technology stack</h2>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {techStack.map((tech) => (
                        <Badge key={tech} variant="outline" className="px-3 py-1">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Author Info */}
              <Card className="border-border/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Created by</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={template.author.avatar} />
                      <AvatarFallback>{template.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{template.author.name}</div>
                      <div className="text-sm text-muted-foreground">@{template.author.username}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="border-border/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span>Downloads</span>
                    </div>
                    <span className="font-medium">{template.stats.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>Stars</span>
                    </div>
                    <span className="font-medium">{template.stats.stars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <GitFork className="h-4 w-4 text-muted-foreground" />
                      <span>Forks</span>
                    </div>
                    <span className="font-medium">{template.stats.forks.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last updated</span>
                    </div>
                    <span className="font-medium text-sm">
                      {template.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Code2 className="h-4 w-4 mr-2" />
                    View source code
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Read documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy clone URL
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
