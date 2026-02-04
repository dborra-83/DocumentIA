// Environment variables with fallbacks
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  apiRegion: import.meta.env.VITE_API_REGION || 'us-east-1',

  // Cognito Configuration
  cognito: {
    userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
    userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
    region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  },

  // S3 Configuration
  s3: {
    documentsBucket: import.meta.env.VITE_DOCUMENTS_BUCKET || '',
    resultsBucket: import.meta.env.VITE_RESULTS_BUCKET || '',
  },

  // Application Configuration
  app: {
    name: 'Document Analysis',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    version: '1.0.0',
  },

  // File Upload Constraints
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxPdfPages: 100,
    allowedFileTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    allowedExtensions: ['.pdf', '.docx', '.txt'],
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },

  // UI Configuration
  ui: {
    colors: {
      primary: '#2563eb', // Blue
      secondary: '#10b981', // Green
      error: '#ef4444', // Red
      warning: '#f59e0b', // Amber
      background: '#ffffff', // White
    },
    debounceDelay: 300, // ms
    toastDuration: 5000, // ms
  },
} as const;

// Validate required configuration
export const validateConfig = (): boolean => {
  const required = [
    config.apiUrl,
    config.cognito.userPoolId,
    config.cognito.userPoolClientId,
  ];

  const missing = required.filter(value => !value);
  
  if (missing.length > 0) {
    console.error('Missing required configuration. Please check your .env file.');
    return false;
  }

  return true;
};

// Export individual configs for convenience
export const { apiUrl, apiRegion, cognito, s3, app, upload, pagination, ui } = config;
