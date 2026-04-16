import React, { useState, useEffect } from 'react';
import apiWithLoading from '../../services/apiWithLoading';
import JobCard from '../common/JobCard';
import './JobsPage.css';
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaMoneyBillWave } from 'react-icons/fa';

const JobsPage = ({ isLoggedIn, onShowLogin }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  // Filter states
  const [jobTypeFilters, setJobTypeFilters] = useState({
    'full-time': false,
    'part-time': false,
    'internship': false,
    'contract': false
  });
  
  const [experienceFilter, setExperienceFilter] = useState({
    'entry': false,
    'mid': false,
    'senior': false
  });
  
  const [salaryRange, setSalaryRange] = useState([0, 50]);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiWithLoading.getAllActiveJobs();
      
      if (response.success && response.data) {
        setJobs(response.data);
        setFilteredJobs(response.data);
      } else {
        setJobs([]);
        setFilteredJobs([]);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, locationFilter, jobTypeFilters, experienceFilter, salaryRange, jobs]);

  const applyFilters = () => {
    let results = jobs;

    // Search filter
    if (searchTerm) {
      results = results.filter(job =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.recruiterInfo?.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      results = results.filter(job =>
        job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Job type filter
    const selectedJobTypes = Object.keys(jobTypeFilters).filter(key => jobTypeFilters[key]);
    if (selectedJobTypes.length > 0) {
      results = results.filter(job =>
        selectedJobTypes.some(type => job.jobType?.toLowerCase().includes(type))
      );
    }

    // Experience filter
    const selectedExperience = Object.keys(experienceFilter).filter(key => experienceFilter[key]);
    if (selectedExperience.length > 0) {
      results = results.filter(job => {
        const exp = job.experience?.toLowerCase() || '';
        if (selectedExperience.includes('entry') && (exp.includes('0') || exp.includes('1') || exp.includes('2') || exp.includes('fresher'))) return true;
        if (selectedExperience.includes('mid') && (exp.includes('2') || exp.includes('3') || exp.includes('4') || exp.includes('5'))) return true;
        if (selectedExperience.includes('senior') && (exp.includes('5+') || exp.includes('6') || exp.includes('7') || exp.includes('8'))) return true;
        return false;
      });
    }

    setFilteredJobs(results);
    setCurrentPage(1);
  };

  const handleJobTypeChange = (type) => {
    setJobTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleExperienceChange = (level) => {
    setExperienceFilter(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const resetFilters = () => {
    setJobTypeFilters({
      'full-time': false,
      'part-time': false,
      'internship': false,
      'contract': false
    });
    setExperienceFilter({
      'entry': false,
      'mid': false,
      'senior': false
    });
    setSalaryRange([0, 50]);
    setSearchTerm('');
    setLocationFilter('');
  };

  const handleApply = (job) => {
    if (!isLoggedIn) {
      onShowLogin();
      return;
    }
    window.location.href = `/recruiter/${job.recruiterId}`;
  };

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="jobs-page-new">
      {/* Search Section */}
      <div className="jobs-search-header">
        <div className="search-container-new">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon-new" />
            <input
              type="text"
              placeholder="Job title, keywords, or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-new"
            />
          </div>
          <div className="location-input-wrapper">
            <FaMapMarkerAlt className="location-icon-new" />
            <input
              type="text"
              placeholder="City, state, or remote"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="location-input-new"
            />
          </div>
          <button className="search-button-new">
            Search Jobs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="jobs-main-content">
        {/* Left Sidebar - Filters */}
        <aside className="jobs-sidebar">
          <div className="filters-header">
            <h3>FILTERS</h3>
          </div>

          {/* Job Type Filter */}
          <div className="filter-section">
            <h4>Job Type</h4>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={jobTypeFilters['full-time']}
                  onChange={() => handleJobTypeChange('full-time')}
                />
                <span>Full-time</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={jobTypeFilters['part-time']}
                  onChange={() => handleJobTypeChange('part-time')}
                />
                <span>Part-time</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={jobTypeFilters['internship']}
                  onChange={() => handleJobTypeChange('internship')}
                />
                <span>Internship</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={jobTypeFilters['contract']}
                  onChange={() => handleJobTypeChange('contract')}
                />
                <span>Contract</span>
              </label>
            </div>
          </div>

          {/* Experience Level Filter */}
          <div className="filter-section">
            <h4>Experience Level</h4>
            <div className="filter-options">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={experienceFilter['entry']}
                  onChange={() => handleExperienceChange('entry')}
                />
                <span>Entry Level (0-2 yrs)</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={experienceFilter['mid']}
                  onChange={() => handleExperienceChange('mid')}
                />
                <span>Mid Level (2-5 yrs)</span>
              </label>
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={experienceFilter['senior']}
                  onChange={() => handleExperienceChange('senior')}
                />
                <span>Senior (5+ yrs)</span>
              </label>
            </div>
          </div>

          {/* Salary Range Filter */}
          <div className="filter-section">
            <h4>Salary Range (LPA)</h4>
            <div className="salary-range-container">
              <div className="salary-inputs">
                <input
                  type="number"
                  value={salaryRange[0]}
                  onChange={(e) => setSalaryRange([parseInt(e.target.value) || 0, salaryRange[1]])}
                  className="salary-input"
                  placeholder="₹0"
                />
                <span>to</span>
                <input
                  type="number"
                  value={salaryRange[1]}
                  onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value) || 50])}
                  className="salary-input"
                  placeholder="₹50+"
                />
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={salaryRange[1]}
                onChange={(e) => setSalaryRange([salaryRange[0], parseInt(e.target.value)])}
                className="salary-slider"
              />
            </div>
          </div>

          {/* Reset Filters */}
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset all filters
          </button>
        </aside>

        {/* Right Content - Job Listings */}
        <main className="jobs-content-area">
          <div className="jobs-header-section">
            <div>
              <h2>Job Listings</h2>
              <p className="jobs-count">Showing {filteredJobs.length} matching results</p>
            </div>
            <div className="sort-section">
              <label>SORT BY</label>
              <select className="sort-select">
                <option>Most Recent</option>
                <option>Salary: High to Low</option>
                <option>Salary: Low to High</option>
                <option>Experience: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="jobs-loading-new">
              <p>Loading jobs...</p>
            </div>
          ) : currentJobs.length > 0 ? (
            <>
              <div className="jobs-list-new">
                {currentJobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    onApply={handleApply}
                    showApplyButton={true}
                    buttonText="Apply Now"
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button
                    className="pagination-arrow"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ‹
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    className="pagination-arrow"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="no-jobs-new">
              <h3>No jobs found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default JobsPage;
