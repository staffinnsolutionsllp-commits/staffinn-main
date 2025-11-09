import React from 'react';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import apiWithLoading from '../../services/apiWithLoading';

const LoadingExample = () => {
  const { startLoading, stopLoading, withLoading } = useGlobalLoading();

  // Example 1: Manual loading control
  const handleManualLoading = () => {
    startLoading('Processing your request...');
    
    // Simulate some work
    setTimeout(() => {
      stopLoading();
      alert('Manual loading completed!');
    }, 2000);
  };

  // Example 2: Using withLoading helper
  const handleWithLoading = async () => {
    await withLoading(
      async () => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('WithLoading completed!');
      },
      'Working with helper...'
    );
  };

  // Example 3: API calls with automatic loading (using apiWithLoading)
  const handleApiCall = async () => {
    try {
      // This will automatically show loading because we're using apiWithLoading
      const response = await apiWithLoading.getAllInstitutes();
      console.log('API Response:', response);
      alert('API call completed! Check console for response.');
    } catch (error) {
      console.error('API Error:', error);
      alert('API call failed! Check console for error.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Loading System Examples</h2>
      <p>This component demonstrates different ways to use the global loading system:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <button 
          onClick={handleManualLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4863f7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Manual Loading Control
        </button>
        
        <button 
          onClick={handleWithLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Using withLoading Helper
        </button>
        
        <button 
          onClick={handleApiCall}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          API Call with Automatic Loading
        </button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>How it works:</h3>
        <ul style={{ textAlign: 'left' }}>
          <li><strong>Manual Control:</strong> Use startLoading() and stopLoading() for custom loading states</li>
          <li><strong>withLoading Helper:</strong> Wraps async functions with automatic loading</li>
          <li><strong>API Calls:</strong> Import apiWithLoading instead of apiService for automatic loading on API calls</li>
        </ul>
      </div>
    </div>
  );
};

export default LoadingExample;