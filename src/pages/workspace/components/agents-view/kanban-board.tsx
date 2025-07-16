import React, { useState, useEffect } from 'react';
import { useKanbanStore } from '@/stores/kanban';
import { useProjectStore } from '@/stores/project';
import { KanbanTask, TaskStatus } from '@/stores/kanban/types';
import { KanbanColumn } from './kanban-column';
import { TaskModal } from './task-modal';

export const KanbanBoard: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { getBoard, createTask, updateTask, updateAgentExecution } = useKanbanStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | undefined>();
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>('ideas');

  const board = getBoard(currentProject || '');

  // Listen for agent status updates
  useEffect(() => {
    const handleAgentStatusUpdate = (update: any) => {
      if (currentProject) {
        updateAgentExecution(currentProject, update.taskId, {
          status: update.status,
          progress: update.progress,
          currentStep: update.currentStep,
          error: update.error,
          lastUpdateTime: new Date()
        });
      }
    };

    const handleWorktreeStatusChange = (info: any) => {
      if (currentProject) {
        updateAgentExecution(currentProject, info.taskId, {
          worktreePath: info.worktreePath,
          branchName: info.branchName
        });
      }
    };

    // Setup listeners
    window.agents?.onStatusUpdate(handleAgentStatusUpdate);
    window.agents?.onWorktreeStatusChange(handleWorktreeStatusChange);

    return () => {
      window.agents?.removeAllListeners();
    };
  }, [currentProject, updateAgentExecution]);

  const handleCreateTask = (status: TaskStatus) => {
    setModalInitialStatus(status);
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setModalInitialStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentProject) return;

    if (editingTask) {
      updateTask(currentProject, editingTask.id, taskData);
    } else {
      createTask(currentProject, taskData);
    }
  };

  const handleTaskClick = (task: KanbanTask) => {
    // Open task modal for editing/viewing
    handleEditTask(task);
  };

  if (!currentProject) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
          <p className="text-gray-600">Please select a project to view the kanban board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 p-6 min-w-fit">
          {board.columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCreateTask={() => handleCreateTask(column.id)}
              onEditTask={handleEditTask}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>
      
      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        initialStatus={modalInitialStatus}
        canCreateInStatus={board.columns.find(c => c.id === modalInitialStatus)?.canCreateTasks}
      />
    </div>
  );
};
