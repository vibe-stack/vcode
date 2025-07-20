import { create } from 'zustand';
import { projectApi } from '@/services/project-api';
import { BufferType, getFileType, getFileTypeFromExtension, getMimeType } from './utils';


const isTextFile = (type: BufferType): boolean => {
    return type === 'text';
};

const canEditFile = (type: BufferType): boolean => {
    return type === 'text';
};

export interface BufferContent {
    /** Unique identifier for this buffer */
    id: string;
    /** Display name for the buffer (usually filename) */
    name: string;
    /** Full file path if the buffer is associated with a file */
    filePath: string | null;
    /** The type of buffer content */
    type: BufferType;
    /** The actual content of the buffer (string for text, Uint8Array for binary, or null for large binaries) */
    content: string | Uint8Array | null;
    /** Whether the buffer has unsaved changes */
    isDirty: boolean;
    /** Whether this buffer is currently being saved */
    isSaving: boolean;
    /** Whether this buffer is currently being loaded */
    isLoading: boolean;
    /** File extension (for syntax highlighting, etc.) */
    extension: string | null;
    /** File size in bytes */
    fileSize?: number;
    /** MIME type of the file */
    mimeType?: string;
    /** Whether this file is editable (text files are editable, most binary files are not) */
    isEditable: boolean;
    /** Timestamp when the buffer was created */
    createdAt: Date;
    /** Timestamp when the buffer was last modified */
    lastModified: Date;
    /** Whether this buffer represents a new file (not yet saved) */
    isNewFile: boolean;
    /** Cursor position and selection state (only for text buffers) */
    cursorPosition?: {
        line: number;
        column: number;
    };
    /** Scroll position for restoration */
    scrollPosition?: {
        top: number;
        left: number;
    };
    /** Error message if buffer failed to load */
    error?: string;
}

export interface BufferState {
    /** Map of buffer ID to buffer content */
    buffers: Map<string, BufferContent>;
    /** Array of buffer IDs representing the tab order */
    tabOrder: string[];
    /** ID of the currently active buffer */
    activeBufferId: string | null;
    /** Counter for generating unique IDs for new buffers */
    nextBufferId: number;

    // Actions
    /** Create a new empty buffer */
    createBuffer: (name?: string, content?: string | Uint8Array) => string;
    /** Open a file into a buffer */
    openFile: (filePath: string) => Promise<string>;
    /** Save a buffer to its associated file */
    saveBuffer: (bufferId: string) => Promise<boolean>;
    /** Save a buffer to a specific file path */
    saveBufferAs: (bufferId: string, filePath: string) => Promise<boolean>;
    /** Close a buffer */
    closeBuffer: (bufferId: string) => Promise<boolean>;
    /** Close all buffers */
    closeAllBuffers: () => Promise<void>;
    /** Close all buffers except the specified one */
    closeOtherBuffers: (bufferId: string) => Promise<void>;
    /** Set the active buffer */
    setActiveBuffer: (bufferId: string) => void;
    /** Update buffer content */
    updateBufferContent: (bufferId: string, content: string | Uint8Array) => void;
    /** Mark a buffer as dirty/clean */
    setBufferDirty: (bufferId: string, isDirty: boolean) => void;
    /** Get a buffer by ID */
    getBuffer: (bufferId: string) => BufferContent | null;
    /** Get a buffer by file path */
    getBufferByPath: (filePath: string) => BufferContent | null;
    /** Check if a file is already open in a buffer */
    isFileOpen: (filePath: string) => boolean;
    /** Get all buffers as an array */
    getAllBuffers: () => BufferContent[];
    /** Get all dirty buffers */
    getDirtyBuffers: () => BufferContent[];
    /** Reorder tabs */
    reorderTabs: (fromIndex: number, toIndex: number) => void;
    /** Update cursor position for a buffer */
    updateCursorPosition: (bufferId: string, line: number, column: number) => void;
    /** Update scroll position for a buffer */
    updateScrollPosition: (bufferId: string, top: number, left: number) => void;
    /** Rename a buffer (for unsaved files) */
    renameBuffer: (bufferId: string, newName: string) => void;
    /** Get the next available buffer name */
    getNextBufferName: () => string;
    /** Check if there are unsaved changes */
    hasUnsavedChanges: () => boolean;
    /** Get buffers by type */
    getBuffersByType: (type: BufferType) => BufferContent[];
    /** Get text buffers only */
    getTextBuffers: () => BufferContent[];
    /** Get binary buffers only */
    getBinaryBuffers: () => BufferContent[];
    /** Check if a buffer can be edited */
    isBufferEditable: (bufferId: string) => boolean;
    /** Get buffer file size */
    getBufferFileSize: (bufferId: string) => number | undefined;
    /** Get buffer MIME type */
    getBufferMimeType: (bufferId: string) => string | undefined;
}

