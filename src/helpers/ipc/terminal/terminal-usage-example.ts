/**
 * Usage example for the enhanced terminal API with command result tracking
 */

// Example usage of the new terminal API with command result callbacks
export function exampleTerminalUsage() {
  // Create a new terminal
  window.terminalApi.create({ cwd: process.cwd(), title: 'Example Terminal' })
    .then((terminal) => {
      console.log('Terminal created:', terminal);

      // Example 1: Run a command with callback to get results
      window.terminalApi.write(terminal.id, 'cat package.json\n', (result: string, exitCode: number) => {
        console.log('Command finished with exit code:', exitCode);
        console.log('Command output:', result);
        
        // Parse the package.json content from the result
        try {
          // Extract just the JSON part from the terminal output
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const packageJson = JSON.parse(jsonMatch[0]);
            console.log('Package name:', packageJson.name);
            console.log('Package version:', packageJson.version);
          }
        } catch (error) {
          console.error('Failed to parse package.json:', error);
        }
      });

      // Example 2: Run multiple commands in sequence
      setTimeout(() => {
        window.terminalApi.write(terminal.id, 'ls -la\n', (result: string, exitCode: number) => {
          console.log('Directory listing result:', result);
          
          // Count files in the directory
          const lines = result.split('\n').filter((line: string) => line.trim() && !line.startsWith('total'));
          console.log(`Found ${lines.length} files/directories`);
        });
      }, 2000);

      // Example 3: Run a command that might fail
      setTimeout(() => {
        window.terminalApi.write(terminal.id, 'nonexistent-command\n', (result: string, exitCode: number) => {
          if (exitCode !== 0) {
            console.error('Command failed with exit code:', exitCode);
            console.error('Error output:', result);
          } else {
            console.log('Command succeeded:', result);
          }
        });
      }, 4000);

      // Example 4: Regular write without callback (existing behavior)
      setTimeout(() => {
        window.terminalApi.write(terminal.id, 'echo "This is a regular write without callback"\n');
      }, 6000);
    })
    .catch((error) => {
      console.error('Failed to create terminal:', error);
    });
}

// Example of setting up global command result listener
export function setupCommandResultListener() {
  window.terminalApi.onCommandResult((data: { terminalId: string; commandId: string; result: string; exitCode: number }) => {
    console.log(`Command ${data.commandId} in terminal ${data.terminalId} completed:`, {
      result: data.result,
      exitCode: data.exitCode
    });
  });
}
