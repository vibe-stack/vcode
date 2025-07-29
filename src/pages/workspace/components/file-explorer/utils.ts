import { projectApi } from '@/services/project-api';

/**
 * Creates directories recursively if they don't exist, then creates the final file
 * Handles VS Code-style nested path creation (e.g., "src/components/ui/button.tsx")
 */
export async function createNestedPath(
    basePath: string, 
    inputPath: string, 
    type: 'file' | 'folder'
): Promise<string> {
    const trimmedPath = inputPath.trim();
    if (!trimmedPath) {
        throw new Error('Path cannot be empty');
    }

    // Split the path into segments
    const segments = trimmedPath.split('/').filter(segment => segment.length > 0);
    
    if (segments.length === 0) {
        throw new Error('Invalid path');
    }

    let currentPath = basePath;
    
    if (type === 'file') {
        // For files, create all directories except the last segment (which is the file)
        const directories = segments.slice(0, -1);
        const fileName = segments[segments.length - 1];
        
        // Create directories
        for (const dir of directories) {
            currentPath = `${currentPath}/${dir}`;
            try {
                // Check if directory already exists, if not create it
                await projectApi.createFolder(currentPath);
            } catch (error) {
                // Directory might already exist, which is fine
                console.log(`Directory ${currentPath} might already exist:`, error);
            }
        }
        
        // Create the file
        const finalFilePath = `${currentPath}/${fileName}`;
        await projectApi.createFile(finalFilePath, '');
        return finalFilePath;
    } else {
        // For folders, create all segments as directories
        for (const dir of segments) {
            currentPath = `${currentPath}/${dir}`;
            try {
                await projectApi.createFolder(currentPath);
            } catch (error) {
                // Directory might already exist, which is fine
                console.log(`Directory ${currentPath} might already exist:`, error);
            }
        }
        
        return currentPath;
    }
}

/**
 * Gets a range of items between two paths for shift+click selection
 */
export function getPathRange(
    paths: string[], 
    startPath: string, 
    endPath: string
): string[] {
    const startIndex = paths.indexOf(startPath);
    const endIndex = paths.indexOf(endPath);
    
    if (startIndex === -1 || endIndex === -1) {
        return [];
    }
    
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    
    return paths.slice(start, end + 1);
}

/**
 * Flattens a directory tree into a flat array of paths for selection purposes
 */
export function flattenDirectoryTree(node: any, expandedFolders: Set<string>): string[] {
    const result: string[] = [node.path];
    
    if (node.type === 'directory' && 
        node.children && 
        expandedFolders.has(node.path)) {
        for (const child of node.children) {
            result.push(...flattenDirectoryTree(child, expandedFolders));
        }
    }
    
    return result;
}
