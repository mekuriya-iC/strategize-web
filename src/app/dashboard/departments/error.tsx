'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DepartmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Departments page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Something went wrong with departments
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        {error.message || 'An unexpected error occurred while loading departments. Please try again.'}
      </p>
      
      <Button
        onClick={reset}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </Button>
    </div>
  );
}
