# Hourglass Loader Implementation

This document explains how to use the new global hourglass loading system implemented in the Staffinn application.

## Overview

The hourglass loader provides a beautiful, animated loading indicator that appears as a full-screen overlay whenever loading operations are performed. It automatically integrates with API calls and can be manually controlled for custom loading scenarios.

## Components

### 1. HourglassLoader Component
- **Location**: `src/Components/common/HourglassLoader.jsx`
- **Purpose**: The main loader component with SVG animation
- **Props**:
  - `size`: Size of the loader (default: '56px')
  - `message`: Loading message to display (default: 'Loading...')

### 2. LoadingContext
- **Location**: `src/context/LoadingContext.jsx`
- **Purpose**: Provides global loading state management
- **Functions**:
  - `showLoading(message)`: Show loading with optional message
  - `hideLoading()`: Hide loading
  - `isLoading`: Current loading state
  - `loadingMessage`: Current loading message

### 3. useGlobalLoading Hook
- **Location**: `src/hooks/useGlobalLoading.js`
- **Purpose**: Easy access to loading functionality
- **Functions**:
  - `startLoading(message)`: Start loading
  - `stopLoading()`: Stop loading
  - `withLoading(asyncFn, message)`: Wrap async function with loading

### 4. API Service with Loading
- **Location**: `src/services/apiWithLoading.js`
- **Purpose**: Automatically handles loading for API calls
- **Usage**: Import `apiWithLoading` instead of `apiService`

## Usage Examples

### 1. Automatic API Loading

```javascript
import apiWithLoading from '../../services/apiWithLoading';

const MyComponent = () => {
  const handleApiCall = async () => {
    // This automatically shows loading
    const response = await apiWithLoading.getAllInstitutes();
    // Loading automatically hides when done
  };

  return <button onClick={handleApiCall}>Load Data</button>;
};
```

### 2. Manual Loading Control

```javascript
import { useGlobalLoading } from '../../hooks/useGlobalLoading';

const MyComponent = () => {
  const { startLoading, stopLoading } = useGlobalLoading();

  const handleCustomOperation = () => {
    startLoading('Processing your request...');
    
    setTimeout(() => {
      stopLoading();
      // Operation complete
    }, 2000);
  };

  return <button onClick={handleCustomOperation}>Process</button>;
};
```

### 3. Using withLoading Helper

```javascript
import { useGlobalLoading } from '../../hooks/useGlobalLoading';

const MyComponent = () => {
  const { withLoading } = useGlobalLoading();

  const handleAsyncOperation = async () => {
    await withLoading(
      async () => {
        // Your async operation here
        await someAsyncFunction();
      },
      'Custom loading message...'
    );
  };

  return <button onClick={handleAsyncOperation}>Execute</button>;
};
```

### 4. Standalone Loader Component

```javascript
import HourglassLoader from '../../Components/common/HourglassLoader';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <HourglassLoader message="Loading data..." />
      </div>
    );
  }

  return <div>Your content here</div>;
};
```

## Integration Steps

### 1. App Setup (Already Done)
The app is already wrapped with `LoadingProvider` in `App.jsx`:

```javascript
function App() {
  return (
    <Router>
      <LoadingProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LoadingProvider>
    </Router>
  );
}
```

### 2. Replace API Service Imports
Replace existing API service imports:

```javascript
// Old way
import apiService from '../../services/api';

// New way (for automatic loading)
import apiWithLoading from '../../services/apiWithLoading';
```

### 3. Use Loading Hook
For manual loading control:

```javascript
import { useGlobalLoading } from '../../hooks/useGlobalLoading';

const MyComponent = () => {
  const { startLoading, stopLoading, withLoading } = useGlobalLoading();
  // Use the loading functions as needed
};
```

## Customization

### Loading Messages
The system provides contextual loading messages for different operations:
- Login: "Signing you in..."
- Registration: "Creating your account..."
- Profile updates: "Updating profile..."
- File uploads: "Uploading files..."
- And many more...

### Styling
The loader can be customized via CSS variables in `HourglassLoader.css`:
- `--hue`: Color hue (default: 223)
- `--hourglass-dur`: Animation duration (default: 2s)

### Size and Message
Pass props to customize individual loader instances:

```javascript
<HourglassLoader 
  size="80px" 
  message="Custom loading message..." 
/>
```

## API Methods with Automatic Loading

The following API methods automatically show loading when using `apiWithLoading`:

- Authentication: `login`, `register`, `getProfile`
- Profile updates: `updateStaffProfile`, `updateRecruiterProfile`, `updateInstituteProfile`
- Data fetching: `getAllInstitutes`, `getAllRecruiters`, `getAllActiveJobs`
- File operations: `uploadFiles`, `uploadRecruiterPhoto`
- Course operations: `addCourse`, `getCourses`, `enrollInCourse`
- Job operations: `createJob`, `updateJob`, `deleteJob`
- News operations: `addRecruiterNews`, `updateRecruiterNews`
- And many more...

## Best Practices

1. **Use apiWithLoading for API calls** - This provides consistent loading experience
2. **Use manual loading for non-API operations** - File processing, calculations, etc.
3. **Provide meaningful messages** - Help users understand what's happening
4. **Keep loading times reasonable** - Don't show loading for very quick operations
5. **Handle errors gracefully** - Always ensure loading is hidden even if operations fail

## Troubleshooting

### Loading doesn't appear
- Ensure `LoadingProvider` wraps your app
- Check that you're using `apiWithLoading` instead of `apiService`
- Verify the loading context is properly initialized

### Loading doesn't disappear
- Make sure to call `stopLoading()` or `hideLoading()`
- Check for unhandled errors that might prevent cleanup
- Use try/finally blocks to ensure loading is always hidden

### Custom styling not working
- Check CSS specificity
- Ensure CSS variables are properly defined
- Verify the component is receiving the correct props

## Example Component

See `src/Components/common/LoadingExample.jsx` for a complete working example demonstrating all usage patterns.