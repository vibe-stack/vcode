// Helper class for mention suggestions
export class MentionSuggestionRenderer {
  element: HTMLElement;
  props: any;
  selectedIndex: number = 0;

  constructor(props: any) {
    this.props = props;
    this.element = document.createElement('div');
    this.update();
  }

  update() {
    const items = this.props.items || [];
    this.element.innerHTML = '';
    this.element.className = [
      'mention-suggestions',
      'bg-popover',
      'border',
      'border-border',
      'rounded-lg', // more pronounced rounding
      'shadow-lg',
      'max-h-64',
      'overflow-y-auto',
      'scrollbar-thin',
      'scrollbar-thumb-muted',
      'scrollbar-track-transparent',
      'p-1'
    ].join(' ');

    // Custom scrollbar for macOS look
    this.element.style.scrollbarWidth = 'thin';
    this.element.style.borderRadius = '0.75rem';
    this.element.style.overflowY = 'auto';
    this.element.style.background = 'var(--popover)';
    this.element.style.maxHeight = '16rem';
    this.element.style.padding = '0.25rem';
    this.element.style.boxShadow = '0 4px 24px 0 rgba(0,0,0,0.10)';

    // Add custom scrollbar styles
    if (!this.element.querySelector('style')) {
      const style = document.createElement('style');
      style.innerHTML = `
        .mention-suggestions::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .mention-suggestions::-webkit-scrollbar-thumb {
          background: rgba(120,120,120,0.15);
          border-radius: 8px;
        }
        .mention-suggestions::-webkit-scrollbar-track {
          background: transparent;
        }
      `;
      this.element.appendChild(style);
    }

    if (items.length === 0) {
      this.element.style.display = 'none';
      return;
    }

    this.element.style.display = 'block';

    // Helper to get relative path
    const getRelativePath = (fullPath: string) => {
      if (!fullPath) return '';
      // Try to find /src/ or / in the path and show from there
      const match = fullPath.match(/(?:\\|\/)(src|components|pages|api|helpers|hooks|layouts|localization|routes|services|stores|styles|themes|types|utils)(?:\\|\/)/);
      if (match) {
        const idx = fullPath.indexOf(match[0]);
        return fullPath.slice(idx + 1); // skip leading slash
      }
      // fallback: show last 2 segments
      const parts = fullPath.split(/\\|\//);
      return parts.slice(-2).join('/');
    };

    items.forEach((item: any, index: number) => {
      const button = document.createElement('button');
      button.className = [
        'w-full',
        'text-left',
        'p-2',
        'hover:bg-accent',
        'hover:text-accent-foreground',
        'flex',
        'items-center',
        'gap-2',
        'rounded-md',
        index === this.selectedIndex ? 'bg-accent text-accent-foreground' : ''
      ].join(' ');

      const relPath = item.path ? getRelativePath(item.path) : '';

      button.innerHTML = `
        <div class="flex-1">
          <div class="font-medium text-sm">${item.label}</div>
          ${item.description ? `<div class="text-xs text-muted-foreground">${item.description}</div>` : ''}
          ${relPath ? `<div class="text-xs text-muted-foreground truncate">${relPath}</div>` : ''}
        </div>
      `;

      button.addEventListener('click', () => {
        this.selectItem(index);
      });

      this.element.appendChild(button);
    });
  }

  updateProps(props: any) {
    this.props = props;
    this.update();
  }

  onKeyDown({ event }: any) {
    const items = this.props.items || [];

    if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
      this.update();
      event.preventDefault();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      this.update();
      event.preventDefault();
      return true;
    }

    if (event.key === 'Enter') {
      this.selectItem(this.selectedIndex);
      event.preventDefault();
      return true;
    }

    return false;
  }

  selectItem(index: number) {
    const items = this.props.items || [];
    const item = items[index];
    
    if (item) {
      this.props.command({
        id: item.id,
        label: item.label,
        type: item.type,
        path: item.path,
      });
    }
  }

  destroy() {
    this.element.remove();
  }
}
