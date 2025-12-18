/**
 * Authentication Guard Utility
 * Handles authentication checks for restricted actions
 */

// Function to trigger the login modal with a message
export const requireAuth = (isLoggedIn, onShowLogin) => {
  if (!isLoggedIn) {
    // Show the login modal
    onShowLogin();
    return false;
  }
  return true;
};

// Function to show login modal with registration message
export const showLoginWithMessage = (setShowLoginModal) => {
  // Set the login modal to show
  setShowLoginModal(true);
  
  // Add the registration message to the modal
  setTimeout(() => {
    const loginModal = document.querySelector('.login-modal');
    if (loginModal) {
      // Check if message already exists
      let messageDiv = loginModal.querySelector('.auth-guard-message');
      if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.className = 'auth-guard-message';
        messageDiv.textContent = 'Please register yourself on the portal first.';
        messageDiv.style.cssText = `
          background-color: #ff6b6b;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: 500;
          margin-bottom: 15px;
          border-radius: 4px;
          animation: fadeIn 0.3s ease-in;
          position: relative;
          z-index: 1000;
        `;
        
        // Insert at the top of the login form or modal content
        const loginForm = loginModal.querySelector('.login-form');
        const loginRightPanel = loginModal.querySelector('.login-right-panel');
        const targetElement = loginRightPanel || loginForm;
        
        if (targetElement) {
          targetElement.insertBefore(messageDiv, targetElement.firstChild);
        }
      }
      
      // Remove message after 5 seconds
      setTimeout(() => {
        if (messageDiv && messageDiv.parentNode) {
          messageDiv.style.animation = 'fadeOut 0.3s ease-out';
          setTimeout(() => {
            if (messageDiv && messageDiv.parentNode) {
              messageDiv.parentNode.removeChild(messageDiv);
            }
          }, 300);
        }
      }, 5000);
    }
  }, 200);
};

// Add CSS animations for the message
const addAuthGuardStyles = () => {
  if (!document.getElementById('auth-guard-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-guard-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
      }
      
      .auth-guard-message {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize styles when module loads
addAuthGuardStyles();

// Alternative function for components that need to trigger login modal directly
export const triggerLoginModal = () => {
  // Try to find and click the existing Sign In button
  const signInButton = document.querySelector('.login-btn');
  if (signInButton) {
    signInButton.click();
    // Add message after a short delay
    setTimeout(() => {
      showLoginWithMessage(() => {});
    }, 300);
  }
};