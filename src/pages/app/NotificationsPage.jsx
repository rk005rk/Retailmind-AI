import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import {
  Bell,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Package,
  FileText,
  Trash2,
  Check
} from 'lucide-react';

export default function NotificationsPage() {
  const { markAllNotificationsAsRead, addToast } = useData();

  const initialList = [
    {
      id: 1,
      type: 'stock',
      title: 'Low Stock Alert',
      description: '14 products are running low on stock. Amul Milk and Parle-G need immediate replenishment.',
      time: '3 min ago',
      read: false,
      icon: AlertTriangle,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
    },
    {
      id: 2,
      type: 'order',
      title: 'New Order Received',
      description: 'Order #9202 - ₹8,450 has been placed by Rahul Sharma for home delivery.',
      time: '15 min ago',
      read: false,
      icon: ShoppingBag,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      description: 'Payment of ₹18,450 received via UPI Instant from Priya Singh for invoice #INV-8831.',
      time: '1 hour ago',
      read: false,
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60'
    },
    {
      id: 4,
      type: 'ai',
      title: 'Stock Reorder Suggested',
      description: 'AI suggests reordering 5 products based on weekend footfall surge predictions.',
      time: '2 hours ago',
      read: true,
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60'
    },
    {
      id: 5,
      type: 'report',
      title: 'Monthly Report Ready',
      description: 'July 2025 financial and inventory audit report is ready to download and view.',
      time: '3 hours ago',
      read: true,
      icon: FileText,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60'
    }
  ];

  const [notifList, setNotifList] = useState(initialList);
  const [filter, setFilter] = useState('All');

  const filtered = notifList.filter((n) => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Stock Alerts') return n.type === 'stock';
    if (filter === 'Orders') return n.type === 'order';
    if (filter === 'Payments') return n.type === 'payment';
    if (filter === 'AI Insights') return n.type === 'ai';
    return true;
  });

  const handleMarkAll = () => {
    setNotifList(notifList.map((n) => ({ ...n, read: true })));
    if (markAllNotificationsAsRead) markAllNotificationsAsRead();
    addToast('All notifications marked as read', 'info');
  };

  const handleToggleRead = (id) => {
    setNotifList(
      notifList.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const handleDelete = (id) => {
    setNotifList(notifList.filter((n) => n.id !== id));
    addToast('Notification removed', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stay updated with important alerts.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Check} onClick={handleMarkAll}>
          Mark all as read
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {['All', 'Unread', 'Stock Alerts', 'Orders', 'Payments', 'AI Insights'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.read ? 'bg-indigo-50/25 dark:bg-indigo-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${n.color}`}>
                  <n.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {n.description}
                  </p>
                  <span className="text-[11px] text-slate-400 font-semibold mt-2 inline-block">
                    {n.time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleRead(n.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {n.read ? 'Mark unread' : 'Mark read'}
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications found under this filter.
          </div>
        )}
      </div>
    </div>
  );
}
