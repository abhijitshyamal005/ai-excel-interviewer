// Application configuration

export const config = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // AI Services
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      maxTokens: 2000,
      temperature: 0.3,
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      model: 'gemini-pro',
    },
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: '24h',
    candidateTokenExpiresIn: '6h',
  },

  // Interview Settings
  interview: {
    maxDuration: 60 * 60, // 1 hour in seconds
    maxQuestions: 15,
    sessionTimeout: 60 * 60 * 4, // 4 hours
    autoSaveInterval: 30, // seconds
  },

  // Application
  app: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },

  // Email (for notifications)
  email: {
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  // File Storage
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
  },
} as const;

// Validation function
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (!config.ai.openai.apiKey && !config.ai.google.apiKey) {
    errors.push('Either OPENAI_API_KEY or GOOGLE_AI_API_KEY is required');
  }

  if (!config.auth.jwtSecret || config.auth.jwtSecret === 'your-secret-key') {
    errors.push('JWT_SECRET must be set to a secure value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Environment helpers
export const isDevelopment = config.app.nodeEnv === 'development';
export const isProduction = config.app.nodeEnv === 'production';
export const isTest = config.app.nodeEnv === 'test';