import { useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to synchronize profile photo updates across components
 * This ensures that when a recruiter uploads a new profile photo,
 * it's immediately reflected in the main header
 */
const useProfilePhotoSync = () => {
  const { refreshUserProfile } = useContext(AuthContext);

  useEffect(() => {
    // Create a custom event listener for profile photo updates
    const handleProfilePhotoUpdate = async () => {
      console.log('Profile photo update detected, refreshing user data');
      try {
        await refreshUserProfile();
        console.log('User profile refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    };

    // Add event listener
    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate);

    // Clean up
    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate);
    };
  }, [refreshUserProfile]);

  // Helper function to dispatch the event when photo is updated
  const notifyProfilePhotoUpdated = () => {
    console.log('Dispatching profile photo update event');
    window.dispatchEvent(new Event('profilePhotoUpdated'));
  };

  return { notifyProfilePhotoUpdated };
};

export default useProfilePhotoSync;