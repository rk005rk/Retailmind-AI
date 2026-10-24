import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  Truck,
  Brain,
  BarChart2,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  Sparkles,
  Bot,
  ArrowRight
} from 'lucide-react';

export default function AppSidebar({ isMobileOpen, setIsMobileOpen }) {
  const { user } = useAuth();
  const { notifications } = useData();
  const navigate = useNavigate();

  const unreadNotifCount = notifications.filter((n) => !n.read).length || 12;

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Inventory', path: '/app/inventory', icon: Package },
    { name: 'Sales', path: '/app/sales', icon: TrendingUp },
    { name: 'Purchase', path: '/app/purchase', icon: ShoppingCart },
    { name: 'Customers', path: '/app/customers', icon: Users },
    { name: 'Suppliers', path: '/app/suppliers', icon: Truck },
    { name: 'AI Predictions', path: '/app/ai-prediction', icon: Brain, isAi: true },
    { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
    { name: 'Reports', path: '/app/reports', icon: FileText },
    { name: 'Notifications', path: '/app/notifications', icon: Bell, badge: unreadNotifCount, badgeColor: 'bg-indigo-600' },
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'Help & Support', path: '/app/help-support', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#0F172A] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center border-b border-slate-800/80">
          <NavLink to="/app/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg text-white tracking-tight">RetailMind</span>
                <span className="text-xs font-bold text-indigo-400">AI</span>
              </div>
              <p className="text-[11px] text-slate-400">Smart Inventory, Higher Profits</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full bg-indigo-500">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom Cards in Sidebar */}
        <div className="p-3.5 space-y-3 border-t border-slate-800/80 bg-[#0B1120]">
          {/* Card 1: AI Business Assistant */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="text-xs font-bold text-white">AI Business Assistant</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Hi {user?.name?.split(' ')[0] || 'Amit'}! 👋</p>
                <p className="text-[11px] text-slate-400">How can I help you today?</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileOpen(false);
                navigate('/app/assistant');
              }}
              className="mt-3 w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask RetailMind AI</span>
            </button>
          </div>

          {/* Card 2: Business Health Score */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Business Health Score</span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md">Good</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">85</span>
              <span className="text-xs text-slate-400 font-semibold">/ 100</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
            </div>

            <NavLink
              to="/app/analytics"
              onClick={() => setIsMobileOpen(false)}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 pt-1 group"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
}
