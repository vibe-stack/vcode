import React, { useState } from 'react';
import { FileText, FolderPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { projectApi } from '@/services/project-api';
import { useProjectStore } from '@/stores/project';

interface CreateFilePopoverProps {
    basePath: string;
    trigger: React.ReactNode;
    defaultType?: 'file' | 'folder';
    onClose?: () => void;
}

export function CreateFilePopover({ basePath, trigger, defaultType = 'file', onClose }: CreateFilePopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState<'file' | 'folder'>(defaultType);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { refreshFileTree } = useProjectStore();

    const handleCreate = async () => {
        if (!fileName.trim()) return;

        setIsCreating(true);
        setError(null);
        
        try {
            const fullPath = `${basePath}/${fileName.trim()}`;
            
            if (fileType === 'file') {
                await projectApi.createFile(fullPath, '');
            } else {
                await projectApi.createFolder(fullPath);
            }

            // Add a small delay to ensure filesystem operations complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Refresh the file tree to show the new file/folder
            await refreshFileTree();
            
            // Close popover and reset state
            setIsOpen(false);
            setFileName('');
            setFileType(defaultType);
            setError(null);
            onClose?.();
        } catch (error) {
            console.error('Failed to create file/folder:', error);
            setError(error instanceof Error ? error.message : 'Failed to create file/folder');
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setFileName('');
            setFileType(defaultType);
            setError(null);
            onClose?.();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) {
                // Reset to default type when opening
                setFileType(defaultType);
                setFileName('');
                setError(null);
            }
        }}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                        <h4 className="font-medium text-sm">Create New</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto"
                            onClick={() => {
                                setIsOpen(false);
                                setFileName('');
                                setFileType(defaultType);
                                setError(null);
                                onClose?.();
                            }}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                    
                    <div className="flex gap-1">
                        <Button
                            variant={fileType === 'file' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 flex-1"
                            onClick={() => setFileType('file')}
                        >
                            <FileText className="h-3 w-3 mr-1" />
                            File
                        </Button>
                        <Button
                            variant={fileType === 'folder' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 flex-1"
                            onClick={() => setFileType('folder')}
                        >
                            <FolderPlus className="h-3 w-3 mr-1" />
                            Folder
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Input
                            placeholder={`Enter ${fileType} name...`}
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-8"
                            autoFocus
                        />
                        
                        {error && (
                            <p className="text-destructive text-xs">{error}</p>
                        )}
                        
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 flex-1"
                                onClick={handleCreate}
                                disabled={!fileName.trim() || isCreating}
                            >
                                {isCreating ? 'Creating...' : 'Create'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={() => {
                                    setIsOpen(false);
                                    setFileName('');
                                    setFileType(defaultType);
                                    onClose?.();
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
