import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for consistent error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorDetails = {
      message: error.message || 'An unexpected network error occurred',
      status: error.response?.status,
      data: error.response?.data,
      isAxiosError: true,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    };

    if (error.code === 'ECONNABORTED') {
      errorDetails.message = 'Request timeout: backend server took too long to respond.';
    } else if (!error.response) {
      errorDetails.message = `Cannot reach backend API server at ${baseURL}. Ensure backend is running.`;
    }

    return Promise.reject(errorDetails);
  }
);

// High-level API service methods
export const api = {
  // System Health
  checkHealth: () => apiClient.get('/api/health'),

  // Dashboard
  getDashboardSummary: () => apiClient.get('/api/dashboard/summary'),

  // Global Analytics
  getGlobalSummary: () => apiClient.get('/api/global/summary'),
  getGlobalCountries: () => apiClient.get('/api/global/countries'),
  getGlobalTimeline: (params) => apiClient.get('/api/global/timeline', { params }),
  getGlobalComparison: (countries) => apiClient.get('/api/global/comparison', { params: { countries } }),

  // India Analytics
  getIndiaOverview: () => apiClient.get('/api/india/overview'),
  getIndiaStates: () => apiClient.get('/api/india/states'),
  getIndiaTimeline: (params) => apiClient.get('/api/india/timeline', { params }),

  // Trends
  getTrendsSummary: () => apiClient.get('/api/trends/summary'),
  getWavesAnalysis: () => apiClient.get('/api/trends/waves'),
  getExcessDeaths: (params) => apiClient.get('/api/trends/excess-deaths', { params }),

  // Prediction / Forecasting
  getPredictionModels: () => apiClient.get('/api/prediction/models'),
  predictCases: (payload) => apiClient.post('/api/prediction/forecast', payload),

  // Data Explorer
  queryData: (params) => apiClient.get('/api/data/explore', { params }),
  exportCsvUrl: (params) => {
    const query = new URLSearchParams(params).toString();
    return `${baseURL}/api/data/export?${query}`;
  },

  // Data Analysis
  getAnalysisStats: () => apiClient.get('/api/analysis/stats'),
  getCorrelationMatrix: () => apiClient.get('/api/analysis/correlations'),

  // Model Performance
  getModelMetrics: () => apiClient.get('/api/models/performance'),
};

export default apiClient;
