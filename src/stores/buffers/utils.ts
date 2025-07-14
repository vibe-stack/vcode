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
    // First check extension if available - it's more reliable
    if (extension) {
        const extType = getFileTypeFromExtension(extension);
        // If we have a definitive type from extension, use it
        // This ensures .md files are always treated as text
        if (extType !== 'unknown') return extType;
    }

    // Only check buffer content if extension is unknown or missing
    if (buffer) {
        const istext = isTextBuffer(buffer);
        if (istext) return 'text';
        // Could add more heuristics for image/pdf/archive here
        return 'binary';
    }

    return 'unknown';
}

// Utility functions for editor status information
export const detectLineEnding = (content: string): 'LF' | 'CRLF' | 'CR' => {
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
    const crCount = (content.match(/\r(?!\n)/g) || []).length;

    if (crlfCount > lfCount && crlfCount > crCount) return 'CRLF';
    if (crCount > lfCount) return 'CR';
    return 'LF';
};

export const detectIndentation = (content: string): { type: 'spaces' | 'tabs', size: number } => {
    const lines = content.split('\n');
    const spacesPattern = /^( +)/;
    const tabsPattern = /^(\t+)/;
    
    let spaceIndents: number[] = [];
    let tabIndents = 0;
    
    for (const line of lines) {
        const spaceMatch = line.match(spacesPattern);
        const tabMatch = line.match(tabsPattern);
        
        if (tabMatch) {
            tabIndents++;
        } else if (spaceMatch) {
            spaceIndents.push(spaceMatch[1].length);
        }
    }
    
    if (tabIndents > spaceIndents.length) {
        return { type: 'tabs', size: 4 }; // Default tab size
    }
    
    if (spaceIndents.length === 0) {
        return { type: 'spaces', size: 4 }; // Default
    }
    
    // Find the most common indentation size
    const indentCounts = spaceIndents.reduce((acc, indent) => {
        acc[indent] = (acc[indent] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);
    
    const mostCommonIndent = Object.entries(indentCounts)
        .sort(([, a], [, b]) => b - a)[0];
    
    return { type: 'spaces', size: parseInt(mostCommonIndent[0]) || 4 };
};

export const detectEncoding = (content: string): string => {
    // Simple encoding detection - in a real app you'd use a proper library
    try {
        // Check if it's valid UTF-8
        new TextEncoder().encode(content);
        return 'UTF-8';
    } catch {
        return 'Unknown';
    }
};

export const getLanguageFromExtension = (extension: string | null): string => {
    if (!extension) return 'plaintext';

    const ext = extension.toLowerCase();
    const languageMap: Record<string, string> = {
        // JavaScript/TypeScript
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'mjs': 'javascript',
        'cjs': 'javascript',
        
        // Web
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'scss': 'scss',
        'sass': 'sass',
        'less': 'less',
        'vue': 'html', // Vue files are often treated as HTML with special syntax
        'svelte': 'html',
        
        // Python
        'py': 'python',
        'pyx': 'python',
        'pyi': 'python',
        'pyc': 'python',
        
        // Java/JVM
        'java': 'java',
        'kt': 'kotlin',
        'kts': 'kotlin',
        'scala': 'scala',
        'sc': 'scala',
        'groovy': 'groovy',
        'gradle': 'groovy',
        
        // C/C++
        'c': 'c',
        'h': 'c',
        'cpp': 'cpp',
        'cxx': 'cpp',
        'cc': 'cpp',
        'hpp': 'cpp',
        'hxx': 'cpp',
        'hh': 'cpp',
        
        // C#
        'cs': 'csharp',
        'csx': 'csharp',
        
        // Rust
        'rs': 'rust',
        
        // Go
        'go': 'go',
        
        // PHP
        'php': 'php',
        'phtml': 'php',
        'php3': 'php',
        'php4': 'php',
        'php5': 'php',
        
        // Ruby
        'rb': 'ruby',
        'rbx': 'ruby',
        'rjs': 'ruby',
        'gemspec': 'ruby',
        
        // Shell
        'sh': 'shell',
        'bash': 'shell',
        'zsh': 'shell',
        'fish': 'shell',
        'ps1': 'powershell',
        'psm1': 'powershell',
        'bat': 'bat',
        'cmd': 'bat',
        
        // Data formats
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'toml': 'ini', // Monaco doesn't have TOML, use INI as fallback
        'ini': 'ini',
        'cfg': 'ini',
        'conf': 'ini',
        'properties': 'ini',
        
        // Markdown
        'md': 'markdown',
        'markdown': 'markdown',
        'mdown': 'markdown',
        'mkd': 'markdown',
        'mdx': 'markdown',
        
        // SQL
        'sql': 'sql',
        'mysql': 'mysql',
        'pgsql': 'pgsql',
        'plsql': 'sql',
        
        // Other
        'r': 'r',
        'R': 'r',
        'matlab': 'm3', // Monaco uses m3 for MATLAB-like syntax
        'm': 'm3',
        'pl': 'perl',
        'pm': 'perl',
        'tcl': 'tcl',
        'lua': 'lua',
        'vim': 'plaintext', // Monaco doesn't have vim syntax
        'dockerfile': 'dockerfile',
        'makefile': 'makefile',
        'cmake': 'cmake',
        'tex': 'latex',
        'bib': 'latex',
        'log': 'plaintext',
        'txt': 'plaintext',
    };

    return languageMap[ext] || 'plaintext';
};