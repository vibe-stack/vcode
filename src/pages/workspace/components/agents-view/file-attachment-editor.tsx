import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";
import { FileAttachmentItem, convertFileToAttachment } from "./file-attachment";
import { TaskAttachment } from "@/stores/kanban/types";
import { mentionProvider } from "@/pages/workspace/components/chat/mention-provider";
import { MentionItem } from "@/pages/workspace/components/chat/types";
import { Search, X, File } from "lucide-react";

interface FileAttachmentEditorProps {
  value: TaskAttachment[];
  onChange: (attachments: TaskAttachment[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const FileAttachmentEditor: React.FC<FileAttachmentEditorProps> = ({
  value,
  onChange,
  placeholder = "Search files to attach...",
  disabled = false,
}) => {
  const [attachments, setAttachments] = useState<TaskAttachment[]>(value || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MentionItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Update local state when value changes
  useEffect(() => {
    setAttachments(value || []);
  }, [value]);

  // Search for files when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = mentionProvider.searchMentionsSync(searchQuery, "file");
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  const handleAddFile = useCallback(
    async (mentionItem: MentionItem) => {
      if (!mentionItem.id || !mentionItem.label) return;

      // Check if file is already attached
      const isAlreadyAttached = attachments.some(
        (att) => att.id === mentionItem.id,
      );
      if (isAlreadyAttached) return;

      const fileItem: FileAttachmentItem = {
        id: mentionItem.id,
        label: mentionItem.label,
        type: "file",
        path: mentionItem.path || mentionItem.id,
        description: mentionItem.description,
      };

      const newAttachment = convertFileToAttachment(fileItem);
      const newAttachments = [...attachments, newAttachment];

      setAttachments(newAttachments);
      onChange(newAttachments);
      setSearchQuery("");
      setShowDropdown(false);
    },
    [attachments, onChange],
  );

  const handleRemoveFile = useCallback(
    (attachmentId: string) => {
      const newAttachments = attachments.filter(
        (att) => att.id !== attachmentId,
      );
      setAttachments(newAttachments);
      onChange(newAttachments);
    },
    [attachments, onChange],
  );

  const handleSearchFocus = useCallback(() => {
    if (searchQuery.length >= 2) {
      setShowDropdown(true);
    }
  }, [searchQuery]);

  const handleSearchBlur = useCallback(() => {
    // Delay hiding dropdown to allow click events
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10"
        />

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-white shadow-lg dark:bg-gray-800">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleAddFile(result)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <File className="text-muted-foreground h-4 w-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{result.label}</div>
                  {result.description && (
                    <div className="text-muted-foreground text-xs">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attached Files Pills */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="bg-accent/30 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
            >
              <File className="h-3 w-3" />
              <span className="font-medium">{attachment.name}</span>
              <span className="text-muted-foreground text-xs">
                {attachment.path.split("/").pop()}
              </span>
              {!disabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveFile(attachment.id)}
                  className="h-4 w-4 p-0 hover:bg-red-500/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
