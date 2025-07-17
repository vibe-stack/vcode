import React from "react";
import { KanbanBoard } from "../agents-view/kanban-board";

export const KanbanView = () => {
  return (
    <div className="h-full w-full">
      <KanbanBoard />
    </div>
  );
};