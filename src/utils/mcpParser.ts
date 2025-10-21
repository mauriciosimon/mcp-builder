import { MCPProject, MCPTool, MCPResource, MCPPrompt } from '../types/mcp';

export async function fetchGitHubRepo(repoUrl: string): Promise<MCPProject> {
  // Parse GitHub URL to get owner and repo
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL. Please use format: https://github.com/owner/repo');
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, '');

  try {
    // Fetch repository info
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`);
    if (!repoResponse.ok) {
      throw new Error('Repository not found or not accessible');
    }
    const repoData = await repoResponse.json();

    // Get the default branch from the repo
    const defaultBranch = repoData.default_branch || 'main';
    const branchesToTry = [defaultBranch, 'main', 'master'];

    // Try to fetch common MCP server file locations (TypeScript/JavaScript and Python)
    const possiblePaths = [
      // TypeScript/JavaScript
      'src/index.ts',
      'src/index.js',
      'src/mcp-server-odoo/index.ts',
      'src/mcp-server-odoo/index.js',
      'index.ts',
      'index.js',
      'src/server.ts',
      'src/server.js',
      'server.ts',
      'server.js',
      'dist/index.js',
      'build/index.js',
      // Python
      'src/server.py',
      'src/__main__.py',
      'src/main.py',
      'server.py',
      'main.py',
      '__main__.py',
      'app.py',
      'src/app.py',
    ];

    let serverCode = '';
    let foundPath = '';

    // Try each branch and path combination
    for (const branch of branchesToTry) {
      for (const path of possiblePaths) {
        try {
          const fileResponse = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${path}`
          );
          if (fileResponse.ok) {
            serverCode = await fileResponse.text();
            foundPath = path;
            break;
          }
        } catch {
          // Try next path
          continue;
        }
      }
      if (serverCode) break;
    }

    if (!serverCode) {
      throw new Error(`Could not find MCP server code in repository. Tried branches: ${branchesToTry.join(', ')}. Make sure the repository contains an MCP server file.`);
    }

    // Detect language based on file extension
    const language = foundPath.endsWith('.py') ? 'python' : 'typescript';

    // Parse the code to extract MCP primitives
    const project = parseMCPCode(serverCode, repoData.name, repoData.description || '', language);

    return {
      ...project,
      id: `imported-${Date.now()}`,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at || repoData.pushed_at,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch or parse MCP repository');
  }
}

function parseMCPCode(code: string, name: string, description: string, language: 'typescript' | 'python'): Omit<MCPProject, 'id' | 'createdAt' | 'updatedAt'> {
  let tools: MCPTool[];
  let resources: MCPResource[];
  let prompts: MCPPrompt[];

  if (language === 'python') {
    tools = extractToolsPython(code);
    resources = extractResourcesPython(code);
    prompts = extractPromptsPython(code);
  } else {
    tools = extractTools(code);
    resources = extractResources(code);
    prompts = extractPrompts(code);
  }

  return {
    name: name || 'Imported MCP',
    description: description || 'Imported from GitHub',
    tools,
    resources,
    prompts,
  };
}

