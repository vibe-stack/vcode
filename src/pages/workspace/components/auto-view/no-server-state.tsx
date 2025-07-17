import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface NoServerStateProps {
  terminalContentsLength: number;
}

export const NoServerState: React.FC<NoServerStateProps> = ({ terminalContentsLength }) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No development servers detected. Start your application's development server and it will appear automatically, or enter a custom URL above.
          {terminalContentsLength === 0 && (
            <div className="mt-2 text-sm">
              💡 Try opening a terminal and running a dev server (e.g., npm start, npm run dev).
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
