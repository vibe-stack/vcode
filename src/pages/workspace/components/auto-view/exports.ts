// Core auto-view component
export { AutoView } from './index';

// Component inspection and framework integration
export { IframeInspector } from './iframe-inspector';
export { useIframeInspector } from './use-iframe-inspector';
export { ComponentInspectorPanel } from './component-inspector-panel';

// Source file mapping
export { SourceFileMapper } from './source-file-mapper';
export { VSCodeSourceFileMapper } from './vscode-source-mapper';

// UI components
export { NoServerState } from './no-server-state';
export { PortSelector } from './port-selector';

// Utilities and testing
export { InspectorTestRunner, DEMO_APPS } from './inspector-test-runner';

// Hooks
export { usePortDetector } from './port-detector';
export { useTerminalContentTracker } from './terminal-content-tracker';

// Types
export type {
  DOMNodeInfo,
  ReactComponentInfo,
  FrameworkInfo,
  IframeInspectionData
} from './iframe-inspector';

export type {
  SourceLocation,
  ComponentSourceInfo
} from './source-file-mapper';

export type {
  DetectedPort
} from './port-detector';

export type {
  DemoApp,
  TestResult
} from './inspector-test-runner';
