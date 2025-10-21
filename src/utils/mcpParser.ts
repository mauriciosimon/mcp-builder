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

    // Try to fetch common MCP server file locations
    const possiblePaths = [
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

    // Parse the code to extract MCP primitives
    const project = parseMCPCode(serverCode, repoData.name, repoData.description || '');

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

function parseMCPCode(code: string, name: string, description: string): Omit<MCPProject, 'id' | 'createdAt' | 'updatedAt'> {
  const tools = extractTools(code);
  const resources = extractResources(code);
  const prompts = extractPrompts(code);

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
