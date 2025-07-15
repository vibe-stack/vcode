import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KanbanTask, TaskStatus, WorkStatus, TaskAttachment } from '@/stores/kanban/types';
import { FileAttachmentEditor } from './file-attachment-editor';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  task?: KanbanTask;
  initialStatus?: TaskStatus;
  canCreateInStatus?: boolean;
}

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'paused', label: 'Paused' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'testing', label: 'Testing' },
  { value: 'finalizing', label: 'Finalizing' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'ideas', label: 'Ideas' },
  { value: 'todo', label: 'To Do' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  onSave,
  task,
  initialStatus = 'ideas',
  canCreateInStatus = true,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: initialStatus,
    workStatus: 'not-started' as WorkStatus,
    assignedAgent: 'grok4',
    attachments: [] as TaskAttachment[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        workStatus: task.workStatus,
        assignedAgent: task.assignedAgent,
        attachments: task.attachments,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: initialStatus,
        workStatus: 'not-started',
        assignedAgent: 'grok4',
        attachments: [],
      });
    }
    setErrors({});
  }, [task, initialStatus, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!canCreateInStatus && formData.status === initialStatus) {
      newErrors.status = 'Cannot create tasks in this status';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      status: initialStatus,
      workStatus: 'not-started',
      assignedAgent: 'grok4',
      attachments: [],
    });
    setErrors({});
    onClose();
  };

  return (
    <Sheet modal open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="md:max-w-6xl w-full bg-gradient-to-br from-neutral-900/60 via-neutral-950/60 to-neutral-900/60 p-12 overflow-y-auto backdrop-blur-lg">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-3xl font-bold text-neutral-900 dark:text-white text-center">
            {task ? 'Edit Task' : 'Create New Task'}
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 relative pb-28 md:pb-0">
          {/* Main content column */}
          <div className="flex-1 bg-white/80 dark:bg-neutral-900/80 rounded-lg shadow p-8 space-y-8">
            <div>
              <Label htmlFor="title" className="text-lg font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title..."
                className={`mt-2 text-2xl font-semibold ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="description" className="text-lg font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description..."
                rows={8}
                className="mt-2 min-h-[180px] resize-vertical"
              />
            </div>
            <div>
              <Label className="text-lg font-medium">Attached Files</Label>
              <FileAttachmentEditor
                value={formData.attachments}
                onChange={(attachments) => setFormData({ ...formData, attachments })}
                placeholder="Type @ to mention files from your codebase..."
              />
            </div>
          </div>
          {/* Sidebar metafields */}
          <div className="w-full md:w-80 flex-shrink-0 bg-neutral-100/80 dark:bg-neutral-950/80 rounded-lg shadow p-6 flex flex-col gap-6 h-fit">
            <div>
              <Label htmlFor="status" className="text-base font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className={`mt-2 w-full ${errors.status ? 'border-red-500' : ''}`} >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>
            <div>
              <Label htmlFor="assignedAgent" className="text-base font-medium">Assigned Agent</Label>
              <Input
                id="assignedAgent"
                disabled
                value={formData.assignedAgent}
                onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                placeholder="Enter agent name..."
                className="mt-2 w-full"
              />
            </div>
          </div>
          {/* Sticky footer for actions */}
          <div className="fixed bottom-0 left-0 w-full md:w-auto md:left-auto md:bottom-8 md:right-8 z-50 flex justify-end gap-2 bg-gradient-to-t from-neutral-950/70 via-neutral-950/60 to-transparent p-4 md:p-0 pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 min-w-[120px]">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 min-w-[120px]">
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
