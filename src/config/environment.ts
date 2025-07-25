/**
 * Environment configuration for the frontend
 * Only VITE_ prefixed variables are available in the renderer process
 */

interface EnvironmentConfig {
  apiUrl: string;
  pusher: {
    host: string;
    port: number;
    key: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

export const env: EnvironmentConfig = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  pusher: {
    host: import.meta.env.VITE_PUSHER_HOST || "localhost",
    port: parseInt(import.meta.env.VITE_PUSHER_PORT || "6001", 10),
    key: import.meta.env.VITE_PUSHER_KEY || "app-key",
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Debug logging in development
if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    apiUrl: env.apiUrl,
    pusher: env.pusher,
    allEnvVars: import.meta.env,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  });
}

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = ['VITE_API_URL'] as const;
  
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      console.warn(`Warning: Environment variable ${varName} is not set. Using default value.`);
    }
  }
};

// Initialize environment validation
if (env.isDevelopment) {
  validateEnvironment();
}
