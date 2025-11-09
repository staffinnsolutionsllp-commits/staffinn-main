import { useLoading } from '../context/LoadingContext';

/**
 * Custom hook to manage global loading states
 * @returns {Object} Loading utilities
 */
export const useGlobalLoading = () => {
  const { isLoading, showLoading, hideLoading, loadingMessage } = useLoading();

  /**
   * Show loading with optional message
   * @param {string} message - Loading message to display
   */
  const startLoading = (message = 'Loading...') => {
    showLoading(message);
  };

  /**
   * Hide loading
   */
  const stopLoading = () => {
    hideLoading();
  };

  /**
   * Execute an async function with loading state
   * @param {Function} asyncFn - Async function to execute
   * @param {string} message - Loading message
   * @returns {Promise} Result of the async function
   */
  const withLoading = async (asyncFn, message = 'Loading...') => {
    try {
      startLoading(message);
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
};

export default useGlobalLoading;