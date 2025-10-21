import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewProject.css';

export function NewProject() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would create the project
    console.log('Creating project:', formData);
    // For now, just navigate back to dashboard
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="new-project">
      <div className="new-project-container">
        <header className="new-project-header">
          <h1>Create New MCP</h1>
          <p>Build a new Model Context Protocol server</p>
        </header>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Project Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Weather MCP"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what your MCP does..."
              rows={4}
              required
            />
          </div>

          <div className="template-section">
            <h3>Choose a Template (Optional)</h3>
            <div className="template-grid">
              <div className="template-card">
                <h4>Blank</h4>
                <p>Start from scratch</p>
              </div>
              <div className="template-card">
                <h4>API Integration</h4>
                <p>Connect to external APIs</p>
              </div>
              <div className="template-card">
                <h4>Database</h4>
                <p>Query and manage databases</p>
              </div>
              <div className="template-card">
                <h4>File System</h4>
                <p>File operations and management</p>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
