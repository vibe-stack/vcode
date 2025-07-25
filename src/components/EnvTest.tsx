import React from 'react';
import { env } from '@/config/environment';

export const EnvTest: React.FC = () => {
  React.useEffect(() => {
    console.log('🔧 Environment Test:', {
      apiUrl: env.apiUrl,
      pusher: env.pusher,
      allEnvVars: import.meta.env,
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
    });
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px' }}>
      <h3>Environment Test</h3>
      <pre>{JSON.stringify({
        apiUrl: env.apiUrl,
        pusher: env.pusher,
        isDevelopment: env.isDevelopment,
        isProduction: env.isProduction,
      }, null, 2)}</pre>
      <h4>Raw import.meta.env:</h4>
      <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
    </div>
  );
};
