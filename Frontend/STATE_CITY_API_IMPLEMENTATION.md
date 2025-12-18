# State-City API Implementation Guide

## Overview
This document describes the implementation of the state-city API across all forms in the MIS system.

## API Details
- **API Key**: `Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==`
- **Base URL**: `https://api.countrystatecity.in/v1/countries/IN`
- **Endpoints**:
  - States: `GET /states`
  - Cities: `GET /states/{stateIso2}/cities`

## Reusable Hook: `useStateCityAPI`

Location: `src/hooks/useStateCityAPI.js`

### Usage Example:
```javascript
import { useStateCityAPI } from '../../hooks/useStateCityAPI';

const MyComponent = () => {
  const { 
    states, 
    cities, 
    selectedState, 
    selectedCity, 
    handleStateChange, 
    handleCityChange 
  } = useStateCityAPI();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      handleStateChange(value); // Pass state ISO code
      setFormData({ ...formData, state: value, city: '' });
    } else if (name === 'city') {
      handleCityChange(value); // Pass city name
      setFormData({ ...formData, city: value });
    }
  };

  return (
    <>
      <select name="state" value={formData.state} onChange={handleChange}>
        <option value="">Select State</option>
        {states.map(state => (
          <option key={state.iso2} value={state.iso2}>{state.name}</option>
        ))}
      </select>

      <select name="city" value={formData.city} onChange={handleChange} disabled={!formData.state}>
        <option value="">Select City</option>
        {cities.map(city => (
          <option key={city.id} value={city.name}>{city.name}</option>
        ))}
      </select>
    </>
  );
};
```

## Implemented Forms

### ✅ 1. Faculty List Form
**File**: `src/Components/Dashboard/FacultyList.jsx`
- **Fields**: Current State, Current City
- **Status**: Implemented with `useStateCityAPI` hook

### ✅ 2. Training Center Details Form
**File**: `src/Components/Dashboard/TrainingCenterDetails.jsx`
- **Fields**: State/UT, District (using cities API)
- **Status**: Implemented with `useStateCityAPI` hook

### ✅ 3. Staff Dashboard Profile
**File**: `src/Components/Dashboard/StaffDashboard.jsx`
- **Fields**: State, City
- **Status**: Already implemented with direct API calls

### ✅ 4. Home Page Search
**File**: `src/Components/Home/Home.jsx`
- **Fields**: State, City (for staff search)
- **Status**: Already implemented with direct API calls

## Key Features

1. **Dynamic City Loading**: Cities are loaded automatically when a state is selected
2. **Disabled State**: City dropdown is disabled until a state is selected
3. **Reset on State Change**: City selection is reset when state changes
4. **Consistent API**: All forms use the same API key and endpoints
5. **Error Handling**: Graceful error handling for API failures

## Notes

- State values are stored as ISO2 codes (e.g., "DL" for Delhi)
- City values are stored as city names (e.g., "New Delhi")
- The hook automatically fetches states on mount
- Cities are fetched when a state is selected
- All dropdowns follow the same pattern for consistency
