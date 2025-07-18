import React from "react";
import { cn } from "@/utils/tailwind";
import {
  KanbanColumn as KanbanColumnType,
  KanbanTask,
} from "@/stores/kanban/types";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCreateTask: () => void;
  onEditTask: (task: KanbanTask) => void;
  onTaskClick?: (task: KanbanTask) => void;
  onTaskDrop?: (task: KanbanTask, targetColumnId: string) => void;
  onTaskDragStart?: (task: KanbanTask) => void;
  onTaskDragEnd?: () => void;
  draggedTask?: KanbanTask | null;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onCreateTask,
  onEditTask,
  onTaskClick,
  onTaskDrop,
  onTaskDragStart,
  onTaskDragEnd,
  draggedTask,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const taskData = e.dataTransfer.getData("application/json");
      if (taskData) {
        const task = JSON.parse(taskData) as KanbanTask;
        onTaskDrop?.(task, column.id);
      }
    } catch (error) {
      console.error("Error parsing dropped task data:", error);
    }
  };
  return (
    <div 
      className={cn(
        "bg-accent/15 flex w-full flex-col rounded-lg flex-shrink-0 min-h-[300px] max-h-[600px] border border-accent/30 shadow-sm transition-all",
        isDragOver && "border-accent bg-accent/20 shadow-lg"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-accent/25 rounded-t-lg border-b border-accent/30 p-4 flex-shrink-0">
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{column.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-accent/60 rounded-full px-2 py-1 text-center text-xs text-gray-500">
              {column.tasks.length}
            </span>
            {column.canCreateTasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCreateTask}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {column.tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            {column.canCreateTasks ? (
              <>
                No tasks yet.
                <br />
                <button
                  onClick={onCreateTask}
                  className="mt-1 text-emerald-600 hover:text-emerald-400"
                >
                  Create the first one
                </button>
              </>
            ) : (
              "No tasks in this column"
            )}
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onClick={onTaskClick}
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
            />
          ))
        )}
        
        {/* Drop zone ghost */}
        {isDragOver && (
          <div className="border-2 border-dashed border-accent bg-accent/10 rounded-xl p-5 flex items-center justify-center">
            <div className="text-accent-foreground text-sm font-medium">
              Drop task here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
