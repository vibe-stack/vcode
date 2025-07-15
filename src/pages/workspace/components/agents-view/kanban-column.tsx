import React from 'react';
import { KanbanColumn as KanbanColumnType, KanbanTask } from '@/stores/kanban/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCreateTask: () => void;
  onEditTask: (task: KanbanTask) => void;
  onTaskClick?: (task: KanbanTask) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onCreateTask,
  onEditTask,
  onTaskClick,
}) => {
  return (
    <div className="flex flex-col w-80 bg-accent/10 rounded-lg">
      <div className="p-4 border-b bg-accent/20 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>
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
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
        {column.tasks.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {column.canCreateTasks ? (
              <>
                No tasks yet.
                <br />
                <button
                  onClick={onCreateTask}
                  className="text-emerald-600 hover:text-emerald-400 mt-1"
                >
                  Create the first one
                </button>
              </>
            ) : (
              'No tasks in this column'
            )}
          </div>
        ) : (
          column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
