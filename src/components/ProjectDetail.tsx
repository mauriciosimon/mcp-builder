import { useParams, Link, useNavigate } from 'react-router-dom';
import { mockProjects } from '../data/mockData';
import { ToolCard } from './primitives/ToolCard';
import { ResourceCard } from './primitives/ResourceCard';
import { PromptCard } from './primitives/PromptCard';
import './ProjectDetail.css';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="project-detail">
        <div className="not-found">
          <h2>Project not found</h2>
          <Link to="/" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="project-detail">
      <div className="project-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Dashboard
        </button>
        <div className="project-title-section">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description}</p>
          <div className="project-meta">
            <span>Created: {formatDate(project.createdAt)}</span>
            <span>•</span>
            <span>Last updated: {formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="primitives-overview">
        <div className="overview-card">
          <div className="overview-icon">🛠️</div>
          <div className="overview-content">
            <h3>{project.tools.length}</h3>
            <p>Tools</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">📦</div>
          <div className="overview-content">
            <h3>{project.resources.length}</h3>
            <p>Resources</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">💬</div>
          <div className="overview-content">
            <h3>{project.prompts.length}</h3>
            <p>Prompts</p>
          </div>
        </div>
      </div>

      <section className="primitives-section">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">🛠️</span>
            <h2>Tools</h2>
          </div>
          <p className="section-description">
            Tools are functions that can be called to perform specific actions. They define
            input parameters and expected behavior.
          </p>
        </div>
        {project.tools.length === 0 ? (
          <div className="empty-primitive">
            <p>No tools defined yet</p>
          </div>
        ) : (
          <div className="primitives-grid">
            {project.tools.map((tool, index) => (
              <ToolCard key={index} tool={tool} />
            ))}
          </div>
        )}
      </section>

      <section className="primitives-section">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">📦</span>
            <h2>Resources</h2>
          </div>
          <p className="section-description">
            Resources are data sources that can be accessed by the MCP. They provide
            contextual information and content.
          </p>
        </div>
        {project.resources.length === 0 ? (
          <div className="empty-primitive">
            <p>No resources defined yet</p>
          </div>
        ) : (
          <div className="primitives-grid">
            {project.resources.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </div>
        )}
      </section>

      <section className="primitives-section">
        <div className="section-header">
          <div className="section-title">
            <span className="section-icon">💬</span>
            <h2>Prompts</h2>
          </div>
          <p className="section-description">
            Prompts are templates that guide interactions. They can accept arguments and
            help structure conversations.
          </p>
        </div>
        {project.prompts.length === 0 ? (
          <div className="empty-primitive">
            <p>No prompts defined yet</p>
          </div>
        ) : (
          <div className="primitives-grid">
            {project.prompts.map((prompt, index) => (
              <PromptCard key={index} prompt={prompt} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
