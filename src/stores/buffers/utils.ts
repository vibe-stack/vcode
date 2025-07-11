export type BufferType = 'text' | 'binary' | 'image' | 'pdf' | 'archive' | 'executable' | 'unknown';

// Utility functions for file type detection
export const getFileTypeFromExtension = (extension: string | null): BufferType => {
    if (!extension) return 'unknown';
    
    const ext = extension.toLowerCase();
    
    // Text files
    const textExtensions = [
        'txt', 'md', 'markdown', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'scss', 'sass',
        'less', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
        'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat',
        'cmd', 'sql', 'r', 'matlab', 'm', 'pl', 'pm', 'tcl', 'lua', 'vim', 'dockerfile', 'makefile',
        'gitignore', 'gitattributes', 'editorconfig', 'prettierrc', 'eslintrc', 'tsconfig', 'jsconfig',
        'log', 'csv', 'tsv', 'rtf', 'tex', 'bib', 'org', 'adoc', 'rst', 'wiki'
    ];
    
    // Image files
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'avif'];
    
    // PDF files
    const pdfExtensions = ['pdf'];
    
    // Archive files
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tar.gz', 'tar.bz2', 'tar.xz'];
    
    // Executable files
    const executableExtensions = ['exe', 'msi', 'deb', 'rpm', 'dmg', 'pkg', 'app', 'bin', 'run', 'com'];
    
    if (textExtensions.includes(ext)) return 'text';
    if (imageExtensions.includes(ext)) return 'image';
    if (pdfExtensions.includes(ext)) return 'pdf';
    if (archiveExtensions.includes(ext)) return 'archive';
    if (executableExtensions.includes(ext)) return 'executable';
    
    return 'binary';
};

export const getMimeType = (extension: string | null): string => {
    if (!extension) return 'application/octet-stream';
    
    const ext = extension.toLowerCase();
    const mimeTypes: Record<string, string> = {
        // Text
        'txt': 'text/plain',
        'md': 'text/markdown',
        'html': 'text/html',
        'htm': 'text/html',
        'css': 'text/css',
        'js': 'text/javascript',
        'ts': 'text/typescript',
        'json': 'application/json',
        'xml': 'application/xml',
        'yaml': 'application/yaml',
        'yml': 'application/yaml',
        
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        
        // Archives
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        
        // Executables
        'exe': 'application/x-msdownload',
        'msi': 'application/x-msi',
        'deb': 'application/vnd.debian.binary-package',
        'rpm': 'application/x-rpm',
        'dmg': 'application/x-apple-diskimage',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
};

// Heuristic: check if a buffer is likely text
export function isTextBuffer(buffer: Uint8Array, sampleSize = 8000): boolean {
    // Only check up to sampleSize bytes
    const len = Math.min(buffer.length, sampleSize);
    let suspiciousBytes = 0;
    for (let i = 0; i < len; i++) {
        const byte = buffer[i];
        // Allow: tab, line feed, carriage return, printable ASCII (32-126)
        if (
            byte === 9 || byte === 10 || byte === 13 ||
            (byte >= 32 && byte <= 126)
        ) {
            continue;
        }
        // Allow some UTF-8 multi-byte sequences (not perfect, but helps)
        if (byte >= 194 && byte <= 250) {
            continue;
        }
        suspiciousBytes++;
        // If more than 1.5% of bytes are suspicious, treat as binary
        if (suspiciousBytes / len > 0.015) return false;
    }
    return true;
}

// Smarter file type detection: use extension if known, else content
export function getFileType({ extension, buffer }: { extension?: string | null, buffer?: Uint8Array }): BufferType {
    if (extension) {
        const extType = getFileTypeFromExtension(extension);
        if (extType !== 'binary' && extType !== 'unknown') return extType;
    }
    if (buffer) {
        if (isTextBuffer(buffer)) return 'text';
        // Could add more heuristics for image/pdf/archive here
        return 'binary';
    }
    return 'unknown';
}