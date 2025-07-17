import React from "react";
import { ChatPanel } from "../chat";

export const AgentsView = () => {
  return (
    <div className="h-full w-full">
      <ChatPanel isAgentMode={true} />
    </div>
  );
};
