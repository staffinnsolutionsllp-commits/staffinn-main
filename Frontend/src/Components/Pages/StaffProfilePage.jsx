import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import apiService from '../../services/api';
import { isValidSlug } from '../../utils/staffUtils';
import StaffProfileHero from './StaffProfile/StaffProfileHero';
import StaffProfileOverview from './StaffProfile/StaffProfileOverview';
import StaffProfileReviews from './StaffProfile/StaffProfileReviews';
import StaffProfileContact from './StaffProfile/StaffProfileContact';
import StaffProfileNotFound from './StaffProfile/StaffProfileNotFound';
import ProfilePortfolioSection from '../Portfolio/ProfilePortfolioSection';
import ProfileServicesTab from '../Services/ProfileServicesTab';
import './StaffProfile/StaffProfilePage.css';

const StaffProfilePage = () => {
  const { profileSlug } = useParams();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [contactedStaff, setContactedStaff] = useState(false);
  const [hiredStaff, setHiredStaff] = useState(false);

  // URL-aware tab state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'reviews' || tab === 'overview' || tab === 'services') setActiveTab(tab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    if (!profileSlug || !isValidSlug(profileSlug)) {
      setError({ status: 404 });
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [profileSlug, isLoggedIn]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getStaffProfileBySlug(profileSlug);
      if (response.success) {
        setProfile(response.data);
      } else {
        setError({ status: response.status || 404, message: response.message });
      }
    } catch (err) {
      setError({ status: 500, message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleContactMade = () => {
    setContactedStaff(true);
  };

  const handleHired = () => {
    setHiredStaff(true);
  };

  const handleReviewSubmitted = (newRating, newReviewCount) => {
    setProfile(prev => prev ? { ...prev, rating: newRating, reviewCount: newReviewCount } : prev);
  };

  // Loading state
  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-container">
          <div className="sp-skeleton-hero">
            <div className="sp-skeleton-avatar" />
            <div className="sp-skeleton-lines">
              <div className="sp-skeleton-line sp-skeleton-line--lg" />
              <div className="sp-skeleton-line sp-skeleton-line--md" />
              <div className="sp-skeleton-line sp-skeleton-line--sm" />
            </div>
          </div>
          <div className="sp-skeleton-body">
            <div className="sp-skeleton-line sp-skeleton-line--full" />
            <div className="sp-skeleton-line sp-skeleton-line--full" />
            <div className="sp-skeleton-line sp-skeleton-line--md" />
          </div>
        </div>
      </div>
    );
  }

  // Error / 404 state
  if (error) {
    return <StaffProfileNotFound status={error.status} onRetry={fetchProfile} />;
  }

  if (!profile) {
    return <StaffProfileNotFound status={404} />;
  }

  return (
    <div className="sp-page">
      <div className="sp-container">
        <StaffProfileHero profile={profile} />

        <div className={`sp-body ${activeTab === 'services' ? 'sp-body--full' : ''}`}>
          <div className="sp-main">
            {/* Tabs */}
            <div className="sp-tabs" role="tablist">
              <button
                className={`sp-tab ${activeTab === 'overview' ? 'sp-tab--active' : ''}`}
                onClick={() => handleTabChange('overview')}
                role="tab"
                aria-selected={activeTab === 'overview'}
              >
                Overview
              </button>
              {import.meta.env.VITE_STAFF_SERVICES_ENABLED === 'true' && (
                <button
                  className={`sp-tab ${activeTab === 'services' ? 'sp-tab--active' : ''}`}
                  onClick={() => handleTabChange('services')}
                  role="tab"
                  aria-selected={activeTab === 'services'}
                >
                  Services
                </button>
              )}
              <button
                className={`sp-tab ${activeTab === 'reviews' ? 'sp-tab--active' : ''}`}
                onClick={() => handleTabChange('reviews')}
                role="tab"
                aria-selected={activeTab === 'reviews'}
              >
                Reviews ({profile.reviewCount || 0})
              </button>
            </div>

            {/* Tab Content */}
            <div className="sp-tab-content">
              {activeTab === 'overview' && (
                <StaffProfileOverview profile={profile} />
              )}
              {import.meta.env.VITE_STAFF_SERVICES_ENABLED === 'true' && activeTab === 'services' && (
                <ProfileServicesTab
                  profileSlug={profileSlug}
                  profile={profile}
                  isOwner={currentUser?.userId === profile.userId}
                />
              )}
              {activeTab === 'reviews' && (
                <StaffProfileReviews
                  staffUserId={profile.userId}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              )}
            </div>

            {/* Portfolio Section (Phase 2) */}
            {import.meta.env.VITE_STAFF_PORTFOLIO_ENABLED === 'true' && (
              <ProfilePortfolioSection
                profileSlug={profileSlug}
                isOwner={currentUser?.userId === profile.userId}
                onManage={() => navigate('/dashboard/staff?tab=portfolio')}
                staffName={profile.fullName}
                staffAvatar={profile.profilePhoto}
              />
            )}
          </div>

          {/* Contact Sidebar (desktop) - hidden when services tab active */}
          {activeTab !== 'services' && (
            <aside className="sp-sidebar">
              <StaffProfileContact
                profile={profile}
                currentUser={currentUser}
                contactedStaff={contactedStaff}
                hiredStaff={hiredStaff}
                onContactMade={handleContactMade}
                onHired={handleHired}
              />
            </aside>
          )}
        </div>

        {/* Mobile Bottom Bar */}
        <div className="sp-mobile-bar">
          <StaffProfileContact
            profile={profile}
            currentUser={currentUser}
            contactedStaff={contactedStaff}
            hiredStaff={hiredStaff}
            onContactMade={handleContactMade}
            onHired={handleHired}
            isMobile
          />
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
