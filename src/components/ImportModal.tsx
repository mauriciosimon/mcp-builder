import { useState } from 'react';
import './ImportModal.css';

interface ImportModalProps {
  onClose: () => void;
  onImport: (repoUrl: string) => Promise<void>;
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onImport(repoUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import MCP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import MCP from GitHub</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="import-form">
          <div className="form-group">
            <label htmlFor="repoUrl">GitHub Repository URL</label>
            <input
              type="url"
              id="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/mcp-server"
              required
              disabled={loading}
            />
            <p className="help-text">
              Enter the URL of a GitHub repository containing an MCP server
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="import-examples">
            <h4>Example repositories:</h4>
            <ul>
              <li>
                <button
                  type="button"
                  className="example-link"
                  onClick={() => setRepoUrl('https://github.com/modelcontextprotocol/servers')}
                  disabled={loading}
                >
                  modelcontextprotocol/servers
                </button>
              </li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !repoUrl}
            >
              {loading ? 'Importing...' : 'Import MCP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
