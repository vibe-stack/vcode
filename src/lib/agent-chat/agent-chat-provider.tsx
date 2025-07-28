import React, { createContext, useContext, ReactNode } from 'react';
import { AgentChatConfig, ToolExecutor, ChatPersistence } from './types';
import { useAgentChat } from './use-agent-chat';
import { GeneralToolExecutor } from './tool-executor';

interface AgentChatContextValue {
  config: AgentChatConfig;
  messages: any[];
  isLoading: boolean;
  status: string;
  currentSessionId: string | null;
  hasUserInteracted: boolean;
  toolExecutor?: ToolExecutor;
  handleSend: (content: string) => void;
  handleToolApprove: (toolCallId: string) => void;
  handleToolCancel: (toolCallId: string) => void;
  handleNewChat: () => void;
  handleLoadSession: (sessionId: string) => void;
  handleClearHistory: () => void;
  handleDeleteMessage: (id: string) => void;
  stop: () => void;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

interface AgentChatProviderProps {
  config: AgentChatConfig;
  children: ReactNode;
  persistence?: ChatPersistence;
  onStateCapture?: () => any;
  onStateRestore?: (state: any) => void;
}

export function AgentChatProvider({ 
  config, 
  children, 
  persistence,
  onStateCapture,
  onStateRestore 
}: AgentChatProviderProps) {
  const toolExecutor = React.useMemo(() => {
    if (config.tools && config.tools.length > 0) {
      return new GeneralToolExecutor(config.tools);
    }
    return undefined;
  }, [config.tools]);

  const chatHook = useAgentChat(config, {
    toolExecutor,
    persistence,
    onStateCapture,
    onStateRestore,
  });

  const contextValue: AgentChatContextValue = {
    config,
    ...chatHook,
  };

  return (
    <AgentChatContext.Provider value={contextValue}>
      {children}
    </AgentChatContext.Provider>
  );
}

export function useAgentChatContext(): AgentChatContextValue {
  const context = useContext(AgentChatContext);
  if (!context) {
    throw new Error('useAgentChatContext must be used within an AgentChatProvider');
  }
  return context;
}