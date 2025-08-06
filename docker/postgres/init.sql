-- MCP Bridge Database Initialization Script
-- This script sets up the initial database schema for the MCP Bridge application

-- Create database (if not exists, handled by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS mcp_bridge;

-- Use the database
-- \c mcp_bridge;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE auth_type AS ENUM ('none', 'bearer', 'apikey', 'basic');
CREATE TYPE http_method AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH');
CREATE TYPE parameter_type AS ENUM ('string', 'number', 'boolean', 'object', 'array');
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error');
CREATE TYPE bridge_status AS ENUM ('active', 'inactive', 'error');

-- Bridges table - main bridge configurations
CREATE TABLE bridges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    
    -- API Configuration (stored as JSONB for flexibility)
    api_config JSONB NOT NULL,
    
    -- MCP Tools (generated from endpoints)
    mcp_tools JSONB DEFAULT '[]',
    
    -- Bridge status and settings
    enabled BOOLEAN DEFAULT false,
    
    -- Routing configuration
    routing_type VARCHAR(50) DEFAULT 'path',
    custom_domain VARCHAR(255),
    path_prefix VARCHAR(100),
    
    -- Access control
    is_public BOOLEAN DEFAULT true,
    allowed_origins TEXT[],
    auth_required BOOLEAN DEFAULT false,
    api_key VARCHAR(255),
    
    -- Performance settings
    rate_limit_rpm INTEGER DEFAULT 100,
    rate_limit_burst INTEGER DEFAULT 20,
    cache_enabled BOOLEAN DEFAULT true,
    cache_ttl INTEGER DEFAULT 300, -- seconds
    timeout_ms INTEGER DEFAULT 30000, -- milliseconds
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT bridges_name_length CHECK (length(name) >= 1 AND length(name) <= 255),
    CONSTRAINT bridges_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT bridges_rate_limit_positive CHECK (rate_limit_rpm > 0),
    CONSTRAINT bridges_timeout_positive CHECK (timeout_ms > 0)
);

-- API Endpoints table - individual endpoints for each bridge
CREATE TABLE api_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    method http_method NOT NULL,
    path VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Parameters and schema (stored as JSONB)
    parameters JSONB DEFAULT '[]',
    request_body JSONB,
    response_schema JSONB,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT api_endpoints_unique_per_bridge UNIQUE(bridge_id, name),
    CONSTRAINT api_endpoints_path_format CHECK (path ~ '^/.*')
);

-- Bridge logs table - for monitoring and debugging
CREATE TABLE bridge_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id UUID REFERENCES bridges(id) ON DELETE CASCADE,
    
    level log_level NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Context information
    component VARCHAR(100),
    endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE SET NULL,
    user_ip INET,
    user_agent TEXT,
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes will be added below
    CONSTRAINT bridge_logs_message_length CHECK (length(message) <= 10000)
);

-- API request tracking table - for analytics and monitoring
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES api_endpoints(id) ON DELETE SET NULL,
    
    -- Request details
    method http_method NOT NULL,
    path VARCHAR(500) NOT NULL,
    endpoint_name VARCHAR(255),
    
    -- Response details
    status_code INTEGER,
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    
    -- Client information
    client_ip INET,
    user_agent TEXT,
    
    -- Request/Response data (optional, for debugging)
    request_body JSONB,
    response_body JSONB,
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT api_requests_status_code_valid CHECK (status_code >= 100 AND status_code < 600),
    CONSTRAINT api_requests_response_time_positive CHECK (response_time_ms >= 0)
);

