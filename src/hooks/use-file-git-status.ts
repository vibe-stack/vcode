import { useGitStore } from '@/stores/git';
import { useMemo } from 'react';

interface MinimalGitStatus {
  workingTreeStatus: string;
  indexStatus: string;
}

export function useFileGitStatus(filePath?: string | null): MinimalGitStatus | null {
  const gitFile = useGitStore(state => state.gitStatus?.files.find(file => file.path === filePath));

  return useMemo(() => {
    if (!filePath || !gitFile) return null;
    return {
      workingTreeStatus: gitFile.workingTreeStatus,
      indexStatus: gitFile.indexStatus
    };
  }, [gitFile, filePath]);
}