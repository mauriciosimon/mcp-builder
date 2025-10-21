# MCP Builder

A modern dashboard application for building and managing Model Context Protocol (MCP) servers.

## Features

- **Dashboard View**: See all your MCP projects at a glance with search functionality
- **Project Creation**: Create new MCP projects with templates
- **Detailed Project View**: Explore MCP primitives in a clear, didactic way:
  - **Tools**: View callable functions with their parameters and schemas
  - **Resources**: Explore data sources and contextual information
  - **Prompts**: Examine prompt templates with their arguments

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── NewProject.tsx   # Project creation form
│   ├── ProjectDetail.tsx # Detailed project view
│   └── primitives/      # MCP primitive visualizations
│       ├── ToolCard.tsx
│       ├── ResourceCard.tsx
│       └── PromptCard.tsx
├── types/              # TypeScript type definitions
│   └── mcp.ts         # MCP-related types
├── data/              # Mock data and state
│   └── mockData.ts    # Sample MCP projects
├── App.tsx            # Root application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## MCP Primitives

### Tools
Tools are functions that can be called to perform specific actions. Each tool defines:
- Name and description
- Input schema with parameters
- Required vs optional parameters

### Resources
Resources are data sources that provide contextual information:
- URI-based identification
- MIME type specification
- Description and metadata

### Prompts
Prompts are templates that guide interactions:
- Template name and description
- Optional arguments
- Required vs optional arguments

## License

MIT
