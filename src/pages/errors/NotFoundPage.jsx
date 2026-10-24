import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center text-4xl font-black mb-6 shadow-2xl">
        404
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h1>
      <p className="mt-3 text-sm text-slate-500 max-w-md">
        The retail URL or dashboard module you were looking for does not exist or has been relocated.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Button variant="outline" size="md" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button variant="primary" size="md" icon={Home} onClick={() => navigate('/app/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
