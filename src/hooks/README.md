// Performance optimization example for file tree git status

// Before optimization:
// - All FileTreeNode components subscribe to the entire gitStatus object
// - When any file's git status changes, ALL nodes re-render
// - In a project with hundreds of files, this causes major performance issues

// After optimization:
// 1. Created useFileGitStatus hook that only tracks individual file status
// 2. Used React.memo with custom comparison to prevent unnecessary re-renders
// 3. Added git status change detection at store level to prevent redundant updates

/*
Performance improvements:
- Only the specific file node re-renders when its git status changes
- React.memo prevents re-renders when props haven't changed
- Store-level optimization prevents redundant git status updates
- Memoized git status display values (color, icon, tooltip)

This should dramatically improve performance in large projects with many files.
*/

export {};
