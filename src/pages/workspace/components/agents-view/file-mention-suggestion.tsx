import React from "react";
import { MentionItem } from "@/pages/workspace/components/chat/types";

interface FileMentionSuggestionProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
  selectedIndex: number;
}

export class FileMentionSuggestion {
  element: HTMLDivElement;
  props: FileMentionSuggestionProps;

  constructor(props: FileMentionSuggestionProps) {
    this.props = props;
    this.element = document.createElement("div");
    this.element.className =
      "bg-white border rounded-md shadow-lg p-1 max-h-48 overflow-y-auto z-50";
    this.render();
  }

  updateProps(props: FileMentionSuggestionProps) {
    this.props = props;
    this.render();
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === "ArrowUp") {
      this.upHandler();
      return true;
    }

    if (event.key === "ArrowDown") {
      this.downHandler();
      return true;
    }

    if (event.key === "Enter") {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    const newIndex =
      this.props.selectedIndex === 0
        ? this.props.items.length - 1
        : this.props.selectedIndex - 1;

    this.updateProps({
      ...this.props,
      selectedIndex: newIndex,
    });
  }

  downHandler() {
    const newIndex =
      this.props.selectedIndex === this.props.items.length - 1
        ? 0
        : this.props.selectedIndex + 1;

    this.updateProps({
      ...this.props,
      selectedIndex: newIndex,
    });
  }

  enterHandler() {
    this.selectItem(this.props.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.props.items[index];
    if (item) {
      this.props.command(item);
    }
  }

  render() {
    this.element.innerHTML = "";

    if (this.props.items.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "px-3 py-2 text-sm text-gray-500";
      noResults.textContent = "No files found";
      this.element.appendChild(noResults);
      return;
    }

    this.props.items.forEach((item, index) => {
      const button = document.createElement("button");
      button.className = `w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
        index === this.props.selectedIndex ? "bg-blue-50" : ""
      }`;

      button.innerHTML = `
        <div class="font-medium">${item.label}</div>
        ${item.description ? `<div class="text-xs text-gray-500">${item.description}</div>` : ""}
      `;

      button.addEventListener("click", () => this.selectItem(index));
      this.element.appendChild(button);
    });
  }

  destroy() {
    this.element.remove();
  }
}
