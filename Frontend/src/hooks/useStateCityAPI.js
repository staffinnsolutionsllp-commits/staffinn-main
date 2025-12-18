import { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';
const BASE_URL = 'https://api.countrystatecity.in/v1/countries/IN';

export const useStateCityAPI = (initialState = '', initialCity = '') => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/states`, {
          headers: { 'X-CSCAPI-KEY': API_KEY }
        });
        setStates(response.data);
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) {
        setCities([]);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/states/${selectedState}/cities`, {
          headers: { 'X-CSCAPI-KEY': API_KEY }
        });
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, [selectedState]);

  const handleStateChange = (stateIsoCode) => {
    setSelectedState(stateIsoCode);
    setSelectedCity('');
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
  };

  return {
    states,
    cities,
    selectedState,
    selectedCity,
    loading,
    handleStateChange,
    handleCityChange,
    setSelectedState,
    setSelectedCity
  };
};
