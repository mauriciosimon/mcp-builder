import { useState } from 'react';
import { MCPResource } from '../../types/mcp';
import './PrimitiveCard.css';

interface ResourceCardProps {
  resource: MCPResource;
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="primitive-card resource-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">📄</span>
          <h3>{resource.name}</h3>
        </div>
        <button
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      <p className="card-description">{resource.description}</p>

      <div className="resource-info">
        <div className="info-item">
          <span className="info-label">URI:</span>
          <code className="uri-code">{resource.uri}</code>
        </div>
        {resource.mimeType && (
          <div className="info-item">
            <span className="info-label">Type:</span>
            <span className="mime-type">{resource.mimeType}</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="expanded-content">
          <h4>Resource Details</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">URI Scheme</span>
              <span className="detail-value">
                {resource.uri.split('://')[0]}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Resource Path</span>
              <span className="detail-value">
                {resource.uri.split('://')[1] || 'N/A'}
              </span>
            </div>
            {resource.mimeType && (
              <div className="detail-item">
                <span className="detail-label">MIME Type</span>
                <span className="detail-value">{resource.mimeType}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
