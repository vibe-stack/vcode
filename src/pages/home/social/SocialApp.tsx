import React, { useState, useEffect } from 'react';
import SocialLayout from './SocialLayout';
import SocialSidebar from './SocialSidebar';
import HomeSection from './sections/HomeSection';
import MyProjectsSection from './sections/MyProjectsSection';
import TrendingSection from './sections/TrendingSection';
import TemplatesSection from './sections/TemplatesSection';
import AppsSection from './sections/AppsSection';
import MessagesSection from './sections/MessagesSection';
import MCPSection from './sections/MCPSection';
import { ProjectCardData } from './ProjectCard';
import { useProjectStore } from '@/stores/project';

export default function SocialApp() {
  const [activeSection, setActiveSection] = useState('home');
  const { 
    setCurrentProject, 
    openProject, 
    loadRecentProjects,
    recentProjects 
  } = useProjectStore();

  // Load recent projects on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  const handleProjectOpen = (project: ProjectCardData) => {
    // If it's a local project (has a path), navigate to workspace with project param
    if ((project as any).path) {
      window.location.href = `/workspace?project=${encodeURIComponent((project as any).path)}`;
    } else {
      // For social projects, we'd need to clone/download them first
      console.log('Opening social project:', project);
      // This would typically involve:
      // 1. Clone the repository
      // 2. Set up the local project
      // 3. Open it in the IDE
    }
  };

  const handleProjectLike = (project: ProjectCardData) => {
    console.log('Liking project:', project.name);
    // TODO: Implement like functionality with API
  };

  const handleProjectStar = (project: ProjectCardData) => {
    console.log('Starring project:', project.name);
    // TODO: Implement star functionality with API
  };

  const handleTemplateUse = async (template: ProjectCardData) => {
    console.log('Using template:', template.name);
    // TODO: Implement template usage
    // This would involve:
    // 1. Clone the template
    // 2. Set up a new project
    // 3. Open it in the IDE
  };

  const handleCreateNew = async () => {
    try {
      await openProject();
    } catch (error) {
      console.error('Error creating new project:', error);
    }
  };

  const handleSectionNavigate = (section: string) => {
    setActiveSection(section);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <HomeSection
            onProjectOpen={handleProjectOpen}
            onSectionNavigate={handleSectionNavigate}
            recentProjects={recentProjects}
          />
        );
      case 'my-projects':
        return (
          <MyProjectsSection
            onProjectOpen={handleProjectOpen}
            onCreateNew={handleCreateNew}
            recentProjects={recentProjects}
          />
        );
      case 'trending':
        return (
          <TrendingSection
            onProjectOpen={handleProjectOpen}
            onProjectLike={handleProjectLike}
            onProjectStar={handleProjectStar}
          />
        );
      case 'templates':
        return (
          <TemplatesSection
            onTemplateOpen={handleProjectOpen}
            onTemplateUse={handleTemplateUse}
          />
        );
      case 'apps':
        return <AppsSection onCreateProject={handleCreateNew} />;
      case 'messages':
        return <MessagesSection />;
      case 'mcp':
        return <MCPSection />;
      default:
        return (
          <HomeSection
            onProjectOpen={handleProjectOpen}
            onSectionNavigate={handleSectionNavigate}
            recentProjects={recentProjects}
          />
        );
    }
  };

  return (
    <SocialLayout
      sidebar={
        <SocialSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
    >
      {renderActiveSection()}
    </SocialLayout>
  );
}
