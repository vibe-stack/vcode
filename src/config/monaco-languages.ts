import * as monaco from 'monaco-editor';

// Enhanced language configurations for better syntax highlighting
export const enhanceMonacoLanguages = () => {
    // JSON configuration with better error reporting
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: true,
        schemaRequest: 'warning',
        schemaValidation: 'warning',
        comments: 'error',
        trailingCommas: 'error',
    });

    // TypeScript/JavaScript configuration
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: 'React',
        allowJs: true,
        typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        allowJs: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
    });

    // Enable type checking and error reporting
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
        noSuggestionDiagnostics: false,
    });

    // CSS configuration with vendor prefixes support
    monaco.languages.css.cssDefaults.setOptions({
        validate: true,
        lint: {
            compatibleVendorPrefixes: 'ignore',
            vendorPrefix: 'warning',
            duplicateProperties: 'warning',
            emptyRules: 'warning',
            importStatement: 'ignore',
            boxModel: 'ignore',
            universalSelector: 'ignore',
            zeroUnits: 'ignore',
            fontFaceProperties: 'warning',
            hexColorLength: 'error',
            argumentsInColorFunction: 'error',
            unknownProperties: 'warning',
            ieHack: 'ignore',
            unknownVendorSpecificProperties: 'ignore',
            propertyIgnoredDueToDisplay: 'warning',
            important: 'ignore',
            float: 'ignore',
            idSelector: 'ignore',
        },
    });

    // SCSS/SASS configuration
    monaco.languages.css.scssDefaults.setOptions({
        validate: true,
        lint: {
            compatibleVendorPrefixes: 'ignore',
            vendorPrefix: 'warning',
            duplicateProperties: 'warning',
            emptyRules: 'warning',
            importStatement: 'ignore',
            boxModel: 'ignore',
            universalSelector: 'ignore',
            zeroUnits: 'ignore',
            fontFaceProperties: 'warning',
            hexColorLength: 'error',
            argumentsInColorFunction: 'error',
            unknownProperties: 'warning',
            ieHack: 'ignore',
            unknownVendorSpecificProperties: 'ignore',
            propertyIgnoredDueToDisplay: 'warning',
            important: 'ignore',
            float: 'ignore',
            idSelector: 'ignore',
        },
    });

    // HTML configuration
    monaco.languages.html.htmlDefaults.setOptions({
        format: {
            tabSize: 2,
            insertSpaces: true,
            wrapLineLength: 120,
            unformatted: 'default',
            contentUnformatted: 'pre,code,textarea',
            indentInnerHtml: false,
            preserveNewLines: true,
            maxPreserveNewLines: 2,
            indentHandlebars: false,
            endWithNewline: false,
            extraLiners: 'head, body, /html',
            wrapAttributes: 'auto',
        },
        suggest: {
            html5: true,
            angular1: false,
            ionic: false,
        },
        // validate: true, // This option might not be available in this Monaco version
    });
};

