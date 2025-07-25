# Environment Configuration

This document explains how to configure environment variables for the Electron app to connect to different API endpoints.

## Overview

The app uses environment variables to configure the API URL and other settings. There are two types of environment variables:

1. **Frontend Variables** (prefixed with `VITE_`): These are exposed to the renderer process and can be accessed in React components
2. **Backend Variables** (no prefix): These are only available in the main process and backend code

## Configuration Files

### `.env` (Local Development)
Your local environment configuration. This file is gitignored and contains your personal settings.

```bash
# Frontend variables (exposed to renderer process)
VITE_API_URL=http://localhost:3000/api

# Backend variables (main process only)
DB_FILE_NAME=file:local.db
```

### `.env.development` (Development Default)
Default development configuration that gets committed to the repository.

### `.env.production` (Production Default)
Default production configuration.

### `.env.example`
Template showing all available environment variables with example values.

## Usage

### Setting the API URL

1. **For local development**: Update your `.env` file
   ```bash
   VITE_API_URL=http://localhost:3000/api
   ```

2. **For different environments**: Create environment-specific files
   ```bash
   # .env.staging
   VITE_API_URL=https://staging-api.yourapp.com/api
   
   # .env.production
   VITE_API_URL=https://api.yourapp.com/api
   ```

3. **For deployment**: Set environment variables in your deployment platform
   ```bash
   export VITE_API_URL=https://api.yourapp.com/api
   ```

### Accessing Environment Variables

#### In React Components (Frontend)
```typescript
import { env } from '@/config/environment';

// Use the configured API URL
console.log('API URL:', env.apiUrl);

// Check environment
if (env.isDevelopment) {
  console.log('Running in development mode');
}
```

#### Direct Access (Frontend)
```typescript
// Direct access to Vite environment variables
const apiUrl = import.meta.env.VITE_API_URL;
```

#### In Main Process (Backend)
```typescript
// Standard Node.js environment variables
const dbFile = process.env.DB_FILE_NAME;
const secretKey = process.env.SECRET_KEY;
```

## Environment Loading Order

Vite loads environment variables in this order (higher priority overrides lower):

1. `process.env` (system environment variables)
2. `.env.local` (local, gitignored)
3. `.env.[mode]` (e.g., `.env.production`)
4. `.env`

## Security

- **NEVER** put sensitive data in `VITE_` prefixed variables
- Frontend variables are bundled into the final app and visible to users
- Keep secrets (API keys, passwords, etc.) in backend-only variables
- Use `.env.local` for sensitive local development settings

## Examples

### Development Setup
```bash
# .env (for local development)
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=MyApp Dev

# Backend secrets (not exposed to frontend)
DATABASE_PASSWORD=local-dev-password
JWT_SECRET=local-dev-secret
```

### Production Deployment
```bash
# Environment variables set in deployment platform
export VITE_API_URL=https://api.myapp.com/api
export DATABASE_PASSWORD=production-secret
export JWT_SECRET=production-jwt-secret
```

### Staging Environment
```bash
# .env.staging
VITE_API_URL=https://staging-api.myapp.com/api
```

## Troubleshooting

1. **Environment variables not loading**: Make sure they start with `VITE_` for frontend access
2. **Variables undefined in production**: Ensure they're set in your deployment environment
3. **TypeScript errors**: Update `src/vite-env.d.ts` to include new `VITE_` variables
4. **Changes not reflected**: Restart the development server after changing environment files
