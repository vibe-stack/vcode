import React from "react";
import { File, Globe, Link, Paperclip } from "lucide-react";
import { ChatAttachment } from "./types";

interface AttachmentDisplayProps {
  attachments: ChatAttachment[];
}

export const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  attachments,
}) => {
  const [open, setOpen] = React.useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "file":
        return <File className="h-4 w-4" />;
      case "url":
        return <Globe className="h-4 w-4" />;
      case "reference":
        return <Link className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  return (
    <div className="mt-2 max-w-full">
      <div
        className="mb-2 flex items-center gap-1"
        onClick={() => setOpen((o) => !o)}
      >
        <Paperclip className="text-muted-foreground h-3 w-3" />
        <span className="text-muted-foreground text-xs">
          {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
        </span>
      </div>

      {open && (
        <div className="space-y-1">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="bg-muted rounded-sm p-2">
              <div className="flex flex-row gap-2">
                <div>{getIcon(attachment.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs">{attachment.name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
