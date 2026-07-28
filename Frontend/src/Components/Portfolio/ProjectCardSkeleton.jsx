import React from 'react';

const ProjectCardSkeleton = () => (
  <div className="pf-skeleton-card">
    <div className="pf-skeleton-cover" />
    <div className="pf-skeleton-body">
      <div className="pf-skeleton-line medium" />
      <div className="pf-skeleton-line" />
      <div className="pf-skeleton-line short" />
    </div>
  </div>
);

export default ProjectCardSkeleton;
