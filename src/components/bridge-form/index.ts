// Main components
export { BridgeForm } from './BridgeForm';
export { BridgeFormUI } from './BridgeFormUI';

// Custom hook
export { useBridgeForm } from './use-bridge-form';

// Form tabs
export { AuthenticationTab } from './authentication-tab/AuthenticationTab';
export { BasicInfoTab } from './basic-info-tab/BasicInfoTab';
export { EndpointsTab } from './endpoints-tab/EndpointsTab';
export { PromptsTab } from './prompts-tab/PromptsTab';
export { ResourcesTab } from './resources-tab/ResourcesTab';
export { RoutingAndAccessTab } from './routing-and-access-tab';

// Helper components
export { FormValidationErrors } from './FormValidationErrors';

// Types
export type { McpBridgeFormData, McpEndpoint, McpPrompt, McpResource } from './utils/types';

// Utilities
export { createDefaultAccessToken, transformFormDataToBridgeConfig } from './utils/bridge-form-actions';

