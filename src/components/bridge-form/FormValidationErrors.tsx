import { AlertTriangle } from "lucide-react";
import { FieldErrors } from "react-hook-form";
import { McpBridgeFormData } from "./types";

interface FormValidationErrorsProps {
    errors: FieldErrors<McpBridgeFormData>;
    getValues: () => McpBridgeFormData;
}

// Type for an error message that can be a string or an object with message and warning flag
type ErrorMessage = string | { message: string; warning?: boolean };

/**
 * Component to display form validation errors in a consistent and professional manner
 */
export function FormValidationErrors({ errors, getValues }: FormValidationErrorsProps) {
    // Early return if no errors
    if (Object.keys(errors).length === 0) return null;

    // Helper function to safely convert undefined to empty string
    const safeString = (value: string | undefined): string => value || "";

    return (
        <div className="space-y-3">
            {/* Basic Info Errors */}
            {(errors.name || errors.description ||
                errors.apiConfig?.name || errors.apiConfig?.baseUrl ||
                errors.apiConfig?.description) && (
                    <ErrorSection
                        title="Basic Information"
                        errors={[
                            safeString(errors.name?.message) || (errors.name ? "MCP Server name is required" : ""),
                            safeString(errors.description?.message),
                            safeString(errors.apiConfig?.name?.message) || (errors.apiConfig?.name ? "API name is required" : ""),
                            safeString(errors.apiConfig?.baseUrl?.message) || (errors.apiConfig?.baseUrl ? "Valid API base URL is required" : ""),
                            safeString(errors.apiConfig?.description?.message),
                        ].filter(Boolean)}
                    />
                )}

            {/* Authentication Errors */}
            {errors.apiConfig?.authentication && (
                <ErrorSection
                    title="Authentication Configuration"
                    errors={[
                        safeString(errors.apiConfig.authentication.type?.message),
                        errors.apiConfig.authentication.token ? "Bearer token is required for token authentication" : "",
                        errors.apiConfig.authentication.apiKey ? "API key is required for API key authentication" : "",
                        errors.apiConfig.authentication.headerName ? "Header name is required for API key authentication" : "",
                        errors.apiConfig.authentication.username ? "Username is required for basic authentication" : "",
                        errors.apiConfig.authentication.password ? "Password is required for basic authentication" : "",
                    ].filter(Boolean)}
                />
            )}

            {/* Endpoints/Tools Errors */}
            {(errors.apiConfig?.endpoints || errors.mcpTools) && (
                <ErrorSection
                    title="MCP Tools & Endpoints"
                    errors={[
                        ...(errors.apiConfig?.endpoints && Array.isArray(errors.apiConfig.endpoints)
                            ? errors.apiConfig.endpoints.map((error, index) =>
                                `Endpoint ${index + 1}: ${safeString(error?.name?.message || error?.path?.message ||
                                    error?.method?.message || error?.parameters?.message ||
                                    error?.message || 'Invalid configuration')}`
                            )
                            : []),
                        ...(errors.mcpTools && Array.isArray(errors.mcpTools)
                            ? errors.mcpTools.map((error, index) =>
                                `Tool ${index + 1}: ${safeString(error?.name?.message || error?.description?.message ||
                                    error?.inputSchema?.message || error?.message || 'Invalid tool configuration')}`
                            )
                            : []),
                        errors.mcpTools && !Array.isArray(errors.mcpTools) ? safeString(errors.mcpTools.message) : "",
                        getValues().apiConfig?.endpoints?.length === 0 ? {
                            message: "No endpoints configured - your MCP server will have no tools available",
                            warning: true
                        } : ""
                    ].filter(Boolean) as ErrorMessage[]}
                />
            )}

            {/* Resources Errors */}
            {errors.mcpResources && (
                <ErrorSection
                    title="Resources"
                    errors={[
                        ...(Array.isArray(errors.mcpResources)
                            ? errors.mcpResources.map((error, index) =>
                                `Resource ${index + 1}: ${safeString(error?.name?.message || error?.uri?.message ||
                                    error?.mimeType?.message || error?.message || 'Invalid resource configuration')}`
                            )
                            : []),
                        !Array.isArray(errors.mcpResources) ? safeString(errors.mcpResources.message) : ""
                    ].filter(Boolean)}
                />
            )}

            {/* Prompts Errors */}
            {errors.mcpPrompts && (
                <ErrorSection
                    title="Prompts"
                    errors={[
                        ...(Array.isArray(errors.mcpPrompts)
                            ? errors.mcpPrompts.map((error, index) =>
                                `Prompt ${index + 1}: ${safeString(error?.name?.message || error?.description?.message ||
                                    error?.arguments?.message || error?.message || 'Invalid prompt configuration')}`
                            )
                            : []),
                        !Array.isArray(errors.mcpPrompts) ? safeString(errors.mcpPrompts.message) : ""
                    ].filter(Boolean)}
                />
            )}

            {/* Access Settings Errors */}
            {errors.access && (
                <ErrorSection
                    title="Access Settings"
                    errors={[
                        safeString(errors.access.authRequired?.message),
                        safeString(errors.access.apiKey?.message),
                        safeString(errors.access.allowedOrigins?.message),
                    ].filter(Boolean)}
                />
            )}
        </div>
    );
}

// Helper component for consistent error display
interface ErrorSectionProps {
    title: string;
    errors: ErrorMessage[];
}

function ErrorSection({ title, errors }: ErrorSectionProps) {
    if (errors.length === 0) return null;

    return (
        <div className="flex gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
                <h4 className="font-medium text-destructive">{title} Issues</h4>
                <ul className="text-sm text-destructive/80 mt-1 list-disc list-inside space-y-1">
                    {errors.map((error, index) => {
                        if (typeof error === 'string') {
                            return <li key={index}>{error}</li>;
                        } else {
                            return (
                                <li key={index} className={error.warning ? "text-orange-600" : ""}>
                                    {error.message}
                                </li>
                            );
                        }
                    })}
                </ul>
            </div>
        </div>
    );
}
