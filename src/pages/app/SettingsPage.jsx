import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import {
  Settings,
  User,
  Building,
  ShieldCheck,
  Bell,
  Sliders,
  Share2,
  Camera,
  Save,
  Moon,
  Sun
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useData();

  const [activeTab, setActiveTab] = useState('Profile');

  const [profile, setProfile] = useState({
    name: 'Amit Verma',
    email: 'amit@retailmind.com',
    phone: '+91 98765 43210',
    role: 'Owner & General Manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80'
  });

  const [business, setBusiness] = useState({
    name: 'Verma Supermart',
    category: 'Supermarket & Grocery',
    address: '124, 100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038',
    gstin: '29AAAAA0000A1Z5',
    currency: 'INR (₹)'
  });

  const [preferences, setPreferences] = useState({
    theme: theme,
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    autoBackup: true
  });

  const [twoFactor, setTwoFactor] = useState(true);

  const [integrations, setIntegrations] = useState({
    whatsapp: true,
    tally: true,
    zoho: false,
    phonepe: true
  });

  const tabs = [
    { id: 'Profile', label: 'Profile Information', icon: User },
    { id: 'Business', label: 'Business Information', icon: Building },
    { id: 'Preferences', label: 'Preferences', icon: Sliders },
    { id: 'Security', label: 'Security & 2FA', icon: ShieldCheck },
    { id: 'Notifications', label: 'Notification Settings', icon: Bell },
    { id: 'Integrations', label: 'Integrations & Sync', icon: Share2 }
  ];

  const handleSaveAll = (e) => {
    if (e) e.preventDefault();
    addToast('Settings preferences saved successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store details, personal profile, preferences, and system integrations.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Save} onClick={handleSaveAll}>
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          {activeTab === 'Profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Profile Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your store manager credentials and contact information.</p>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-600 shadow-sm"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{profile.name}</h4>
                  <p className="text-xs text-slate-500">{profile.role}</p>
                  <button
                    type="button"
                    onClick={() => addToast('Photo uploaded successfully!', 'info')}
                    className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change Profile Photo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Business' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Business Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage legal store entities, GST taxation and invoicing location.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Store / Business Name</label>
                  <input
                    type="text"
                    value={business.name}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Business Category</label>
                  <select
                    value={business.category}
                    onChange={(e) => setBusiness({ ...business, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                    <option value="FMCG Wholesaler">FMCG Wholesaler</option>
                    <option value="Department Store">Department Store</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Store Address</label>
                  <input
                    type="text"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={business.gstin}
                    onChange={(e) => setBusiness({ ...business, gstin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Default Currency</label>
                  <input
                    type="text"
                    value={business.currency}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Display & System Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure visual themes, locale formats, and language.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">System Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="English">English (India)</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date Format</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Active Theme Mode</h4>
                  <p className="text-xs text-slate-500">Switch between light SaaS mode and dark navy executive mode.</p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-2"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Access Controls</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Change your password and configure Two-Factor Authentication (2FA).</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA via SMS/WhatsApp)</h4>
                  <p className="text-xs text-slate-500">Require an OTP verification code whenever logging in from a new POS terminal.</p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => {
                    setTwoFactor(e.target.checked);
                    addToast(`2FA is now ${e.target.checked ? 'Enabled' : 'Disabled'}`, 'info');
                  }}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Change Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose which alerts you want to receive on your phone and dashboard.</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Low Stock Alerts', desc: 'Notify immediately when an item hits reorder threshold' },
                  { label: 'New Customer Orders', desc: 'Push alert for online and counter orders' },
                  { label: 'Daily AI Demand Summaries', desc: 'Morning WhatsApp digest of expected inventory velocity' },
                  { label: 'Supplier Delivery Updates', desc: 'Notifications when incoming shipments arrive at warehouse' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</h4>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connected Retail Integrations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Connect your accounting, messaging, and payment providers.</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'WhatsApp Business API', desc: 'Send receipts and automated restock alerts to customers & suppliers', key: 'whatsapp' },
                  { name: 'Tally Prime Cloud Sync', desc: 'Real-time 2-way ledger and inventory sync with Tally ERP', key: 'tally' },
                  { name: 'Zoho Books & GST Filing', desc: 'Automatic e-invoicing and GSTR-1 preparation', key: 'zoho' },
                  { name: 'PhonePe & PayTM QR Integration', desc: 'Dynamic QR codes on bills with instant payment webhook', key: 'phonepe' }
                ].map((integ) => (
                  <div key={integ.key} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{integ.name}</h4>
                      <p className="text-xs text-slate-500">{integ.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIntegrations({ ...integrations, [integ.key]: !integrations[integ.key] });
                        addToast(`${integ.name} is now ${!integrations[integ.key] ? 'Connected' : 'Disconnected'}`, 'info');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        integrations[integ.key]
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {integrations[integ.key] ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button variant="primary" size="md" icon={Save} onClick={handleSaveAll}>
              Save {activeTab} Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
