import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MCPProject } from '../types/mcp';
import { mockProjects } from '../data/mockData';
import { ImportModal } from './ImportModal';
import { fetchGitHubRepo } from '../utils/mcpParser';
import './Dashboard.css';

const STORAGE_KEY = 'mcp-builder-imported-projects';

export function Dashboard() {
  const [importedProjects, setImportedProjects] = useState<MCPProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  // Load imported projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setImportedProjects(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load imported projects:', error);
      }
    }
  }, []);

  // Save imported projects to localStorage whenever they change
  useEffect(() => {
    if (importedProjects.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(importedProjects));
    }
  }, [importedProjects]);

  // Combine mock projects and imported projects
  const allProjects = [...mockProjects, ...importedProjects];

  const filteredProjects = allProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = async (repoUrl: string) => {
    const importedProject = await fetchGitHubRepo(repoUrl);
    setImportedProjects(prev => [...prev, importedProject]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>MCP Builder</h1>
        <p className="subtitle">Build and manage your Model Context Protocol servers</p>
      </header>

      <div className="dashboard-actions">
        <input
          type="text"
          placeholder="Search projects..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="action-buttons">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary-action"
          >
            📥 Import from GitHub
          </button>
          <Link to="/new" className="btn btn-primary">
            + Create New MCP
          </Link>
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects found</h3>
            <p>
              {searchTerm
                ? 'Try a different search term'
                : 'Create your first MCP or import one from GitHub to get started'}
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="project-card"
            >
              <div className="project-card-header">
                <h2>{project.name}</h2>
                <span className="project-id">
                  {project.id.startsWith('imported-') ? '📥' : '#'}{project.id.replace('imported-', '')}
                </span>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-label">Tools</span>
                  <span className="stat-value">{project.tools.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Resources</span>
                  <span className="stat-value">{project.resources.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Prompts</span>
                  <span className="stat-value">{project.prompts.length}</span>
                </div>
              </div>
              <div className="project-footer">
                <span className="date">Updated {formatDate(project.updatedAt)}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