export const useBufferStore = create<BufferState>((set, get) => ({
    // Initial state
    buffers: new Map(),
    tabOrder: [],
    activeBufferId: null,
    nextBufferId: 1,

    // Create a new empty buffer
    createBuffer: (name?: string, content: string | Uint8Array = '') => {
        const state = get();
        const bufferId = `buffer_${state.nextBufferId}`;
        const bufferName = name || state.getNextBufferName();
        const extension = bufferName.includes('.') ? bufferName.split('.').pop() || null : null;
        // getFileType expects Uint8Array, so pass empty Uint8Array if content is not string
        const bufferType = getFileType({ extension, buffer: typeof content === 'string' ? new TextEncoder().encode(content) : content });

        const isText = typeof content === 'string';
        const newBuffer: BufferContent = {
            id: bufferId,
            name: bufferName,
            filePath: null,
            type: bufferType,
            content,
            isDirty: isText ? content.length > 0 : (content instanceof Uint8Array ? content.length > 0 : false),
            isSaving: false,
            isLoading: false,
            extension,
            mimeType: getMimeType(extension),
            isEditable: canEditFile(bufferType),
            createdAt: new Date(),
            lastModified: new Date(),
            isNewFile: true,
        };

        set((state) => {
            const newBuffers = new Map(state.buffers);
            newBuffers.set(bufferId, newBuffer);
            
            return {
                buffers: newBuffers,
                tabOrder: [...state.tabOrder, bufferId],
                activeBufferId: bufferId,
                nextBufferId: state.nextBufferId + 1,
            };
        });

        return bufferId;
    },

    // Open a file into a buffer
    openFile: async (filePath: string) => {
        const state = get();
        
        // Check if file is already open
        const existingBuffer = state.getBufferByPath(filePath);
        if (existingBuffer) {
            state.setActiveBuffer(existingBuffer.id);
            return existingBuffer.id;
        }

        // Create new buffer for the file
        const bufferId = `buffer_${state.nextBufferId}`;
        const fileName = filePath.split('/').pop() || 'Untitled';
        const extension = fileName.includes('.') ? fileName.split('.').pop() || null : null;

        try {
            // Get file stats first to determine size
            const fileStats = await projectApi.getFileStats(filePath);
            
            // Always try to load content first to determine type accurately
            // Only skip loading for very large files
            const shouldLoad = fileStats.size <= 10 * 1024 * 1024; // 10MB limit

            // Set initial loading state with unknown type
            const loadingBuffer: BufferContent = {
                id: bufferId,
                name: fileName,
                filePath,
                type: 'unknown',
                content: null,
                isDirty: false,
                isSaving: false,
                isLoading: shouldLoad,
                extension,
                fileSize: fileStats.size,
                mimeType: 'application/octet-stream',
                isEditable: false,
                createdAt: new Date(),
                lastModified: new Date(),
                isNewFile: false,
            };

            set((state) => {
                const newBuffers = new Map(state.buffers);
                newBuffers.set(bufferId, loadingBuffer);
                
                return {
                    buffers: newBuffers,
                    tabOrder: [...state.tabOrder, bufferId],
                    activeBufferId: bufferId,
                    nextBufferId: state.nextBufferId + 1,
                };
            });

            if (shouldLoad) {
                try {
                    // Load file content to determine actual type
                    const fileData = await projectApi.openFile(filePath);
                    
                    // Determine the actual buffer type based on content
                    const actualBufferType = getFileType({ 
                        extension, 
                        buffer: typeof fileData.content === 'string' ? 
                            new TextEncoder().encode(fileData.content) : 
                            fileData.content 
                    });
                    const actualMimeType = getMimeType(extension);
                    const actualIsEditable = canEditFile(actualBufferType);
                    
                    set((state) => {
                        const newBuffers = new Map(state.buffers);
                        const buffer = newBuffers.get(bufferId);
                        if (buffer) {
                            newBuffers.set(bufferId, {
                                ...buffer,
                                content: fileData.content,
                                type: actualBufferType,
                                mimeType: actualMimeType,
                                isEditable: actualIsEditable,
                                isLoading: false,
                            });
                        }
                        return { buffers: newBuffers };
                    });
                } catch (error) {
                    // Handle file loading error
                    set((state) => {
                        const newBuffers = new Map(state.buffers);
                        const buffer = newBuffers.get(bufferId);
                        if (buffer) {
                            newBuffers.set(bufferId, {
                                ...buffer,
                                content: null,
                                isLoading: false,
                                error: `Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            });
                        }
                        return { buffers: newBuffers };
                    });
                }
            } else {
                // For very large files, we can't load content, so we have to use extension-based detection as fallback
                const fallbackType = getFileTypeFromExtension(extension);
                const fallbackMimeType = getMimeType(extension);
                const fallbackIsEditable = canEditFile(fallbackType);
                
                set((state) => {
                    const newBuffers = new Map(state.buffers);
                    const buffer = newBuffers.get(bufferId);
                    if (buffer) {
                        newBuffers.set(bufferId, {
                            ...buffer,
                            type: fallbackType,
                            mimeType: fallbackMimeType,
                            isEditable: fallbackIsEditable,
                            isLoading: false,
                        });
                    }
                    return { buffers: newBuffers };
                });
            }

            return bufferId;
        } catch (error) {
            console.error('Error opening file:', error);
            // Create an error buffer
            const errorBuffer: BufferContent = {
                id: bufferId,
                name: fileName,
                filePath,
                type: 'unknown',
                content: null,
                isDirty: false,
                isSaving: false,
                isLoading: false,
                extension,
                mimeType: 'application/octet-stream',
                isEditable: false,
                createdAt: new Date(),
                lastModified: new Date(),
                isNewFile: false,
                error: `Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };

            set((state) => {
                const newBuffers = new Map(state.buffers);
                newBuffers.set(bufferId, errorBuffer);
                
                return {
                    buffers: newBuffers,
                    tabOrder: [...state.tabOrder, bufferId],
                    activeBufferId: bufferId,
                    nextBufferId: state.nextBufferId + 1,
                };
            });

            return bufferId;
        }
    },

    // Save a buffer to its associated file
    saveBuffer: async (bufferId: string) => {
        const state = get();
        const buffer = state.getBuffer(bufferId);
        
        if (!buffer) {
            console.error('Buffer not found:', bufferId);
            return false;
        }

        if (!buffer.filePath) {
            console.error('Buffer has no file path:', bufferId);
            return false;
        }

        if (!buffer.isEditable) {
            console.error('Buffer is not editable:', bufferId);
            return false;
        }

        if (buffer.content === null) {
            console.error('Buffer has no content to save:', bufferId);
            return false;
        }
        // Set saving state
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const currentBuffer = newBuffers.get(bufferId);
            if (currentBuffer) {
                newBuffers.set(bufferId, {
                    ...currentBuffer,
                    isSaving: true,
                });
            }
            return { buffers: newBuffers };
        });
        try {
            // Only save string content for now; skip binary
            if (typeof buffer.content !== 'string') {
                console.error('Cannot save non-string buffer content:', bufferId);
                set((state) => {
                    const newBuffers = new Map(state.buffers);
                    const currentBuffer = newBuffers.get(bufferId);
                    if (currentBuffer) {
                        newBuffers.set(bufferId, {
                            ...currentBuffer,
                            isSaving: false,
                        });
                    }
                    return { buffers: newBuffers };
                });
                return false;
            }
            const success = await projectApi.saveFile(buffer.filePath, buffer.content);
            
            if (success) {
                set((state) => {
                    const newBuffers = new Map(state.buffers);
                    const currentBuffer = newBuffers.get(bufferId);
                    if (currentBuffer) {
                        newBuffers.set(bufferId, {
                            ...currentBuffer,
                            isDirty: false,
                            isSaving: false,
                            isNewFile: false,
                            lastModified: new Date(),
                        });
                    }
                    return { buffers: newBuffers };
                });

                // TypeScript files will be automatically updated via LSP integration
            }

            return success;
        } catch (error) {
            console.error('Error saving buffer:', error);
            set((state) => {
                const newBuffers = new Map(state.buffers);
                const currentBuffer = newBuffers.get(bufferId);
                if (currentBuffer) {
                    newBuffers.set(bufferId, {
                        ...currentBuffer,
                        isSaving: false,
                    });
                }
                return { buffers: newBuffers };
            });
            return false;
        }
    },

    // Save a buffer to a specific file path
    saveBufferAs: async (bufferId: string, filePath: string) => {
        const state = get();
        const buffer = state.getBuffer(bufferId);
        
        if (!buffer) {
            console.error('Buffer not found:', bufferId);
            return false;
        }

        if (!buffer.isEditable) {
            console.error('Buffer is not editable:', bufferId);
            return false;
        }

        if (buffer.content === null) {
            console.error('Buffer has no content to save:', bufferId);
            return false;
        }
        // Set saving state
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const currentBuffer = newBuffers.get(bufferId);
            if (currentBuffer) {
                newBuffers.set(bufferId, {
                    ...currentBuffer,
                    isSaving: true,
                });
            }
            return { buffers: newBuffers };
        });
        try {
            // Only save string content for now; skip binary
            if (typeof buffer.content !== 'string') {
                console.error('Cannot save non-string buffer content:', bufferId);
                set((state) => {
                    const newBuffers = new Map(state.buffers);
                    const currentBuffer = newBuffers.get(bufferId);
                    if (currentBuffer) {
                        newBuffers.set(bufferId, {
                            ...currentBuffer,
                            isSaving: false,
                        });
                    }
                    return { buffers: newBuffers };
                });
                return false;
            }
            const success = await projectApi.saveFile(filePath, buffer.content);
            
            if (success) {
                const fileName = filePath.split('/').pop() || 'Untitled';
                const extension = fileName.includes('.') ? fileName.split('.').pop() || null : null;
                const bufferType = getFileTypeFromExtension(extension);
                const mimeType = getMimeType(extension);

                set((state) => {
                    const newBuffers = new Map(state.buffers);
                    const currentBuffer = newBuffers.get(bufferId);
                    if (currentBuffer) {
                        newBuffers.set(bufferId, {
                            ...currentBuffer,
                            name: fileName,
                            filePath,
                            type: bufferType,
                            extension,
                            mimeType,
                            isDirty: false,
                            isSaving: false,
                            isNewFile: false,
                            lastModified: new Date(),
                        });
                    }
                    return { buffers: newBuffers };
                });
            }

            return success;
        } catch (error) {
            console.error('Error saving buffer as:', error);
            set((state) => {
                const newBuffers = new Map(state.buffers);
                const currentBuffer = newBuffers.get(bufferId);
                if (currentBuffer) {
                    newBuffers.set(bufferId, {
                        ...currentBuffer,
                        isSaving: false,
                    });
                }
                return { buffers: newBuffers };
            });
            return false;
        }
    },

    // Close a buffer
    closeBuffer: async (bufferId: string) => {
        const state = get();
        const buffer = state.getBuffer(bufferId);
        
        if (!buffer) {
            return true; // Already closed
        }

        // If buffer is dirty, you might want to prompt user to save
        // For now, we'll just close it
        
        set((state) => {
            const newBuffers = new Map(state.buffers);
            newBuffers.delete(bufferId);
            
            const newTabOrder = state.tabOrder.filter(id => id !== bufferId);
            
            // Update active buffer if necessary
            let newActiveBufferId = state.activeBufferId;
            if (state.activeBufferId === bufferId) {
                if (newTabOrder.length > 0) {
                    // Find the next buffer to activate
                    const closedIndex = state.tabOrder.indexOf(bufferId);
                    if (closedIndex > 0) {
                        newActiveBufferId = newTabOrder[closedIndex - 1];
                    } else {
                        newActiveBufferId = newTabOrder[0];
                    }
                } else {
                    newActiveBufferId = null;
                }
            }

            return {
                buffers: newBuffers,
                tabOrder: newTabOrder,
                activeBufferId: newActiveBufferId,
            };
        });

        return true;
    },

    // Close all buffers
    closeAllBuffers: async () => {
        set({
            buffers: new Map(),
            tabOrder: [],
            activeBufferId: null,
        });
    },

    // Close all buffers except the specified one
    closeOtherBuffers: async (bufferId: string) => {
        const state = get();
        const buffer = state.getBuffer(bufferId);
        
        if (!buffer) {
            return;
        }

        set({
            buffers: new Map([[bufferId, buffer]]),
            tabOrder: [bufferId],
            activeBufferId: bufferId,
        });
    },

    // Set the active buffer
    setActiveBuffer: (bufferId: string) => {
        const state = get();
        if (state.buffers.has(bufferId)) {
            set({ activeBufferId: bufferId });
        }
    },

    // Update buffer content
    updateBufferContent: (bufferId: string, content: string | Uint8Array) => {
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const buffer = newBuffers.get(bufferId);
            if (buffer) {
                newBuffers.set(bufferId, {
                    ...buffer,
                    content,
                    isDirty: typeof content === 'string' ? content.length > 0 : (content instanceof Uint8Array ? content.length > 0 : false),
                    lastModified: new Date(),
                });

                // Update TypeScript service in real-time for TypeScript/JavaScript files
                if (buffer.filePath && typeof content === 'string' && (
                    buffer.filePath.endsWith('.ts') || 
                    buffer.filePath.endsWith('.tsx') || 
                    buffer.filePath.endsWith('.js') || 
                    buffer.filePath.endsWith('.jsx') ||
                    buffer.filePath.endsWith('.d.ts')
                )) {
                    // TypeScript files will be automatically updated via LSP integration
                    // No manual debouncing needed - LSP handles this efficiently
                }
            }
            return { buffers: newBuffers };
        });
    },

    // Mark a buffer as dirty/clean
    setBufferDirty: (bufferId: string, isDirty: boolean) => {
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const buffer = newBuffers.get(bufferId);
            if (buffer) {
                newBuffers.set(bufferId, {
                    ...buffer,
                    isDirty,
                });
            }
            return { buffers: newBuffers };
        });
    },

    // Get a buffer by ID
    getBuffer: (bufferId: string) => {
        const state = get();
        return state.buffers.get(bufferId) || null;
    },

    // Get a buffer by file path
    getBufferByPath: (filePath: string) => {
        const state = get();
        for (const buffer of state.buffers.values()) {
            if (buffer.filePath === filePath) {
                return buffer;
            }
        }
        return null;
    },

    // Check if a file is already open in a buffer
    isFileOpen: (filePath: string) => {
        return get().getBufferByPath(filePath) !== null;
    },

    // Get all buffers as an array
    getAllBuffers: () => {
        const state = get();
        return Array.from(state.buffers.values());
    },

    // Get all dirty buffers
    getDirtyBuffers: () => {
        const state = get();
        return Array.from(state.buffers.values()).filter(buffer => buffer.isDirty);
    },

    // Reorder tabs
    reorderTabs: (fromIndex: number, toIndex: number) => {
        set((state) => {
            const newTabOrder = [...state.tabOrder];
            const [moved] = newTabOrder.splice(fromIndex, 1);
            newTabOrder.splice(toIndex, 0, moved);
            return { tabOrder: newTabOrder };
        });
    },

    // Update cursor position for a buffer
    updateCursorPosition: (bufferId: string, line: number, column: number) => {
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const buffer = newBuffers.get(bufferId);
            if (buffer) {
                newBuffers.set(bufferId, {
                    ...buffer,
                    cursorPosition: { line, column },
                });
            }
            return { buffers: newBuffers };
        });
    },

    // Update scroll position for a buffer
    updateScrollPosition: (bufferId: string, top: number, left: number) => {
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const buffer = newBuffers.get(bufferId);
            if (buffer) {
                newBuffers.set(bufferId, {
                    ...buffer,
                    scrollPosition: { top, left },
                });
            }
            return { buffers: newBuffers };
        });
    },

    // Rename a buffer (for unsaved files)
    renameBuffer: (bufferId: string, newName: string) => {
        set((state) => {
            const newBuffers = new Map(state.buffers);
            const buffer = newBuffers.get(bufferId);
            if (buffer && buffer.isNewFile) {
                newBuffers.set(bufferId, {
                    ...buffer,
                    name: newName,
                    isDirty: true,
                });
            }
            return { buffers: newBuffers };
        });
    },

    // Get the next available buffer name
    getNextBufferName: () => {
        const state = get();
        const existingNames = new Set(Array.from(state.buffers.values()).map(b => b.name));
        
        let counter = 1;
        let name = `Untitled`;
        while (existingNames.has(name)) {
            name = `Untitled ${counter}`;
            counter++;
        }
        return name;
    },

    // Check if there are unsaved changes
    hasUnsavedChanges: () => {
        const state = get();
        return Array.from(state.buffers.values()).some(buffer => buffer.isDirty);
    },

    // Get buffers by type
    getBuffersByType: (type: BufferType) => {
        const state = get();
        return Array.from(state.buffers.values()).filter(buffer => buffer.type === type);
    },

    // Get text buffers only
    getTextBuffers: () => {
        const state = get();
        return Array.from(state.buffers.values()).filter(buffer => buffer.type === 'text');
    },

    // Get binary buffers only  
    getBinaryBuffers: () => {
        const state = get();
        return Array.from(state.buffers.values()).filter(buffer => buffer.type !== 'text');
    },

    // Check if a buffer can be edited
    isBufferEditable: (bufferId: string) => {
        const state = get();
        const buffer = state.buffers.get(bufferId);
        return buffer?.isEditable || false;
    },

    // Get buffer file size
    getBufferFileSize: (bufferId: string) => {
        const state = get();
        const buffer = state.buffers.get(bufferId);
        return buffer?.fileSize;
    },

    // Get buffer MIME type
    getBufferMimeType: (bufferId: string) => {
        const state = get();
        const buffer = state.buffers.get(bufferId);
        return buffer?.mimeType;
    },
}));

