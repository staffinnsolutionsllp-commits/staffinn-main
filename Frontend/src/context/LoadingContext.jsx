import React, { createContext, useContext, useState, useEffect } from 'react';
import HourglassLoader from '../Components/common/HourglassLoader';
import { initializeLoadingService } from '../services/apiWithLoading';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const showLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  // Initialize the API loading service
  useEffect(() => {
    initializeLoadingService({ showLoading, hideLoading });
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading, loadingMessage }}>
      {children}
      {isLoading && (
        <div className="global-loading-overlay">
          <HourglassLoader message={loadingMessage} />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;