import axios from 'axios';

// 动态获取API基础URL，支持部署环境配置
const getApiBaseUrl = () => {
  // 1. 首先检查环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. 在生产环境中，如果前端部署在AWS，使用相对路径（通过nginx代理）
  if (process.env.NODE_ENV === 'production') {
    return '/api/v1';
  }
  
  // 3. 开发环境默认使用localhost
  return 'http://localhost:8080/api/v1';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Resume API functions
export const resumeApi = {
  // Upload a resume
  uploadResume: async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    return api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get a list of user's resumes
  getResumes: async (userId: string) => {
    return api.get(`/resumes?user_id=${userId}`);
  },

  // Get a specific resume
  getResume: async (resumeId: string) => {
    return api.get(`/resumes/${resumeId}`);
  },

  // Parse a resume
  parseResume: async (resumeId: string) => {
    return api.post(`/resumes/${resumeId}/parse`);
  },

  // Analyze a resume
  analyzeResume: async (resumeId: string) => {
    return api.post(`/resumes/${resumeId}/analyze`);
  },

  // Get analysis for a resume
  getAnalysis: async (resumeId: string) => {
    return api.get(`/analyses/${resumeId}`);
  },

  // Get job suggestions for a resume
  getJobSuggestions: async (resumeId: string) => {
    return api.get(`/resumes/${resumeId}/job-suggestions`);
  },

  // Update resume content
  updateResumeContent: async (resumeId: string, content: any) => {
    return api.put(`/resumes/${resumeId}/content`, { content });
  },
  
  // Download optimized resume
  downloadResume: async (resumeId: string) => {
    return api.get(`/resumes/${resumeId}/download`, {
      responseType: 'blob',
    });
  },
  
  // AI优化简历内容（section或bullet point）
  optimizeContent: async (resumeId: string, data: {
    sectionKey: string;
    itemIndex?: number;
    bulletIndex?: number;
    nestedSection?: string;
    nestedItemIndex?: number;
    currentContent: string;
    jobTitle?: string;
  }) => {
    return api.post(`/resumes/${resumeId}/optimize-content`, data);
  },

  // 删除简历
  deleteResume: async (resumeId: string) => {
    return api.delete(`/resumes/${resumeId}`);
  },

  // Generate custom formatted PDF resume
  generateCustomPDF: async (resumeId: string) => {
    return api.get(`/resumes/${resumeId}/generate-pdf`, {
      responseType: 'blob',
    });
  },
};

// Auth API functions
export const authApi = {
  // Verify Google token with backend (placeholder for future implementation)
  verifyGoogleToken: async (token: string) => {
    // This would be implemented to send the Google token to your backend for verification
    // For now, we'll just simulate a successful response
    return Promise.resolve({
      data: {
        status: 'success',
        data: {
          id: 'google-user-123',
          name: 'Test User',
          email: 'testuser@example.com',
          picture: 'https://example.com/profile.jpg'
        }
      }
    });
  }
};

export default api; 