function extractTools(code: string): MCPTool[] {
  const tools: MCPTool[] = [];

  // Look for ListToolsRequestSchema handler
  const listToolsMatch = code.match(/setRequestHandler\(ListToolsRequestSchema,[\s\S]*?tools:\s*\[([\s\S]*?)\]\s*[,}]/);

  if (listToolsMatch) {
    const toolsArrayContent = listToolsMatch[1];

    // Extract individual tool objects
    const toolMatches = toolsArrayContent.matchAll(/\{[\s\S]*?name:\s*['"`]([^'"`]+)['"`][\s\S]*?description:\s*['"`]([^'"`]+)['"`][\s\S]*?inputSchema:\s*(\{[\s\S]*?\})\s*[,}]/g);

    for (const match of toolMatches) {
      try {
        const [, name, description, schemaStr] = match;

        // Try to parse the input schema
        let inputSchema;
        try {
          // Clean up the schema string and try to parse it
          const cleanSchema = schemaStr
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Add quotes to keys
            .replace(/'/g, '"'); // Replace single quotes with double quotes

          inputSchema = JSON.parse(cleanSchema);
        } catch {
          // If parsing fails, use a basic schema
          inputSchema = {
            type: 'object',
            properties: {},
          };
        }

        tools.push({
          name: name.trim(),
          description: description.trim(),
          inputSchema,
        });
      } catch (error) {
        console.warn('Failed to parse tool:', error);
      }
    }
  }

  // If no tools found with the above method, try to find tool names from CallToolRequestSchema
  if (tools.length === 0) {
    const callToolMatch = code.match(/setRequestHandler\(CallToolRequestSchema[\s\S]*?case\s+['"`]([^'"`]+)['"`]/g);
    if (callToolMatch) {
      callToolMatch.forEach(match => {
        const nameMatch = match.match(/case\s+['"`]([^'"`]+)['"`]/);
        if (nameMatch) {
          tools.push({
            name: nameMatch[1],
            description: `Tool: ${nameMatch[1]}`,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          });
        }
      });
    }
  }

  return tools;
}

function extractResources(code: string): MCPResource[] {
  const resources: MCPResource[] = [];

  // Look for ListResourcesRequestSchema handler
  const listResourcesMatch = code.match(/setRequestHandler\(ListResourcesRequestSchema,[\s\S]*?resources:\s*\[([\s\S]*?)\]\s*[,}]/);

  if (listResourcesMatch) {
    const resourcesArrayContent = listResourcesMatch[1];

    // Extract individual resource objects
    const resourceMatches = resourcesArrayContent.matchAll(/\{[\s\S]*?uri:\s*['"`]([^'"`]+)['"`][\s\S]*?name:\s*['"`]([^'"`]+)['"`][\s\S]*?description:\s*['"`]([^'"`]+)['"`][\s\S]*?(?:mimeType:\s*['"`]([^'"`]+)['"`])?[\s\S]*?[,}]/g);

    for (const match of resourceMatches) {
      const [, uri, name, description, mimeType] = match;
      resources.push({
        uri: uri.trim(),
        name: name.trim(),
        description: description.trim(),
        mimeType: mimeType?.trim() || 'text/plain',
      });
    }
  }

  return resources;
}

function extractPrompts(code: string): MCPPrompt[] {
  const prompts: MCPPrompt[] = [];

  // Look for ListPromptsRequestSchema handler
  const listPromptsMatch = code.match(/setRequestHandler\(ListPromptsRequestSchema,[\s\S]*?prompts:\s*\[([\s\S]*?)\]\s*[,}]/);

  if (listPromptsMatch) {
    const promptsArrayContent = listPromptsMatch[1];

    // Extract individual prompt objects
    const promptMatches = promptsArrayContent.matchAll(/\{[\s\S]*?name:\s*['"`]([^'"`]+)['"`][\s\S]*?description:\s*['"`]([^'"`]+)['"`][\s\S]*?(?:arguments:\s*\[([\s\S]*?)\])?[\s\S]*?[,}]/g);

    for (const match of promptMatches) {
      const [, name, description, argsStr] = match;

      const promptArgs: { name: string; description: string; required?: boolean }[] = [];

      if (argsStr) {
        const argMatches = argsStr.matchAll(/\{[\s\S]*?name:\s*['"`]([^'"`]+)['"`][\s\S]*?description:\s*['"`]([^'"`]+)['"`][\s\S]*?(?:required:\s*(true|false))?[\s\S]*?\}/g);

        for (const argMatch of argMatches) {
          const [, argName, argDesc, required] = argMatch;
          promptArgs.push({
            name: argName.trim(),
            description: argDesc.trim(),
            required: required === 'true',
          });
        }
      }

      prompts.push({
        name: name.trim(),
        description: description.trim(),
        arguments: promptArgs.length > 0 ? promptArgs : undefined,
      });
    }
  }

  return prompts;
}

// Python-specific extraction functions

function extractToolsPython(code: string): MCPTool[] {
  const tools: MCPTool[] = [];

  // Look for @server.list_tools() decorator pattern
  const listToolsMatch = code.match(/@server\.list_tools\(\)[\s\S]*?return\s*\[([\s\S]*?)\]/);

  if (listToolsMatch) {
    const toolsArrayContent = listToolsMatch[1];

    // Extract Tool objects (Python pattern)
    const toolMatches = toolsArrayContent.matchAll(/Tool\([\s\S]*?name\s*=\s*['"]([^'"]+)['"][\s\S]*?description\s*=\s*['"]([^'"]+)['"][\s\S]*?inputSchema\s*=\s*(\{[\s\S]*?\})\s*[,\)]/g);

    for (const match of toolMatches) {
      try {
        const [, name, description, schemaStr] = match;

        let inputSchema;
        try {
          // Convert Python dict syntax to JSON
          const cleanSchema = schemaStr
            .replace(/'/g, '"')
            .replace(/True/g, 'true')
            .replace(/False/g, 'false')
            .replace(/None/g, 'null');

          inputSchema = JSON.parse(cleanSchema);
        } catch {
          inputSchema = {
            type: 'object',
            properties: {},
          };
        }

        tools.push({
          name: name.trim(),
          description: description.trim(),
          inputSchema,
        });
      } catch (error) {
        console.warn('Failed to parse Python tool:', error);
      }
    }
  }

  // Alternative pattern: look for @server.call_tool() decorators
  if (tools.length === 0) {
    const callToolMatches = code.matchAll(/@server\.call_tool\(\)[\s\S]*?async\s+def\s+(\w+)\(/g);

    for (const match of callToolMatches) {
      const [, funcName] = match;
      // Try to find docstring for description
      const funcPattern = new RegExp(`def\\s+${funcName}\\([^)]*\\):[\\s\\S]*?"""([^"]+)"""`, 'm');
      const docMatch = code.match(funcPattern);
      const description = docMatch ? docMatch[1].trim() : `Tool: ${funcName}`;

      tools.push({
        name: funcName,
        description,
        inputSchema: {
          type: 'object',
          properties: {},
        },
      });
    }
  }

  return tools;
}

function extractResourcesPython(code: string): MCPResource[] {
  const resources: MCPResource[] = [];

  // Look for @server.list_resources() decorator pattern
  const listResourcesMatch = code.match(/@server\.list_resources\(\)[\s\S]*?return\s*\[([\s\S]*?)\]/);

  if (listResourcesMatch) {
    const resourcesArrayContent = listResourcesMatch[1];

    // Extract Resource objects (Python pattern)
    const resourceMatches = resourcesArrayContent.matchAll(/Resource\([\s\S]*?uri\s*=\s*['"]([^'"]+)['"][\s\S]*?name\s*=\s*['"]([^'"]+)['"][\s\S]*?description\s*=\s*['"]([^'"]+)['"][\s\S]*?(?:mimeType\s*=\s*['"]([^'"]+)['"])?[\s\S]*?[,\)]/g);

    for (const match of resourceMatches) {
      const [, uri, name, description, mimeType] = match;
      resources.push({
        uri: uri.trim(),
        name: name.trim(),
        description: description.trim(),
        mimeType: mimeType?.trim() || 'text/plain',
      });
    }
  }

  return resources;
}

function extractPromptsPython(code: string): MCPPrompt[] {
  const prompts: MCPPrompt[] = [];

  // Look for @server.list_prompts() decorator pattern
  const listPromptsMatch = code.match(/@server\.list_prompts\(\)[\s\S]*?return\s*\[([\s\S]*?)\]/);

  if (listPromptsMatch) {
    const promptsArrayContent = listPromptsMatch[1];

    // Extract Prompt objects (Python pattern)
    const promptMatches = promptsArrayContent.matchAll(/Prompt\([\s\S]*?name\s*=\s*['"]([^'"]+)['"][\s\S]*?description\s*=\s*['"]([^'"]+)['"][\s\S]*?(?:arguments\s*=\s*\[([\s\S]*?)\])?[\s\S]*?[,\)]/g);

    for (const match of promptMatches) {
      const [, name, description, argsStr] = match;

      const promptArgs: { name: string; description: string; required?: boolean }[] = [];

      if (argsStr) {
        const argMatches = argsStr.matchAll(/PromptArgument\([\s\S]*?name\s*=\s*['"]([^'"]+)['"][\s\S]*?description\s*=\s*['"]([^'"]+)['"][\s\S]*?(?:required\s*=\s*(True|False))?[\s\S]*?\)/g);

        for (const argMatch of argMatches) {
          const [, argName, argDesc, required] = argMatch;
          promptArgs.push({
            name: argName.trim(),
            description: argDesc.trim(),
            required: required === 'True',
          });
        }
      }

      prompts.push({
        name: name.trim(),
        description: description.trim(),
        arguments: promptArgs.length > 0 ? promptArgs : undefined,
      });
    }
  }

  return prompts;
}
