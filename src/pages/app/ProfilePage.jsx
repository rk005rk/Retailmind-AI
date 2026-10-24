import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { User, Mail, Phone, MapPin, Building, ShieldCheck, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card p-8 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-24 h-24 rounded-3xl object-cover border-4 border-brand-500/30 shadow-xl"
        />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h1>
            <Badge variant="info">{user?.role}</Badge>
          </div>
          <p className="text-xs text-slate-500 font-semibold">{user?.email}</p>
          <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">{user?.businessName}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Edit3}
          onClick={() => navigate('/app/settings')}
        >
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" /> Account Information
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Email: <span className="font-bold text-slate-900 dark:text-white">{user?.email}</span></p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Phone: <span className="font-bold text-slate-900 dark:text-white">{user?.phone}</span></p>
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Role Access: <span className="font-bold text-slate-900 dark:text-white">{user?.role} Access</span></p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-500" /> Business Details
          </h3>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <p>Store: <span className="font-bold text-slate-900 dark:text-white">{user?.businessName}</span></p>
            <p>Category: <span className="font-bold text-slate-900 dark:text-white">{user?.businessType}</span></p>
            <p>GSTIN: <span className="font-bold text-slate-900 dark:text-white font-mono">{user?.gst}</span></p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Address: <span className="font-bold text-slate-900 dark:text-white">{user?.address}, {user?.city}, {user?.state}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
