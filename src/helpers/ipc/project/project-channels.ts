// Project API IPC channel definitions
export const PROJECT_OPEN_FOLDER_CHANNEL = "project:open-folder";
export const PROJECT_OPEN_FILE_CHANNEL = "project:open-file";
export const PROJECT_SAVE_FILE_CHANNEL = "project:save-file";
export const PROJECT_CREATE_FILE_CHANNEL = "project:create-file";
export const PROJECT_CREATE_FOLDER_CHANNEL = "project:create-folder";
export const PROJECT_DELETE_FILE_CHANNEL = "project:delete-file";
export const PROJECT_DELETE_FOLDER_CHANNEL = "project:delete-folder";
export const PROJECT_RENAME_FILE_CHANNEL = "project:rename-file";
export const PROJECT_RENAME_FOLDER_CHANNEL = "project:rename-folder";
export const PROJECT_GET_DIRECTORY_TREE_CHANNEL = "project:get-directory-tree";
export const PROJECT_WATCH_FILE_CHANGES_CHANNEL = "project:watch-file-changes";
export const PROJECT_UNWATCH_FILE_CHANGES_CHANNEL = "project:unwatch-file-changes";
export const PROJECT_SEARCH_FILES_CHANNEL = "project:search-files";
export const PROJECT_SEARCH_IN_FILES_CHANNEL = "project:search-in-files";
export const PROJECT_GET_FILE_STATS_CHANNEL = "project:get-file-stats";
export const PROJECT_GET_RECENT_PROJECTS_CHANNEL = "project:get-recent-projects";
export const PROJECT_ADD_RECENT_PROJECT_CHANNEL = "project:add-recent-project";
export const PROJECT_REMOVE_RECENT_PROJECT_CHANNEL = "project:remove-recent-project";
export const PROJECT_GET_CURRENT_PROJECT_CHANNEL = "project:get-current-project";
export const PROJECT_SET_CURRENT_PROJECT_CHANNEL = "project:set-current-project";
export const PROJECT_SET_LAST_OPENED_PROJECT_CHANNEL = "project:set-last-opened-project";
export const PROJECT_GET_LAST_OPENED_PROJECT_CHANNEL = "project:get-last-opened-project";

// File system events
export const PROJECT_FILE_CHANGED_EVENT = "project:file-changed";
export const PROJECT_FILE_CREATED_EVENT = "project:file-created";
export const PROJECT_FILE_DELETED_EVENT = "project:file-deleted";
export const PROJECT_FILE_RENAMED_EVENT = "project:file-renamed";
