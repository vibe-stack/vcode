import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { File, Globe, Link, Paperclip } from 'lucide-react';
import { ChatAttachment } from './types';

interface AttachmentDisplayProps {
  attachments: ChatAttachment[];
}

export const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({ attachments }) => {
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${sizes[i]}`;
  };

  return null;

  return (
    <div className="mt-2 max-w-full">
      <div className="flex items-center gap-1 mb-2">
        <Paperclip className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-1">
        {attachments.map((attachment) => (
          <Card key={attachment.id} className="p-2">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 text-muted-foreground">
                {getIcon(attachment.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {attachment.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {attachment.type}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {attachment.path && (
                    <span className="truncate">{attachment.path}</span>
                  )}
                  {attachment.url && (
                    <span className="truncate">{attachment.url}</span>
                  )}
                  {attachment.size && (
                    <span>{formatFileSize(attachment.size)}</span>
                  )}
                </div>
              </div>
            </div>
            
            {attachment.content && (
              <div className="mt-2 p-2 bg-muted rounded-sm">
                <pre className="text-xs overflow-x-auto max-h-32 whitespace-pre-wrap">
                  {attachment.content.substring(0, 500)}
                  {attachment.content.length > 500 && '...'}
                </pre>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
