
import { GitBranchIcon, PlusIcon, CheckIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import slugify from 'slug';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useGitStore } from '@/stores/git';

export const GitBranchSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Zustand git store
  const branches = useGitStore(s => s.branches);
  const currentBranch = useGitStore(s => s.currentBranch);
  const isLoadingBranches = useGitStore(s => s.isLoadingBranches);
  const loadBranches = useGitStore(s => s.loadBranches);
  const checkoutBranch = useGitStore(s => s.checkoutBranch);
  const isGitRepo = useGitStore(s => s.isGitRepo);
  // For error state, you may want to add error handling to the store if needed

  // Filtered branches by search
  const filteredBranches = useMemo(() => {
    if (!search) return branches;
    return branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  }, [branches, search]);

  // Slug for new branch
  const newBranchSlug = useMemo(() => slugify(search || '', { lower: true }), [search]);
  const branchExists = branches.some((b) => b.name === newBranchSlug);

  // Switch branch
  const handleSwitch = async (branch: string) => {
    await checkoutBranch(branch);
    setOpen(false);
  };

  // Create new branch
  const handleCreate = async () => {
    if (!newBranchSlug || branchExists) return;
    // You may want to add createBranch to the store for consistency
    if (typeof window !== 'undefined' && window.gitApi?.createBranch) {
      await window.gitApi.createBranch(newBranchSlug);
      await checkoutBranch(newBranchSlug);
      setOpen(false);
      setSearch('');
      loadBranches();
    }
  };

  // Load branches when popover opens
  React.useEffect(() => {
    if (open && isGitRepo) loadBranches();
  }, [open, isGitRepo, loadBranches]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-xs text-muted-foreground px-2 py-1 rounded hover:bg-accent/40 transition flex flex-row gap-0.5 items-center"
          aria-label="Switch Git branch"
        >
          <GitBranchIcon className="h-3 w-3" />
          <span className="font-mono ml-1">{currentBranch || '—'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96" align="start">
        <div className="border-b px-3 py-2">
          <input
            className="w-full bg-transparent outline-none text-sm"
            placeholder="Search or create branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {/* You can add error display here if you add error state to the store */}
        <div className="h-56 overflow-y-auto">
          {isLoadingBranches ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
          ) : filteredBranches.length > 0 ? (
            filteredBranches.map((b) => (
              <button
                key={b.name}
                className={`w-full flex items-center px-3 py-2 text-left text-xs cursor-default hover:bg-accent/40 transition ${b.name === currentBranch ? 'font-bold text-primary' : ''}`}
                onClick={() => handleSwitch(b.name)}
                disabled={b.name === currentBranch}
              >
                {b.name === currentBranch ? <CheckIcon className="w-3 h-3 mr-2" /> : <span className="w-3 h-3 mr-2" />}
                <span className="font-mono">{b.name}</span>
              </button>
            ))
          ) : search && newBranchSlug && !branchExists ? (
            <button
              className="w-full flex items-center text-xs px-3 py-2 text-left cursor-default hover:bg-accent/40 transition"
              onClick={handleCreate}
            >
              <PlusIcon className="w-3 h-3 mr-2" />
              <span className="font-mono">Create branch "{newBranchSlug}"</span>
            </button>
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground">No branches found.</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}