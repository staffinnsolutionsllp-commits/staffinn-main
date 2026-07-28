/**
 * Phase 2: Staff Portfolio API Client.
 * Centralized service for all portfolio-related API calls.
 * Uses native fetch (consistent with existing api.js pattern).
 * Never exposes internal keys (PK, SK, TTL, storageKey).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function getAuthHeadersOnly() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.code = data.code || null;
    error.data = data;
    throw error;
  }
  return data;
}

// ─── Owner Portfolio Management ───────────────────────────────────────────

export async function getMyProjects() {
  const response = await fetch(`${API_URL}/projects/my`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function getMyProject(projectId) {
  const response = await fetch(`${API_URL}/projects/${projectId}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function createProject(title, idempotencyKey) {
  const response = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ title })
  });
  return handleResponse(response);
}

export async function updateProject(projectId, fields, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...fields, version })
  });
  return handleResponse(response);
}

export async function publishProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/publish`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function unpublishProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/unpublish`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function featureProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/feature`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function unfeatureProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/unfeature`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function archiveProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/archive`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function restoreProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}/actions/restore`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function deleteProject(projectId, version) {
  const response = await fetch(`${API_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version })
  });
  return handleResponse(response);
}

export async function reorderProjects(projects, portfolioVersion) {
  const response = await fetch(`${API_URL}/projects/actions/reorder`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ projects, portfolioVersion })
  });
  return handleResponse(response);
}

// ─── Media ────────────────────────────────────────────────────────────────

export async function uploadCover(projectId, file, expectedVersion) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expectedVersion', String(expectedVersion));
  const response = await fetch(`${API_URL}/projects/${projectId}/media/cover`, {
    method: 'POST',
    headers: getAuthHeadersOnly(),
    body: formData
  });
  return handleResponse(response);
}

export async function uploadGallery(projectId, file, expectedVersion) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('expectedVersion', String(expectedVersion));
  const response = await fetch(`${API_URL}/projects/${projectId}/media/gallery`, {
    method: 'POST',
    headers: getAuthHeadersOnly(),
    body: formData
  });
  return handleResponse(response);
}

export async function deleteMedia(projectId, mediaId, expectedVersion) {
  const response = await fetch(`${API_URL}/projects/${projectId}/media/${mediaId}?expectedVersion=${expectedVersion}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
}

// ─── Public Profile Portfolio ─────────────────────────────────────────────

export async function getProfileProjects(profileSlug) {
  const response = await fetch(`${API_URL}/staff/${profileSlug}/projects`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

export async function getProfileProject(profileSlug, projectSlug) {
  const response = await fetch(`${API_URL}/staff/${profileSlug}/projects/${projectSlug}`, { headers: getAuthHeaders() });
  return handleResponse(response);
}

// ─── Error Classification ─────────────────────────────────────────────────

export function classifyError(error) {
  if (!error.status) return 'network';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 403) return 'forbidden';
  if (error.status === 404) return 'not_found';
  if (error.status === 409) return 'version_conflict';
  if (error.status === 413) return 'file_too_large';
  if (error.status === 422) return 'validation';
  if (error.status === 429) return 'rate_limited';
  if (error.status >= 500) return 'server_error';
  return 'unknown';
}

export function getErrorMessage(error) {
  const type = classifyError(error);
  const messages = {
    network: 'Network error. Check your connection and try again.',
    unauthorized: 'Please log in to continue.',
    forbidden: 'You don\'t have permission for this action.',
    not_found: 'Project not found.',
    version_conflict: 'This project was updated elsewhere. Please refresh.',
    file_too_large: 'File is too large. Maximum size is 5MB.',
    validation: error.message || 'Please check your input.',
    rate_limited: 'Too many requests. Please wait a moment.',
    server_error: 'Something went wrong. Please try again.',
    unknown: 'An unexpected error occurred.'
  };
  return messages[type] || messages.unknown;
}
