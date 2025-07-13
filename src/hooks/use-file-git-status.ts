import { useGitStore } from '@/stores/git';
import { GitFileStatus } from '@/services/git-api';
import { useMemo } from 'react';

/**
 * Custom hook to get git status for a specific file path.
 * This hook provides better performance by using memoization to prevent
 * unnecessary re-renders when the file's status hasn't changed.
 */
export function useFileGitStatus(filePath?: string | null): GitFileStatus | null {
  // Get the git status from the store
  const gitStatus = useGitStore(state => state.gitStatus);
  
  // Use useMemo to prevent unnecessary re-renders
  const fileGitStatus = useMemo(() => {
    if (!gitStatus || !filePath) return null;

    const fileStatus = gitStatus.files.find((f: any) => f.path === filePath);
    return fileStatus || null;
  }, [gitStatus, filePath]);

  if (!filePath) return null;

  return fileGitStatus;
}
