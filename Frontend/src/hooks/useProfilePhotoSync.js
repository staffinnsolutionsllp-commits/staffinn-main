import { useEffect } from 'react';

/**
 * Custom hook to sync profile photos across the application
 * This hook listens for profile photo changes and updates all relevant image elements
 */
const useProfilePhotoSync = (profileImage, userRole = 'institute') => {
  useEffect(() => {
    if (userRole === 'institute' && profileImage) {
      console.log('Updating all images with:', profileImage);
      
      // Update institute-profile-logo images
      const profileLogos = document.querySelectorAll('img.institute-profile-logo');
      profileLogos.forEach(img => {
        img.src = profileImage;
        console.log('Updated profile logo:', img.src);
      });
      
      // Update institute-logo images
      const instituteLogos = document.querySelectorAll('img.institute-logo');
      instituteLogos.forEach(img => {
        img.src = profileImage;
        console.log('Updated institute logo:', img.src);
      });
      
      // Update images in institute-header areas
      const headerImages = document.querySelectorAll('.institute-header img, .institute-info img');
      headerImages.forEach(img => {
        img.src = profileImage;
        console.log('Updated header image:', img.src);
      });
      
      // Update any other institute-related images
      const otherInstituteImages = document.querySelectorAll('[data-institute-image]');
      otherInstituteImages.forEach(img => {
        img.src = profileImage;
        console.log('Updated other image:', img.src);
      });
    }
  }, [profileImage, userRole]);

  // Function to manually trigger image updates
  const updateAllImages = (newImageUrl) => {
    if (userRole === 'institute') {
      const selectors = [
        'img.institute-profile-logo',
        'img.institute-logo',
        '.institute-header img',
        '.institute-info img',
        '[data-institute-image]'
      ];
      
      selectors.forEach(selector => {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
          img.src = newImageUrl || '/institute-logo-placeholder.png';
        });
      });
    }
  };

  return { updateAllImages };
};

export default useProfilePhotoSync;