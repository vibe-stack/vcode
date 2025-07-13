import React, { useEffect } from "react";
import ToggleTheme from "@/components/ToggleTheme";
import { useTranslation } from "react-i18next";
import LangToggle from "@/components/LangToggle";
import Footer from "@/components/template/Footer";
import InitialIcons from "@/components/template/InitialIcons";
import { useProjectStore } from "@/stores/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FolderOpen, 
  Clock, 
  Plus, 
  Trash2,
  ExternalLink
} from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const {
    recentProjects,
    isLoadingRecentProjects,
    isLoadingProject,
    loadRecentProjects,
    openProject,
    removeRecentProject,
    setCurrentProject
  } = useProjectStore();

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleOpenProject = async () => {
    await openProject();
  };

  const handleOpenRecentProject = async (projectPath: string) => {
    await setCurrentProject(projectPath);
  };

  const handleRemoveRecentProject = async (projectPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeRecentProject(projectPath);
  };

  const formatLastOpened = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col p-2">
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('welcome', 'Welcome to vCode')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('subtitle', 'Open a project to start coding')}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex gap-4">
              <Button
                onClick={handleOpenProject}
                size="lg"
                className="h-12 px-6"
                disabled={isLoadingProject}
              >
                <FolderOpen className="mr-2 h-5 w-5" />
                {isLoadingProject ? 'Opening...' : t('openProject', 'Open Project')}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6"
                disabled
              >
                <Plus className="mr-2 h-5 w-5" />
                {t('newProject', 'New Project (Coming Soon)')}
              </Button>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Recent Projects */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">{t('recentProjects', 'Recent Projects')}</h2>
            </div>

            {isLoadingRecentProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('noRecentProjects', 'No recent projects')}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t('noRecentProjectsDesc', 'Open a project to get started')}
                  </p>
                  <Button onClick={handleOpenProject} disabled={isLoadingProject}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {t('openProject', 'Open Project')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentProjects.map((project) => (
                    <Card
                      key={project.path}
                      className="cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => handleOpenRecentProject(project.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate" title={project.name}>
                              {project.name}
                            </CardTitle>
                            <CardDescription className="text-sm truncate" title={project.path}>
                              {project.path}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
                            onClick={(e) => handleRemoveRecentProject(project.path, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {formatLastOpened(new Date(project.lastOpened))}
                          </Badge>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ToggleTheme />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
