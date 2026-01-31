import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface pour les réponses d'erreur de l'API
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
  path: string;
}

// Fonction utilitaire pour extraire le message d'erreur de l'API
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Si l'API a retourné une réponse avec un message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Si l'API a retourné des erreurs de validation multiples
    if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
      return axiosError.response.data.errors[0];
    }

    // Erreur réseau
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }

    // Timeout
    if (axiosError.code === 'ECONNABORTED') {
      return 'La requête a pris trop de temps. Veuillez réessayer.';
    }

    // Statuts HTTP courants
    switch (axiosError.response?.status) {
      case 400:
        return 'Les données envoyées sont invalides.';
      case 401:
        return 'Vous devez être connecté pour effectuer cette action.';
      case 403:
        return 'Vous n\'avez pas les droits pour effectuer cette action.';
      case 404:
        return 'La ressource demandée n\'existe pas.';
      case 409:
        return 'Cette ressource existe déjà.';
      case 422:
        return 'Les données envoyées sont invalides.';
      case 500:
        return 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
      case 502:
      case 503:
      case 504:
        return 'Le service est temporairement indisponible. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  // Erreur JavaScript générique
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inattendue est survenue.';
}

// Fonction pour obtenir tous les messages d'erreur (pour les formulaires)
export function getApiErrorMessages(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    if (axiosError.response?.data?.errors && axiosError.response.data.errors.length > 0) {
      return axiosError.response.data.errors;
    }

    if (axiosError.response?.data?.message) {
      return [axiosError.response.data.message];
    }
  }

  return [getApiErrorMessage(error)];
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = useAuthStore.getState().tokens;
      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.data;
          useAuthStore.getState().setTokens(newTokens);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
