import { useState } from 'react';
import { MCPTool } from '../../types/mcp';
import './PrimitiveCard.css';

interface ToolCardProps {
  tool: MCPTool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const requiredParams = tool.inputSchema.required || [];
  const allParams = Object.entries(tool.inputSchema.properties || {});

  return (
    <div className="primitive-card tool-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">⚙️</span>
          <h3>{tool.name}</h3>
        </div>
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      <p className="card-description">{tool.description}</p>

      {allParams.length > 0 && (
        <div className="params-summary">
          <span className="params-count">
            {allParams.length} parameter{allParams.length !== 1 ? 's' : ''}
          </span>
          {requiredParams.length > 0 && (
            <span className="required-count">
              {requiredParams.length} required
            </span>
          )}
        </div>
      )}

      {expanded && allParams.length > 0 && (
        <div className="expanded-content">
          <h4>Parameters</h4>
          <div className="params-list">
            {allParams.map(([name, schema]) => (
              <div key={name} className="param-item">
                <div className="param-header">
                  <span className="param-name">{name}</span>
                  <div className="param-badges">
                    <span className="param-type">{schema.type}</span>
                    {requiredParams.includes(name) && (
                      <span className="param-required">required</span>
                    )}
                  </div>
                </div>
                {schema.description && (
                  <p className="param-description">{schema.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
