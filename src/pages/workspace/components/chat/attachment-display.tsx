import React from 'react';
import { File, Globe, Link, Paperclip } from 'lucide-react';
import { ChatAttachment } from './types';

interface AttachmentDisplayProps {
  attachments: ChatAttachment[];
}

export const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({ attachments }) => {
  const [open, setOpen] = React.useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <File className="h-4 w-4" />;
      case 'url':
        return <Globe className="h-4 w-4" />;
      case 'reference':
        return <Link className="h-4 w-4" />;
      default:
        return <Paperclip className="h-4 w-4" />;
    }
  };

  return (
    <div className="mt-2 max-w-full">
      <div className="flex items-center gap-1 mb-2" onClick={() => setOpen(o => !o)}>
        <Paperclip className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
        </span>
      </div>

      {open && <div className="space-y-1">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="bg-muted rounded-sm p-2">
            <div className="flex flex-row gap-2">
              <div>
                {getIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs truncate">{attachment.name}</span>
                </div>
              </div>
            </div>
          </div>

        ))}
      </div>}
    </div>
  );
};
