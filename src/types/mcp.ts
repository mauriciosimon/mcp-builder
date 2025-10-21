export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, {
      type: string;
      description?: string;
      required?: boolean;
    }>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
  }[];
}

export interface MCPProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}
