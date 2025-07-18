import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('VCode IDE Extension is now active!')

  // Register command to open VCode editor
  const openEditorCommand = vscode.commands.registerCommand('vcode.openEditor', async () => {
    const panel = vscode.window.createWebviewPanel(
      'vcodeEditor',
      'VCode Editor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    )

    panel.webview.html = getWebviewContent()
  })

  // Register welcome command
  const showWelcomeCommand = vscode.commands.registerCommand('vcode.showWelcome', () => {
    vscode.window.showInformationMessage('Welcome to VCode IDE Extension!')
  })

  // Add commands to subscriptions
  context.subscriptions.push(openEditorCommand, showWelcomeCommand)

  // Show welcome message on activation
  vscode.window.showInformationMessage('VCode IDE Extension activated successfully!')
}

export function deactivate() {
  console.log('VCode IDE Extension is deactivated')
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VCode Editor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .editor-area {
            width: 100%;
            height: 400px;
            border: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            padding: 10px;
            outline: none;
            resize: vertical;
        }
        .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            margin: 10px 5px 0 0;
            cursor: pointer;
            border-radius: 2px;
        }
        .button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        h1 {
            color: var(--vscode-foreground);
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>VCode Editor</h1>
        <p>This is a simple editor interface within VS Code using the VCode IDE Extension.</p>
        
        <textarea 
            class="editor-area" 
            placeholder="Start coding here..."
            id="editor"
        ></textarea>
        
        <div>
            <button class="button" onclick="clearEditor()">Clear</button>
            <button class="button" onclick="formatCode()">Format</button>
            <button class="button" onclick="saveContent()">Save to File</button>
        </div>
        
        <p><strong>Features:</strong></p>
        <ul>
            <li>Basic text editing</li>
            <li>VS Code theme integration</li>
            <li>Extensible for Monaco integration</li>
            <li>File operations</li>
        </ul>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function clearEditor() {
            document.getElementById('editor').value = '';
        }
        
        function formatCode() {
            const editor = document.getElementById('editor');
            const content = editor.value;
            // Basic formatting - in a real implementation, this would use Monaco
            const formatted = content.split('\\n').map(line => line.trim()).join('\\n');
            editor.value = formatted;
        }
        
        function saveContent() {
            const content = document.getElementById('editor').value;
            vscode.postMessage({
                command: 'save',
                content: content
            });
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'loadContent':
                    document.getElementById('editor').value = message.content;
                    break;
            }
        });
    </script>
</body>
</html>`
}