import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProjectCard, { ProjectCardData } from '../ProjectCard';
import TemplateDetailView from '../TemplateDetailView';
import { 
  Search,
  Download,
  Star,
  DollarSign,
  Crown,
  Gift,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TemplatesSectionProps {
  onTemplateOpen?: (template: ProjectCardData) => void;
  onTemplateUse?: (template: ProjectCardData) => void;
}

// Mock templates data with enhanced information
const mockTemplates: ProjectCardData[] = [
  {
    id: 'template1',
    name: 'Next.js SaaS Starter Kit',
    description: 'Complete SaaS starter with authentication, payments, dashboard, and multi-tenancy. Production-ready with Stripe integration.',
    author: {
      name: 'SaaS Labs',
      username: 'saaslabs',
      avatar: 'https://images.unsplash.com/photo-1549078642-b2ba4bda0cdb?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
    tags: ['Next.js', 'Stripe', 'Auth', 'Dashboard', 'Premium'],
    stats: {
      stars: 3200,
      forks: 890,
      downloads: 12400,
      views: 45600,
      likes: 1240,
      comments: 234
    },
    featured: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-07-19')
  },
  {
    id: 'template2',
    name: 'React Component Library',
    description: 'Production-ready React components with Storybook, automated testing, and comprehensive documentation.',
    author: {
      name: 'UI Collective',
      username: 'uicollective',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=400&h=200&fit=crop',
    tags: ['React', 'Storybook', 'TypeScript', 'Free'],
    stats: {
      stars: 1890,
      forks: 456,
      downloads: 8900,
      views: 23400,
      likes: 678,
      comments: 123
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-07-17')
  },
  {
    id: 'template3',
    name: 'Cross-Platform Mobile App',
    description: 'React Native template with navigation, state management, push notifications, and offline capabilities.',
    author: {
      name: 'Mobile Masters',
      username: 'mobilemasters',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
    tags: ['React Native', 'Expo', 'Navigation', 'Premium'],
    stats: {
      stars: 1234,
      forks: 234,
      downloads: 5600,
      views: 18900,
      likes: 445,
      comments: 78
    },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-07-14')
  },
  {
    id: 'template4',
    name: 'API Backend Starter',
    description: 'RESTful API template with Docker, PostgreSQL, Redis, authentication, and comprehensive API documentation.',
    author: {
      name: 'Backend Builders',
      username: 'backendbuilders',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=200&fit=crop',
    tags: ['Node.js', 'Docker', 'PostgreSQL', 'Free'],
    stats: {
      stars: 987,
      forks: 178,
      downloads: 3400,
      views: 12300,
      likes: 234,
      comments: 45
    },
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-07-12')
  },
  {
    id: 'template5',
    name: 'E-commerce Platform',
    description: 'Full-featured e-commerce solution with payment processing, inventory management, and admin dashboard.',
    author: {
      name: 'Commerce Co',
      username: 'commerceco',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
    tags: ['E-commerce', 'Payment', 'Inventory', 'Premium'],
    stats: {
      stars: 2100,
      forks: 340,
      downloads: 7800,
      views: 28500,
      likes: 890,
      comments: 145
    },
    featured: true,
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-07-18')
  },
  {
    id: 'template6',
    name: 'Data Visualization Dashboard',
    description: 'Analytics dashboard template with D3.js charts, real-time data, and customizable widgets.',
    author: {
      name: 'DataViz Studio',
      username: 'datavizstudio',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
    },
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
    tags: ['D3.js', 'Analytics', 'Charts', 'Free'],
    stats: {
      stars: 756,
      forks: 123,
      downloads: 2900,
      views: 9800,
      likes: 367,
      comments: 58
    },
    createdAt: new Date('2024-06-12'),
    updatedAt: new Date('2024-07-16')
  }
];

const templateCategories = [
  { id: 'all', label: 'All Templates' },
  { id: 'free', label: 'Free', icon: Gift },
  { id: 'premium', label: 'Premium', icon: Crown },
  { id: 'featured', label: 'Featured', icon: Star }
];

export default function TemplatesSection({
  onTemplateOpen,
  onTemplateUse
}: TemplatesSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [selectedTemplate, setSelectedTemplate] = React.useState<ProjectCardData | null>(null);

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'free') return matchesSearch && template.tags.includes('Free');
    if (activeCategory === 'premium') return matchesSearch && template.tags.includes('Premium');
    if (activeCategory === 'featured') return matchesSearch && template.featured;
    
    return matchesSearch;
  });

  const isPremiumTemplate = (template: ProjectCardData) => {
    return template.tags.includes('Premium');
  };

  const handleTemplateClick = (template: ProjectCardData) => {
    setSelectedTemplate(template);
  };

  const handleTemplateUse = (template: ProjectCardData) => {
    onTemplateUse?.(template);
  };

  if (selectedTemplate) {
    return (
      <TemplateDetailView
        template={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
        onUse={handleTemplateUse}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start your next project with proven, production-ready templates
            </p>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2">
          {templateCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                activeCategory === category.id
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
              }`}
            >
              {category.icon && <category.icon className="h-4 w-4" />}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Try adjusting your search terms or browse different categories
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="relative group">
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 h-80">
                    <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                      <img 
                        src={template.coverImage} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {isPremiumTemplate(template) && (
                          <Badge className="bg-yellow-500/90 text-yellow-900 border-0">
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {template.featured && (
                          <Badge className="bg-emerald-500/90 text-emerald-900 border-0">
                            Featured
                          </Badge>
                        )}
                      </div>

                      {/* Preview Button */}
                      <Button 
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateClick(template);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>

                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate" title={template.name}>
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={template.author.avatar} />
                          <AvatarFallback className="text-xs">
                            {template.author.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {template.author.name}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.filter(tag => !['Premium', 'Free', 'Featured'].includes(tag)).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Stats and Use Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            <span>{(template.stats.downloads / 1000).toFixed(1)}k</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{template.stats.stars}</span>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateUse(template);
                          }}
                          className="h-8 px-3"
                        >
                          {isPremiumTemplate(template) ? (
                            <>
                              <DollarSign className="h-3 w-3 mr-1" />
                              $19
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Use
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      <div className="px-8 py-4 border-t border-border/50">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-600">
              {mockTemplates.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Templates
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {mockTemplates.filter(t => t.tags.includes('Free')).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Free Templates
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {mockTemplates.filter(t => t.tags.includes('Premium')).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Premium Templates
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {mockTemplates.reduce((sum, t) => sum + t.stats.downloads, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Downloads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
