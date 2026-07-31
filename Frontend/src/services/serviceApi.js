/**
 * Phase 2G: Staff Services API Client.
 * Centralized service for all service-related API calls.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.code = data.code || null;
    throw error;
  }
  return data;
}

// ─── Owner Service Management ─────────────────────────────────────────

export async function getMyServices() {
  const response = await fetch(`${API_URL}/services/my`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function getMyService(serviceId) {
  const response = await fetch(`${API_URL}/services/${serviceId}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function createService(data, idempotencyKey) {
  const headers = getAuthHeaders();
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch(`${API_URL}/services`, {
    method: 'POST', headers, body: JSON.stringify(data)
  });
  return handleResponse(response);
}

export async function updateService(serviceId, fields, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ ...fields, version })
  });
  return handleResponse(response);
}

export async function publishService(serviceId, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/actions/publish`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function pauseService(serviceId, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/actions/pause`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function reactivateService(serviceId, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/actions/reactivate`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function archiveService(serviceId, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/actions/archive`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function deleteService(serviceId) {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  return handleResponse(response);
}

export async function updatePackages(serviceId, packages, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/packages`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ packages, version })
  });
  return handleResponse(response);
}

export async function updateFaqs(serviceId, faqs, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/faqs`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ faqs, version })
  });
  return handleResponse(response);
}

export async function updateAddons(serviceId, addons, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/addons`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ addons, version })
  });
  return handleResponse(response);
}

export async function updateRequirements(serviceId, requirements, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/requirements`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ requirements, version })
  });
  return handleResponse(response);
}

export async function updateAvailability(serviceId, availability, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/availability`, {
    method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ availability, version })
  });
  return handleResponse(response);
}

// ─── Media ────────────────────────────────────────────────────────────

export async function uploadServiceCover(serviceId, file, version) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('version', String(version));
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/services/${serviceId}/media/cover`, {
    method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: formData
  });
  return handleResponse(response);
}

export async function uploadServiceGallery(serviceId, file, version) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('version', String(version));
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/services/${serviceId}/media/gallery`, {
    method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: formData
  });
  return handleResponse(response);
}

export async function deleteServiceMedia(serviceId, mediaType, mediaIndex, version) {
  const response = await fetch(`${API_URL}/services/${serviceId}/media/${mediaType}/${mediaIndex}?version=${version}`, {
    method: 'DELETE', headers: getAuthHeaders()
  });
  return handleResponse(response);
}

// ─── Public ───────────────────────────────────────────────────────────

export async function getProfileServices(profileSlug) {
  const response = await fetch(`${API_URL}/staff/${profileSlug}/services`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function getServiceDetail(serviceSlug) {
  const response = await fetch(`${API_URL}/services/${serviceSlug}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}
