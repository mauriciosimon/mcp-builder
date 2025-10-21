import { MCPProject } from '../types/mcp';

export const mockProjects: MCPProject[] = [
  {
    id: '1',
    name: 'Weather MCP',
    description: 'A Model Context Protocol server for fetching weather data',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    tools: [
      {
        name: 'get_current_weather',
        description: 'Get the current weather in a given location',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA',
              required: true,
            },
            unit: {
              type: 'string',
              description: 'Temperature unit (celsius or fahrenheit)',
              required: false,
            },
          },
          required: ['location'],
        },
      },
      {
        name: 'get_forecast',
        description: 'Get weather forecast for the next N days',
        inputSchema: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state',
              required: true,
            },
            days: {
              type: 'number',
              description: 'Number of days to forecast (1-7)',
              required: true,
            },
          },
          required: ['location', 'days'],
        },
      },
    ],
    resources: [
      {
        uri: 'weather://current',
        name: 'Current Weather Data',
        description: 'Real-time weather information',
        mimeType: 'application/json',
      },
      {
        uri: 'weather://alerts',
        name: 'Weather Alerts',
        description: 'Active weather alerts and warnings',
        mimeType: 'application/json',
      },
    ],
    prompts: [
      {
        name: 'weather_summary',
        description: 'Generate a natural language weather summary',
        arguments: [
          {
            name: 'location',
            description: 'Location to summarize weather for',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Database MCP',
    description: 'MCP server for database operations and queries',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T14:20:00Z',
    tools: [
      {
        name: 'execute_query',
        description: 'Execute a SQL query on the database',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute',
              required: true,
            },
            database: {
              type: 'string',
              description: 'Target database name',
              required: false,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {
            database: {
              type: 'string',
              description: 'Database name',
              required: false,
            },
          },
        },
      },
      {
        name: 'describe_table',
        description: 'Get schema information for a table',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Table name',
              required: true,
            },
          },
          required: ['table'],
        },
      },
    ],
    resources: [
      {
        uri: 'db://schema',
        name: 'Database Schema',
        description: 'Complete database schema information',
        mimeType: 'application/json',
      },
      {
        uri: 'db://connections',
        name: 'Active Connections',
        description: 'List of active database connections',
        mimeType: 'application/json',
      },
    ],
    prompts: [
      {
        name: 'generate_query',
        description: 'Generate SQL query from natural language',
        arguments: [
          {
            name: 'request',
            description: 'Natural language query request',
            required: true,
          },
          {
            name: 'table',
            description: 'Target table name',
            required: false,
          },
        ],
      },
      {
        name: 'explain_query',
        description: 'Explain what a SQL query does in plain language',
        arguments: [
          {
            name: 'query',
            description: 'SQL query to explain',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'File System MCP',
    description: 'MCP for file system operations and management',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    tools: [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to read',
              required: true,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to write to',
              required: true,
            },
            content: {
              type: 'string',
              description: 'Content to write',
              required: true,
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'list_directory',
        description: 'List contents of a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path',
              required: true,
            },
          },
          required: ['path'],
        },
      },
    ],
    resources: [
      {
        uri: 'file://workspace',
        name: 'Workspace Files',
        description: 'Files in the current workspace',
        mimeType: 'application/json',
      },
    ],
    prompts: [
      {
        name: 'file_summary',
        description: 'Generate a summary of file contents',
        arguments: [
          {
            name: 'path',
            description: 'File path to summarize',
            required: true,
          },
        ],
      },
    ],
  },
];
