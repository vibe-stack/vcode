// Agent API IPC channel definitions
export const AGENT_CREATE_CHANNEL = "agent:create";
export const AGENT_LIST_CHANNEL = "agent:list";
export const AGENT_GET_CHANNEL = "agent:get";
export const AGENT_DELETE_CHANNEL = "agent:delete";
export const AGENT_START_CHANNEL = "agent:start";
export const AGENT_STOP_CHANNEL = "agent:stop";
export const AGENT_UPDATE_STATUS_CHANNEL = "agent:updateStatus";
export const AGENT_ADD_MESSAGE_CHANNEL = "agent:addMessage";
export const AGENT_GET_MESSAGES_CHANNEL = "agent:getMessages";
export const AGENT_GET_PROGRESS_CHANNEL = "agent:getProgress";
export const AGENT_IS_RUNNING_CHANNEL = "agent:isRunning";
export const AGENT_GET_RUNNING_CHANNEL = "agent:getRunning";
export const AGENT_GET_PROJECT_SUMMARY_CHANNEL = "agent:getProjectSummary";
export const AGENT_GET_ALL_PROJECTS_CHANNEL = "agent:getAllProjects";
export const AGENT_SWITCH_PROJECT_CHANNEL = "agent:switchProject";
export const AGENT_CHECK_FILE_CONFLICTS_CHANNEL = "agent:checkFileConflicts";
export const AGENT_CLEANUP_INACTIVE_PROJECTS_CHANNEL = "agent:cleanupInactiveProjects";

// Agent events
export const AGENT_STATUS_CHANGED_EVENT = "agent:statusChanged";
export const AGENT_STEP_STARTED_EVENT = "agent:stepStarted";
export const AGENT_STEP_COMPLETED_EVENT = "agent:stepCompleted";
export const AGENT_STEP_FAILED_EVENT = "agent:stepFailed";
export const AGENT_LOCK_CONFLICT_EVENT = "agent:lockConflict";
export const AGENT_NEEDS_CLARIFICATION_EVENT = "agent:needsClarification";
export const AGENT_EXECUTION_COMPLETE_EVENT = "agent:executionComplete";
export const AGENT_EXECUTION_ABORTED_EVENT = "agent:executionAborted";
export const AGENT_CREATED_EVENT = "agent:created";
export const AGENT_DELETED_EVENT = "agent:deleted";
export const AGENT_MESSAGE_ADDED_EVENT = "agent:messageAdded";
