export interface ToolExecutionResult {
  message: string;
  metadata?: {
    fileChanges?: {
      filePath: string;
      operation: 'create' | 'update' | 'delete';
      prevState: string;
      nextState: string;
    }[];
    terminalExecution?: {
      command: string;
      cwd: string;
      terminalId: string;
    };
    contextRules?: {
      rules: string;
      sources: string[];
    };
  };
}

/**
 * Tool execution functions that run in the frontend
 * These have access to the most up-to-date file state
 */
export const frontendToolExecutors = {
  async readFile(args: { filePath: string; sessionId?: string }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      
      const result = await window.projectApi.openFile(filePath);
      
      // Always try to get context rules for this file
      let contextRules = null;
      try {
        const currentProject = await window.projectApi.getCurrentProject();
        console.log('[readFile] Current project:', currentProject);
        console.log('[readFile] File path:', filePath);
        console.log('[readFile] Session ID:', args.sessionId);
        
        if (currentProject) {
          if (args.sessionId) {
            // Use context tracker for token efficiency across the session
            const { contextTracker } = await import('./context-tracker');
            console.log('[readFile] Using context tracker...');
            contextRules = await contextTracker.getNewContextForFiles(
              args.sessionId, 
              [filePath], 
              currentProject
            );

            console.log("Context rules that were found", contextRules);
          } else {
            // Fallback: get context rules directly (less efficient but still works)
            const { contextRulesService } = await import('./context-rules-service');
            console.log('[readFile] Using direct context rules service...');
            contextRules = await contextRulesService.getContextForFile(filePath, currentProject);

            console.log("Context rules fallback", contextRules);
          }
        } else {
          console.warn('[readFile] No current project found');
        }
      } catch (error) {
        console.warn('[readFile tool] Failed to get context rules:', error);
      }
      
      // Format the response based on whether we have context
      let message: string;
      if (contextRules && contextRules.rules.trim()) {
        // Include context rules with clear separation and explicit instructions
        message = `# File: ${filePath}

${result.content}

---

## ⚠️ IMPORTANT: Context Rules for This File

**Please follow these specific rules when working with this file:**

${contextRules.rules}

*📁 Context sources: ${contextRules.sources.map(s => s.split('/').pop()).join(', ')}*

**These are project-specific requirements that MUST be followed in any modifications to this file.**`;
      } else {
        // Just the file content
        message = result.content;
      }

      console.log("MESSAGE THE AI RECEIVED", message);
      
      return {
        message,
        metadata: contextRules ? { contextRules } : undefined
      };
    } catch (error) {
      console.error('[readFile tool] Error:', error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async writeFile(args: { filePath: string; content: string; sessionId?: string }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }

      // Get context rules BEFORE processing content to ensure they're applied
      let contextRules = null;
      try {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          if (args.sessionId) {
            const { contextTracker } = await import('./context-tracker');
            contextRules = await contextTracker.getNewContextForFiles(
              args.sessionId, 
              [filePath], 
              currentProject
            );
          } else {
            const { contextRulesService } = await import('./context-rules-service');
            contextRules = await contextRulesService.getContextForFile(filePath, currentProject);
          }
        }
      } catch (error) {
        console.warn('[writeFile tool] Failed to get context rules:', error);
      }
      
      // Process the content to handle escaped characters (like \n)
      let processedContent = args.content
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');

      // Apply context rules to the content if they exist
      if (contextRules && contextRules.rules.includes('// Edited by AI')) {
        // Check if the content already has the comment
        if (!processedContent.includes('// Edited by AI')) {
          // Add the comment at the top for TypeScript/JavaScript files
          if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            processedContent = '// Edited by AI\n' + processedContent;
          }
        }
      }
      
      // Get previous content for snapshot
      let prevState = '';
      let operation: 'create' | 'update' = 'create';
      
      try {
        const existingFile = await window.projectApi.openFile(filePath);
        prevState = existingFile.content;
        operation = 'update';
      } catch (error) {
        // File doesn't exist, create it
        await window.projectApi.createFile(filePath, '');
        operation = 'create';
      }
      
      // Import the stores dynamically to avoid circular imports
      const { useEditorSplitStore } = await import('@/stores/editor-splits');
      const { useBufferStore } = await import('@/stores/buffers');
      
      // Open the file in a buffer (this will create or reuse existing buffer)
      const editorStore = useEditorSplitStore.getState();
      await editorStore.openFile(filePath);
      
      // Get the buffer for this file
      const bufferStore = useBufferStore.getState();
      const buffer = bufferStore.getBufferByPath(filePath);
      
      if (!buffer) {
        throw new Error(`Failed to create buffer for ${filePath}`);
      }
      
      // Update the buffer content
      bufferStore.updateBufferContent(buffer.id, processedContent);
      
      // Save the buffer
      const saveSuccess = await bufferStore.saveBuffer(buffer.id);
      
      if (!saveSuccess) {
        throw new Error(`Failed to save buffer for ${filePath}`);
      }
      
      return {
        message: `Successfully ${operation === 'create' ? 'created' : 'updated'} ${filePath}${contextRules ? `\n\n✅ **Context Rules Applied:**\n${contextRules.rules}\n\n*These rules were automatically enforced during file creation/update.*` : ''}`,
        metadata: {
          fileChanges: [{
            filePath,
            operation,
            prevState,
            nextState: processedContent,
          }],
          contextRules: contextRules || undefined
        }
      };
    } catch (error) {
      console.error('[writeFile tool] Error:', error);
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async listDirectory(args: { dirPath: string }): Promise<ToolExecutionResult> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      const result = await window.projectApi.getDirectoryTree(dirPath);
      return {
        message: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      console.error('[listDirectory tool] Error:', error);
      throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async createDirectory(args: { dirPath: string }): Promise<ToolExecutionResult> {
    try {
      let dirPath = args.dirPath;
      if (!dirPath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          dirPath = `${currentProject}/${dirPath}`;
        }
      }
      await window.projectApi.createFolder(dirPath);
      return {
        message: `Successfully created directory ${dirPath}`,
      };
    } catch (error) {
      console.error('[createDirectory tool] Error:', error);
      throw new Error(`Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteFile(args: { filePath: string }): Promise<ToolExecutionResult> {
    try {
      let filePath = args.filePath;
      if (!filePath.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          filePath = `${currentProject}/${filePath}`;
        }
      }
      
      // Get file content for snapshot
      let prevState = '';
      try {
        const existingFile = await window.projectApi.openFile(filePath);
        prevState = existingFile.content;
      } catch (error) {
        // File doesn't exist, nothing to delete
        return {
          message: `File ${filePath} does not exist`,
        };
      }
      
      await window.projectApi.deleteFile(filePath);
      
      return {
        message: `Successfully deleted ${filePath}`,
        metadata: {
          fileChanges: [{
            filePath,
            operation: 'delete',
            prevState,
            nextState: '',
          }]
        }
      };
    } catch (error) {
      console.error('[deleteFile tool] Error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async searchFiles(args: { query: string; directory?: string }): Promise<ToolExecutionResult> {
    try {
      let searchDir = args.directory;
      if (searchDir && !searchDir.startsWith('/')) {
        const currentProject = await window.projectApi.getCurrentProject();
        if (currentProject) {
          searchDir = `${currentProject}/${searchDir}`;
        }
      }
      const result = await window.projectApi.searchFiles(args.query, searchDir);
      return {
        message: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      console.error('[searchFiles tool] Error:', error);
      throw new Error(`Failed to search files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async searchCodebase(args: { query: string; limit?: number }): Promise<ToolExecutionResult> {
    try {
      // Check if index API is available
      if (!window.indexApi) {
        return {
          message: `No relevant code found for query: "${args.query}" (semantic index not available)`
        };
      }

      // Check if index is built
      const status = await window.indexApi.getStatus();
      if (!status?.isBuilt) {
        return {
          message: `No relevant code found for query: "${args.query}" (semantic index not built)`
        };
      }

      // Perform the search with a higher limit to allow for filtering
      const results = await window.indexApi.search(args.query, 50);
      
      if (!results || results.length === 0) {
        return {
          message: `No relevant code found for query: "${args.query}"`
        };
      }

      // Group results by file and limit to max 4 files with max 2 hits each
      const groupedResults: { [filePath: string]: typeof results } = {};
      const maxFiles = 4;
      const maxHitsPerFile = 2;
      
      for (const result of results) {
        if (Object.keys(groupedResults).length >= maxFiles) break;
        
        if (!groupedResults[result.filePath]) {
          groupedResults[result.filePath] = [];
        }
        
        if (groupedResults[result.filePath].length < maxHitsPerFile) {
          groupedResults[result.filePath].push(result);
        }
      }

      // Format the results
      const formattedResults = Object.entries(groupedResults).map(([filePath, fileResults]) => {
        const relativePath = filePath.split('/').slice(-3).join('/'); // Show last 3 path segments
        
        const fileSection = fileResults.map((result, index) => {
          const scorePercent = Math.round(result.score * 100);
          
          let resultText = `**${relativePath}**`;
          if (result.lineNumber) {
            resultText += ` (line ${result.lineNumber})`;
          }
          resultText += ` - ${scorePercent}% relevance\n`;
          
          if (result.snippet) {
            resultText += `\`\`\`\n${result.snippet}\n\`\`\`\n`;
          } else if (result.content) {
            // Truncate content if it's too long
            const content = result.content.length > 200 
              ? result.content.substring(0, 200) + '...'
              : result.content;
            resultText += `\`\`\`\n${content}\n\`\`\`\n`;
          }
          
          return resultText;
        }).join('\n');
        
        return fileSection;
      }).join('\n---\n\n');

      const totalHits = Object.values(groupedResults).reduce((sum, fileResults) => sum + fileResults.length, 0);
      const totalFiles = Object.keys(groupedResults).length;

      return {
        message: `Found ${totalHits} relevant code snippet${totalHits !== 1 ? 's' : ''} in ${totalFiles} file${totalFiles !== 1 ? 's' : ''} for query: "${args.query}"\n\n${formattedResults}`
      };
    } catch (error) {
      console.error('[searchCodebase tool] Error:', error);
      return {
        message: `No relevant code found for query: "${args.query}" (search failed: ${error instanceof Error ? error.message : 'Unknown error'})`
      };
    }
  },

  async getProjectInfo(args: { includeStats?: boolean }): Promise<ToolExecutionResult> {
    try {
      const currentProject = await window.projectApi.getCurrentProject();
      if (!currentProject) {
        return {
          message: 'No project is currently open',
        };
      }

      const projectInfo: any = {
        name: currentProject.split('/').pop() || 'Unknown',
        path: currentProject,
        isOpen: true,
      };

      if (args.includeStats) {
        try {
          const stats = await window.projectApi.getFileStats(currentProject);
          projectInfo.stats = stats;
        } catch (error) {
          projectInfo.stats = 'Unable to retrieve project statistics';
        }
      }

      return {
        message: JSON.stringify(projectInfo, null, 2),
      };
    } catch (error) {
      console.error('[getProjectInfo tool] Error:', error);
      throw new Error(`Failed to get project info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async runTerminalCommand(args: { command: string; cwd?: string }): Promise<ToolExecutionResult> {
    try {
      const currentProject = await window.projectApi.getCurrentProject();
      const workingDir = args.cwd || currentProject || process.cwd();
      
      console.log('[runTerminalCommand] Starting execution:', args.command, 'in', workingDir);
      
      // Create a terminal with the specified command
      const terminalInfo = await window.terminalApi.create({
        title: `Agent: ${args.command.slice(0, 30)}...`,
        cwd: workingDir
      });

      console.log('[runTerminalCommand] Terminal created:', terminalInfo);

      // Set up listeners BEFORE writing the command
      const result = await new Promise<string>((resolve, reject) => {
        let output = '';
        let hasExited = false;
        let hasStarted = false;
        
        console.log('[runTerminalCommand] Setting up listeners for terminal:', terminalInfo.id);
        
        // Collect output
        const unsubscribeData = window.terminalApi.onData((data) => {
          if (data.terminalId === terminalInfo.id) {
            if (!hasStarted) {
              hasStarted = true;
              console.log('[runTerminalCommand] First data received - command started');
            }
            console.log('[runTerminalCommand] Received data chunk:', JSON.stringify(data.data.substring(0, 100)));
            output += data.data;
          }
        });

        // Wait for exit
        const unsubscribeExit = window.terminalApi.onExit((data) => {
          if (data.terminalId === terminalInfo.id) {
            console.log('[runTerminalCommand] Terminal exited with code:', data.exitCode);
            hasExited = true;
            unsubscribeData();
            unsubscribeExit();
            
            // Clean up the terminal
            window.terminalApi.kill(terminalInfo.id).catch((error) => {
              console.log('[runTerminalCommand] Error killing terminal (expected):', error);
            });
            
            // Resolve with the output and exit code
            const finalOutput = `$ ${args.command}\n${output}\n[Process exited with code ${data.exitCode}]`;
            console.log('[runTerminalCommand] Resolving with output length:', finalOutput.length);
            resolve(finalOutput);
          }
        });

        // Handle errors
        const unsubscribeError = window.terminalApi.onError((data) => {
          if (data.terminalId === terminalInfo.id) {
            console.log('[runTerminalCommand] Terminal error:', data.error);
            hasExited = true;
            unsubscribeData();
            unsubscribeExit();
            unsubscribeError();
            
            window.terminalApi.kill(terminalInfo.id).catch(() => {});
            
            const finalOutput = `$ ${args.command}\n${output}\n[Process error: ${data.error}]`;
            resolve(finalOutput);
          }
        });

        // Write the command after setting up listeners
        setTimeout(async () => {
          console.log('[runTerminalCommand] Writing command to terminal:', args.command);
          try {
            await window.terminalApi.write(terminalInfo.id, args.command + '\n');
            console.log('[runTerminalCommand] Command written successfully');
          } catch (error) {
            console.error('[runTerminalCommand] Error writing command:', error);
            unsubscribeData();
            unsubscribeExit();
            unsubscribeError();
            reject(new Error(`Failed to write command: ${error}`));
          }
        }, 100);

        // Set a timeout to prevent hanging (10 seconds for debugging)
        setTimeout(() => {
          if (!hasExited) {
            console.log('[runTerminalCommand] Command timed out - hasStarted:', hasStarted, 'output length:', output.length);
            unsubscribeData();
            unsubscribeExit();
            unsubscribeError();
            window.terminalApi.kill(terminalInfo.id).catch(() => {});
            
            let finalOutput;
            if (!hasStarted) {
              finalOutput = `$ ${args.command}\n[No output received - command may not have started]\n[Process terminated after 5 seconds timeout]`;
            } else {
              finalOutput = `$ ${args.command}\n${output}\n[Process terminated after 5 seconds timeout]`;
            }
            resolve(finalOutput);
          }
        }, 10000); // 10 seconds for debugging
      });

      console.log('[runTerminalCommand] Execution completed successfully');

      return {
        message: result,
        metadata: {
          terminalExecution: {
            command: args.command,
            cwd: workingDir,
            terminalId: terminalInfo.id
          }
        }
      };
    } catch (error) {
      console.error('[runTerminalCommand tool] Error:', error);
      throw new Error(`Failed to run terminal command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
} as const;

export type FrontendToolExecutors = typeof frontendToolExecutors;
