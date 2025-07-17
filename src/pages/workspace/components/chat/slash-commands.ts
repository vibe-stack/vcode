export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon?: string;
  action?: () => void;
}

export const slashCommands: SlashCommand[] = [
  {
    id: 'help',
    name: '/help',
    description: 'Show available commands and shortcuts',
    icon: '❓',
  },
  {
    id: 'clear',
    name: '/clear',
    description: 'Clear the current conversation',
    icon: '🗑️',
  },
  {
    id: 'new',
    name: '/new',
    description: 'Start a new conversation',
    icon: '➕',
  },
  {
    id: 'search',
    name: '/search',
    description: 'Search through files and code',
    icon: '🔍',
  },
  {
    id: 'explain',
    name: '/explain',
    description: 'Explain the selected code',
    icon: '💡',
  },
  {
    id: 'refactor',
    name: '/refactor',
    description: 'Suggest improvements for the selected code',
    icon: '🔧',
  },
  {
    id: 'test',
    name: '/test',
    description: 'Generate tests for the selected code',
    icon: '🧪',
  },
  {
    id: 'docs',
    name: '/docs',
    description: 'Generate documentation for the selected code',
    icon: '📝',
  },
  {
    id: 'commit',
    name: '/commit',
    description: 'Generate a commit message for staged changes',
    icon: '📦',
  },
  {
    id: 'review',
    name: '/review',
    description: 'Review the current changes',
    icon: '👀',
  },
  {
    id: 'fix',
    name: '/fix',
    description: 'Fix errors in the current file',
    icon: '🔨',
  },
  {
    id: 'optimize',
    name: '/optimize',
    description: 'Optimize the selected code for performance',
    icon: '⚡',
  },
];

export class SlashCommandProvider {
  private static instance: SlashCommandProvider;

  static getInstance(): SlashCommandProvider {
    if (!SlashCommandProvider.instance) {
      SlashCommandProvider.instance = new SlashCommandProvider();
    }
    return SlashCommandProvider.instance;
  }

  searchCommands(query: string): SlashCommand[] {
    if (!query) {
      return slashCommands;
    }

    const lowerQuery = query.toLowerCase();
    return slashCommands.filter(cmd => 
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
    );
  }

  getCommand(id: string): SlashCommand | undefined {
    return slashCommands.find(cmd => cmd.id === id);
  }

  executeCommand(id: string): string {
    const command = this.getCommand(id);
    if (!command) {
      return '';
    }

    // Return a template message based on the command
    switch (id) {
      case 'help':
        return 'Here are the available commands:\n' + 
          slashCommands.map(cmd => `${cmd.name} - ${cmd.description}`).join('\n');
      case 'clear':
        return '/clear';
      case 'new':
        return '/new';
      case 'search':
        return 'What would you like to search for?';
      case 'explain':
        return 'Please explain the following code:';
      case 'refactor':
        return 'Please suggest improvements for the following code:';
      case 'test':
        return 'Please generate tests for the following code:';
      case 'docs':
        return 'Please generate documentation for the following code:';
      case 'commit':
        return 'Please generate a commit message for the staged changes.';
      case 'review':
        return 'Please review the following changes:';
      case 'fix':
        return 'Please fix the errors in this file:';
      case 'optimize':
        return 'Please optimize the following code for better performance:';
      default:
        return '';
    }
  }
}

export const slashCommandProvider = SlashCommandProvider.getInstance();