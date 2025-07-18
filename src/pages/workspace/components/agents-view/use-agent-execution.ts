import { useChat } from "ai/react";
import { useCallback } from "react";
import { useKanbanStore } from "@/stores/kanban";
import { useProjectStore } from "@/stores/project";

interface UseAgentExecutionProps {
  taskId: string;
}

export function useAgentExecution({ taskId }: UseAgentExecutionProps) {
  const { currentProject } = useProjectStore();
  const {
    getMessages,
    addMessage,
    updateAgentStep,
    completeAgentTask,
    handleAgentError,
    getTask,
  } = useKanbanStore();

  const currentTask = currentProject ? getTask(currentProject, taskId) : null;

  // Get current messages from kanban store and convert to AI SDK format
  const storedMessages = currentProject
    ? getMessages(currentProject, taskId) || []
    : [];
  const initialMessages = storedMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    createdAt: msg.timestamp,
  }));

  const { messages, append, reload, stop, isLoading, error, setMessages } =
    useChat({
      api: "/api/agents",
      initialMessages,
      onFinish: (message) => {
        if (!currentProject) return;

        // Save the assistant's response to kanban store
        addMessage(currentProject, taskId, {
          role: "assistant",
          content: message.content,
        });

        // Handle tool invocations for task workflow
        if (message.toolInvocations && message.toolInvocations.length > 0) {
          for (const invocation of message.toolInvocations) {
            // Check if the tool invocation is complete
            if (invocation.state === "result" && "result" in invocation) {
              if (
                invocation.toolName === "agentTaskComplete" &&
                invocation.result
              ) {
                const result = invocation.result as {
                  status: "review" | "need_clarification";
                  message: string;
                };
                completeAgentTask(
                  currentProject,
                  taskId,
                  result.status,
                  result.message,
                );
              } else if (
                invocation.toolName === "agentRequestClarification" &&
                invocation.result
              ) {
                const result = invocation.result as {
                  questions: string[];
                  context?: string;
                };
                const message = `Clarification needed:\n${result.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}${result.context ? `\n\nContext: ${result.context}` : ""}`;
                completeAgentTask(
                  currentProject,
                  taskId,
                  "need_clarification",
                  message,
                );
              }
            }
          }
        } else {
          // No tool calls - default to review
          completeAgentTask(currentProject, taskId, "review");
        }
      },
      onError: (error) => {
        if (currentProject) {
          handleAgentError(currentProject, taskId, error.message);
        }
      },
    });

  const executeAgent = useCallback(async () => {
    if (!currentProject || !currentTask) return;

    // Check if we need to create initial message from task title/description
    let messagesToExecute = [...initialMessages];

    if (messagesToExecute.length === 0) {
      const initialContent = currentTask.description
        ? `${currentTask.title}\n\n${currentTask.description}`
        : currentTask.title;

      // Add the initial message to kanban store
      addMessage(currentProject, taskId, {
        role: "user",
        content: initialContent,
      });

      // Add to messages to execute
      messagesToExecute.push({
        id: `initial-${Date.now()}`,
        role: "user" as const,
        content: initialContent,
        createdAt: new Date(),
      });
    }

    // Set messages and start execution
    setMessages(messagesToExecute);

    // Update task to starting state
    updateAgentStep(currentProject, taskId, "Starting execution...");

    // Trigger the chat execution
    if (messagesToExecute.length > 0) {
      await reload();
    }
  }, [
    currentProject,
    taskId,
    currentTask,
    initialMessages,
    addMessage,
    updateAgentStep,
    setMessages,
    reload,
  ]);

  const stopAgent = useCallback(() => {
    stop();
    if (currentProject) {
      updateAgentStep(currentProject, taskId, "Stopped by user");
    }
  }, [stop, currentProject, taskId, updateAgentStep]);

  return {
    messages,
    executeAgent,
    stopAgent,
    isExecuting: isLoading,
    error,
    // Expose the underlying chat functions for manual control
    append,
    reload,
  };
}
