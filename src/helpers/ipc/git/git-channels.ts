// Git API IPC channel definitions
export const GIT_GET_STATUS_CHANNEL = "git:get-status";
export const GIT_GET_DIFF_CHANNEL = "git:get-diff";
export const GIT_INIT_CHANNEL = "git:init";
export const GIT_ADD_CHANNEL = "git:add";
export const GIT_COMMIT_CHANNEL = "git:commit";
export const GIT_PUSH_CHANNEL = "git:push";
export const GIT_PULL_CHANNEL = "git:pull";
export const GIT_CHECK_REPO_CHANNEL = "git:check-repo";
export const GIT_GET_BRANCH_CHANNEL = "git:get-branch";
export const GIT_GET_BRANCHES_CHANNEL = "git:get-branches";
export const GIT_CHECKOUT_CHANNEL = "git:checkout";
export const GIT_GET_LOG_CHANNEL = "git:get-log";

// Git events
export const GIT_STATUS_CHANGED_EVENT = "git:status-changed";
export const GIT_BRANCH_CHANGED_EVENT = "git:branch-changed";