// Additional utility functions for binary file handling
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileTypeDescription = (type: BufferType): string => {
    switch (type) {
        case 'text': return 'Text File';
        case 'image': return 'Image File';
        case 'pdf': return 'PDF Document';
        case 'archive': return 'Archive File';
        case 'executable': return 'Executable File';
        case 'binary': return 'Binary File';
        default: return 'Unknown File Type';
    }
};

export const canPreviewFile = (type: BufferType): boolean => {
    return type === 'text' || type === 'image';
};

export const getFileIcon = (type: BufferType, extension?: string | null): string => {
    switch (type) {
        case 'text':
            // Return appropriate icon based on extension
            if (extension) {
                const ext = extension.toLowerCase();
                if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return '📄';
                if (['html', 'htm'].includes(ext)) return '🌐';
                if (['css', 'scss', 'sass'].includes(ext)) return '🎨';
                if (['json', 'xml', 'yaml', 'yml'].includes(ext)) return '📋';
                if (['md', 'markdown'].includes(ext)) return '📝';
                if (['py'].includes(ext)) return '🐍';
                if (['java'].includes(ext)) return '☕';
                if (['c', 'cpp', 'h', 'hpp'].includes(ext)) return '⚡';
            }
            return '📄';
        case 'image': return '🖼️';
        case 'pdf': return '📕';
        case 'archive': return '📦';
        case 'executable': return '⚙️';
        case 'binary': return '🔧';
        default: return '📄';
    }
};
