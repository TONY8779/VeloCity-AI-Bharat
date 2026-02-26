import { api } from './api';

export const collaborationService = {
  async shareProject(projectId, permissions = 'view') {
    return api.post(`/api/projects/${projectId}/share`, { permissions });
  },

  async accessShared(token) {
    return api.get(`/api/share/${token}`);
  },

  async revokeShare(projectId) {
    return api.delete(`/api/projects/${projectId}/share`);
  },

  async getCollaborators(projectId) {
    return api.get(`/api/projects/${projectId}/collaborators`);
  },

  async removeCollaborator(projectId, userId) {
    return api.delete(`/api/projects/${projectId}/collaborators/${userId}`);
  },

  async addComment(assetId, text, videoTimestamp = 0) {
    return api.post(`/api/assets/${assetId}/comments`, { text, videoTimestamp });
  },

  async getComments(assetId) {
    return api.get(`/api/assets/${assetId}/comments`);
  },

  async deleteComment(commentId) {
    return api.delete(`/api/comments/${commentId}`);
  },

  async getActivity(projectId, page = 1) {
    return api.get(`/api/projects/${projectId}/activity?page=${page}`);
  },
};
