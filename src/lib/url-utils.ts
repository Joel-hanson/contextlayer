/**
 * Joins URL parts handling edge cases with slashes
 */
export function joinUrl(baseUrl: string, path: string): string {
    // Remove trailing slash from baseUrl if present
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Join with a single slash
    return `${base}/${cleanPath}`;
}

/**
 * Creates a new URL ensuring proper joining of base URL and path
 */
export function createUrl(path: string, baseUrl: string): URL {
    const fullUrl = joinUrl(baseUrl, path);
    return new URL(fullUrl);
}

/**
 * Safely appends path to base URL handling edge cases
 */
export function appendPath(baseUrl: string, path: string): string {
    return createUrl(path, baseUrl).toString();
}
