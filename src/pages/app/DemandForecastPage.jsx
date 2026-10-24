import React from 'react';
import { TrendingUp, Calendar, Zap, SunMedium } from 'lucide-react';
import Badge from '../../components/common/Badge';

export default function DemandForecastPage() {
  const factors = [
    { name: 'Festival Boost (Diwali & Navratri)', impact: '+42% Demand Surge', status: 'High Impact', icon: Zap },
    { name: 'Weekend Shopping Surge', impact: '+35% Friday-Sunday', status: 'Weekly Repeat', icon: SunMedium },
    { name: 'Monsoon Seasonality', impact: '-12% Footfall (Mid-Aug)', status: 'Weather Factor', icon: Calendar },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-brand-500" /> Seasonality & Demand Forecasting
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Analyze festival multipliers, weekend traffic surges, and regional weather impact on retail inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {factors.map((f) => (
          <div key={f.name} className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <f.icon className="w-5 h-5" />
              </div>
              <Badge variant="info">{f.status}</Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.name}</h3>
            <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{f.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
