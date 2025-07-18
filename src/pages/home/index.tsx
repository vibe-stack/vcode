import React, { useEffect, useState } from "react";
import ToggleTheme from "@/components/ToggleTheme";
import { useTranslation } from "react-i18next";
import Footer from "@/components/template/Footer";
import { useProjectStore } from "@/stores/project";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderOpen,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Settings,
} from "lucide-react";
import GlobalCommands from "@/components/global-commands";
import { SettingsModal } from "@/components/SettingsModal";

export default function HomePage() {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    recentProjects,
    isLoadingRecentProjects,
    isLoadingProject,
    loadRecentProjects,
    openProject,
    removeRecentProject,
    setCurrentProject,
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

  const handleRemoveRecentProject = async (
    projectPath: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    await removeRecentProject(projectPath);
  };

  const formatLastOpened = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col">

      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold">
                {t("welcome", "Welcome to vCode")}
              </h1>
              <p className="text-muted-foreground text-lg">
                {t("subtitle", "Open a project to start coding")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
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
                {isLoadingProject
                  ? "Opening..."
                  : t("openProject", "Open Project")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6"
                disabled
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("newProject", "New Project (Coming Soon)")}
              </Button>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Recent Projects */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Clock className="text-muted-foreground h-5 w-5" />
              <h2 className="text-2xl font-semibold">
                {t("recentProjects", "Recent Projects")}
              </h2>
            </div>

            {isLoadingRecentProjects ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card
                    key={i}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="mb-2 h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentProjects.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <FolderOpen className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {t("noRecentProjects", "No recent projects")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("noRecentProjectsDesc", "Open a project to get started")}
                  </p>
                  <Button
                    onClick={handleOpenProject}
                    disabled={isLoadingProject}
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {t("openProject", "Open Project")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentProjects.map((project) => (
                    <Card
                      key={project.path}
                      className="group cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => handleOpenRecentProject(project.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle
                              className="truncate text-lg"
                              title={project.name}
                            >
                              {project.name}
                            </CardTitle>
                            <CardDescription
                              className="truncate text-sm"
                              title={project.path}
                            >
                              {/* {project.path} */}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) =>
                              handleRemoveRecentProject(project.path, e)
                            }
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
                          <ExternalLink className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
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
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <ToggleTheme />
          </div>
          <Footer />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
