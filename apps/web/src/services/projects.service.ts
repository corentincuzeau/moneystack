import api from './api';
import type { Project, ProjectContribution } from '@moneystack/shared';

export interface CreateProjectDto {
  accountId?: string;
  name: string;
  description?: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  status?: string;
}

export interface AddContributionDto {
  accountId: string;
  amount: number;
  notes?: string;
}

export const projectsService = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addContribution: async (projectId: string, data: AddContributionDto): Promise<ProjectContribution> => {
    const response = await api.post(`/projects/${projectId}/contributions`, data);
    return response.data.data;
  },

  getContributions: async (projectId: string): Promise<ProjectContribution[]> => {
    const response = await api.get(`/projects/${projectId}/contributions`);
    return response.data.data;
  },
};