// Custom language registration for common file types not supported by default
export const registerCustomLanguages = () => {
    // Register .env files
    monaco.languages.register({ id: 'dotenv' });
    monaco.languages.setMonarchTokensProvider('dotenv', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/\w+(?==)/, 'key'],
                [/=/, 'delimiter'],
                [/.*/, 'value'],
            ],
        },
    });

    // Register .gitignore files
    monaco.languages.register({ id: 'gitignore' });
    monaco.languages.setMonarchTokensProvider('gitignore', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\!/, 'operator'],
                [/\*/, 'wildcard'],
                [/.*/, 'path'],
            ],
        },
    });

    // Register .log files with simple highlighting
    monaco.languages.register({ id: 'log' });
    monaco.languages.setMonarchTokensProvider('log', {
        tokenizer: {
            root: [
                [/\[[^\]]*\]/, 'tag'],
                [/\d{4}-\d{2}-\d{2}/, 'date'],
                [/\d{2}:\d{2}:\d{2}/, 'time'],
                [/(ERROR|FATAL|CRITICAL)/, 'error'],
                [/(WARN|WARNING)/, 'warning'],
                [/(INFO|DEBUG|TRACE)/, 'info'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register YAML files
    monaco.languages.register({ id: 'yaml' });
    monaco.languages.setMonarchTokensProvider('yaml', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\s*[\w-]+\s*:/, 'key'],
                [/:\s*/, 'delimiter'],
                [/^\s*-\s*/, 'operator'],
                [/[|>][-+]?\s*$/, 'string.heredoc'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/\btrue\b|\bfalse\b|\bnull\b/, 'keyword'],
                [/\d+/, 'number'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register TOML files
    monaco.languages.register({ id: 'toml' });
    monaco.languages.setMonarchTokensProvider('toml', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\s*\[.*\]\s*$/, 'tag'],
                [/^\s*[\w-]+\s*=/, 'key'],
                [/=/, 'delimiter'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/\btrue\b|\bfalse\b/, 'keyword'],
                [/\d{4}-\d{2}-\d{2}/, 'number'],
                [/\d+/, 'number'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register Dockerfile
    monaco.languages.register({ id: 'dockerfile' });
    monaco.languages.setMonarchTokensProvider('dockerfile', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\s*(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/i, 'keyword'],
                [/\$\{[^}]*\}/, 'variable'],
                [/\$\w+/, 'variable'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register Makefile
    monaco.languages.register({ id: 'makefile' });
    monaco.languages.setMonarchTokensProvider('makefile', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^[\w-]+\s*:/, 'tag'],
                [/\$\([^)]*\)/, 'variable'],
                [/\$\{[^}]*\}/, 'variable'],
                [/\$[@<^+?*]/, 'variable'],
                [/\$\w+/, 'variable'],
                [/^\t/, 'delimiter'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register Apache config
    monaco.languages.register({ id: 'apache' });
    monaco.languages.setMonarchTokensProvider('apache', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\s*<\/?[^>]+>/, 'tag'],
                [/^\s*\w+/, 'keyword'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register Nginx config
    monaco.languages.register({ id: 'nginx' });
    monaco.languages.setMonarchTokensProvider('nginx', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/^\s*\w+/, 'keyword'],
                [/\{/, 'delimiter.curly'],
                [/\}/, 'delimiter.curly'],
                [/;/, 'delimiter'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/.*/, 'text'],
            ],
        },
    });

    // Register Properties files
    monaco.languages.register({ id: 'properties' });
    monaco.languages.setMonarchTokensProvider('properties', {
        tokenizer: {
            root: [
                [/#.*/, 'comment'],
                [/!.*/, 'comment'],
                [/^\s*[\w.-]+\s*[=:]/, 'key'],
                [/[=:]/, 'delimiter'],
                [/\\$/, 'string.escape'],
                [/.*/, 'value'],
            ],
        },
    });

    // Register Protocol Buffers
    monaco.languages.register({ id: 'protobuf' });
    monaco.languages.setMonarchTokensProvider('protobuf', {
        tokenizer: {
            root: [
                [/\/\/.*/, 'comment'],
                [/\/\*[\s\S]*?\*\//, 'comment'],
                [/\b(syntax|package|import|message|service|rpc|enum|option|extend|oneof|reserved|returns)\b/, 'keyword'],
                [/\b(double|float|int32|int64|uint32|uint64|sint32|sint64|fixed32|fixed64|sfixed32|sfixed64|bool|string|bytes)\b/, 'type'],
                [/\b(optional|required|repeated)\b/, 'keyword'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/'([^'\\]|\\.)*'/, 'string'],
                [/\d+/, 'number'],
                [/.*/, 'text'],
            ],
        },
    });
};

// Map common file extensions to custom languages
export const getCustomLanguageFromExtension = (extension: string): string | null => {
    const customMappings: Record<string, string> = {
        'env': 'dotenv',
        'gitignore': 'gitignore',
        'log': 'log',
        'conf': 'ini',
        'cfg': 'ini',
        'toml': 'toml',
        'yml': 'yaml',
        'yaml': 'yaml',
        'dockerfile': 'dockerfile',
        'makefile': 'makefile',
        'mk': 'makefile',
        'apache': 'apache',
        'nginx': 'nginx',
        'properties': 'properties',
        'props': 'properties',
        'proto': 'protobuf',
        'protobuf': 'protobuf',
    };

    return customMappings[extension.toLowerCase()] || null;
};

// Enhanced language detection based on filename patterns
export const detectLanguageFromFilename = (filename: string): string | null => {
    const filenamePatterns: Record<string, string> = {
        '.env': 'dotenv',
        '.env.local': 'dotenv',
        '.env.production': 'dotenv',
        '.env.development': 'dotenv',
        '.gitignore': 'gitignore',
        '.gitattributes': 'gitignore',
        'dockerfile': 'dockerfile',
        'makefile': 'makefile',
        'gnumakefile': 'makefile',
        'package.json': 'json',
        'tsconfig.json': 'json',
        'composer.json': 'json',
        '.eslintrc': 'json',
        '.babelrc': 'json',
        '.prettierrc': 'json',
    };

    const lowerFilename = filename.toLowerCase();
    
    // Check exact filename matches first
    if (filenamePatterns[lowerFilename]) {
        return filenamePatterns[lowerFilename];
    }
    
    // Check for common patterns
    if (lowerFilename.includes('dockerfile')) {
        return 'dockerfile';
    }
    
    if (lowerFilename.includes('makefile')) {
        return 'makefile';
    }
    
    return null;
};
