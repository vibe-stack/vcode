import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ProjectCard, { ProjectCardData } from '../ProjectCard';
import ProjectListView from '../ProjectListView';
import { 
  Plus, 
  Search,
  Grid3X3, 
  List,
  ArrowRight,
  FolderOpen,
  Star,
  GitFork,
  Calendar
} from 'lucide-react';
import { RecentProject } from '@/services/project-api';
import { convertRecentProjectToCard } from '../utils/projectHelpers';

interface MyProjectsSectionProps {
  onProjectOpen?: (project: ProjectCardData) => void;
  onCreateNew?: () => void;
  recentProjects?: RecentProject[];
}

const viewModes = [
  { id: 'grid', icon: Grid3X3, label: 'Grid' },
  { id: 'list', icon: List, label: 'List' }
];

const sortOptions = [
  { id: 'updated', label: 'Last updated' },
  { id: 'created', label: 'Date created' },
  { id: 'name', label: 'Name' },
  { id: 'stars', label: 'Stars' }
];

export default function MyProjectsSection({
  onProjectOpen,
  onCreateNew,
  recentProjects = []
}: MyProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState('grid');
  const [sortBy, setSortBy] = React.useState('updated');

  // Convert recent projects to project cards
  const userProjects = recentProjects.map(convertRecentProjectToCard);

  const filteredProjects = userProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">My Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {recentProjects.length} {recentProjects.length === 1 ? 'project' : 'projects'} in your workspace
            </p>
          </div>
          <Button onClick={onCreateNew} size="sm" className="h-9 px-4">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 h-9 border border-border rounded-md bg-background text-sm"
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex border border-border rounded-md">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`p-2 h-9 w-9 ${
                  viewMode === mode.id
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                <mode.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search terms or browse all projects'
                  : 'Create your first project to start building amazing things'
                }
              </p>
              {!searchQuery && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first project
                </Button>
              )}
            </div>
          ) : viewMode === 'list' ? (
                  <ProjectListView
                    projects={filteredProjects.map(p => ({ ...p, path: "" }))}
                    onProjectOpen={onProjectOpen}
                  />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={{ ...project }}
                        size="medium"
                        onOpen={onProjectOpen}
                      />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats Footer */}
      {recentProjects.length > 0 && (
        <div className="px-8 py-4 border-t border-border/50">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">
                {recentProjects.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Projects
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {userProjects.reduce((sum, p) => sum + p.stats.stars, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Stars Earned
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {userProjects.reduce((sum, p) => sum + p.stats.forks, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Forks
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-emerald-600">
                {recentProjects.filter(p => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(p.lastOpened) > monthAgo;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active This Month
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
