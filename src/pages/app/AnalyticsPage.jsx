import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import { exportToCsv } from '../../utils/exportCsv';
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AnalyticsPage() {
  const { addToast } = useData();
  const [timeframe, setTimeframe] = useState('This Month');

  const growthMetrics = [
    {
      title: 'Revenue Growth',
      value: '18.5%',
      change: '+2.4% vs last month',
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Sales Growth',
      value: '12.5%',
      change: '+1.8% vs last month',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Customer Growth',
      value: '8.2%',
      change: '+0.5% vs last month',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Profit Growth',
      value: '15.3%',
      change: '+3.1% vs last month',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const revenueOverviewData = [
    { month: 'Jan', revenue: 520000, target: 480000 },
    { month: 'Feb', revenue: 580000, target: 520000 },
    { month: 'Mar', revenue: 640000, target: 590000 },
    { month: 'Apr', revenue: 710000, target: 650000 },
    { month: 'May', revenue: 760000, target: 700000 },
    { month: 'Jun', revenue: 810000, target: 750000 },
    { month: 'Jul', revenue: 845230, target: 800000 }
  ];

  const categoryData = [
    { name: 'Food & Grocery', value: 45.2, amount: 382000, color: '#6366F1' },
    { name: 'Beverages', value: 28.5, amount: 240800, color: '#06B6D4' },
    { name: 'Personal Care', value: 12.4, amount: 104800, color: '#F59E0B' },
    { name: 'Household', value: 8.1, amount: 68400, color: '#10B981' },
    { name: 'Others', value: 5.8, amount: 49230, color: '#8B5CF6' }
  ];

  const handleExport = () => {
    const rows = categoryData.map((c) => ({
      Category: c.name,
      'Share (%)': `${c.value}%`,
      'Total Revenue (INR)': c.amount,
      Period: 'July 2025'
    }));
    exportToCsv('retailmind_analytics_summary', rows);
    addToast('Analytics breakdown exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Detailed analytics and business insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none shadow-sm"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>

          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {growthMetrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.title}</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              {m.value}
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {m.change}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly gross sales vs target budget (₹ in Lakhs)</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
              +18.5% YoY
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueOverviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v / 100000}L`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155'
                  }}
                  formatter={(val) => `₹${Number(val).toLocaleString()}`}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="revenue"
                  name="Actual Revenue (₹)"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="target"
                  name="Target Budget (₹)"
                  fill="#E2E8F0"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales by Category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share of total retail store sales</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155'
                  }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.name}</span>
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-white">
                  <span>{cat.value}%</span>
                  <span className="text-slate-400 text-[11px] font-normal block">₹{(cat.amount / 1000).toFixed(1)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
