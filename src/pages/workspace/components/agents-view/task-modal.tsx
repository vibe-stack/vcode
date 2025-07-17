import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KanbanTask,
  TaskStatus,
  WorkStatus,
  TaskAttachment,
} from "@/stores/kanban/types";
import { FileAttachmentEditor } from "./file-attachment-editor";
import { AgentComments } from "./agent-comments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettingsStore } from "@/stores/settings";
import { getActiveAccentClasses } from "@/utils/accent-colors";
import { cn } from "@/utils/tailwind";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Omit<KanbanTask, "id" | "createdAt" | "updatedAt">) => void;
  task?: KanbanTask;
  initialStatus?: TaskStatus;
  canCreateInStatus?: boolean;
}

const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "paused", label: "Paused" },
  { value: "blocked", label: "Blocked" },
  { value: "testing", label: "Testing" },
  { value: "finalizing", label: "Finalizing" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "ideas", label: "Ideas" },
  { value: "todo", label: "To Do" },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  onSave,
  task,
  initialStatus = "ideas",
  canCreateInStatus = true,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: initialStatus,
    workStatus: "not-started" as WorkStatus,
    assignedAgent: "grok4",
    attachments: [] as TaskAttachment[],
  });

  const isTaskStarted =
    task?.status === "doing" ||
    task?.status === "done" ||
    task?.status === "rejected";
  const canEditTask = !isTaskStarted;
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || "blue";
  const useGradient = settings.appearance?.useGradient || false;

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
        title: "",
        description: "",
        status: initialStatus,
        workStatus: "not-started",
        assignedAgent: "grok4",
        attachments: [],
      });
    }
    setErrors({});
  }, [task, initialStatus, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!canCreateInStatus && formData.status === initialStatus) {
      newErrors.status = "Cannot create tasks in this status";
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
      title: "",
      description: "",
      status: initialStatus,
      workStatus: "not-started",
      assignedAgent: "grok4",
      attachments: [],
    });
    setErrors({});
    onClose();
  };


  return (
    <Sheet modal open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto bg-gradient-to-br from-neutral-900/60 via-neutral-950/60 to-neutral-900/60 p-8 backdrop-blur-lg md:max-w-4xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold text-neutral-900 dark:text-white">
            {task ? "Task Details" : "Create New Task"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Task Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-lg bg-white/80 p-6 shadow dark:bg-neutral-900/80"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Main content */}
              <div className="space-y-4 md:col-span-2">
                <div>
                  <Label htmlFor="title" className="text-base font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter task title..."
                    disabled={!canEditTask}
                    className={`mt-2 ${errors.title ? "border-red-500" : ""}`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-base font-medium"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter task description..."
                    rows={4}
                    disabled={!canEditTask}
                    className="resize-vertical mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Attached Files
                  </Label>
                  <FileAttachmentEditor
                    value={formData.attachments}
                    onChange={(attachments) =>
                      setFormData({ ...formData, attachments })
                    }
                    placeholder="Type @ to mention files from your codebase..."
                    disabled={!canEditTask}
                  />
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status" className="text-base font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: TaskStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={!canEditTask}
                  >
                    <SelectTrigger
                      className={`mt-2 ${errors.status ? "border-red-500" : ""}`}
                    >
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
                  {errors.status && (
                    <p className="mt-1 text-xs text-red-500">{errors.status}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="assignedAgent"
                    className="text-base font-medium"
                  >
                    Assigned Agent
                  </Label>
                  <Input
                    id="assignedAgent"
                    disabled
                    value={formData.assignedAgent}
                    className="mt-2"
                  />
                </div>

                {task && (
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        Updated: {new Date(task.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {canEditTask && (
                <Button 
                  type="submit" 
                  className={cn(
                    "bg-primary hover:bg-primary/90 rounded-sm",
                    getActiveAccentClasses(accentColor, useGradient)
                  )}
                >
                  {task ? "Update Task" : "Create Task"}
                </Button>
              )}
            </div>
          </form>

          {/* Agent Comments Section */}
          {task && (
            <div className="overflow-hidden rounded-lg border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 shadow">
              <div className="border-b border-blue-200 dark:border-blue-800 p-4">
                <h3 className="text-lg font-medium">Agent Communication</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {isTaskStarted
                    ? "Agent execution logs and user comments"
                    : "Prepare messages for the agent. Use 'Run' in the kanban board to execute."}
                </p>
              </div>
              <AgentComments
                taskId={task.id}
                canAddMessages={!isTaskStarted}
                className="h-96"
              />
            </div>
          )}
          
        </div>
      </SheetContent>
    </Sheet>
  );
};
