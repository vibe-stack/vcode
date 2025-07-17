// Helper class for mention suggestions
export class MentionSuggestionRenderer {
  element: HTMLElement;
  props: any;
  selectedIndex: number = 0;

  constructor(props: any) {
    this.props = props;
    this.element = document.createElement("div");
    this.update();
  }

  update() {
    const items = this.props.items || [];
    this.element.innerHTML = "";
    this.element.className = [
      "mention-suggestions",
      "bg-popover",
      "border",
      "border-border",
      "rounded-lg",
      "shadow-lg",
      "max-h-64",
      "overflow-y-auto",
      "scrollbar-thin",
      "scrollbar-thumb-muted",
      "scrollbar-track-transparent",
      "p-1",
    ].join(" ");

    if (items.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "text-muted-foreground text-sm p-2 text-center";
      noResults.textContent = "No files found";
      this.element.appendChild(noResults);
      return;
    }

    items.forEach((item: any, index: number) => {
      const div = document.createElement("div");
      div.className = [
        "mention-suggestion-item",
        "flex",
        "items-center",
        "gap-2",
        "p-2",
        "rounded",
        "cursor-pointer",
        "hover:bg-accent",
        "hover:text-accent-foreground",
        index === this.selectedIndex ? "bg-accent text-accent-foreground" : "",
      ].join(" ");

      // Icon based on file type
      const icon = document.createElement("div");
      icon.className = "w-4 h-4 flex-shrink-0";
      
      if (item.type === "file") {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>`;
      } else if (item.type === "folder") {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>`;
      } else {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
      }

      // Content
      const content = document.createElement("div");
      content.className = "flex-1 min-w-0";
      
      const title = document.createElement("div");
      title.className = "text-sm font-medium truncate";
      title.textContent = item.label;
      
      const path = document.createElement("div");
      path.className = "text-xs text-muted-foreground truncate";
      path.textContent = item.path;
      
      content.appendChild(title);
      content.appendChild(path);
      
      div.appendChild(icon);
      div.appendChild(content);

      div.addEventListener("click", () => {
        this.selectItem(index);
      });

      this.element.appendChild(div);
    });
  }

  updateProps(props: any) {
    this.props = props;
    this.selectedIndex = props.selectedIndex || 0;
    this.update();
  }

  selectItem(index: number) {
    const item = this.props.items[index];
    if (item && this.props.command) {
      this.props.command(item);
    }
  }

  onKeyDown(props: { event: KeyboardEvent }) {
    const { event } = props;
    const items = this.props.items || [];

    if (event.key === "ArrowUp") {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.update();
      event.preventDefault();
      return true;
    }

    if (event.key === "ArrowDown") {
      this.selectedIndex = Math.min(items.length - 1, this.selectedIndex + 1);
      this.update();
      event.preventDefault();
      return true;
    }

    if (event.key === "Enter") {
      this.selectItem(this.selectedIndex);
      event.preventDefault();
      return true;
    }

    return false;
  }
}