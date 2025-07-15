// File attachment functionality for kanban tasks

import { TaskAttachment } from '@/stores/kanban/types';

export interface FileAttachmentItem {
  id: string;
  label: string;
  type: 'file';
  path: string;
  description?: string;
  size?: number;
  lastModified?: Date;
}

export const convertFileToAttachment = (file: FileAttachmentItem): TaskAttachment => ({
  id: file.id,
  type: 'file',
  name: file.label,
  path: file.path,
  size: file.size,
  lastModified: file.lastModified
});

export const convertAttachmentToFile = (attachment: TaskAttachment): FileAttachmentItem => ({
  id: attachment.id,
  label: attachment.name,
  type: 'file',
  path: attachment.path,
  size: attachment.size,
  lastModified: attachment.lastModified
});
