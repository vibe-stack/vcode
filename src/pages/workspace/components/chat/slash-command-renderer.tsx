// Helper class for slash command suggestions
export class SlashCommandSuggestionRenderer {
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
      'slash-command-suggestions',
      'bg-popover',
      'border',
      'border-border',
      'rounded-lg',
      'shadow-lg',
      'max-h-64',
      'overflow-y-auto',
      'scrollbar-thin',
      'scrollbar-thumb-muted',
      'scrollbar-track-transparent',
      'p-1'
    ].join(' ');

    // Custom styling
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
        .slash-command-suggestions::-webkit-scrollbar {
          width: 8px;
          background: transparent;
        }
        .slash-command-suggestions::-webkit-scrollbar-thumb {
          background: rgba(120,120,120,0.15);
          border-radius: 8px;
        }
        .slash-command-suggestions::-webkit-scrollbar-track {
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
        'gap-3',
        'rounded-md',
        index === this.selectedIndex ? 'bg-accent text-accent-foreground' : ''
      ].join(' ');

      button.innerHTML = `
        <div class="text-lg">${item.icon || '/'}</div>
        <div class="flex-1">
          <div class="font-medium text-sm">${item.name}</div>
          <div class="text-xs text-muted-foreground">${item.description}</div>
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
      this.props.command(item);
    }
  }

  destroy() {
    this.element.remove();
  }
}