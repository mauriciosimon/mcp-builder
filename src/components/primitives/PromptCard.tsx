import { useState } from 'react';
import { MCPPrompt } from '../../types/mcp';
import './PrimitiveCard.css';

interface PromptCardProps {
  prompt: MCPPrompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasArguments = prompt.arguments && prompt.arguments.length > 0;

  return (
    <div className="primitive-card prompt-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">💭</span>
          <h3>{prompt.name}</h3>
        </div>
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      <p className="card-description">{prompt.description}</p>

      {hasArguments && (
        <div className="args-summary">
          <span className="args-count">
            {prompt.arguments!.length} argument{prompt.arguments!.length !== 1 ? 's' : ''}
          </span>
          {prompt.arguments!.some((arg) => arg.required) && (
            <span className="required-count">
              {prompt.arguments!.filter((arg) => arg.required).length} required
            </span>
          )}
        </div>
      )}

      {expanded && hasArguments && (
        <div className="expanded-content">
          <h4>Arguments</h4>
          <div className="args-list">
            {prompt.arguments!.map((arg, index) => (
              <div key={index} className="arg-item">
                <div className="arg-header">
                  <span className="arg-name">{arg.name}</span>
                  {arg.required && (
                    <span className="arg-required">required</span>
                  )}
                </div>
                <p className="arg-description">{arg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
