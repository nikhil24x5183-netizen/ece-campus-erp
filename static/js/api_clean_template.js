/* Centralized REST API Client */
const API = {
  async request(url, options = {}) {
    options.headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          window.location.hash = '#/login';
        } else if (response.status === 403) {
          Toast.error(data.message || '403 Access Denied');
          if (data.redirect) {
            window.location.hash = data.redirect;
          }
        }
        throw new Error(data.message || data.error || 'Server error');
      }
      return data;
    } catch (err) {
      console.error('API Request Error:', err);
      throw err;
    }
  },

  get(url) {
    return this.request(url, { method: 'GET' });
  },

  post(url, body) {
    const isFormData = body instanceof FormData;
    return this.request(url, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },

  upload(url, formData) {
    return this.request(url, {
      method: 'POST',
      body: formData
    });
  },

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
};
