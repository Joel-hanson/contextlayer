import type { McpEndpoint } from './types';

interface Parameter {
    name?: string;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    description?: string;
    location?: 'path' | 'query' | 'body';
    style?: 'parameter' | 'replacement';
}

interface Endpoint {
    id?: string;
    name?: string;
    path?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description?: string;
    parameters?: Parameter[];
}

export function mapEndpointFromTemplate(endpoint: Endpoint): McpEndpoint {
    return {
        id: endpoint.id || `endpoint-${Date.now()}`,
        name: endpoint.name || '',
        path: endpoint.path || '',
        method: endpoint.method || 'GET',
        description: endpoint.description || '',
        parameters: (endpoint.parameters || []).map(param => {
            // Determine if parameter is a path parameter by looking at the URL pattern
            const appearsInPath = endpoint.path?.includes(`{${param.name}}`);
            const location = param.location || (appearsInPath ? 'path' : 'query');
            const style = param.style || (appearsInPath ? 'replacement' : 'parameter');

            return {
                name: param.name || '',
                type: param.type || 'string',
                required: Boolean(param.required) || location === 'path',
                description: param.description || '',
                location,
                style
            };
        })
    };
}
