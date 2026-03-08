const API_BASE = '';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('velocity_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('velocity_token', token);
    } else {
      localStorage.removeItem('velocity_token');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    // Always read fresh from localStorage (token may be set after login)
    const token = localStorage.getItem('velocity_token') || this.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}`, options);

    if (res.status === 401) {
      // Only auto-logout for explicit auth-check endpoints
      const isAuthCheck = path === '/auth/me' || path === '/auth/youtube/status';
      if (isAuthCheck) {
        this.setToken(null);
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  get(path) { return this.request('GET', path); }
  post(path, body) { return this.request('POST', path, body); }
  put(path, body) { return this.request('PUT', path, body); }
  delete(path) { return this.request('DELETE', path); }

  async upload(path, formData) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }

    return res.json();
  }
}

export const api = new ApiClient();
