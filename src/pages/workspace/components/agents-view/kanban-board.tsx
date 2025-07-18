import React, { useState, useEffect, useRef } from "react";
import { useKanbanStore } from "@/stores/kanban";
import { useProjectStore } from "@/stores/project";
import { KanbanTask, TaskStatus } from "@/stores/kanban/types";
import { KanbanColumn } from "./kanban-column";
import { TaskModal } from "./task-modal";

export const KanbanBoard: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { getBoard, createTask, updateTask, moveTask } = useKanbanStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | undefined>();
  const [modalInitialStatus, setModalInitialStatus] =
    useState<TaskStatus>("ideas");
  const [containerWidth, setContainerWidth] = useState(0);
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const board = getBoard(currentProject || "");

  // Track container width for responsive layout
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate wrapping layout - fixed width columns that wrap
  const getColumnLayout = () => {
    const columnWidth = 320; // Fixed width
    const gap = 16; // 4 * 4px
    const padding = 16; // 2 * 8px
    
    const availableWidth = containerWidth - padding;
    const columnsCount = board.columns.length;
    
    if (columnsCount === 0) {
      return { columnWidth, columnsPerRow: 1 };
    }
    
    // Calculate how many columns fit per row
    const columnsPerRow = Math.floor((availableWidth + gap) / (columnWidth + gap));
    const actualColumnsPerRow = Math.max(1, Math.min(columnsPerRow, columnsCount));
    
    return {
      columnWidth,
      columnsPerRow: actualColumnsPerRow
    };
  };

  const layout = getColumnLayout();

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

  const handleSaveTask = (
    taskData: Omit<KanbanTask, "id" | "createdAt" | "updatedAt">,
  ) => {
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

  const handleTaskDrop = (task: KanbanTask, targetColumnId: string) => {
    if (!currentProject) return;
    
    // Only move if the task is being dropped in a different column
    if (task.status !== targetColumnId) {
      moveTask(currentProject, task.id, targetColumnId as TaskStatus);
      updateTask(currentProject, task.id, {
        status: targetColumnId as TaskStatus,
        updatedAt: new Date(),
      });
    }
    
    // Clear drag state
    setDraggedTask(null);
  };

  const handleDragStart = (task: KanbanTask) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  if (!currentProject) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">No Project Selected</h2>
          <p className="text-gray-600">
            Please select a project to view the kanban board.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div 
          className="grid gap-4 p-2"
          style={{
            gridTemplateColumns: `repeat(${layout.columnsPerRow}, ${layout.columnWidth}px)`,
            justifyContent: 'center'
          }}
        >
          {board.columns.map((column) => (
            <div key={column.id} className="h-fit">
              <KanbanColumn
                column={column}
                onCreateTask={() => handleCreateTask(column.id)}
                onEditTask={handleEditTask}
                onTaskClick={handleTaskClick}
                onTaskDrop={handleTaskDrop}
                onTaskDragStart={handleDragStart}
                onTaskDragEnd={handleDragEnd}
                draggedTask={draggedTask}
              />
            </div>
          ))}
        </div>
      </div>

      <TaskModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        initialStatus={modalInitialStatus}
        canCreateInStatus={
          board.columns.find((c) => c.id === modalInitialStatus)?.canCreateTasks
        }
      />
    </div>
  );
};