-- Bridge sessions table - for managing active bridge connections
CREATE TABLE bridge_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bridge_id UUID NOT NULL REFERENCES bridges(id) ON DELETE CASCADE,
    
    session_token VARCHAR(255) UNIQUE NOT NULL,
    client_info JSONB DEFAULT '{}',
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT bridge_sessions_expires_after_created CHECK (expires_at > created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_bridges_slug ON bridges(slug);
CREATE INDEX idx_bridges_enabled ON bridges(enabled);
CREATE INDEX idx_bridges_created_at ON bridges(created_at);

CREATE INDEX idx_api_endpoints_bridge_id ON api_endpoints(bridge_id);
CREATE INDEX idx_api_endpoints_method_path ON api_endpoints(method, path);

CREATE INDEX idx_bridge_logs_bridge_id ON bridge_logs(bridge_id);
CREATE INDEX idx_bridge_logs_level ON bridge_logs(level);
CREATE INDEX idx_bridge_logs_timestamp ON bridge_logs(timestamp);
CREATE INDEX idx_bridge_logs_component ON bridge_logs(component);

CREATE INDEX idx_api_requests_bridge_id ON api_requests(bridge_id);
CREATE INDEX idx_api_requests_timestamp ON api_requests(timestamp);
CREATE INDEX idx_api_requests_status_code ON api_requests(status_code);
CREATE INDEX idx_api_requests_response_time ON api_requests(response_time_ms);
CREATE INDEX idx_api_requests_client_ip ON api_requests(client_ip);

CREATE INDEX idx_bridge_sessions_bridge_id ON bridge_sessions(bridge_id);
CREATE INDEX idx_bridge_sessions_token ON bridge_sessions(session_token);
CREATE INDEX idx_bridge_sessions_active ON bridge_sessions(is_active);
CREATE INDEX idx_bridge_sessions_expires ON bridge_sessions(expires_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_bridges_updated_at BEFORE UPDATE ON bridges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_endpoints_updated_at BEFORE UPDATE ON api_endpoints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically update last_activity for sessions
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bridge_sessions_activity BEFORE UPDATE ON bridge_sessions
    FOR EACH ROW EXECUTE FUNCTION update_session_activity();

-- Insert some example data for development
INSERT INTO bridges (name, description, slug, api_config, enabled) VALUES 
(
    'GitHub API Bridge',
    'Access GitHub repositories, issues, and pull requests through MCP',
    'github-api',
    '{
        "id": "github-api-config",
        "name": "GitHub API",
        "baseUrl": "https://api.github.com",
        "description": "GitHub REST API v4",
        "authentication": {
            "type": "bearer",
            "token": "your-github-token"
        },
        "headers": {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MCP-Bridge/1.0"
        }
    }',
    true
),
(
    'JSONPlaceholder Test API',
    'Test API for development and prototyping',
    'jsonplaceholder',
    '{
        "id": "jsonplaceholder-config",
        "name": "JSONPlaceholder",
        "baseUrl": "https://jsonplaceholder.typicode.com",
        "description": "Fake Online REST API for Testing and Prototyping",
        "authentication": {
            "type": "none"
        }
    }',
    true
);

-- Get the bridge IDs for inserting endpoints
DO $$
DECLARE
    github_bridge_id UUID;
    placeholder_bridge_id UUID;
BEGIN
    SELECT id INTO github_bridge_id FROM bridges WHERE slug = 'github-api';
    SELECT id INTO placeholder_bridge_id FROM bridges WHERE slug = 'jsonplaceholder';
    
    -- GitHub API endpoints
    INSERT INTO api_endpoints (bridge_id, name, method, path, description, parameters) VALUES
    (github_bridge_id, 'listRepos', 'GET', '/user/repos', 'List repositories for the authenticated user', 
     '[{"name": "type", "type": "string", "required": false, "description": "Repository type filter"}]'),
    (github_bridge_id, 'getRepo', 'GET', '/repos/{owner}/{repo}', 'Get a specific repository',
     '[{"name": "owner", "type": "string", "required": true, "description": "Repository owner"}, {"name": "repo", "type": "string", "required": true, "description": "Repository name"}]'),
    (github_bridge_id, 'listIssues', 'GET', '/repos/{owner}/{repo}/issues', 'List issues for a repository',
     '[{"name": "owner", "type": "string", "required": true, "description": "Repository owner"}, {"name": "repo", "type": "string", "required": true, "description": "Repository name"}]');
    
    -- JSONPlaceholder endpoints
    INSERT INTO api_endpoints (bridge_id, name, method, path, description, parameters) VALUES
    (placeholder_bridge_id, 'getPosts', 'GET', '/posts', 'Get all posts', '[]'),
    (placeholder_bridge_id, 'getPost', 'GET', '/posts/{id}', 'Get a specific post',
     '[{"name": "id", "type": "number", "required": true, "description": "Post ID"}]'),
    (placeholder_bridge_id, 'createPost', 'POST', '/posts', 'Create a new post',
     '[{"name": "title", "type": "string", "required": true, "description": "Post title"}, {"name": "body", "type": "string", "required": true, "description": "Post content"}, {"name": "userId", "type": "number", "required": true, "description": "User ID"}]');
END $$;

-- Insert some sample log entries
INSERT INTO bridge_logs (bridge_id, level, message, component) 
SELECT 
    id, 
    'info', 
    'Bridge initialized successfully', 
    'bridge-manager'
FROM bridges;

COMMIT;
