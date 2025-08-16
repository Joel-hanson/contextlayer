import { type McpEndpoint } from './types';

export function createDefaultEndpointFromTemplate(endpoint: {
    id?: string;
    name?: string;
    path?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description?: string;
    parameters?: Array<{
        name?: string;
        type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
        required?: boolean;
        description?: string;
        location?: 'path' | 'query' | 'body';
        style?: 'parameter' | 'replacement';
    }>;
}): McpEndpoint {
    return {
        id: endpoint.id || `endpoint-${Date.now()}`,
        name: endpoint.name || '',
        path: endpoint.path || '',
        method: endpoint.method || 'GET',
        description: endpoint.description || '',
        parameters: (endpoint.parameters || []).map(param => {
            const location = param.location || (param.style === 'replacement' ? 'path' : 'query');
            return {
                name: param.name || '',
                type: param.type || 'string',
                required: param.required || location === 'path',
                description: param.description || '',
                location,
                style: param.style || (location === 'path' ? 'parameter' : 'parameter')
            };
        })
    };
}
