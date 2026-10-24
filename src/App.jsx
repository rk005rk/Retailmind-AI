import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';

// Landing Page
import LandingPage from './pages/landing/LandingPage';

// Onboarding Wizard
import BusinessSetupWizard from './pages/onboarding/BusinessSetupWizard';

// App Admin Layout & Pages
import AppLayout from './pages/app/AppLayout';
import DashboardPage from './pages/app/DashboardPage';
import InventoryPage from './pages/app/InventoryPage';
import SalesPage from './pages/app/SalesPage';
import PurchasePage from './pages/app/PurchasePage';
import CustomersPage from './pages/app/CustomersPage';
import SuppliersPage from './pages/app/SuppliersPage';
import AnalyticsPage from './pages/app/AnalyticsPage';
import AiPredictionPage from './pages/app/AiPredictionPage';
import DemandForecastPage from './pages/app/DemandForecastPage';
import BusinessAssistantPage from './pages/app/BusinessAssistantPage';
import DeadStockPage from './pages/app/DeadStockPage';
import NotificationsPage from './pages/app/NotificationsPage';
import ReportsPage from './pages/app/ReportsPage';
import SettingsPage from './pages/app/SettingsPage';
import ProfilePage from './pages/app/ProfilePage';
import HelpSupportPage from './pages/app/HelpSupportPage';

// Error Pages
import NotFoundPage from './pages/errors/NotFoundPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import ServerErrorPage from './pages/errors/ServerErrorPage';

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Routes>

          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Main Admin App */}
          <Route path="/app" element={<AppLayout />}>
            <Route
              index
              element={<Navigate to="/app/dashboard" replace />}
            />

            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="purchase" element={<PurchasePage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="ai-prediction" element={<AiPredictionPage />} />
            <Route path="demand-forecast" element={<DemandForecastPage />} />
            <Route path="assistant" element={<BusinessAssistantPage />} />
            <Route path="dead-stock" element={<DeadStockPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="help-support" element={<HelpSupportPage />} />

            {/* App Error Pages */}
            <Route path="403" element={<ForbiddenPage />} />
            <Route path="500" element={<ServerErrorPage />} />
          </Route>

          {/* Onboarding */}
          <Route
            path="/onboarding"
            element={<BusinessSetupWizard />}
          />

          {/* Catch-all 404 */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />

        </Routes>
      </DataProvider>
    </ThemeProvider>
  );
}