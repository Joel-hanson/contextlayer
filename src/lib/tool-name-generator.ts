/**
 * Generates a standardized tool name from method and path
 * Format: method_resource_action
 * Examples:
 * - GET /users -> get_users_list
 * - GET /users/{id} -> get_users_read
 * - POST /users -> post_users_create
 * - PUT /users/{id} -> put_users_update
 * - DELETE /users/{id} -> delete_users_delete
 */
export function generateStandardToolName(method: string, path: string): string {
    const cleanedMethod = method.toLowerCase();

    // Remove URL parameters and split path
    const pathParts = path
        .replace(/\{[^}]+\}/g, '') // Remove URL parameters
        .split('/')
        .filter(Boolean) // Remove empty strings
        .map(part => part.toLowerCase());

    // Determine the action based on method and path
    let action = '';
    const hasParams = path.includes('{');
    if (cleanedMethod === 'get') {
        action = hasParams ? 'read' : 'list';
    } else if (cleanedMethod === 'post') {
        action = 'create';
    } else if (cleanedMethod === 'put' || cleanedMethod === 'patch') {
        action = 'update';
    } else if (cleanedMethod === 'delete') {
        action = 'delete';
    }

    // Always use last path part for resource name
    const resource = pathParts[pathParts.length - 1] || 'root';
    const toolName = `${cleanedMethod}_${resource}_${action}`;

    return toolName;
}
