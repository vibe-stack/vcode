import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface LSPRequest {
  id: number;
  method: string;
  params?: any;
}

export interface LSPResponse {
  id?: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface LSPNotification {
  method: string;
  params?: any;
}

export class TypeScriptLSPService extends EventEmitter {
  private static instance: TypeScriptLSPService;
  private tsServerProcess: ChildProcess | null = null;
  private isInitialized = false;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private projectPath: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): TypeScriptLSPService {
    if (!TypeScriptLSPService.instance) {
      TypeScriptLSPService.instance = new TypeScriptLSPService();
    }
    return TypeScriptLSPService.instance;
  }

  public async initialize(projectPath: string): Promise<void> {
    // If the same project is already initialized, return immediately
    if (this.isInitialized && this.projectPath === projectPath) {
      return;
    }

    // If there's already an initialization in progress for the same project, wait for it
    if (this.initializationPromise && this.projectPath === projectPath) {
      return this.initializationPromise;
    }

    console.log('Initializing TypeScript LSP for project:', projectPath);
    
    // Create a new initialization promise
    this.initializationPromise = this.doInitialize(projectPath);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(projectPath: string): Promise<void> {
    this.projectPath = projectPath;
    
    try {
      await this.stopServer();
      // Small delay to ensure the previous server has fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.startServer();
      await this.sendInitialize();
      console.log('TypeScript LSP initialization completed successfully');
    } catch (error) {
      console.error('Failed to initialize TypeScript LSP:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Find typescript-language-server executable
        let tsServerPath: string;
        try {
          tsServerPath = require.resolve('typescript-language-server/lib/cli.mjs');
          console.log('TypeScript LSP server path:', tsServerPath);
        } catch (error) {
          reject(new Error(`Failed to resolve typescript-language-server: ${error}`));
          return;
        }
        
        console.log('Starting TypeScript LSP server process...');
        this.tsServerProcess = spawn('node', [tsServerPath, '--stdio'], {
          cwd: this.projectPath || process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, NODE_ENV: 'development' }
        });

        if (!this.tsServerProcess) {
          reject(new Error('Failed to spawn TypeScript LSP server process'));
          return;
        }

        console.log('TypeScript LSP server process started with PID:', this.tsServerProcess.pid);

        let buffer = '';
        let serverReady = false;
        
        this.tsServerProcess.stdout?.on('data', (data) => {
          buffer += data.toString();
          // Process and extract complete messages
          buffer = this.extractCompleteMessages(buffer);
        });

        this.tsServerProcess.stderr?.on('data', (data) => {
          const errorMessage = data.toString();
          console.error('TypeScript LSP stderr:', errorMessage);
          // If there's a critical error, reject the promise
          if (errorMessage.includes('Error:') || errorMessage.includes('SyntaxError:')) {
            if (!serverReady) {
              reject(new Error(`TypeScript LSP startup error: ${errorMessage}`));
            }
          }
        });

        this.tsServerProcess.on('error', (error) => {
          console.error('TypeScript LSP process error:', error);
          if (!serverReady) {
            reject(error);
          }
        });

        this.tsServerProcess.on('exit', (code, signal) => {
          console.log(`TypeScript LSP process exited with code: ${code}, signal: ${signal}`);
          this.isInitialized = false;
          this.tsServerProcess = null;
          this.rejectAllPendingRequests();
          
          if (!serverReady) {
            reject(new Error(`TypeScript LSP server exited early with code: ${code}, signal: ${signal}`));
          }
        });

        // Wait a bit longer for the server to be ready for requests
        setTimeout(() => {
          serverReady = true;
          resolve();
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  private extractCompleteMessages(buffer: string): string {
    const messages = [];
    let remaining = buffer;

    while (true) {
      const headerEnd = remaining.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const headerPart = remaining.substring(0, headerEnd);
      const contentLengthMatch = headerPart.match(/Content-Length: (\d+)/);
      
      if (!contentLengthMatch) {
        remaining = remaining.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1]);
      const messageStart = headerEnd + 4;
      
      if (remaining.length < messageStart + contentLength) {
        break; // Incomplete message
      }

      const messageContent = remaining.substring(messageStart, messageStart + contentLength);
      messages.push(messageContent);
      remaining = remaining.substring(messageStart + contentLength);
    }

    // Process complete messages
    for (const message of messages) {
      try {
        const parsed = JSON.parse(message);
        this.handleMessage(parsed);
      } catch (error) {
        console.error('Failed to parse LSP message:', error, 'Raw message:', message.substring(0, 200) + '...');
      }
    }

    return remaining;
  }

  private handleMessage(message: any): void {
    if (message.id !== undefined) {
      // Response to a request
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);
        
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    } else {
      // Notification from server
      this.emit('notification', message);
    }
  }

  private async sendInitialize(): Promise<void> {
    const initializeParams = {
      processId: process.pid,
      clientInfo: {
        name: 'vcode-ide',
        version: '1.0.0',
      },
      rootUri: this.projectPath ? `file://${this.projectPath}` : null,
      workspaceFolders: this.projectPath ? [{
        uri: `file://${this.projectPath}`,
        name: path.basename(this.projectPath),
      }] : null,
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: false,
            willSave: false,
            willSaveWaitUntil: false,
            didSave: false,
          },
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ['markdown', 'plaintext'],
              deprecatedSupport: true,
              preselectSupport: true,
              tagSupport: {
                valueSet: [1] // Deprecated
              },
              insertReplaceSupport: true,
              resolveSupport: {
                properties: ['documentation', 'detail', 'additionalTextEdits']
              }
            },
            completionItemKind: {
              valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
            }
          },
          hover: {
            dynamicRegistration: false,
            contentFormat: ['markdown', 'plaintext'],
          },
          signatureHelp: {
            dynamicRegistration: false,
            signatureInformation: {
              documentationFormat: ['markdown', 'plaintext'],
              parameterInformation: {
                labelOffsetSupport: true
              }
            },
            contextSupport: true
          },
          definition: {
            dynamicRegistration: false,
            linkSupport: true
          },
          references: {
            dynamicRegistration: false,
          },
          documentHighlight: {
            dynamicRegistration: false,
          },
          documentSymbol: {
            dynamicRegistration: false,
            symbolKind: {
              valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
            },
            hierarchicalDocumentSymbolSupport: true
          },
          codeAction: {
            dynamicRegistration: false,
            codeActionLiteralSupport: {
              codeActionKind: {
                valueSet: ['quickfix', 'refactor', 'refactor.extract', 'refactor.inline', 'refactor.rewrite', 'source', 'source.organizeImports'],
              },
            },
            isPreferredSupport: true,
            disabledSupport: true,
            dataSupport: true,
            resolveSupport: {
              properties: ['edit']
            },
            honorsChangeAnnotations: false
          },
          codeLens: {
            dynamicRegistration: false,
          },
          formatting: {
            dynamicRegistration: false,
          },
          rangeFormatting: {
            dynamicRegistration: false,
          },
          onTypeFormatting: {
            dynamicRegistration: false,
          },
          rename: {
            dynamicRegistration: false,
            prepareSupport: true,
            prepareSupportDefaultBehavior: 1,
            honorsChangeAnnotations: true
          },
          publishDiagnostics: {
            relatedInformation: true,
            versionSupport: false,
            tagSupport: {
              valueSet: [1, 2] // Unnecessary, Deprecated
            },
            codeDescriptionSupport: true,
            dataSupport: true
          },
        },
        workspace: {
          applyEdit: true,
          workspaceEdit: {
            documentChanges: true,
            resourceOperations: ['create', 'rename', 'delete'],
            failureHandling: 'textOnlyTransactional',
            normalizesLineEndings: true,
            changeAnnotationSupport: {
              groupsOnLabel: true
            }
          },
          didChangeConfiguration: {
            dynamicRegistration: false,
          },
          didChangeWatchedFiles: {
            dynamicRegistration: false,
          },
          symbol: {
            dynamicRegistration: false,
            symbolKind: {
              valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
            }
          },
          executeCommand: {
            dynamicRegistration: false,
          },
          workspaceFolders: true,
          configuration: true
        },
        window: {
          showMessage: {
            messageActionItem: {
              additionalPropertiesSupport: true
            }
          },
          showDocument: {
            support: true
          },
          workDoneProgress: true
        },
        general: {
          regularExpressions: {
            engine: 'ECMAScript',
            version: 'ES2020'
          },
          markdown: {
            parser: 'marked',
            version: '1.1.0'
          }
        }
      },
      initializationOptions: {
        preferences: {
          includeInlayParameterNameHints: 'all',
          includeInlayParameterNameHintsWhenArgumentMatchesName: false,
          includeInlayFunctionParameterTypeHints: true,
          includeInlayVariableTypeHints: true,
          includeInlayPropertyDeclarationTypeHints: true,
          includeInlayFunctionLikeReturnTypeHints: true,
          includeInlayEnumMemberValueHints: true,
          importModuleSpecifier: 'shortest',
          allowTextChangesInNewFiles: true,
          providePrefixAndSuffixTextForRename: true,
          allowRenameOfImportPath: true,
          includeAutomaticOptionalChainCompletions: true,
          provideRefactorNotApplicableReason: true,
          generateReturnInDocTemplate: true,
          includeCompletionsForModuleExports: true,
          includeCompletionsForImportStatements: true,
          includeCompletionsWithSnippetText: true,
          includeCompletionsWithClassMemberSnippets: true,
          includeCompletionsWithObjectLiteralMethodSnippets: true,
          useLabelDetailsInCompletionEntries: true,
          allowIncompleteCompletions: true,
          displayPartsForJSDoc: true,
          disableLineTextInReferences: true
        },
        hostInfo: 'vcode-ide'
      }
    };

    const result = await this.sendRequest('initialize', initializeParams);
    
    // Send initialized notification
    await this.sendNotification('initialized', {});
    
    // Configure the workspace if we have a project path
    if (this.projectPath) {
      await this.sendNotification('workspace/didChangeConfiguration', {
        settings: {
          typescript: {
            preferences: {
              includePackageJsonAutoImports: 'auto',
              includeCompletionsForModuleExports: true,
              includeAutomaticOptionalChainCompletions: true,
              includeCompletionsWithInsertText: true,
              allowTextChangesInNewFiles: true,
              providePrefixAndSuffixTextForRename: true,
              allowRenameOfImportPath: true,
              displayPartsForJSDoc: true,
              generateReturnInDocTemplate: true
            },
            suggest: {
              includeCompletionsForModuleExports: true,
              includeAutomaticOptionalChainCompletions: true,
              includeCompletionsWithInsertText: true
            }
          }
        }
      });
    }
    
    this.isInitialized = true;
    console.log('TypeScript LSP initialized successfully');
  }

  public async sendRequest(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.tsServerProcess || !this.tsServerProcess.stdin) {
        reject(new Error('TypeScript LSP server is not running'));
        return;
      }

      const id = ++this.requestId;
      const request: LSPRequest = { id, method, params };
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, 10000); // Increased timeout to 10 seconds

      this.pendingRequests.set(id, { resolve, reject, timeout });

      const message = JSON.stringify(request);
      const content = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;
      
      this.tsServerProcess.stdin.write(content);
    });
  }

  public async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.tsServerProcess || !this.tsServerProcess.stdin) {
      throw new Error('TypeScript LSP server is not running');
    }

    const notification: LSPNotification = { method, params };
    const message = JSON.stringify(notification);
    const content = `Content-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`;
    
    this.tsServerProcess.stdin.write(content);
  }

  public async didOpenTextDocument(uri: string, languageId: string, version: number, text: string): Promise<void> {
    await this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
        version,
        text,
      },
    });
  }

  public async didChangeTextDocument(uri: string, version: number, changes: any[]): Promise<void> {
    await this.sendNotification('textDocument/didChange', {
      textDocument: {
        uri,
        version,
      },
      contentChanges: changes,
    });
  }

  public async didCloseTextDocument(uri: string): Promise<void> {
    await this.sendNotification('textDocument/didClose', {
      textDocument: {
        uri,
      },
    });
  }

  public async getCompletions(uri: string, position: { line: number; character: number }): Promise<any> {
    return this.sendRequest('textDocument/completion', {
      textDocument: { uri },
      position,
    });
  }

  public async getHover(uri: string, position: { line: number; character: number }): Promise<any> {
    return this.sendRequest('textDocument/hover', {
      textDocument: { uri },
      position,
    });
  }

  public async getDefinition(uri: string, position: { line: number; character: number }): Promise<any> {
    return this.sendRequest('textDocument/definition', {
      textDocument: { uri },
      position,
    });
  }

  public async getReferences(uri: string, position: { line: number; character: number }): Promise<any> {
    return this.sendRequest('textDocument/references', {
      textDocument: { uri },
      position,
      context: { includeDeclaration: true },
    });
  }

  public async getSignatureHelp(uri: string, position: { line: number; character: number }): Promise<any> {
    return this.sendRequest('textDocument/signatureHelp', {
      textDocument: { uri },
      position,
    });
  }

  private rejectAllPendingRequests(): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('TypeScript LSP server stopped'));
    }
    this.pendingRequests.clear();
  }

  public async stopServer(): Promise<void> {
    if (this.tsServerProcess) {
      console.log('Stopping TypeScript LSP server...');
      this.rejectAllPendingRequests();
      
      if (!this.tsServerProcess.killed) {
        this.tsServerProcess.kill('SIGTERM');
        
        // Give the process a moment to gracefully exit
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.tsServerProcess = null;
      this.isInitialized = false;
      console.log('TypeScript LSP server stopped');
    }
  }

  public isServerRunning(): boolean {
    return this.tsServerProcess !== null && !this.tsServerProcess.killed;
  }
}

export const typescriptLSPService = TypeScriptLSPService.getInstance();
