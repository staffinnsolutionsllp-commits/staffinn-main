import React, { useState, useEffect } from 'react';
import {
  FiCalendar, FiClock, FiBook, FiUsers, FiBriefcase,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiPhone, FiMail
} from 'react-icons/fi';
import apiService from '../../services/api';
import './RecruiterCampusInviteTracking.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const RecruiterCampusInviteTracking = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState(null);

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const res = await apiService.getRecruiterSentInvites();
      if (res.success) {
        setInvites(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: FiAlertCircle, color: '#d97706', bg: '#fef3c7', label: 'Pending' },
      accepted: { icon: FiCheckCircle, color: '#059669', bg: '#d1fae5', label: 'Accepted' },
      declined: { icon: FiXCircle, color: '#dc2626', bg: '#fee2e2', label: 'Declined' }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return <div className="rcit-loading">Loading sent invites...</div>;
  }

  return (
    <div className="rcit-container">
      <div className="rcit-header">
        <h2>Campus Invites Sent</h2>
        <p>Track your campus drive invitations to institutes</p>
      </div>

      {invites.length === 0 ? (
        <div className="rcit-empty">
          <FiCalendar size={48} />
          <p>No campus invites sent yet</p>
        </div>
      ) : (
        <div className="rcit-grid">
          {invites.map(invite => {
            const statusConfig = getStatusConfig(invite.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={invite.inviteId} className="rcit-card" onClick={() => setSelectedInvite(invite)}>
                <div className="rcit-card-header">
                  <h3>{invite.instituteName}</h3>
                  <div className="rcit-status" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                    <StatusIcon size={14} /> {statusConfig.label}
                  </div>
                </div>

                <div className="rcit-card-details">
                  <div className="rcit-detail">
                    <FiCalendar size={14} />
                    <span>{formatDate(invite.preferredDate)}</span>
                  </div>
                  <div className="rcit-detail">
                    <FiClock size={14} />
                    <span>{invite.preferredTimeSlot}</span>
                  </div>
                  <div className="rcit-detail">
                    <FiBriefcase size={14} />
                    <span>{invite.jobRoles}</span>
                  </div>
                  <div className="rcit-detail">
                    <FiUsers size={14} />
                    <span>{invite.numberOfVacancies} positions</span>
                  </div>
                </div>

                <div className="rcit-courses">
                  {invite.selectedCourses?.slice(0, 2).map(c => (
                    <span key={c.id} className="rcit-course-chip">{c.name}</span>
                  ))}
                  {invite.selectedCourses?.length > 2 && (
                    <span className="rcit-course-more">+{invite.selectedCourses.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedInvite && (
        <div className="rcit-modal-overlay" onClick={(e) => e.target.className === 'rcit-modal-overlay' && setSelectedInvite(null)}>
          <div className="rcit-modal">
            <div className="rcit-modal-header">
              <h2>Campus Drive with {selectedInvite.instituteName}</h2>
              <button onClick={() => setSelectedInvite(null)}>×</button>
            </div>

            <div className="rcit-modal-body">
              <div className="rcit-section">
                <h4><FiCalendar /> Schedule</h4>
                <p><strong>Date:</strong> {formatDate(selectedInvite.preferredDate)}</p>
                <p><strong>Time:</strong> {selectedInvite.preferredTimeSlot}</p>
              </div>

              <div className="rcit-section">
                <h4><FiBriefcase /> Hiring Details</h4>
                <p><strong>Job Roles:</strong> {selectedInvite.jobRoles}</p>
                <p><strong>Vacancies:</strong> {selectedInvite.numberOfVacancies}</p>
                {selectedInvite.salaryStipend && <p><strong>Salary/Stipend:</strong> {selectedInvite.salaryStipend}</p>}
              </div>

              <div className="rcit-section">
                <h4><FiBook /> Selected Courses</h4>
                <div className="rcit-courses">
                  {selectedInvite.selectedCourses?.map(c => (
                    <span key={c.id} className="rcit-course-chip">{c.name}</span>
                  ))}
                </div>
              </div>

              {selectedInvite.status === 'accepted' && selectedInvite.instituteResponse && (
                <div className="rcit-section rcit-response">
                  <h4><FiCheckCircle /> Institute Response</h4>
                  {selectedInvite.instituteResponse.tpoName && (
                    <>
                      <p><FiUsers size={14} /> <strong>Coordinator:</strong> {selectedInvite.instituteResponse.tpoName}</p>
                      <p><FiPhone size={14} /> <strong>Contact:</strong> {selectedInvite.instituteResponse.contactNumber}</p>
                      <p><FiMail size={14} /> <strong>Email:</strong> {selectedInvite.instituteResponse.officialEmail}</p>
                    </>
                  )}
                  {selectedInvite.instituteResponse.venueDetails && (
                    <p><strong>Venue:</strong> {selectedInvite.instituteResponse.venueDetails}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterCampusInviteTracking;
