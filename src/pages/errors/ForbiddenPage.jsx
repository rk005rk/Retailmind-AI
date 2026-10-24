import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ShieldAlert, Home } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center text-4xl font-black mb-6 shadow-2xl">
        403
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">403 Forbidden Access</h1>
      <p className="mt-3 text-sm text-slate-500 max-w-md">
        You do not have administrative permissions to view this retail module. Please contact your store owner.
      </p>

      <div className="mt-8">
        <Button variant="primary" size="md" icon={Home} onClick={() => navigate('/app/dashboard')}>
          Return to Safe Dashboard
        </Button>
      </div>
    </div>
  );
}
