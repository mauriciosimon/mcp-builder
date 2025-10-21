import { MCPProject, MCPTool, MCPResource, MCPPrompt } from '../types/mcp';

// Agent-based intelligent MCP analysis
async function analyzeWithAgent(code: string, language: 'typescript' | 'python'): Promise<{
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}> {
  // For now, we'll use a simple approach: send the code to analyze
  // In a production app, this would use an AI API

  // Try to extract using intelligent parsing
  const analysis = await intelligentExtraction(code, language);

  return analysis;
}

// Intelligent extraction that understands different patterns
async function intelligentExtraction(code: string, language: 'typescript' | 'python'): Promise<{
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}> {
  if (language === 'python') {
    return {
      tools: await extractToolsIntelligent(code),
      resources: await extractResourcesIntelligent(code),
      prompts: await extractPromptsIntelligent(code),
    };
  } else {
    return {
      tools: extractTools(code),
      resources: extractResources(code),
      prompts: extractPrompts(code),
    };
  }
}

// Intelligent tool extraction for Python
async function extractToolsIntelligent(code: string): Promise<MCPTool[]> {
  const tools: MCPTool[] = [];

  // Pattern 1: FastMCP @app.tool() or @self.app.tool() - more flexible pattern
  // Matches: @app.tool() or @self.app.tool() followed by function definition with optional docstring
  const toolFunctionPattern = /@(?:self\.)?app\.tool\(\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

  let match;
  while ((match = toolFunctionPattern.exec(code)) !== null) {
    const [, funcName, docstring1, docstring2] = match;
    const docstring = docstring1 || docstring2 || '';
    const description = docstring.trim().split('\n')[0].trim();

    tools.push({
      name: funcName,
      description: description || `Tool: ${funcName}`,
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });
  }

  // Pattern 2: Look for tool definitions in _register_tools method or similar
  // This pattern catches nested decorators in class methods
  const methodPatterns = [
    /def\s+_register_tools\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
    /def\s+register_tools\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
    /def\s+setup\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
  ];

  for (const methodPattern of methodPatterns) {
    const methodMatch = code.match(methodPattern);
    if (methodMatch) {
      const methodCode = methodMatch[0];
      const nestedToolPattern = /@(?:self\.)?app\.tool\(\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

      let nestedMatch;
      while ((nestedMatch = nestedToolPattern.exec(methodCode)) !== null) {
        const [, funcName, docstring1, docstring2] = nestedMatch;
        const docstring = docstring1 || docstring2 || '';
        const description = docstring.trim().split('\n')[0].trim();

        // Avoid duplicates
        if (!tools.some(t => t.name === funcName)) {
          tools.push({
            name: funcName,
            description: description || `Tool: ${funcName}`,
            inputSchema: {
              type: 'object',
              properties: {},
            },
          });
        }
      }
    }
  }

  return tools;
}

// Intelligent resource extraction for Python
async function extractResourcesIntelligent(code: string): Promise<MCPResource[]> {
  const resources: MCPResource[] = [];

  // Pattern 1: FastMCP @app.resource() or @self.app.resource() - more flexible
  const resourcePattern = /@(?:self\.)?app\.resource\s*\(\s*["']([^"']+)["']\s*\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

  let match;
  while ((match = resourcePattern.exec(code)) !== null) {
    const [, uri, funcName, docstring1, docstring2] = match;
    const docstring = docstring1 || docstring2 || '';
    const description = docstring.trim().split('\n')[0].trim();

    resources.push({
      uri: uri.trim(),
      name: funcName.replace(/_/g, ' '),
      description: description || `Resource: ${funcName}`,
      mimeType: 'text/plain',
    });
  }

  // Pattern 2: Look for resource definitions in _register_resources method or similar
  const methodPatterns = [
    /def\s+_register_resources\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
    /def\s+register_resources\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
  ];

  for (const methodPattern of methodPatterns) {
    const methodMatch = code.match(methodPattern);
    if (methodMatch) {
      const methodCode = methodMatch[0];
      const nestedResourcePattern = /@(?:self\.)?app\.resource\s*\(\s*["']([^"']+)["']\s*\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

      let nestedMatch;
      while ((nestedMatch = nestedResourcePattern.exec(methodCode)) !== null) {
        const [, uri, funcName, docstring1, docstring2] = nestedMatch;
        const docstring = docstring1 || docstring2 || '';
        const description = docstring.trim().split('\n')[0].trim();

        // Avoid duplicates
        if (!resources.some(r => r.uri === uri.trim())) {
          resources.push({
            uri: uri.trim(),
            name: funcName.replace(/_/g, ' '),
            description: description || `Resource: ${funcName}`,
            mimeType: 'text/plain',
          });
        }
      }
    }
  }

  return resources;
}

// Intelligent prompt extraction for Python
async function extractPromptsIntelligent(code: string): Promise<MCPPrompt[]> {
  const prompts: MCPPrompt[] = [];

  // Pattern 1: FastMCP @app.prompt() or @self.app.prompt() - more flexible
  const promptPattern = /@(?:self\.)?app\.prompt\s*\(\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

  let match;
  while ((match = promptPattern.exec(code)) !== null) {
    const [, funcName, docstring1, docstring2] = match;
    const docstring = docstring1 || docstring2 || '';
    const description = docstring.trim().split('\n')[0].trim();

    prompts.push({
      name: funcName,
      description: description || `Prompt: ${funcName}`,
    });
  }

  // Pattern 2: Look for prompt definitions in _register_prompts method or similar
  const methodPatterns = [
    /def\s+_register_prompts\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
    /def\s+register_prompts\s*\([^)]*\)\s*:[\s\S]*?(?=\n    def\s|\n\nclass\s|\n\n    def\s|\Z)/,
  ];

  for (const methodPattern of methodPatterns) {
    const methodMatch = code.match(methodPattern);
    if (methodMatch) {
      const methodCode = methodMatch[0];
      const nestedPromptPattern = /@(?:self\.)?app\.prompt\s*\(\)\s*(?:async\s+)?def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')?/gs;

      let nestedMatch;
      while ((nestedMatch = nestedPromptPattern.exec(methodCode)) !== null) {
        const [, funcName, docstring1, docstring2] = nestedMatch;
        const docstring = docstring1 || docstring2 || '';
        const description = docstring.trim().split('\n')[0].trim();

        // Avoid duplicates
        if (!prompts.some(p => p.name === funcName)) {
          prompts.push({
            name: funcName,
            description: description || `Prompt: ${funcName}`,
          });
        }
      }
    }
  }

  return prompts;
}

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
    // Also try package-based patterns for Python (e.g., package_name/__main__.py)
    const packageName = repoName.replace(/-/g, '_'); // Convert repo name to Python package format

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
      // Python - root level
      'src/server.py',
      'src/__main__.py',
      'src/main.py',
      'server.py',
      'main.py',
      '__main__.py',
      'app.py',
      'src/app.py',
      // Python - package structure (e.g., package_name/__main__.py)
      `${packageName}/__main__.py`,
      `${packageName}/server.py`,
      `${packageName}/main.py`,
      `src/${packageName}/__main__.py`,
      `src/${packageName}/server.py`,
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

    // Parse the code to extract MCP primitives using intelligent extraction
    const project = await parseMCPCode(serverCode, repoData.name, repoData.description || '', language);

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

async function parseMCPCode(code: string, name: string, description: string, language: 'typescript' | 'python'): Promise<Omit<MCPProject, 'id' | 'createdAt' | 'updatedAt'>> {
  // Use intelligent extraction
  const analysis = await analyzeWithAgent(code, language);

  return {
    name: name || 'Imported MCP',
    description: description || 'Imported from GitHub',
    tools: analysis.tools,
    resources: analysis.resources,
    prompts: analysis.prompts,
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
