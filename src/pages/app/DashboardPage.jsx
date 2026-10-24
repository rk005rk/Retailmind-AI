import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  Calendar,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Package,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Inbox,
  BarChart2,
  Box,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  weeklySalesOverview,
  sparklineData,
  topSellingProducts,
  aiInsightsCards,
  inventorySummaryData,
  lowStockAlertsData,
  recentOrdersData
} from '../../data/mockData';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salesTimeframe, setSalesTimeframe] = useState('This Week');
  const [topProductsTimeframe, setTopProductsTimeframe] = useState('This Month');

  // Custom tooltip matching the screenshot
  const CustomSalesTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700/80 min-w-[140px]">
          <p className="text-slate-400 font-semibold border-b border-slate-700/60 pb-1">
            {label === 'Thu' ? 'Thu, 17 July' : `${label}, 22 July`}
          </p>
          <div className="flex items-center justify-between text-indigo-300 font-bold">
            <span>Sales (₹)</span>
            <span>{payload[0]?.value?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span>Orders</span>
            <span>{payload[1]?.value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 1. Greeting & Date Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Amit'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Date Widget */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm self-start sm:self-auto">
          <span>Tuesday, 22 July 2025</span>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 2. Top 5 Metric Cards with Wavy Mini Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Sales</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              ₹ 24,560
            </h3>
            <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">
              <span>↑ 12.5%</span> <span className="text-slate-400 font-normal">vs yesterday</span>
            </p>
          </div>

          <div className="h-10 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.todaySales}>
                <defs>
                  <linearGradient id="purpleSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#6366F1" strokeWidth={2} fill="url(#purpleSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Inbox className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Revenue</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              ₹ 8,45,230
            </h3>
            <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">
              <span>↑ 18.6%</span> <span className="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>

          <div className="h-10 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.monthlyRevenue}>
                <defs>
                  <linearGradient id="greenSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="url(#greenSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Total Profit */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Profit</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              ₹ 2,45,760
            </h3>
            <p className="text-[11px] font-bold text-emerald-500 mt-1 flex items-center gap-0.5">
              <span>↑ 15.3%</span> <span className="text-slate-400 font-normal">vs last month</span>
            </p>
          </div>

          <div className="h-10 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.totalProfit}>
                <defs>
                  <linearGradient id="amberSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#F59E0B" strokeWidth={2} fill="url(#amberSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Box className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Products</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              1,245
            </h3>
            <p className="text-[11px] font-bold text-blue-500 mt-1 flex items-center gap-0.5">
              <span>+ 24</span> <span className="text-slate-400 font-normal">new this month</span>
            </p>
          </div>

          <div className="h-10 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.totalProducts}>
                <defs>
                  <linearGradient id="blueSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} fill="url(#blueSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 5: Low Stock Items */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Low Stock Items</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              14
            </h3>
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center gap-0.5"
            >
              <span>View low stock</span> <span>→</span>
            </button>
          </div>

          <div className="h-10 w-full mt-2 -mx-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.lowStockItems}>
                <defs>
                  <linearGradient id="redSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#EF4444" strokeWidth={2} fill="url(#redSpark)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Sales Overview (Left), Top Selling Products (Center), AI Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Col 1: Sales Overview (Span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sales Overview</h3>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg cursor-pointer">
              <span>{salesTimeframe}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold mb-2">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-1 bg-indigo-600 rounded-full" /> Sales (₹)
            </span>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-emerald-400" /> Orders
            </span>
          </div>

          {/* Dual Axis Multi-Line Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySalesOverview} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} domain={[0, 50000]} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<CustomSalesTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366F1' }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 2: Top Selling Products (Span 4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Selling Products</h3>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg cursor-pointer">
                <span>{topProductsTimeframe}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 space-y-1">
              {topSellingProducts.map((p) => (
                <div key={p.rank} className="pt-2 pb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-3">{p.rank}</span>
                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.unitSold}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                    {p.revenue}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All Products →
            </button>
          </div>
        </div>

        {/* Col 3: AI Insights (Span 3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">AI Insights</h3>
            </div>

            {/* 3 Insights Cards */}
            <div className="space-y-2.5">
              {/* Card 1: Green */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sales are higher on weekends</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    You can expect 20-25% more sales this weekend.
                  </p>
                </div>
              </div>

              {/* Card 2: Orange */}
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Milk products demand increased</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Stock up more milk products for next week.
                  </p>
                </div>
              </div>

              {/* Card 3: Blue */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Low stock alert</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    14 products are running low. Reorder soon to avoid stockouts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate('/app/ai-prediction')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All Insights →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Inventory Summary (Left), Low Stock Alerts (Center), Recent Orders (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Col 1: Inventory Summary */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Inventory Summary</h3>

            {/* Donut Chart with Breakdown */}
            <div className="flex items-center gap-4">
              {/* Donut */}
              <div className="h-36 w-36 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventorySummaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {inventorySummaryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm font-black text-slate-900 dark:text-white">1,245</span>
                  <span className="text-[10px] text-slate-400 font-medium">Total</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-1.5 text-xs">
                {inventorySummaryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ml-2 whitespace-nowrap">
                      {item.count} ({item.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Full Inventory →
            </button>
          </div>
        </div>

        {/* Col 2: Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Low Stock Alerts</h3>
              <button
                onClick={() => navigate('/app/inventory')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {lowStockAlertsData.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-500">
                        Current Stock: <span className="font-bold text-rose-500">{item.currentStock} units</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Reorder Level: {item.reorderLevel} units
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 text-[11px] font-bold border border-rose-200/60 dark:border-rose-900/60">
                    Low
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Recent Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Orders</h3>
              <button
                onClick={() => navigate('/app/sales')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {recentOrdersData.map((ord) => (
                <div key={ord.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{ord.orderNumber}</p>
                    <p className="text-[11px] text-slate-400">{ord.date}</p>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">{ord.amount}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        ord.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : ord.status === 'Processing'
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Footer matching image */}
      <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <p>© 2025 RetailMind AI. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Made with <span className="text-rose-500">❤️</span> for Retail Businesses
        </p>
      </div>
    </div>
  );
}
