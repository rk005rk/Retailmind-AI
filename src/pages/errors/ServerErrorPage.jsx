import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ServerCrash, RefreshCw } from 'lucide-react';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-4xl font-black mb-6 shadow-2xl">
        500
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">500 Server Error</h1>
      <p className="mt-3 text-sm text-slate-500 max-w-md">
        Our predictive AI engine experienced a temporary timeout. Please try refreshing your session.
      </p>

      <div className="mt-8">
        <Button variant="primary" size="md" icon={RefreshCw} onClick={() => window.location.reload()}>
          Reload Application
        </Button>
      </div>
    </div>
  );
}
