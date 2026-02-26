import { api } from './api';

export const projectService = {
  async create(data) {
    return api.post('/api/projects', data);
  },

  async list() {
    return api.get('/api/projects');
  },

  async get(id) {
    return api.get(`/api/projects/${id}`);
  },

  async update(id, data) {
    return api.put(`/api/projects/${id}`, data);
  },

  async remove(id) {
    return api.delete(`/api/projects/${id}`);
  },

  async saveState(id, state) {
    return api.post(`/api/projects/${id}/save-state`, state);
  },
};
