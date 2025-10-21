import { useState } from 'react';
import { MCPProject } from '../types/mcp';
import {
  generateMCPServerCode,
  generatePackageJson,
  generateTsConfig,
  generateReadme,
} from '../utils/codeGenerator';
import './CodeGeneratorModal.css';

interface CodeGeneratorModalProps {
  project: MCPProject;
  onClose: () => void;
}

type FileType = 'server' | 'package' | 'tsconfig' | 'readme';

export function CodeGeneratorModal({ project, onClose }: CodeGeneratorModalProps) {
  const [selectedFile, setSelectedFile] = useState<FileType>('server');
  const [copied, setCopied] = useState(false);

  const files = {
    server: {
      name: 'index.ts',
      label: 'Server Code',
      content: generateMCPServerCode(project),
      language: 'typescript',
    },
    package: {
      name: 'package.json',
      label: 'Package.json',
      content: generatePackageJson(project),
      language: 'json',
    },
    tsconfig: {
      name: 'tsconfig.json',
      label: 'TSConfig',
      content: generateTsConfig(),
      language: 'json',
    },
    readme: {
      name: 'README.md',
      label: 'README',
      content: generateReadme(project),
      language: 'markdown',
    },
  };

  const currentFile = files[selectedFile];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    // Create a simple text file with instructions and all files
    const allContent = `# ${project.name} - MCP Server Code

This archive contains all the files needed to run your MCP server.

## Setup Instructions

1. Create a new directory for your project
2. Save each file below with its corresponding filename
3. Run: npm install
4. Run: npm run build
5. Your server will be ready in the build/ directory

## File Structure

src/
  index.ts          - Main server code
package.json        - Dependencies and scripts
tsconfig.json       - TypeScript configuration
README.md           - Documentation

---

## File: src/${files.server.name}

${files.server.content}

---

## File: ${files.package.name}

${files.package.content}

---

## File: ${files.tsconfig.name}

${files.tsconfig.content}

---

## File: ${files.readme.name}

${files.readme.content}
`;

    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-mcp-server.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generated MCP Server Code</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="file-tabs">
            {(Object.keys(files) as FileType[]).map((fileType) => (
              <button
                key={fileType}
                className={`file-tab ${selectedFile === fileType ? 'active' : ''}`}
                onClick={() => setSelectedFile(fileType)}
              >
                {files[fileType].label}
              </button>
            ))}
          </div>

          <div className="code-container">
            <div className="code-header">
              <span className="filename">{currentFile.name}</span>
              <div className="code-actions">
                <button className="action-button" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button className="action-button" onClick={handleDownload}>
                  ⬇️ Download
                </button>
              </div>
            </div>
            <pre className="code-block">
              <code className={`language-${currentFile.language}`}>
                {currentFile.content}
              </code>
            </pre>
          </div>

          <div className="instructions">
            <h3>Quick Start Instructions</h3>
            <ol>
              <li>
                <strong>Create project structure:</strong>
                <pre className="instruction-code">mkdir my-mcp-server && cd my-mcp-server
mkdir src</pre>
              </li>
              <li>
                <strong>Save the files:</strong> Use the tabs above to copy or download each file
                to the appropriate location
              </li>
              <li>
                <strong>Install dependencies:</strong>
                <pre className="instruction-code">npm install</pre>
              </li>
              <li>
                <strong>Build the server:</strong>
                <pre className="instruction-code">npm run build</pre>
              </li>
              <li>
                <strong>Test the server:</strong>
                <pre className="instruction-code">node build/index.js</pre>
              </li>
            </ol>
            <button className="download-all-button" onClick={handleDownloadAll}>
              📦 Download All Files (as .txt)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
