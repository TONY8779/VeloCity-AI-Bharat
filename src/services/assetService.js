import { api } from './api';

export const assetService = {
  async upload(file, tags = [], projectId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (tags.length) formData.append('tags', JSON.stringify(tags));
    if (projectId) formData.append('projectId', projectId);
    return api.upload('/api/assets/upload', formData);
  },

  async list(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== '') params.set(key, val);
    }
    return api.get(`/api/assets?${params.toString()}`);
  },

  async get(id) {
    return api.get(`/api/assets/${id}`);
  },

  async updateTags(id, tags) {
    return api.put(`/api/assets/${id}/tags`, { tags });
  },

  async remove(id) {
    return api.delete(`/api/assets/${id}`);
  },

  async restore(id) {
    return api.post(`/api/assets/${id}/restore`);
  },

  async getStorage() {
    return api.get('/api/assets/storage');
  },
};
