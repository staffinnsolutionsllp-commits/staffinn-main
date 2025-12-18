const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

export const createTrainingInfrastructure = async (data) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/training-infrastructure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Create training infrastructure error:', error);
    return { success: false, message: 'Failed to create training infrastructure' };
  }
};

export const getTrainingInfrastructures = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/training-infrastructure`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  } catch (error) {
    console.error('Get training infrastructures error:', error);
    return { success: false, message: 'Failed to get training infrastructures' };
  }
};

export const updateTrainingInfrastructure = async (id, data) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/training-infrastructure/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Update training infrastructure error:', error);
    return { success: false, message: 'Failed to update training infrastructure' };
  }
};

export const deleteTrainingInfrastructure = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_URL}/training-infrastructure/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  } catch (error) {
    console.error('Delete training infrastructure error:', error);
    return { success: false, message: 'Failed to delete training infrastructure' };
  }
};

export const uploadInfrastructurePhotos = async (id, files) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }
    
    const response = await fetch(`${API_URL}/training-infrastructure/${id}/photos`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Upload photos error:', error);
    return { success: false, message: 'Failed to upload photos' };
  }
};
