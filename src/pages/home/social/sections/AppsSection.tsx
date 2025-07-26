import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import {
    Search,
    Video,
    Package,
    ArrowRight,
    FolderOpen,
    Star,
    Download
} from 'lucide-react';
import { AppCardData, devApps } from '@/pages/apps/registry';



interface AppsSectionProps {
    onCreateProject?: () => void;
}



const categories = ['All', 'Media', '3D Tools', 'Code Tools', 'Utilities'];

export default function AppsSection({ onCreateProject }: AppsSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredApps = devApps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const featuredApps = filteredApps.filter(app => app.featured);
    const regularApps = filteredApps.filter(app => !app.featured);

    return (
        <div className="flex h-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border/30">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Developer Apps</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Productivity tools and utilities built right into your IDE
                            </p>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search apps..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            {categories.map((category) => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                    className="text-xs"
                                >
                                    {category}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Featured Apps */}
                    {featuredApps.length > 0 && (
                        <section className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                Featured Apps
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {featuredApps.map((app) => (
                                    <AppCard
                                        key={app.id}
                                        app={app}
                                        featured
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* All Apps */}
                    {regularApps.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-4">
                                All Apps ({filteredApps.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {regularApps.map((app) => (
                                    <AppCard
                                        key={app.id}
                                        app={app}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* No Results */}
                    {filteredApps.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No apps found</h3>
                            <p className="text-muted-foreground max-w-md">
                                Try adjusting your search or category filter to find what you're looking for.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface AppCardProps {
    app: AppCardData;
    featured?: boolean;
}

function AppCard({ app, featured = false }: AppCardProps) {
    const Icon = app.icon;

    return (
        <Link to={app.route}>
            <Card className={`p-5 cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 group ${featured ? 'bg-gradient-to-br from-background to-accent/5' : ''
                }`}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${featured
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
                            : 'bg-accent text-accent-foreground'
                        }`}>
                        <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {app.name}
                            </h3>
                            {featured && (
                                <Badge variant="secondary" className="text-xs">
                                    Featured
                                </Badge>
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {app.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                            {app.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs py-0 px-2">
                                    {tag}
                                </Badge>
                            ))}
                            {app.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs py-0 px-2">
                                    +{app.tags.length - 3}
                                </Badge>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                    {app.category}
                                </Badge>
                                {app.requiresProject && (
                                    <div className="flex items-center gap-1">
                                        <FolderOpen className="h-3 w-3" />
                                        <span>Requires project</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                            >
                                Open
                                <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
