import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../../components/common/AppSidebar';
import AppHeader from '../../components/common/AppHeader';
import ToastContainer from '../../components/common/ToastContainer';

export default function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Navigation */}
      <AppSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <AppHeader setIsMobileOpen={setIsMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Notifications Toast Container */}
      <ToastContainer />
    </div>
  );
}
