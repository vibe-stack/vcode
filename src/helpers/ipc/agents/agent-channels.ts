// Agent-specific IPC channels
export const AGENT_SEND_MESSAGE_CHANNEL = "agent:send-message";
export const AGENT_STREAM_CHUNK_CHANNEL = "agent:stream-chunk";
export const AGENT_STREAM_END_CHANNEL = "agent:stream-end";
export const AGENT_STREAM_ERROR_CHANNEL = "agent:stream-error";

// Agent lifecycle channels
export const AGENT_START_CHANNEL = "agent:start";
export const AGENT_STOP_CHANNEL = "agent:stop";
export const AGENT_PAUSE_CHANNEL = "agent:pause";
export const AGENT_RESUME_CHANNEL = "agent:resume";
export const AGENT_STATUS_UPDATE_CHANNEL = "agent:status-update";

// Git worktree channels
export const AGENT_CREATE_WORKTREE_CHANNEL = "agent:create-worktree";
export const AGENT_DELETE_WORKTREE_CHANNEL = "agent:delete-worktree";
export const AGENT_SWITCH_WORKTREE_CHANNEL = "agent:switch-worktree";
export const AGENT_WORKTREE_STATUS_CHANNEL = "agent:worktree-status";
