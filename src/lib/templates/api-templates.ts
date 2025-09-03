import type { LucideIcon } from "lucide-react";
import { Database, Globe, Zap } from "lucide-react";
import type {
    ApiConfig as BaseApiConfig,
    McpPrompt,
    McpResource,
} from "../types";

interface TemplateApiConfig extends Omit<BaseApiConfig, "id"> {
    id?: string;
}

interface TemplateConfig {
    name: string;
    description?: string;
    apiConfig: TemplateApiConfig;
    mcpResources?: McpResource[];
    mcpPrompts?: McpPrompt[];
}

export interface ApiTemplate {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
    tags: string[];
    config: TemplateConfig;
}

export const apiTemplates: ApiTemplate[] = [
    {
        id: "slack",
        name: "Slack API",
        description: "Team communication and messaging",
        icon: Zap,
        color: "bg-purple-600",
        tags: ["Chat", "OAuth"],
        config: {
            name: "Slack API",
            description: "Send messages and manage Slack workspaces.",
            apiConfig: {
                name: "Slack Web API",
                baseUrl: "https://slack.com/api",
                description: "Slack Web API for team communication",
                authentication: { type: "bearer", token: "", keyLocation: "header" },
                endpoints: [
                    {
                        id: "post_chat_postmessage",
                        name: "post_chat_postmessage",
                        method: "POST",
                        path: "/chat.postMessage",
                        description: "Send a message to a channel",
                        parameters: [
                            {
                                name: "channel",
                                type: "string",
                                required: true,
                                description: "Channel ID where the message will be posted",
                                location: "body",
                            },
                            {
                                name: "text",
                                type: "string",
                                required: false,
                                description:
                                    "Text of the message to send (used as fallback when using blocks)",
                                location: "body",
                            },
                            {
                                name: "blocks",
                                type: "object",
                                required: false,
                                description:
                                    "JSON string of Block Kit layout for rich messages",
                                location: "body",
                            },
                            {
                                name: "thread_ts",
                                type: "string",
                                required: false,
                                description:
                                    "Timestamp of the parent message to reply in a thread",
                                location: "body",
                            },
                            {
                                name: "mrkdwn",
                                type: "boolean",
                                required: false,
                                description: "Whether to use markdown formatting for text",
                                location: "body",
                            },
                        ],
                    },
                    {
                        id: "post_files_upload",
                        name: "post_files_upload",
                        method: "POST",
                        path: "/files.upload",
                        description:
                            "Upload a file to Slack (Note: This endpoint is being deprecated March 2025)",
                        parameters: [
                            {
                                name: "channels",
                                type: "string",
                                required: false,
                                description:
                                    "Comma-separated list of channel IDs to share the file",
                                location: "body",
                            },
                            {
                                name: "content",
                                type: "string",
                                required: false,
                                description:
                                    "Text content to create as a file (use for editable text files)",
                                location: "body",
                            },
                            {
                                name: "filename",
                                type: "string",
                                required: false,
                                description: "Filename of file",
                                location: "body",
                            },
                            {
                                name: "title",
                                type: "string",
                                required: false,
                                description: "Title of file",
                                location: "body",
                            },
                            {
                                name: "initial_comment",
                                type: "string",
                                required: false,
                                description: "Initial comment to add to the file",
                                location: "body",
                            },
                            {
                                name: "thread_ts",
                                type: "string",
                                required: false,
                                description:
                                    "Timestamp of the parent message to share file in thread",
                                location: "body",
                            },
                            {
                                name: "filetype",
                                type: "string",
                                required: false,
                                description: "File type (e.g., text, csv, pdf, etc.)",
                                location: "body",
                            },
                        ],
                    },
                    {
                        id: "get_files_getuploadurlexternal",
                        name: "get_files_getuploadurlexternal",
                        method: "GET",
                        path: "/files.getUploadURLExternal",
                        description:
                            "Get URL for uploading files (Recommended method for file uploads)",
                        parameters: [
                            {
                                name: "filename",
                                type: "string",
                                required: true,
                                description: "Filename including extension",
                                location: "query",
                            },
                            {
                                name: "length",
                                type: "number",
                                required: true,
                                description: "File size in bytes",
                                location: "query",
                            },
                            {
                                name: "alt_text",
                                type: "string",
                                required: false,
                                description: "Alternative text for image files",
                                location: "query",
                            },
                        ],
                    },
                    {
                        id: "get_conversations_list",
                        name: "get_conversations_list",
                        method: "GET",
                        path: "/conversations.list",
                        description: "Get list of channels",
                        parameters: [
                            {
                                name: "types",
                                type: "string",
                                required: false,
                                description: "Channel types (public_channel,private_channel)",
                            },
                            {
                                name: "exclude_archived",
                                type: "boolean",
                                required: false,
                                description: "Exclude archived channels",
                            },
                            {
                                name: "limit",
                                type: "number",
                                required: false,
                                description: "Maximum number of items to return",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "slack://workspace/info",
                    name: "Workspace Info",
                    description: "Current Slack workspace information",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        workspace: {
                            name: "Your Team Workspace",
                            url: "your-team.slack.com",
                            domain: "your-team",
                            members: "Contact your Slack admin for current member count",
                            channels: "Use conversations.list API to get channel count",
                            plan: "Contact your Slack admin for plan information"
                        },
                        features: [
                            "Channels and Direct Messages",
                            "File Sharing",
                            "App Integrations",
                            "Search functionality",
                            "Voice and Video calls"
                        ]
                    }, null, 2),
                },
                {
                    uri: "slack://channels/guidelines",
                    name: "Channel Guidelines",
                    description: "Best practices for channel management",
                    mimeType: "text/markdown",
                    content: `# Slack Channel Management Guidelines

## Channel Naming Conventions
- Use lowercase letters and hyphens
- Include team/project prefix (e.g., \`#marketing-campaigns\`)
- Keep names descriptive but concise

## Channel Types
- **#general**: Company-wide announcements
- **#random**: Casual conversations
- **#team-[name]**: Team-specific discussions
- **#project-[name]**: Project-specific channels

## Best Practices
1. **Set clear channel purposes** in the description
2. **Pin important messages** for easy reference
3. **Use threads** for detailed discussions
4. **Archive inactive channels** to reduce clutter
5. **Use @channel/@here sparingly** to avoid notification fatigue

## Channel Etiquette
- Stay on topic within each channel
- Use appropriate emoji reactions instead of "thanks" messages
- Search before asking questions that might already be answered
- Respect timezone differences when sending messages`,
                },
                {
                    uri: "slack://messaging/templates",
                    name: "Message Templates",
                    description: "Common message templates for team communication",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "announcements": {
                            "company_update": "📢 **Company Update**\n\nHi team! I wanted to share some important updates:\n\n• [Update 1]\n• [Update 2]\n• [Update 3]\n\nFeel free to reach out if you have any questions!",
                            "project_milestone": "🎉 **Milestone Achieved!**\n\nGreat news! We've successfully completed [milestone name].\n\n**Key achievements:**\n• [Achievement 1]\n• [Achievement 2]\n\nThanks to everyone who contributed!"
                        },
                        "meetings": {
                            "meeting_reminder": "⏰ **Meeting Reminder**\n\n📅 **When:** [Date and Time]\n📍 **Where:** [Location/Link]\n📋 **Agenda:** [Brief agenda]\n\nSee you there!",
                            "meeting_notes": "📝 **Meeting Notes - [Date]**\n\n**Attendees:** [List]\n**Decisions Made:**\n• [Decision 1]\n• [Decision 2]\n\n**Action Items:**\n• [Action 1] - @[person]\n• [Action 2] - @[person]"
                        },
                        "support": {
                            "help_request": "🆘 **Need Help**\n\n**Issue:** [Brief description]\n**Context:** [Additional details]\n**Urgency:** [High/Medium/Low]\n\nAny assistance would be appreciated!",
                            "solution_sharing": "💡 **Solution Found**\n\n**Problem:** [Brief description]\n**Solution:** [Steps taken]\n\nHope this helps others who might face the same issue!"
                        }
                    }, null, 2),
                },
                {
                    uri: "slack://block-kit/examples",
                    name: "Block Kit Examples",
                    description: "Example Block Kit layouts for rich messages",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "simple_message": {
                            "blocks": [
                                {
                                    "type": "section",
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "Hello! This is a simple Block Kit message."
                                    }
                                }
                            ]
                        },
                        "message_with_button": {
                            "blocks": [
                                {
                                    "type": "section",
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "Click the button below to take action:"
                                    }
                                },
                                {
                                    "type": "actions",
                                    "elements": [
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "text": "Click Me"
                                            },
                                            "action_id": "button_click",
                                            "style": "primary"
                                        }
                                    ]
                                }
                            ]
                        },
                        "approval_request": {
                            "blocks": [
                                {
                                    "type": "section",
                                    "text": {
                                        "type": "mrkdwn",
                                        "text": "📋 *Approval Required*\n\n*Request:* New budget proposal\n*Amount:* $5,000\n*Department:* Marketing"
                                    }
                                },
                                {
                                    "type": "actions",
                                    "elements": [
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "text": "Approve"
                                            },
                                            "style": "primary",
                                            "action_id": "approve"
                                        },
                                        {
                                            "type": "button",
                                            "text": {
                                                "type": "plain_text",
                                                "text": "Reject"
                                            },
                                            "style": "danger",
                                            "action_id": "reject"
                                        }
                                    ]
                                }
                            ]
                        }
                    }, null, 2),
                },
                {
                    uri: "slack://api/rate-limits",
                    name: "API Rate Limits",
                    description: "Current rate limits for Slack API methods",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "tier1": {
                            "description": "Most Slack Web API methods",
                            "rate_limit": "1+ requests per minute",
                            "methods": ["chat.postMessage", "conversations.list", "users.list"]
                        },
                        "tier2": {
                            "description": "Methods that post content",
                            "rate_limit": "20+ requests per minute",
                            "methods": ["files.upload", "chat.update", "chat.delete"]
                        },
                        "tier3": {
                            "description": "Special rate limits",
                            "rate_limit": "50+ requests per minute",
                            "methods": ["conversations.history", "conversations.replies"]
                        },
                        "tier4": {
                            "description": "Higher rate limit methods",
                            "rate_limit": "100+ requests per minute",
                            "methods": ["users.info", "conversations.info"]
                        },
                        "best_practices": [
                            "Respect rate limits to avoid 429 errors",
                            "Implement exponential backoff for retries",
                            "Cache responses when possible",
                            "Use bulk operations when available"
                        ]
                    }, null, 2),
                },
                {
                    uri: "slack://app/installation-guide",
                    name: "App Installation Guide",
                    description: "Step-by-step guide for installing Slack apps",
                    mimeType: "text/markdown",
                    content: `# Slack App Installation Guide

## Prerequisites
- Slack workspace admin permissions
- Valid API tokens
- App configuration completed

## Installation Steps

### 1. Create Your Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch" or "From app manifest"
4. Fill in app details (name, workspace)

### 2. Configure OAuth & Permissions
1. Navigate to "OAuth & Permissions" in the sidebar
2. Add required scopes under "Bot Token Scopes":
   - \`chat:write\` - Send messages
   - \`channels:read\` - View public channels
   - \`files:write\` - Upload files
   - \`users:read\` - View user information

### 3. Install to Workspace
1. Click "Install to Workspace" button
2. Review permissions and authorize
3. Copy the "Bot User OAuth Token" (starts with \`xoxb-\`)

### 4. Configure Your Bridge
1. Paste the OAuth token in the authentication field
2. Test the connection with a simple API call
3. Configure your desired endpoints

## Security Best Practices
- Store tokens securely
- Use environment variables for sensitive data
- Regularly rotate tokens
- Monitor API usage and rate limits

## Troubleshooting
- **Invalid Auth**: Check token format and permissions
- **Rate Limits**: Implement proper retry logic
- **Missing Scopes**: Add required scopes in OAuth settings`,
                },
            ],
            mcpPrompts: [
                {
                    name: "channel_summary",
                    description: "Summarize channel activity and key discussions",
                    content: `You are a Slack channel analyzer. Analyze the channel activity and provide a comprehensive summary.

**Your Task:**
- Review messages, threads, and reactions in the specified channel
- Identify key topics, decisions, and action items
- Highlight important announcements or updates
- Note active participants and their contributions
- Summarize overall channel sentiment and engagement

**Analysis Framework:**
1. **Key Topics**: Main subjects discussed
2. **Decisions Made**: Important conclusions or resolutions
3. **Action Items**: Tasks assigned or follow-ups needed
4. **Announcements**: Important updates or news shared
5. **Engagement**: Level of participation and interaction

**Output Format:**
Provide a structured summary with clear sections and bullet points. Focus on actionable insights and important information that team members should know.`,
                    arguments: [
                        {
                            name: "channel",
                            description: "Channel ID or name",
                            required: true,
                        },
                        {
                            name: "days",
                            description: "Number of days to analyze",
                            required: false,
                        },
                    ],
                },
                {
                    name: "message_composer",
                    description: "Compose professional messages for team communication",
                    content: `You are a professional communication assistant specialized in crafting effective Slack messages.

**Your Role:**
- Write clear, engaging, and purposeful messages
- Adapt tone and style to match the specified requirements
- Ensure messages are appropriate for team communication
- Include relevant context and call-to-actions when needed

**Communication Principles:**
1. **Clarity**: Use simple, direct language
2. **Purpose**: Every message should have a clear objective
3. **Tone**: Match the requested tone (formal/casual/urgent)
4. **Action**: Include clear next steps when applicable
5. **Respect**: Maintain professionalism and consideration

**Tone Guidelines:**
- **Formal**: Professional, structured, complete sentences
- **Casual**: Friendly, conversational, team-oriented
- **Urgent**: Direct, clear priority, specific timeline

**Message Structure:**
- Lead with the main point
- Provide necessary context
- Include clear action items
- Use formatting for readability (@mentions, bullet points, etc.)`,
                    arguments: [
                        {
                            name: "purpose",
                            description: "Purpose of the message",
                            required: true,
                        },
                        {
                            name: "tone",
                            description: "Tone (formal/casual/urgent)",
                            required: false,
                        },
                    ],
                },
                {
                    name: "block_kit_builder",
                    description: "Generate Block Kit JSON for interactive messages",
                    content: `You are a Slack Block Kit expert. Generate well-structured, interactive Block Kit JSON for engaging Slack messages.

**Your Expertise:**
- Create interactive messages with buttons, dropdowns, and inputs
- Design user-friendly layouts with proper accessibility
- Implement best practices for Block Kit components
- Ensure JSON is valid and follows Slack's specifications

**Available Components:**
1. **Section**: Text with optional accessory elements
2. **Actions**: Interactive elements (buttons, select menus)
3. **Input**: Text inputs, checkboxes, radio buttons
4. **Divider**: Visual separator
5. **Header**: Large text headers
6. **Context**: Smaller contextual information
7. **Image**: Display images with alt text

**Design Principles:**
- Keep interactions intuitive and purposeful
- Use consistent styling and spacing
- Include appropriate labels and placeholders
- Consider accessibility and screen readers
- Limit cognitive load with clear hierarchy

**JSON Structure:**
Generate valid Block Kit JSON that can be directly used in Slack API calls. Include proper error handling and validation.`,
                    arguments: [
                        {
                            name: "components",
                            description: "Desired components (buttons,menus,datepicker,etc)",
                            required: true,
                        },
                        {
                            name: "purpose",
                            description: "Purpose of the interactive message",
                            required: true,
                        },
                    ],
                },
                {
                    name: "channel_organizer",
                    description: "Recommend channel organization strategies",
                    content: `You are a Slack workspace organization expert. Help teams create efficient, scalable channel structures.

**Your Expertise:**
- Design logical channel hierarchies and naming conventions
- Recommend optimal channel types and privacy settings
- Suggest workflow integration strategies
- Ensure discoverability and reduce channel sprawl

**Channel Strategy Framework:**
1. **Purpose-Based Grouping**: Organize by function, project, or team
2. **Naming Conventions**: Clear, consistent, searchable patterns
3. **Channel Types**: Public, private, DM groups appropriate usage
4. **Information Architecture**: Logical hierarchy and relationships
5. **Lifecycle Management**: Creation, maintenance, and archival processes

**Recommendations Include:**
- Channel naming patterns (prefixes, suffixes, formats)
- Channel purposes and descriptions
- Member management strategies
- Integration with tools and workflows
- Archive and cleanup policies

**Best Practices:**
- Keep channel purposes focused and clear
- Avoid duplicate or overlapping channels
- Consider team size and communication patterns
- Plan for growth and organizational changes`,
                    arguments: [
                        {
                            name: "team_size",
                            description: "Size of the team",
                            required: true,
                        },
                        {
                            name: "department_structure",
                            description: "Key departments or teams",
                            required: true,
                        },
                    ],
                },
                {
                    name: "workflow_designer",
                    description: "Design Slack workflows for common business processes",
                    content: `You are a Slack Workflow Builder expert. Design automated workflows that streamline business processes and improve team productivity.

**Your Capabilities:**
- Create multi-step automated workflows
- Design form-based data collection
- Set up approval processes and notifications
- Integrate with external tools and systems
- Build conditional logic and branching

**Workflow Design Process:**
1. **Process Analysis**: Break down the business process into steps
2. **Trigger Identification**: Determine workflow initiation points
3. **Step Definition**: Map each action and decision point
4. **Data Flow**: Design information collection and routing
5. **Notifications**: Set up appropriate alerts and updates
6. **Testing**: Validate workflow logic and error handling

**Common Workflow Types:**
- **Approval Workflows**: Request approval, route for review, notify decisions
- **Onboarding**: Welcome new team members, assign tasks, schedule meetings
- **IT Support**: Ticket creation, routing, and resolution tracking
- **Time Off**: Request submission, manager approval, calendar updates
- **Expense Reports**: Submission, review, approval, and processing

**Best Practices:**
- Keep workflows simple and intuitive
- Provide clear instructions and context
- Include error handling and fallback options
- Test thoroughly before deployment
- Document workflow purpose and maintenance`,
                    arguments: [
                        {
                            name: "process",
                            description: "Business process to automate",
                            required: true,
                        },
                        {
                            name: "complexity",
                            description: "Desired complexity level (simple/advanced)",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "weather",
        name: "Weather API",
        description: "OpenWeatherMap real-time weather data",
        icon: Globe,
        color: "bg-blue-500",
        tags: ["Weather", "API Key"],
        config: {
            name: "Weather API",
            description:
                "Connect to OpenWeatherMap for real-time weather data and forecasts.",
            apiConfig: {
                name: "OpenWeatherMap API",
                baseUrl: "https://api.openweathermap.org/data/2.5",
                description: "Real-time weather data and forecasts",
                authentication: {
                    type: "apikey",
                    apiKey: "",
                    headerName: "appid",
                    keyLocation: "query",
                },
                endpoints: [
                    {
                        id: "get_weather_read",
                        name: "get_weather_read",
                        method: "GET",
                        path: "/weather",
                        description: "Get current weather for a city",
                        parameters: [
                            {
                                name: "q",
                                type: "string",
                                required: true,
                                description: "City name",
                            },
                            {
                                name: "units",
                                type: "string",
                                required: false,
                                description: "Units (standard, metric, imperial)",
                            },
                        ],
                    },
                    {
                        id: "get_forecast_read",
                        name: "get_forecast_read",
                        method: "GET",
                        path: "/forecast",
                        description: "Get 5 day weather forecast",
                        parameters: [
                            {
                                name: "q",
                                type: "string",
                                required: true,
                                description: "City name",
                            },
                            {
                                name: "units",
                                type: "string",
                                required: false,
                                description: "Units (standard, metric, imperial)",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "weather://cities",
                    name: "Weather Cities",
                    description: "List of popular cities for weather queries",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "popular_cities": [
                            { "name": "New York", "country": "US", "query": "New York,US" },
                            { "name": "London", "country": "GB", "query": "London,GB" },
                            { "name": "Tokyo", "country": "JP", "query": "Tokyo,JP" },
                            { "name": "Paris", "country": "FR", "query": "Paris,FR" },
                            { "name": "Sydney", "country": "AU", "query": "Sydney,AU" },
                            { "name": "Dubai", "country": "AE", "query": "Dubai,AE" },
                            { "name": "Singapore", "country": "SG", "query": "Singapore,SG" },
                            { "name": "Mumbai", "country": "IN", "query": "Mumbai,IN" },
                            { "name": "São Paulo", "country": "BR", "query": "São Paulo,BR" },
                            { "name": "Cairo", "country": "EG", "query": "Cairo,EG" }
                        ],
                        "query_formats": [
                            "City name: 'London'",
                            "City and country: 'London,GB'",
                            "Coordinates: 'lat=35&lon=139'",
                            "Zip code: '10001' (US only)"
                        ],
                        "note": "For best results, include country code (ISO 3166-1 alpha-2)"
                    }, null, 2),
                },
                {
                    uri: "weather://units",
                    name: "Weather Units",
                    description: "Available unit systems for weather data",
                    mimeType: "text/plain",
                    content: `Weather API Unit Systems

STANDARD (Default)
- Temperature: Kelvin
- Wind Speed: m/s
- Pressure: hPa
- Humidity: %

METRIC
- Temperature: Celsius
- Wind Speed: m/s
- Pressure: hPa
- Humidity: %

IMPERIAL
- Temperature: Fahrenheit
- Wind Speed: mph
- Pressure: hPa
- Humidity: %

Usage: Add 'units=metric' or 'units=imperial' to your API calls.
Example: /weather?q=London&units=metric`,
                },
            ],
            mcpPrompts: [
                {
                    name: "weather_summary",
                    description: "Generate a comprehensive weather summary for a city",
                    content: `You are a professional weather analyst. Provide comprehensive, easy-to-understand weather summaries for any location.

**Your Role:**
- Analyze current weather conditions and forecasts
- Explain weather patterns in clear, accessible language
- Provide practical advice based on weather conditions
- Include relevant context and safety considerations

**Weather Summary Components:**
1. **Current Conditions**: Temperature, humidity, wind, visibility
2. **Forecast Overview**: Short-term and extended outlook
3. **Notable Features**: Precipitation, storms, unusual conditions
4. **Practical Advice**: Clothing suggestions, activity recommendations
5. **Safety Notes**: Weather-related warnings or precautions

**Communication Style:**
- Use conversational, friendly tone
- Explain meteorological terms clearly
- Focus on practical implications
- Include comparative context ("warmer than average")
- Provide specific, actionable recommendations

**Format Guidelines:**
- Start with current conditions summary
- Include key metrics with context
- Highlight any significant weather events
- End with practical recommendations`,
                    arguments: [
                        {
                            name: "city",
                            description: "City name for weather summary",
                            required: true,
                        },
                    ],
                },
                {
                    name: "weather_comparison",
                    description: "Compare weather between multiple cities",
                    content: `You are a weather comparison specialist. Create detailed, useful comparisons between multiple cities' weather conditions.

**Your Expertise:**
- Analyze weather data across multiple locations
- Identify meaningful patterns and differences
- Provide travel and planning recommendations
- Explain regional weather variations clearly

**Comparison Framework:**
1. **Temperature Analysis**: Current temps, feels-like, daily ranges
2. **Precipitation**: Rain, snow, humidity levels
3. **Wind Conditions**: Speed, direction, wind chill factors
4. **Visibility & Air Quality**: Clarity, pollution, atmospheric conditions
5. **Comfort Index**: Overall weather comfort and outdoor suitability

**Analysis Approach:**
- Present side-by-side comparisons
- Highlight significant differences
- Explain reasons for variations (geography, seasons, patterns)
- Provide travel or relocation insights
- Include timing recommendations

**Practical Applications:**
- Travel planning and packing advice
- Business trip scheduling
- Event planning considerations
- Relocation decision support
- Seasonal activity recommendations`,
                    arguments: [
                        {
                            name: "cities",
                            description: "Comma-separated list of cities",
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "demo",
        name: "JSONPlaceholder API",
        description: "JSONPlaceholder for testing",
        icon: Database,
        color: "bg-orange-500",
        tags: ["Testing", "No Auth"],
        config: {
            name: "Demo API (JSONPlaceholder)",
            description:
                "Free fake API for testing and prototyping. No authentication required.",
            apiConfig: {
                name: "JSONPlaceholder API",
                baseUrl: "https://jsonplaceholder.typicode.com",
                description: "Free fake REST API for testing and prototyping",
                authentication: { type: "none", keyLocation: "header" },
                endpoints: [
                    {
                        id: "get_posts_list",
                        name: "get_posts_list",
                        method: "GET",
                        path: "/posts",
                        description: "Retrieve all posts",
                        parameters: [],
                    },
                    {
                        id: "get_posts_read",
                        name: "get_posts_read",
                        method: "GET",
                        path: "/posts/{id}",
                        description: "Retrieve a specific post by ID",
                        parameters: [
                            {
                                name: "id",
                                type: "number",
                                required: true,
                                description: "Post ID",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                    {
                        id: "get_users_list",
                        name: "get_users_list",
                        method: "GET",
                        path: "/users",
                        description: "Retrieve all users",
                        parameters: [],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "demo://posts/stats",
                    name: "Posts Statistics",
                    description: "Statistics about posts in the demo API",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "total_posts": 100,
                        "total_users": 10,
                        "posts_per_user": {
                            "average": 10,
                            "min": 10,
                            "max": 10
                        },
                        "post_structure": {
                            "fields": ["id", "title", "body", "userId"],
                            "id_range": "1-100",
                            "sample_post": {
                                "id": 1,
                                "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                                "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto",
                                "userId": 1
                            }
                        },
                        "endpoints": [
                            "GET /posts - All posts",
                            "GET /posts/{id} - Single post",
                            "POST /posts - Create post",
                            "PUT /posts/{id} - Update post",
                            "DELETE /posts/{id} - Delete post"
                        ]
                    }, null, 2),
                },
                {
                    uri: "demo://users/guide",
                    name: "Users Guide",
                    description: "Guide on working with demo users",
                    mimeType: "text/markdown",
                    content: `# JSONPlaceholder Users Guide

## Available Users
The demo API provides 10 test users with realistic data.

## User Structure
Each user contains:
- **id**: Unique identifier (1-10)
- **name**: Full name
- **username**: Username
- **email**: Email address
- **address**: Full address with geo coordinates
- **phone**: Phone number
- **website**: Personal website
- **company**: Company information

## Sample User
\`\`\`json
{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}
\`\`\`

## Usage Tips
- Perfect for testing user-related features
- No authentication required
- Stable data that won't change
- Great for demos and prototyping`,
                },
                {
                    uri: "demo://api/schema",
                    name: "API Schema",
                    description: "JSONPlaceholder API schema documentation",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "base_url": "https://jsonplaceholder.typicode.com",
                        "resources": {
                            "posts": {
                                "count": 100,
                                "endpoints": ["/posts", "/posts/{id}"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "title", "body", "userId"]
                            },
                            "comments": {
                                "count": 500,
                                "endpoints": ["/comments", "/comments/{id}", "/posts/{id}/comments"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "name", "email", "body", "postId"]
                            },
                            "albums": {
                                "count": 100,
                                "endpoints": ["/albums", "/albums/{id}", "/users/{id}/albums"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "title", "userId"]
                            },
                            "photos": {
                                "count": 5000,
                                "endpoints": ["/photos", "/photos/{id}", "/albums/{id}/photos"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "title", "url", "thumbnailUrl", "albumId"]
                            },
                            "todos": {
                                "count": 200,
                                "endpoints": ["/todos", "/todos/{id}", "/users/{id}/todos"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "title", "completed", "userId"]
                            },
                            "users": {
                                "count": 10,
                                "endpoints": ["/users", "/users/{id}"],
                                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "fields": ["id", "name", "username", "email", "address", "phone", "website", "company"]
                            }
                        },
                        "features": [
                            "Zero configuration",
                            "No registration required",
                            "CORS enabled",
                            "RESTful API",
                            "JSON responses",
                            "Supports all HTTP methods"
                        ]
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "post_analysis",
                    description: "Analyze posts and provide insights",
                    content: `You are a content analysis expert specializing in blog post and social media analysis. Analyze collections of posts to extract meaningful insights and patterns.

**Your Analysis Capabilities:**
- Content theme identification and categorization
- Sentiment analysis and tone assessment
- Engagement pattern recognition
- Quality and relevance scoring
- Trend identification and popularity metrics

**Analysis Framework:**
1. **Content Quality**: Writing style, structure, clarity
2. **Theme Analysis**: Topic categorization and subject matter
3. **Engagement Metrics**: Comments, reactions, shares
4. **Sentiment Assessment**: Positive, negative, neutral tones
5. **User Behavior**: Posting patterns, activity levels
6. **Content Performance**: Most popular posts and topics

**Insights to Provide:**
- Most engaging content types and topics
- Optimal posting patterns and timing
- Content quality improvement suggestions
- User engagement recommendations
- Trending topics and themes

**Output Format:**
Provide structured analysis with clear sections, data-backed insights, and actionable recommendations for content creators.`,
                    arguments: [
                        {
                            name: "limit",
                            description: "Number of posts to analyze",
                            required: false,
                        },
                    ],
                },
                {
                    name: "user_profile",
                    description: "Generate a detailed user profile summary",
                    content: `You are a user profile analyst. Create comprehensive user summaries based on available data and activity patterns.

**Your Expertise:**
- Synthesize user information into coherent profiles
- Identify user characteristics and preferences
- Analyze activity patterns and behavior
- Generate persona-based insights
- Provide recommendations for user engagement

**Profile Components:**
1. **Basic Information**: Name, contact, location details
2. **Activity Analysis**: Posts, comments, engagement levels
3. **Interest Mapping**: Topics, themes, content preferences
4. **Social Connections**: Network analysis, collaboration patterns
5. **Behavior Patterns**: Usage frequency, interaction style
6. **Professional Profile**: Company, role, industry context

**Analysis Approach:**
- Combine demographic and behavioral data
- Identify key characteristics and motivations
- Look for patterns in activity and engagement
- Suggest personalization opportunities
- Highlight unique user attributes

**Output Structure:**
Present a well-organized profile with clear sections, key insights, and actionable recommendations for better user experience and engagement.`,
                    arguments: [
                        {
                            name: "user_id",
                            description: "User ID to analyze",
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "jsonbin",
        name: "JSONBin.io API",
        description: "JSON storage and API mocking",
        icon: Database,
        color: "bg-yellow-500",
        tags: ["Storage", "API Key"],
        config: {
            name: "JSONBin.io API",
            description: "Store and access JSON data with a simple REST API.",
            apiConfig: {
                name: "JSONBin.io API",
                baseUrl: "https://api.jsonbin.io/v3",
                description: "JSON storage service with API features",
                authentication: {
                    type: "apikey",
                    apiKey: "",
                    headerName: "X-Master-Key",
                    keyLocation: "header",
                },
                endpoints: [
                    {
                        id: "post_b_create",
                        name: "post_b_create",
                        method: "POST",
                        path: "/b",
                        description: "Create a new JSON bin",
                        parameters: [
                            {
                                name: "name",
                                type: "string",
                                required: true,
                                description: "Name of the bin",
                            },
                            {
                                name: "private",
                                type: "boolean",
                                required: false,
                                description: "Make bin private",
                            },
                            {
                                name: "body",
                                type: "object",
                                required: true,
                                description: "JSON data to store",
                                location: "body",
                            },
                        ],
                    },
                    {
                        id: "get_b_read",
                        name: "get_b_read",
                        method: "GET",
                        path: "/b/{id}",
                        description: "Read a JSON bin by ID",
                        parameters: [
                            {
                                name: "id",
                                type: "string",
                                required: true,
                                description: "Bin ID",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "jsonbin://bins/list",
                    name: "Bins List",
                    description: "List of all JSON bins",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "example_bins": [
                            {
                                "id": "example_bin_1",
                                "name": "User Preferences",
                                "description": "Sample user preferences data",
                                "private": false,
                                "created": "2024-01-01T00:00:00Z"
                            },
                            {
                                "id": "example_bin_2",
                                "name": "App Configuration",
                                "description": "Application settings and config",
                                "private": true,
                                "created": "2024-01-02T00:00:00Z"
                            }
                        ],
                        "bin_structure": {
                            "id": "Unique bin identifier",
                            "name": "Human readable name",
                            "private": "Boolean - public or private access",
                            "data": "Your JSON data object"
                        },
                        "usage_tips": [
                            "Use descriptive names for easy identification",
                            "Mark sensitive data as private",
                            "Consider data size limits",
                            "Use proper JSON formatting"
                        ]
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "json_validator",
                    description: "Validate JSON structure before storing",
                    content: `You are a JSON validation and optimization expert. Analyze JSON data for structure, validity, and best practices before storage.

**Your Validation Capabilities:**
- Syntax validation and error detection
- Schema compliance checking
- Performance optimization recommendations
- Security vulnerability assessment
- Structure improvement suggestions

**Validation Process:**
1. **Syntax Check**: Ensure valid JSON format
2. **Structure Analysis**: Evaluate data organization
3. **Type Validation**: Verify data types and formats
4. **Schema Compliance**: Check against expected patterns
5. **Optimization Review**: Suggest improvements for storage and retrieval

**Key Validation Areas:**
- **Syntax Errors**: Missing quotes, brackets, commas
- **Data Types**: Appropriate use of strings, numbers, booleans, arrays
- **Nesting Levels**: Reasonable depth and complexity
- **Key Naming**: Consistent and descriptive property names
- **Value Formats**: Proper date, email, URL formats

**Recommendations Include:**
- Error fixes with specific line numbers
- Structure optimization suggestions
- Security considerations (no sensitive data)
- Performance improvements for large datasets
- Best practices for JSON schema design`,
                    arguments: [
                        {
                            name: "json",
                            description: "JSON data to validate",
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "reqres",
        name: "ReqRes API",
        description: "REST API for testing",
        icon: Database,
        color: "bg-indigo-500",
        tags: ["Testing", "No Auth"],
        config: {
            name: "ReqRes API",
            description: "Free REST API for testing with realistic response data.",
            apiConfig: {
                name: "ReqRes API",
                baseUrl: "https://reqres.in/api",
                description: "Mock REST API with realistic responses",
                authentication: {
                    type: "apikey",
                    apiKey: "reqres-free-v1",
                    headerName: "x-api-key",
                    keyLocation: "header",
                },
                endpoints: [
                    {
                        id: "get_users_list",
                        name: "get_users_list",
                        method: "GET",
                        path: "/users",
                        description: "Get list of users with pagination",
                        parameters: [
                            {
                                name: "page",
                                type: "number",
                                required: false,
                                description: "Page number",
                            },
                            {
                                name: "per_page",
                                type: "number",
                                required: false,
                                description: "Items per page",
                            },
                        ],
                    },
                    {
                        id: "get_users_read",
                        name: "get_users_read",
                        method: "GET",
                        path: "/users/{id}",
                        description: "Get a single user by ID",
                        parameters: [
                            {
                                name: "id",
                                type: "number",
                                required: true,
                                description: "User ID",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                    {
                        id: "post_users_create",
                        name: "post_users_create",
                        method: "POST",
                        path: "/users",
                        description: "Create a new user",
                        parameters: [
                            {
                                name: "name",
                                type: "string",
                                required: true,
                                description: "User name",
                            },
                            {
                                name: "job",
                                type: "string",
                                required: true,
                                description: "User job",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "reqres://users/schema",
                    name: "User Schema",
                    description: "User data structure documentation",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "user_fields": {
                            "id": "number - Unique user identifier",
                            "email": "string - User email address",
                            "first_name": "string - User's first name",
                            "last_name": "string - User's last name",
                            "avatar": "string - URL to user avatar image"
                        },
                        "sample_user": {
                            "id": 2,
                            "email": "janet.weaver@reqres.in",
                            "first_name": "Janet",
                            "last_name": "Weaver",
                            "avatar": "https://reqres.in/img/faces/2-image.jpg"
                        },
                        "pagination": {
                            "page": "Current page number",
                            "per_page": "Items per page",
                            "total": "Total number of items",
                            "total_pages": "Total number of pages"
                        },
                        "response_format": {
                            "data": "Array of user objects or single user object",
                            "support": "Object with support information"
                        }
                    }, null, 2),
                },
                {
                    uri: "reqres://examples",
                    name: "Example Responses",
                    description: "Sample API responses for each endpoint",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "list_users": {
                            "url": "GET /api/users?page=2",
                            "response": {
                                "page": 2,
                                "per_page": 6,
                                "total": 12,
                                "total_pages": 2,
                                "data": [
                                    {
                                        "id": 7,
                                        "email": "michael.lawson@reqres.in",
                                        "first_name": "Michael",
                                        "last_name": "Lawson",
                                        "avatar": "https://reqres.in/img/faces/7-image.jpg"
                                    }
                                ]
                            }
                        },
                        "single_user": {
                            "url": "GET /api/users/2",
                            "response": {
                                "data": {
                                    "id": 2,
                                    "email": "janet.weaver@reqres.in",
                                    "first_name": "Janet",
                                    "last_name": "Weaver",
                                    "avatar": "https://reqres.in/img/faces/2-image.jpg"
                                }
                            }
                        },
                        "create_user": {
                            "url": "POST /api/users",
                            "request": {
                                "name": "morpheus",
                                "job": "leader"
                            },
                            "response": {
                                "name": "morpheus",
                                "job": "leader",
                                "id": "892",
                                "createdAt": "2024-01-01T12:00:00.000Z"
                            }
                        }
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "test_scenario",
                    description: "Generate test scenarios for endpoints",
                    content: `You are an API testing expert specializing in comprehensive test scenario generation. Create thorough test plans for API endpoints.

**Your Testing Expertise:**
- Test case design and coverage analysis
- Edge case identification and boundary testing
- Error scenario planning and validation
- Performance and load testing considerations
- Security testing and vulnerability assessment

**Test Scenario Framework:**
1. **Positive Tests**: Valid inputs and expected behaviors
2. **Negative Tests**: Invalid inputs and error handling
3. **Edge Cases**: Boundary conditions and limits
4. **Security Tests**: Authentication, authorization, injection
5. **Performance Tests**: Load, stress, and response time

**Scenario Types:**
- **Success Scenarios**: Valid requests with expected responses
- **Error Scenarios**: Invalid data, missing fields, authentication failures
- **Boundary Testing**: Min/max values, empty data, large payloads
- **Integration Testing**: Multi-step workflows and dependencies

**Test Case Structure:**
- Clear test description and objective
- Detailed input parameters and data
- Expected response format and status codes
- Validation criteria and assertions
- Prerequisites and setup requirements

**Coverage Areas:**
- All HTTP methods and status codes
- Request/response validation
- Authentication and authorization
- Data validation and sanitization
- Error handling and recovery`,
                    arguments: [
                        {
                            name: "endpoint",
                            description: "Target endpoint",
                            required: true,
                        },
                        {
                            name: "scenario_type",
                            description: "Type of test (success/error)",
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "dog-api",
        name: "Dog API",
        description: "Dog images and facts",
        icon: Globe,
        color: "bg-orange-400",
        tags: ["Fun", "No Auth"],
        config: {
            name: "Dog API",
            description: "Get random dog images and breed information.",
            apiConfig: {
                name: "Dog API",
                baseUrl: "https://dog.ceo/api",
                description: "Free API for dog images and breeds",
                authentication: { type: "none", keyLocation: "header" },
                endpoints: [
                    {
                        id: "get_breeds_image_random",
                        name: "get_breeds_image_random",
                        method: "GET",
                        path: "/breeds/image/random",
                        description: "Get a random dog image",
                        parameters: [],
                    },
                    {
                        id: "get_breeds_list",
                        name: "get_breeds_list",
                        method: "GET",
                        path: "/breeds/list/all",
                        description: "Get list of all dog breeds",
                        parameters: [],
                    },
                    {
                        id: "get_breed_images_random",
                        name: "get_breed_images_random",
                        method: "GET",
                        path: "/breed/{breed}/images/random",
                        description: "Get images for a specific breed",
                        parameters: [
                            {
                                name: "breed",
                                type: "string",
                                required: true,
                                description: "Dog breed name",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "dog://breeds/info",
                    name: "Breed Information",
                    description: "Detailed information about dog breeds",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "popular_breeds": [
                            {
                                "name": "labrador",
                                "description": "Friendly, outgoing, active dogs with plenty of energy",
                                "size": "Large",
                                "temperament": "Friendly, Active, Outgoing",
                                "life_span": "10-12 years"
                            },
                            {
                                "name": "golden_retriever",
                                "description": "Intelligent, friendly, devoted dogs",
                                "size": "Large",
                                "temperament": "Intelligent, Friendly, Devoted",
                                "life_span": "10-12 years"
                            },
                            {
                                "name": "bulldog",
                                "description": "Docile, willful, friendly dogs",
                                "size": "Medium",
                                "temperament": "Docile, Willful, Friendly",
                                "life_span": "8-10 years"
                            }
                        ],
                        "breed_categories": [
                            "Working dogs",
                            "Sporting dogs",
                            "Toy dogs",
                            "Terrier dogs",
                            "Hound dogs",
                            "Herding dogs",
                            "Non-sporting dogs"
                        ],
                        "api_notes": [
                            "Use lowercase breed names",
                            "Some breeds have sub-breeds (e.g., 'collie/border')",
                            "Check /breeds/list/all for complete list",
                            "Images are randomly selected"
                        ]
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "breed_finder",
                    description: "Find dog breeds based on characteristics",
                    content: `You are a dog breed expert and matchmaker. Help people find the perfect dog breed based on their lifestyle, preferences, and circumstances.

**Your Expertise:**
- Comprehensive knowledge of 200+ dog breeds
- Understanding of breed characteristics, temperaments, and needs
- Lifestyle matching and compatibility assessment
- Care requirements and training considerations
- Health considerations and breed-specific issues

**Breed Matching Framework:**
1. **Lifestyle Assessment**: Living space, activity level, family situation
2. **Preference Analysis**: Size, appearance, temperament preferences
3. **Care Capacity**: Time, experience, grooming, exercise needs
4. **Compatibility Check**: Allergies, other pets, children
5. **Long-term Considerations**: Lifespan, health, training needs

**Key Characteristics to Consider:**
- **Size**: Toy, Small, Medium, Large, Giant
- **Energy Level**: Low, Moderate, High, Very High
- **Grooming Needs**: Minimal, Moderate, High Maintenance
- **Training Difficulty**: Beginner-friendly to Expert-level
- **Temperament**: Gentle, Protective, Independent, Social

**Recommendation Structure:**
- Top 3-5 breed matches with detailed explanations
- Pros and cons for each recommendation
- Care requirements and expectations
- Training and socialization needs
- Health considerations and typical lifespan`,
                    arguments: [
                        {
                            name: "characteristics",
                            description: "Desired breed characteristics",
                            required: true,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "jokes-api",
        name: "JokeAPI",
        description: "Programming and general jokes",
        icon: Globe,
        color: "bg-pink-500",
        tags: ["Fun", "No Auth"],
        config: {
            name: "JokeAPI",
            description: "Get random jokes of various categories.",
            apiConfig: {
                name: "JokeAPI v2",
                baseUrl: "https://v2.jokeapi.dev",
                description: "Free API for jokes and humor",
                authentication: { type: "none", keyLocation: "header" },
                endpoints: [
                    {
                        id: "get_joke_any",
                        name: "get_joke_any",
                        method: "GET",
                        path: "/joke/Any",
                        description: "Get a random joke",
                        parameters: [
                            {
                                name: "type",
                                type: "string",
                                required: false,
                                description: "Type of joke (single/twopart)",
                                location: "query",
                                style: "parameter",
                            },
                            {
                                name: "contains",
                                type: "string",
                                required: false,
                                description: "Search term in joke",
                                location: "query",
                                style: "parameter",
                            },
                        ],
                    },
                    {
                        id: "get_joke_read",
                        name: "get_joke_read",
                        method: "GET",
                        path: "/joke/{category}",
                        description: "Get a joke from specific category",
                        parameters: [
                            {
                                name: "category",
                                type: "string",
                                required: true,
                                description:
                                    "Joke category (Programming/Misc/Dark/Pun/Spooky/Christmas)",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "jokes://categories",
                    name: "Joke Categories",
                    description: "Available joke categories",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "categories": [
                            {
                                "name": "Programming",
                                "description": "Jokes about coding, developers, and tech"
                            },
                            {
                                "name": "Misc",
                                "description": "General miscellaneous jokes"
                            },
                            {
                                "name": "Dark",
                                "description": "Dark humor jokes (use with caution)"
                            },
                            {
                                "name": "Pun",
                                "description": "Puns and wordplay jokes"
                            },
                            {
                                "name": "Spooky",
                                "description": "Halloween and spooky themed jokes"
                            },
                            {
                                "name": "Christmas",
                                "description": "Christmas and holiday themed jokes"
                            }
                        ],
                        "joke_types": [
                            {
                                "type": "single",
                                "description": "Single part jokes with setup and punchline combined"
                            },
                            {
                                "type": "twopart",
                                "description": "Two part jokes with separate setup and delivery"
                            }
                        ],
                        "filters": [
                            "nsfw - Not safe for work content",
                            "religious - Religious content",
                            "political - Political content",
                            "racist - Racist content",
                            "sexist - Sexist content",
                            "explicit - Explicit content"
                        ],
                        "usage_tips": [
                            "Use the 'safe-mode' flag to filter inappropriate content",
                            "Combine categories with + (e.g., Programming+Misc)",
                            "Use 'contains' parameter to search for specific terms"
                        ]
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "joke_finder",
                    description: "Find jokes based on mood and preferences",
                    content: `You are a humor specialist and joke curator. Find the perfect jokes to match specific moods, audiences, and situations.

**Your Comedy Expertise:**
- Understanding of different humor styles and preferences
- Audience-appropriate content selection
- Mood-based joke recommendation
- Cultural sensitivity and appropriateness assessment
- Comedy timing and delivery suggestions

**Joke Selection Framework:**
1. **Mood Matching**: Align humor style with desired emotional outcome
2. **Audience Analysis**: Consider age, context, professional setting
3. **Content Filtering**: Ensure appropriateness and sensitivity
4. **Variety Selection**: Mix different joke types and styles
5. **Quality Assessment**: Focus on well-crafted, clever humor

**Mood Categories:**
- **Uplifting**: Light-hearted, positive, cheerful jokes
- **Witty**: Clever wordplay, puns, intelligent humor
- **Silly**: Absurd, goofy, childlike humor
- **Dry**: Deadpan, sarcastic, understated humor
- **Nerdy**: Programming, tech, science-based jokes

**Content Considerations:**
- Safe for work environments
- Culturally appropriate and inclusive
- Avoid offensive or divisive content
- Consider timing and social context
- Match complexity to audience sophistication

**Recommendation Structure:**
- Curated joke selection with variety
- Context for when to use each joke
- Delivery tips and timing suggestions
- Alternative options for different audiences`,
                    arguments: [
                        {
                            name: "mood",
                            description: "Desired mood of joke",
                            required: true,
                        },
                        {
                            name: "category",
                            description: "Preferred category",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "pokemon",
        name: "PokéAPI",
        description: "Pokémon data and information",
        icon: Globe,
        color: "bg-red-500",
        tags: ["Fun", "No Auth"],
        config: {
            name: "PokéAPI",
            description: "Complete Pokémon information database.",
            apiConfig: {
                name: "PokéAPI v2",
                baseUrl: "https://pokeapi.co/api/v2",
                description: "Free API for Pokémon data",
                authentication: { type: "none", keyLocation: "header" },
                endpoints: [
                    {
                        id: "get_pokemon_read",
                        name: "get_pokemon_read",
                        method: "GET",
                        path: "/pokemon/{id}",
                        description: "Get information about a specific Pokémon",
                        parameters: [
                            {
                                name: "id",
                                type: "string",
                                required: true,
                                description: "Pokémon ID or name",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                    {
                        id: "get_type_list",
                        name: "get_type_list",
                        method: "GET",
                        path: "/type",
                        description: "Get all Pokémon types",
                        parameters: [],
                    },
                    {
                        id: "get_ability_read",
                        name: "get_ability_read",
                        method: "GET",
                        path: "/ability/{id}",
                        description: "Get information about a specific ability",
                        parameters: [
                            {
                                name: "id",
                                type: "string",
                                required: true,
                                description: "Ability ID or name",
                                location: "path",
                                style: "replacement",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "pokemon://types/chart",
                    name: "Type Chart",
                    description: "Pokémon type effectiveness chart",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "type_effectiveness": {
                            "super_effective": {
                                "fire": ["grass", "ice", "bug", "steel"],
                                "water": ["fire", "ground", "rock"],
                                "grass": ["water", "ground", "rock"],
                                "electric": ["water", "flying"],
                                "ice": ["grass", "ground", "flying", "dragon"],
                                "fighting": ["normal", "ice", "rock", "dark", "steel"],
                                "poison": ["grass", "fairy"],
                                "ground": ["fire", "electric", "poison", "rock", "steel"],
                                "flying": ["grass", "fighting", "bug"],
                                "psychic": ["fighting", "poison"],
                                "bug": ["grass", "psychic", "dark"],
                                "rock": ["fire", "ice", "flying", "bug"],
                                "ghost": ["psychic", "ghost"],
                                "dragon": ["dragon"],
                                "dark": ["psychic", "ghost"],
                                "steel": ["ice", "rock", "fairy"],
                                "fairy": ["fighting", "dragon", "dark"]
                            },
                            "not_very_effective": {
                                "fire": ["fire", "water", "rock", "dragon"],
                                "water": ["water", "grass", "dragon"],
                                "grass": ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"]
                            }
                        },
                        "immunities": {
                            "normal": ["ghost"],
                            "fighting": ["ghost"],
                            "poison": ["steel"],
                            "ground": ["flying"],
                            "psychic": ["dark"],
                            "ghost": ["normal"]
                        }
                    }, null, 2),
                },
                {
                    uri: "pokemon://generations",
                    name: "Generations",
                    description: "List of Pokémon generations",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "generations": [
                            {
                                "id": 1,
                                "name": "Generation I",
                                "region": "Kanto",
                                "pokemon_range": "1-151",
                                "games": ["Red", "Blue", "Yellow"],
                                "legendary": ["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"]
                            },
                            {
                                "id": 2,
                                "name": "Generation II",
                                "region": "Johto",
                                "pokemon_range": "152-251",
                                "games": ["Gold", "Silver", "Crystal"],
                                "legendary": ["Raikou", "Entei", "Suicune", "Lugia", "Ho-Oh", "Celebi"]
                            },
                            {
                                "id": 3,
                                "name": "Generation III",
                                "region": "Hoenn",
                                "pokemon_range": "252-386",
                                "games": ["Ruby", "Sapphire", "Emerald"],
                                "legendary": ["Kyogre", "Groudon", "Rayquaza", "Jirachi", "Deoxys"]
                            },
                            {
                                "id": 4,
                                "name": "Generation IV",
                                "region": "Sinnoh",
                                "pokemon_range": "387-493",
                                "games": ["Diamond", "Pearl", "Platinum"],
                                "legendary": ["Dialga", "Palkia", "Giratina", "Darkrai", "Arceus"]
                            }
                        ],
                        "total_pokemon": 1010,
                        "api_usage": "Use pokemon name or ID (1-1010) to get specific Pokemon data"
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "team_builder",
                    description: "Build a balanced Pokémon team",
                    content: `You are a Pokémon team building expert and competitive strategist. Create well-balanced, effective teams for various play styles and generations.

**Your Strategic Expertise:**
- Deep knowledge of all Pokémon generations and meta-games
- Type effectiveness and coverage analysis
- Role distribution and team synergy optimization
- Competitive formats and rule understanding
- Move set optimization and item selection

**Team Building Framework:**
1. **Role Distribution**: Offensive, defensive, support, utility
2. **Type Coverage**: Both offensive and defensive considerations
3. **Stat Balance**: Speed tiers, bulk distribution, damage output
4. **Synergy Analysis**: How team members work together
5. **Meta Adaptation**: Counter popular strategies and threats

**Core Team Roles:**
- **Physical Sweeper**: High attack, speed for physical damage
- **Special Sweeper**: High special attack for special damage
- **Tank/Wall**: High defensive stats for damage absorption
- **Support**: Healing, status, field control
- **Lead**: Setup, hazards, momentum control
- **Revenge Killer**: Cleanup and priority moves

**Strategic Considerations:**
- Generation-specific moves and abilities
- Format restrictions and banned elements
- Common threats and how to handle them
- Weather and terrain strategies
- Item distribution for maximum effectiveness

**Team Composition Output:**
- 6 Pokémon with roles and justifications
- Move sets with explanations
- Item recommendations
- Strategy overview and win conditions`,
                    arguments: [
                        {
                            name: "generation",
                            description: "Pokémon generation",
                            required: true,
                        },
                        {
                            name: "style",
                            description: "Battle style preference",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "nasa",
        name: "NASA API",
        description: "Space and astronomy data",
        icon: Globe,
        color: "bg-blue-800",
        tags: ["Educational", "API Key"],
        config: {
            name: "NASA API",
            description: "Access NASA space data and imagery.",
            apiConfig: {
                name: "NASA Open API",
                baseUrl: "https://api.nasa.gov",
                description: "NASA space and astronomy data",
                authentication: {
                    type: "apikey",
                    apiKey: "",
                    headerName: "api_key",
                    keyLocation: "query",
                },
                endpoints: [
                    {
                        id: "get_planetary_apod",
                        name: "get_planetary_apod",
                        method: "GET",
                        path: "/planetary/apod",
                        description: "Get astronomy picture of the day",
                        parameters: [
                            {
                                name: "date",
                                type: "string",
                                required: false,
                                description: "Date (YYYY-MM-DD)",
                            },
                            {
                                name: "hd",
                                type: "boolean",
                                required: false,
                                description: "HD image URL",
                            },
                        ],
                    },
                    {
                        id: "get_mars_photos_list",
                        name: "get_mars_photos_list",
                        method: "GET",
                        path: "/mars-photos/api/v1/rovers/curiosity/photos",
                        description: "Get Mars rover photos",
                        parameters: [
                            {
                                name: "sol",
                                type: "number",
                                required: true,
                                description: "Martian sol (day)",
                            },
                            {
                                name: "camera",
                                type: "string",
                                required: false,
                                description: "Rover camera name",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "nasa://rovers/info",
                    name: "Mars Rovers",
                    description: "Information about Mars rovers",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "active_rovers": [
                            {
                                "name": "Curiosity",
                                "launch_date": "2011-11-26",
                                "landing_date": "2012-08-06",
                                "status": "Active",
                                "mission_duration": "687 Earth days (planned), still active",
                                "landing_site": "Gale Crater",
                                "cameras": ["FHAZ", "RHAZ", "MAST", "CHEMCAM", "MAHLI", "MARDI"]
                            },
                            {
                                "name": "Perseverance",
                                "launch_date": "2020-07-30",
                                "landing_date": "2021-02-18",
                                "status": "Active",
                                "mission_duration": "At least one Mars year (687 Earth days)",
                                "landing_site": "Jezero Crater",
                                "cameras": ["EDL_RUCAM", "EDL_RDCAM", "EDL_DDCAM", "EDL_PUCAM1", "EDL_PUCAM2", "NAVCAM_LEFT", "NAVCAM_RIGHT", "MCZ_LEFT", "MCZ_RIGHT", "FRONT_HAZCAM_LEFT_A", "FRONT_HAZCAM_RIGHT_A", "REAR_HAZCAM_LEFT", "REAR_HAZCAM_RIGHT", "SUPERCAM_RMI"]
                            }
                        ],
                        "retired_rovers": [
                            {
                                "name": "Sojourner",
                                "mission_duration": "1997",
                                "status": "Mission Complete"
                            },
                            {
                                "name": "Spirit",
                                "mission_duration": "2004-2010",
                                "status": "Mission Complete"
                            },
                            {
                                "name": "Opportunity",
                                "mission_duration": "2004-2018",
                                "status": "Mission Complete"
                            }
                        ],
                        "api_notes": "Use rover name in lowercase for API calls"
                    }, null, 2),
                },
                {
                    uri: "nasa://cameras",
                    name: "Rover Cameras",
                    description: "Available Mars rover cameras",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        "curiosity_cameras": {
                            "FHAZ": "Front Hazard Avoidance Camera",
                            "RHAZ": "Rear Hazard Avoidance Camera",
                            "MAST": "Mast Camera",
                            "CHEMCAM": "Chemistry and Camera Complex",
                            "MAHLI": "Mars Hand Lens Imager",
                            "MARDI": "Mars Descent Imager"
                        },
                        "perseverance_cameras": {
                            "EDL_RUCAM": "Rover Up-Look Camera",
                            "EDL_RDCAM": "Rover Down-Look Camera",
                            "EDL_DDCAM": "Descent Stage Down-Look Camera",
                            "EDL_PUCAM1": "Parachute Up-Look Camera A",
                            "EDL_PUCAM2": "Parachute Up-Look Camera B",
                            "NAVCAM_LEFT": "Navigation Camera - Left",
                            "NAVCAM_RIGHT": "Navigation Camera - Right",
                            "MCZ_LEFT": "Mast Camera Zoom - Left",
                            "MCZ_RIGHT": "Mast Camera Zoom - Right",
                            "FRONT_HAZCAM_LEFT_A": "Front Hazard Avoidance Camera - Left",
                            "FRONT_HAZCAM_RIGHT_A": "Front Hazard Avoidance Camera - Right",
                            "REAR_HAZCAM_LEFT": "Rear Hazard Avoidance Camera - Left",
                            "REAR_HAZCAM_RIGHT": "Rear Hazard Avoidance Camera - Right",
                            "SUPERCAM_RMI": "SuperCam Remote Micro-Imager"
                        },
                        "usage_tips": [
                            "Camera names are case-sensitive",
                            "Not all cameras are available for all sols",
                            "Use camera parameter to filter photos",
                            "Check rover capabilities before requesting specific cameras"
                        ]
                    }, null, 2),
                },
            ],
            mcpPrompts: [
                {
                    name: "space_facts",
                    description: "Generate space facts from NASA data",
                    content: `You are a NASA space science educator and facts specialist. Transform NASA data and discoveries into engaging, accurate space facts for various audiences.

**Your Educational Mission:**
- Present complex space science in accessible ways
- Ensure scientific accuracy and credibility
- Adapt content complexity to audience level
- Connect facts to real NASA missions and discoveries
- Inspire curiosity about space exploration

**Fact Generation Framework:**
1. **Scientific Accuracy**: Verify all facts against NASA sources
2. **Audience Adaptation**: Adjust complexity and language
3. **Context Provision**: Explain significance and implications
4. **Visual Connections**: Link to NASA images and data when relevant
5. **Mission Integration**: Connect facts to current and past missions

**Complexity Levels:**
- **Elementary**: Simple language, basic concepts, wonder-focused
- **Middle School**: More detail, scientific terms with explanations
- **High School**: Scientific principles, mathematical concepts
- **Adult/General**: Full complexity with context and implications
- **Expert**: Technical details, research implications, cutting-edge science

**Topic Areas:**
- **Planets and Moons**: Surface features, composition, atmospheres
- **Space Missions**: Current and historical mission achievements
- **Astronomy**: Stars, galaxies, cosmic phenomena
- **Technology**: Spacecraft, instruments, engineering marvels
- **Earth Science**: Climate, weather, environmental monitoring

**Fact Presentation:**
- Clear, engaging statements
- Scientific context and significance
- Connection to ongoing research
- Sources and further reading suggestions`,
                    arguments: [
                        {
                            name: "topic",
                            description: "Space topic of interest",
                            required: true,
                        },
                        { name: "level", description: "Complexity level", required: false },
                    ],
                },
            ],
        },
    },
    {
        id: "openai",
        name: "OpenAI API",
        description: "AI models and completions",
        icon: Zap,
        color: "bg-green-600",
        tags: ["AI", "Bearer"],
        config: {
            name: "OpenAI API",
            description: "Access OpenAI models for AI-powered features.",
            apiConfig: {
                name: "OpenAI API",
                baseUrl: "https://api.openai.com/v1",
                description: "OpenAI API for AI models",
                authentication: { type: "bearer", token: "", keyLocation: "header" },
                endpoints: [
                    {
                        id: "post_chat_completions",
                        name: "post_chat_completions",
                        method: "POST",
                        path: "/chat/completions",
                        description: "Generate AI completions",
                        parameters: [
                            {
                                name: "model",
                                type: "string",
                                required: true,
                                description: "Model ID (e.g., gpt-4)",
                            },
                            {
                                name: "messages",
                                type: "object",
                                required: true,
                                description: "Array of message objects as JSON string",
                            },
                        ],
                    },
                    {
                        id: "get_models_list",
                        name: "get_models_list",
                        method: "GET",
                        path: "/models",
                        description: "List available models",
                        parameters: [],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "openai://models/capabilities",
                    name: "Model Capabilities",
                    description: "Detailed capabilities of different OpenAI models",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        models: {
                            "gpt-4-turbo": {
                                context_length: 128000,
                                training_data: "Up to April 2024",
                                capabilities: ["text_generation", "code_generation", "reasoning", "analysis"],
                                max_output_tokens: 4096,
                                multimodal: true,
                                function_calling: true,
                                json_mode: true
                            },
                            "gpt-3.5-turbo": {
                                context_length: 16385,
                                training_data: "Up to September 2021",
                                capabilities: ["text_generation", "code_generation", "conversation"],
                                max_output_tokens: 4096,
                                multimodal: false,
                                function_calling: true,
                                json_mode: true
                            },
                            "dall-e-3": {
                                type: "image_generation",
                                max_resolution: "1024x1024, 1024x1792, 1792x1024",
                                styles: ["vivid", "natural"],
                                quality: ["standard", "hd"]
                            },
                            "whisper-1": {
                                type: "speech_to_text",
                                supported_formats: ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"],
                                max_file_size: "25 MB",
                                languages: "99+ languages"
                            }
                        },
                        use_cases: {
                            "content_creation": ["gpt-4-turbo", "gpt-3.5-turbo"],
                            "code_generation": ["gpt-4-turbo", "gpt-3.5-turbo"],
                            "data_analysis": ["gpt-4-turbo"],
                            "image_generation": ["dall-e-3"],
                            "transcription": ["whisper-1"]
                        }
                    }, null, 2)
                },
                {
                    uri: "openai://usage/guidelines",
                    name: "Usage Guidelines",
                    description: "Best practices for using OpenAI API",
                    mimeType: "text/markdown",
                    content: `# OpenAI API Usage Guidelines

## Rate Limits
- **Tier 1**: 20 RPM, 40,000 TPM
- **Tier 2**: 100 RPM, 100,000 TPM  
- **Tier 3**: 200 RPM, 200,000 TPM
- **Tier 4**: 500 RPM, 300,000 TPM
- **Tier 5**: 10,000 RPM, 2,000,000 TPM

## Best Practices

### Prompt Engineering
- Be specific and clear in your instructions
- Use examples to demonstrate desired output format
- Break complex tasks into smaller steps
- Use system messages to set context and behavior

### Error Handling
- Implement exponential backoff for rate limit errors
- Handle network timeouts gracefully
- Check response status codes
- Validate API responses before processing

### Cost Optimization
- Choose the right model for your task
- Use prompt compression techniques
- Implement caching for repeated requests
- Monitor token usage regularly

### Security
- Never expose API keys in client-side code
- Use environment variables for credentials
- Implement proper input validation
- Monitor usage for unusual patterns

## Common Integration Patterns

### Streaming Responses
\`\`\`javascript
const stream = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: messages,
  stream: true
});
\`\`\`

### Function Calling
\`\`\`javascript
const response = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: messages,
  functions: functions,
  function_call: "auto"
});
\`\`\`
`
                },
                {
                    uri: "openai://pricing/calculator",
                    name: "Pricing Calculator",
                    description: "Token usage and pricing information",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        pricing: {
                            "gpt-4-turbo": {
                                input_cost_per_1k_tokens: 0.01,
                                output_cost_per_1k_tokens: 0.03,
                                currency: "USD"
                            },
                            "gpt-3.5-turbo": {
                                input_cost_per_1k_tokens: 0.0015,
                                output_cost_per_1k_tokens: 0.002,
                                currency: "USD"
                            },
                            "dall-e-3": {
                                standard_1024x1024: 0.040,
                                standard_1024x1792: 0.080,
                                hd_1024x1024: 0.080,
                                hd_1024x1792: 0.120,
                                currency: "USD"
                            },
                            "whisper-1": {
                                cost_per_minute: 0.006,
                                currency: "USD"
                            }
                        },
                        token_estimation: {
                            english_words_to_tokens: 1.3,
                            characters_to_tokens: 4,
                            code_multiplier: 1.2
                        },
                        calculator: {
                            example_costs: {
                                "1000_word_summary": {
                                    model: "gpt-3.5-turbo",
                                    estimated_input_tokens: 1300,
                                    estimated_output_tokens: 200,
                                    total_cost: 0.00235
                                },
                                "code_review": {
                                    model: "gpt-4-turbo",
                                    estimated_input_tokens: 2000,
                                    estimated_output_tokens: 500,
                                    total_cost: 0.035
                                }
                            }
                        }
                    }, null, 2)
                },
            ],
            mcpPrompts: [
                {
                    name: "model_selector",
                    description: "Help choose the right OpenAI model for a specific task",
                    content: `You are an OpenAI model selection expert. Help users choose the most appropriate and cost-effective model for their specific use case.

**Your Expertise:**
- Deep knowledge of all OpenAI model capabilities and limitations
- Understanding of pricing and performance trade-offs
- Experience with real-world application requirements
- Optimization strategies for different use cases

**Model Selection Framework:**
1. **Task Analysis**: Understand the specific requirements
2. **Capability Mapping**: Match task needs to model strengths
3. **Budget Optimization**: Balance cost with performance needs
4. **Scale Considerations**: Factor in volume and frequency
5. **Quality Requirements**: Assess accuracy and reliability needs

**Key Considerations:**
- **GPT-4 Turbo**: Best for complex reasoning, analysis, coding
- **GPT-3.5 Turbo**: Cost-effective for simpler tasks, high volume
- **DALL-E 3**: Image generation and creative visuals
- **Whisper**: Speech-to-text transcription
- **Embeddings**: Semantic search and similarity

**Recommendation Structure:**
- Primary model recommendation with justification
- Alternative options with trade-offs
- Cost estimation and optimization tips
- Implementation considerations and best practices`,
                    arguments: [
                        {
                            name: "task",
                            description: "Description of the task",
                            required: true,
                        },
                        {
                            name: "budget",
                            description: "Budget considerations (low/medium/high)",
                            required: false,
                        },
                    ],
                },
                {
                    name: "prompt_optimizer",
                    description: "Optimize prompts for better AI responses",
                    content: `You are a prompt engineering expert. Transform user prompts into highly effective, optimized versions that produce better AI responses.

**Your Skills:**
- Advanced prompt engineering techniques
- Understanding of AI model behavior and biases
- Experience with various prompt patterns and strategies
- Knowledge of effective instruction design

**Optimization Techniques:**
1. **Clarity Enhancement**: Make instructions crystal clear
2. **Context Addition**: Provide relevant background information
3. **Format Specification**: Define desired output structure
4. **Example Integration**: Include few-shot examples when helpful
5. **Constraint Definition**: Set clear boundaries and requirements

**Prompt Patterns:**
- **Chain of Thought**: Step-by-step reasoning
- **Role Playing**: Assign specific personas or expertise
- **Template Filling**: Structured input/output formats
- **Iterative Refinement**: Multi-step improvement process
- **Constraint Optimization**: Balanced requirements

**Optimization Process:**
- Analyze the original prompt for weaknesses
- Identify missing context or unclear instructions
- Apply appropriate prompt engineering techniques
- Test and refine for optimal results
- Provide rationale for each optimization choice`,
                    arguments: [
                        {
                            name: "prompt",
                            description: "Original prompt to optimize",
                            required: true,
                        },
                        { name: "goal", description: "Desired outcome", required: true },
                    ],
                },
                {
                    name: "response_analyzer",
                    description: "Analyze and improve AI-generated responses",
                    content: `You are an AI response quality analyst. Evaluate AI-generated content and provide detailed feedback for improvement.

**Your Assessment Areas:**
- Accuracy and factual correctness
- Relevance to the original query
- Clarity and readability
- Completeness and thoroughness
- Tone and style appropriateness

**Analysis Framework:**
1. **Content Quality**: Accuracy, depth, relevance
2. **Structure Analysis**: Organization, flow, coherence
3. **Style Assessment**: Tone, voice, audience appropriateness
4. **Completeness Check**: Missing information or context
5. **Improvement Opportunities**: Specific enhancement suggestions

**Evaluation Criteria:**
- **Accuracy**: Factual correctness and reliability
- **Relevance**: Direct connection to user needs
- **Clarity**: Easy to understand and follow
- **Completeness**: Comprehensive coverage of topic
- **Actionability**: Practical value and applicability

**Feedback Structure:**
- Overall quality score and summary
- Specific strengths and weaknesses
- Detailed improvement recommendations
- Suggested revisions or alternatives
- Best practices for similar future responses`,
                    arguments: [
                        {
                            name: "response",
                            description: "AI response to analyze",
                            required: true,
                        },
                        {
                            name: "criteria",
                            description: "Evaluation criteria",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "stripe",
        name: "Stripe API",
        description: "Payment processing and subscriptions",
        icon: Zap,
        color: "bg-emerald-500",
        tags: ["Payments", "Bearer"],
        config: {
            name: "Stripe API",
            description: "Process payments and manage subscriptions with Stripe.",
            apiConfig: {
                name: "Stripe API v1",
                baseUrl: "https://api.stripe.com/v1",
                description: "Stripe payment processing API",
                authentication: { type: "bearer", token: "", keyLocation: "header" },
                endpoints: [
                    {
                        id: "post_payment_intents",
                        name: "post_payment_intents",
                        method: "POST",
                        path: "/payment_intents",
                        description: "Create a PaymentIntent for processing payments",
                        parameters: [
                            {
                                name: "amount",
                                type: "number",
                                required: true,
                                description: "Amount in smallest currency unit",
                            },
                            {
                                name: "currency",
                                type: "string",
                                required: true,
                                description: "Three-letter ISO currency code",
                            },
                        ],
                    },
                    {
                        id: "get_customers_list",
                        name: "get_customers_list",
                        method: "GET",
                        path: "/customers",
                        description: "List all customers",
                        parameters: [
                            {
                                name: "limit",
                                type: "number",
                                required: false,
                                description: "Number of customers to return",
                            },
                            {
                                name: "email",
                                type: "string",
                                required: false,
                                description: "Filter by customer email",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "stripe://payment/methods",
                    name: "Payment Methods",
                    description: "Available payment methods by region",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        payment_methods: {
                            united_states: {
                                cards: ["visa", "mastercard", "amex", "discover", "diners", "jcb"],
                                digital_wallets: ["apple_pay", "google_pay", "samsung_pay"],
                                bank_payments: ["ach_debit", "ach_credit"],
                                buy_now_pay_later: ["affirm", "afterpay_clearpay", "klarna"]
                            },
                            europe: {
                                cards: ["visa", "mastercard", "amex"],
                                digital_wallets: ["apple_pay", "google_pay"],
                                bank_payments: ["sepa_debit", "sofort", "giropay", "ideal", "bancontact"],
                                buy_now_pay_later: ["klarna"]
                            },
                            asia_pacific: {
                                cards: ["visa", "mastercard", "amex", "jcb"],
                                digital_wallets: ["apple_pay", "google_pay", "alipay", "wechat_pay"],
                                bank_payments: ["fpx", "grabpay"],
                                local_methods: ["paynow"]
                            }
                        },
                        processing_fees: {
                            cards: {
                                domestic: "2.9% + 30¢",
                                international: "3.4% + 30¢"
                            },
                            digital_wallets: {
                                domestic: "2.9% + 30¢",
                                international: "3.4% + 30¢"
                            },
                            ach: {
                                domestic: "0.8% (max $5.00)"
                            }
                        },
                        setup_requirements: {
                            business_verification: true,
                            bank_account: true,
                            tax_id: true,
                            identity_verification: true
                        },
                        integration_types: {
                            checkout: "Pre-built payment form",
                            elements: "Custom payment form components",
                            payment_links: "No-code payment links",
                            invoicing: "Send professional invoices"
                        }
                    }, null, 2)
                },
            ],
            mcpPrompts: [
                {
                    name: "payment_flow",
                    description: "Generate payment flow recommendations",
                    arguments: [
                        { name: "amount", description: "Payment amount", required: true },
                        { name: "currency", description: "Currency code", required: true },
                    ],
                },
            ],
        },
    },
    {
        id: "sendgrid",
        name: "SendGrid API",
        description: "Email service integration",
        icon: Zap,
        color: "bg-blue-600",
        tags: ["Email", "Bearer"],
        config: {
            name: "SendGrid API",
            description: "Send transactional and marketing emails.",
            apiConfig: {
                name: "SendGrid API v3",
                baseUrl: "https://api.sendgrid.com/v3",
                description: "SendGrid email service API",
                authentication: { type: "bearer", token: "", keyLocation: "header" },
                endpoints: [
                    {
                        id: "post_mail_send",
                        name: "post_mail_send",
                        method: "POST",
                        path: "/mail/send",
                        description: "Send a transactional email",
                        parameters: [
                            {
                                name: "to",
                                type: "string",
                                required: true,
                                description: "Recipient email address",
                            },
                            {
                                name: "subject",
                                type: "string",
                                required: true,
                                description: "Email subject",
                            },
                            {
                                name: "content",
                                type: "string",
                                required: true,
                                description: "Email content",
                            },
                        ],
                    },
                    {
                        id: "get_stats_read",
                        name: "get_stats_read",
                        method: "GET",
                        path: "/stats",
                        description: "Get email statistics",
                        parameters: [
                            {
                                name: "start_date",
                                type: "string",
                                required: true,
                                description: "Start date in YYYY-MM-DD format",
                            },
                            {
                                name: "end_date",
                                type: "string",
                                required: false,
                                description: "End date in YYYY-MM-DD format",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "sendgrid://templates",
                    name: "Email Templates",
                    description: "Available email templates",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        templates: {
                            transactional: {
                                welcome_email: {
                                    id: "d-1234567890123456",
                                    name: "Welcome Email",
                                    subject: "Welcome to {{company_name}}!",
                                    variables: ["user_name", "company_name", "verification_link"],
                                    description: "Welcome new users with account verification"
                                },
                                password_reset: {
                                    id: "d-2345678901234567",
                                    name: "Password Reset",
                                    subject: "Reset your password",
                                    variables: ["user_name", "reset_link", "expiry_time"],
                                    description: "Password reset with secure link"
                                },
                                order_confirmation: {
                                    id: "d-3456789012345678",
                                    name: "Order Confirmation",
                                    subject: "Order confirmed #{{order_number}}",
                                    variables: ["customer_name", "order_number", "items", "total"],
                                    description: "Confirm customer orders with details"
                                }
                            },
                            marketing: {
                                newsletter: {
                                    id: "d-4567890123456789",
                                    name: "Newsletter",
                                    subject: "{{month}} Newsletter - {{company_name}}",
                                    variables: ["subscriber_name", "month", "company_name", "articles"],
                                    description: "Monthly newsletter template"
                                },
                                product_announcement: {
                                    id: "d-5678901234567890",
                                    name: "Product Announcement",
                                    subject: "Introducing {{product_name}}",
                                    variables: ["customer_name", "product_name", "features", "cta_link"],
                                    description: "Announce new products or features"
                                }
                            }
                        },
                        design_guidelines: {
                            responsive: true,
                            max_width: "600px",
                            supported_clients: ["gmail", "outlook", "apple_mail", "yahoo"],
                            best_practices: [
                                "Use web-safe fonts",
                                "Optimize images for email",
                                "Include alt text for images",
                                "Test across multiple clients",
                                "Keep file size under 100KB"
                            ]
                        },
                        personalization: {
                            dynamic_content: true,
                            conditional_blocks: true,
                            handlebars_syntax: true,
                            example: "{{#if premium_user}}Premium content here{{/if}}"
                        },
                        deliverability: {
                            authentication: ["SPF", "DKIM", "DMARC"],
                            reputation_monitoring: true,
                            bounce_handling: true,
                            unsubscribe_management: true
                        }
                    }, null, 2)
                },
            ],
            mcpPrompts: [
                {
                    name: "email_composer",
                    description: "Generate professional email content",
                    content: `You are a professional email communication specialist. Craft effective, well-structured emails that achieve their intended purpose while maintaining appropriate tone and professionalism.

**Your Communication Expertise:**
- Professional email writing and formatting
- Tone adaptation for different contexts and audiences
- Clear subject line creation and message structure
- Call-to-action optimization and response facilitation
- Email etiquette and best practices

**Email Composition Framework:**
1. **Purpose Clarification**: Define clear objective and desired outcome
2. **Audience Analysis**: Consider recipient's role, relationship, preferences
3. **Structure Design**: Subject, greeting, body, closing, signature
4. **Tone Calibration**: Match formality to context and relationship
5. **Action Orientation**: Clear next steps and response expectations

**Email Components:**
- **Subject Line**: Clear, specific, action-oriented
- **Opening**: Appropriate greeting and context setting
- **Body**: Structured, scannable, purposeful content
- **Call-to-Action**: Specific requests with clear deadlines
- **Closing**: Professional sign-off with contact information

**Tone Guidelines:**
- **Formal**: Business correspondence, official communications
- **Professional**: Standard workplace communication
- **Casual**: Team members, informal updates
- **Diplomatic**: Sensitive topics, conflict resolution
- **Urgent**: Time-sensitive matters requiring quick response

**Best Practices:**
- Keep emails concise and scannable
- Use bullet points for multiple items
- Include clear subject lines
- Proofread for clarity and errors
- Consider email timing and recipient availability`,
                    arguments: [
                        { name: "purpose", description: "Email purpose", required: true },
                        {
                            name: "tone",
                            description: "Email tone (formal/casual)",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "github",
        name: "GitHub API",
        description: "Repository management and issues",
        icon: Zap,
        color: "bg-gray-800",
        tags: ["Repos", "Bearer"],
        config: {
            name: "GitHub API",
            description:
                "Access repositories, issues, and pull requests from GitHub.",
            apiConfig: {
                name: "GitHub REST API",
                baseUrl: "https://api.github.com",
                description: "GitHub REST API for repository management",
                authentication: { type: "bearer", token: "", keyLocation: "header" },
                endpoints: [
                    {
                        id: "get_user_repos",
                        name: "get_user_repos",
                        method: "GET",
                        path: "/user/repos",
                        description: "List repositories for the authenticated user",
                        parameters: [
                            {
                                name: "sort",
                                type: "string",
                                required: false,
                                description: "Sort by created, updated, pushed, full_name",
                            },
                            {
                                name: "per_page",
                                type: "number",
                                required: false,
                                description: "Results per page (max 100)",
                            },
                        ],
                    },
                    {
                        id: "get_repos_issues",
                        name: "get_repos_issues",
                        method: "GET",
                        path: "/repos/{owner}/{repo}/issues",
                        description: "Get issues for a repository",
                        parameters: [
                            {
                                name: "owner",
                                type: "string",
                                required: true,
                                description: "Repository owner",
                            },
                            {
                                name: "repo",
                                type: "string",
                                required: true,
                                description: "Repository name",
                            },
                        ],
                    },
                ],
            },
            mcpResources: [
                {
                    uri: "github://profile",
                    name: "User Profile",
                    description: "GitHub user profile information",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        profile_fields: {
                            basic: ["login", "id", "avatar_url", "name", "company", "blog", "location", "email", "bio"],
                            statistics: ["public_repos", "public_gists", "followers", "following"],
                            timestamps: ["created_at", "updated_at"],
                            flags: ["hireable", "site_admin", "type"]
                        },
                        example_profile: {
                            login: "octocat",
                            id: 1,
                            avatar_url: "https://github.com/images/error/octocat_happy.gif",
                            name: "The Octocat",
                            company: "@github",
                            blog: "https://github.blog",
                            location: "San Francisco",
                            email: "octocat@github.com",
                            bio: "There once was...",
                            public_repos: 8,
                            public_gists: 8,
                            followers: 5000,
                            following: 9,
                            created_at: "2008-01-14T04:33:35Z",
                            updated_at: "2008-01-14T04:33:35Z",
                            hireable: false,
                            type: "User"
                        },
                        privacy_settings: {
                            private_email: "Can be hidden from public view",
                            private_profile: "Enterprise feature for organizations",
                            contribution_graph: "Can be made private"
                        }
                    }, null, 2)
                },
                {
                    uri: "github://organizations",
                    name: "User Organizations",
                    description: "Organizations the user belongs to",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        organization_types: {
                            free: {
                                features: ["unlimited_public_repos", "limited_private_repos", "community_support"],
                                limits: {
                                    private_repos: 3000,
                                    collaborators: "unlimited",
                                    actions_minutes: 2000
                                }
                            },
                            team: {
                                features: ["unlimited_repos", "advanced_tools", "team_management"],
                                limits: {
                                    private_repos: "unlimited",
                                    collaborators: "unlimited",
                                    actions_minutes: 3000
                                }
                            },
                            enterprise: {
                                features: ["saml_sso", "advanced_security", "enterprise_support"],
                                limits: {
                                    private_repos: "unlimited",
                                    collaborators: "unlimited",
                                    actions_minutes: 50000
                                }
                            }
                        },
                        membership_roles: {
                            member: "Basic access to organization resources",
                            moderator: "Can moderate discussions and comments",
                            admin: "Full administrative access to organization",
                            owner: "Complete control over organization"
                        },
                        organization_features: [
                            "team_management",
                            "repository_permissions",
                            "security_policies",
                            "audit_logs",
                            "dependency_insights",
                            "code_scanning",
                            "secret_scanning"
                        ]
                    }, null, 2)
                },
                {
                    uri: "github://limits",
                    name: "Rate Limits",
                    description: "Current API rate limit status",
                    mimeType: "application/json",
                    content: JSON.stringify({
                        rate_limits: {
                            unauthenticated: {
                                requests_per_hour: 60,
                                search_requests_per_minute: 10
                            },
                            authenticated: {
                                requests_per_hour: 5000,
                                search_requests_per_minute: 30
                            },
                            github_app: {
                                requests_per_hour: 15000,
                                search_requests_per_minute: 30
                            },
                            oauth_app: {
                                requests_per_hour: 5000,
                                search_requests_per_minute: 30
                            }
                        },
                        rate_limit_headers: {
                            "X-RateLimit-Limit": "Maximum requests per hour",
                            "X-RateLimit-Remaining": "Remaining requests in current window",
                            "X-RateLimit-Reset": "Unix timestamp when limit resets",
                            "X-RateLimit-Used": "Requests used in current window"
                        },
                        best_practices: [
                            "Use conditional requests with ETags",
                            "Cache responses when possible",
                            "Use GraphQL for complex queries",
                            "Implement exponential backoff for 429 responses",
                            "Monitor rate limit headers"
                        ],
                        secondary_limits: {
                            abuse_detection: "Temporary blocks for suspicious activity",
                            concurrent_requests: "Max 100 concurrent requests",
                            content_creation: "Special limits for creating content"
                        }
                    }, null, 2)
                },
            ],
            mcpPrompts: [
                {
                    name: "repo_analysis",
                    description: "Analyze a GitHub repository structure and activity",
                    content: `You are a GitHub repository analyst and code reviewer. Provide comprehensive analysis of repository structure, activity, and development practices.

**Your Analysis Capabilities:**
- Repository structure and organization assessment
- Code quality and documentation evaluation
- Development activity and contributor analysis
- Issue and pull request pattern recognition
- Technology stack and dependency analysis

**Repository Analysis Framework:**
1. **Structure Assessment**: Organization, file structure, documentation
2. **Activity Analysis**: Commit patterns, contributor engagement, release cycles
3. **Code Quality**: Complexity, testing, best practices adherence
4. **Community Health**: Issues, discussions, contributor guidelines
5. **Technology Evaluation**: Languages, frameworks, dependencies

**Key Analysis Areas:**
- **Codebase Health**: Test coverage, code complexity, documentation quality
- **Development Practices**: Branching strategy, CI/CD, review processes
- **Community Engagement**: Issue resolution, contributor activity
- **Maintenance Status**: Recent activity, dependency updates, security
- **Project Maturity**: Version history, stability, adoption metrics

**Insights to Provide:**
- Repository strengths and areas for improvement
- Development workflow recommendations
- Code quality and maintainability assessment
- Community engagement and growth opportunities
- Technology and architecture considerations

**Output Structure:**
- Executive summary with key findings
- Detailed analysis by category
- Recommendations for improvement
- Metrics and supporting data`,
                    arguments: [
                        { name: "owner", description: "Repository owner", required: true },
                        { name: "repo", description: "Repository name", required: true },
                    ],
                },
                {
                    name: "issue_summary",
                    description: "Summarize issues and pull requests for a repository",
                    content: `You are a GitHub project management analyst specializing in issue and pull request analysis. Provide insights into project health and development patterns.

**Your Analytical Focus:**
- Issue lifecycle and resolution patterns
- Pull request quality and review processes
- Project momentum and contributor activity
- Bug tracking and feature development trends
- Community engagement and support patterns

**Analysis Framework:**
1. **Issue Categorization**: Bug reports, feature requests, documentation, questions
2. **Lifecycle Analysis**: Time to resolution, response rates, backlog health
3. **Contributor Patterns**: Active contributors, issue ownership, collaboration
4. **Quality Assessment**: Issue detail quality, reproduction steps, labels
5. **Trend Identification**: Common problems, feature request patterns

**Key Metrics:**
- **Resolution Time**: Average time from open to close
- **Response Rate**: How quickly issues receive first response
- **Backlog Health**: Age distribution of open issues
- **Contributor Activity**: Who's filing and resolving issues
- **Issue Quality**: Detail level, reproducibility, actionability

**Summary Components:**
- Current issue and PR status overview
- Key trends and patterns identified
- Active contributor and maintainer analysis
- Recommendations for project improvement
- Priority issues requiring attention

**Actionable Insights:**
- Process improvement opportunities
- Community engagement strategies
- Backlog management recommendations
- Contributor recognition and support needs`,
                    arguments: [
                        { name: "owner", description: "Repository owner", required: true },
                        { name: "repo", description: "Repository name", required: true },
                        {
                            name: "state",
                            description: "Issue state (open/closed/all)",
                            required: false,
                        },
                    ],
                },
            ],
        },
    },
];
