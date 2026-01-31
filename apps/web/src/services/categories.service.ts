import api from './api';
import type { Category } from '@moneystack/shared';

export interface CreateCategoryDto {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await api.post('/categories', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  getByType: async (type: 'INCOME' | 'EXPENSE'): Promise<Category[]> => {
    const response = await api.get(`/categories?type=${type}`);
    return response.data.data;
  },
};
