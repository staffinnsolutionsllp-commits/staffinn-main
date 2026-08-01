/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiCheck, FiImage } from 'react-icons/fi';
import * as portfolioApi from '../../services/portfolioApi';

const ProjectsSelector = ({ selectedProjects = [], onChange, userId }) => {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await portfolioApi.getMyProjects();
        if (res.success) {
          // Show all projects (published + draft) for owner selection
          setAllProjects(res.data.projects || []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  const toggleProject = (projectId) => {
    if (selectedProjects.includes(projectId)) {
      onChange(selectedProjects.filter(id => id !== projectId));
    } else {
      onChange([...selectedProjects, projectId]);
    }
  };

  const isSelected = (projectId) => selectedProjects.includes(projectId);

  if (loading) {
    return (
      <div>
        <h2 className="sv-step-title">Portfolio Projects</h2>
        <div className="pf-skeleton" style={{ height: 200 }} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="sv-step-title">Portfolio Projects</h2>
      <p className="sv-step-desc">Select which portfolio projects to showcase in this service. Only selected projects will appear in the "My Portfolio" section of this service.</p>

      {allProjects.length === 0 ? (
        <div className="sv-projects-empty">
          <FiImage size={24} color="var(--pf-text-muted)" />
          <p>No portfolio projects found. Add projects in your Portfolio dashboard first.</p>
        </div>
      ) : (
        <>
          <div className="sv-projects-count">
            {selectedProjects.length} of {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} selected
          </div>
          <div className="sv-projects-grid">
            {allProjects.map(project => (
              <div
                key={project.projectId}
                className={`sv-project-select-card ${isSelected(project.projectId) ? 'selected' : ''}`}
                onClick={() => toggleProject(project.projectId)}
                role="checkbox"
                aria-checked={isSelected(project.projectId)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleProject(project.projectId); } }}
              >
                <div className="sv-project-select-img">
                  {project.coverMedia?.thumbnailUrl || project.coverMedia?.detailUrl ? (
                    <img src={project.coverMedia.thumbnailUrl || project.coverMedia.detailUrl} alt={project.title} />
                  ) : (
                    <FiImage size={20} color="var(--pf-text-muted)" />
                  )}
                  {isSelected(project.projectId) && (
                    <div className="sv-project-select-check"><FiCheck size={14} /></div>
                  )}
                </div>
                <div className="sv-project-select-info">
                  <h4>{project.title}</h4>
                  <p>{project.shortDescription || 'No description'}</p>
                  <span className="sv-project-select-status">{project.status}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsSelector;
