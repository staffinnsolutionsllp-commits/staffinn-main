/* eslint-disable react/prop-types */
import React from 'react';
import { FiFolder, FiPlus, FiSearch } from 'react-icons/fi';

const ProjectEmptyState = ({ hasFilters, onClearFilters, onAddProject }) => {
  if (hasFilters) {
    return (
      <div className="pf-empty-state">
        <div className="pf-empty-icon"><FiSearch /></div>
        <h3>No projects match your filters</h3>
        <p>Try adjusting your search or filter criteria.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="pf-btn pf-btn-secondary" onClick={onClearFilters}>Clear Filters</button>
          <button className="pf-btn pf-btn-primary" onClick={onAddProject}><FiPlus /> Add Project</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-empty-state">
      <div className="pf-empty-icon"><FiFolder /></div>
      <h3>Build your professional portfolio</h3>
      <p>Add projects to showcase your skills, experience and professional achievements to recruiters and employers.</p>
      <button className="pf-btn pf-btn-primary pf-btn-lg" onClick={onAddProject}>
        <FiPlus /> Add Your First Project
      </button>
    </div>
  );
};

export default ProjectEmptyState;
