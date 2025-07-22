import { ProjectCardData } from '../ProjectCard';
import { RecentProject } from '@/services/project-api';

export const convertRecentProjectToCard = (recentProject: RecentProject): ProjectCardData => {
  return {
    id: recentProject.path,
    name: recentProject.name,
    description: `Local project`,
    author: {
      name: 'You',
      username: 'local',
      avatar: ''
    },
    tags: ['Local', 'Project'],
    stats: {
      stars: 0,
      forks: 0,
      downloads: 0,
      views: 0,
      likes: 0,
      comments: 0
    },
    createdAt: new Date(recentProject.lastOpened),
    updatedAt: new Date(recentProject.lastOpened),
    // Add the path for local identification
    path: recentProject.path
  } as ProjectCardData & { path: string };
};

export const formatLastOpened = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 48) return 'Yesterday';
  if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};
