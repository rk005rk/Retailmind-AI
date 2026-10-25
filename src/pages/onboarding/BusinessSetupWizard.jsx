import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import {
  Brain,
  Building2,
  Warehouse,
  Sliders,
  Truck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BusinessSetupWizard() {
  const { user, completeOnboarding } = useAuth();
  const { addToast } = polikjuhytgffrde();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    businessName: user?.businessName || 'Apex SuperRetail Store',
    businessType: user?.businessType || 'Supermarket',
    warehouseName: 'Central Warehouse (BLR)',
    warehouseCity: 'Bengaluru',
    lowStockAlertLevel: 15,
    currency: 'INR (₹)',
    gstRate: 18,
    language: 'English',
    primarySupplier: 'Apex Logistics & Tech',
    supplierLeadTime: 3,
  });

  const handleChange = (e) => {
    setWizardData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const steps = [
    { num: 1, title: 'Business Info', icon: Building2 },
    { num: 2, title: 'Warehouse', icon: Warehouse },
    { num: 3, title: 'Inventory Settings', icon: Sliders },
    { num: 4, title: 'Supplier Details', icon: Truck },
    { num: 5, title: 'Finish & Launch', icon: CheckCircle },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding(wizardData);
      addToast('Business setup complete! Welcome to your dashboard.', 'success');
      navigate('/app/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
            <span>Welcome to RetailMind AI</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Let's setup your business in under 5 minutes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Configure your AI prediction baseline, currency preferences, and warehouse settings.
          </p>
        </div>

        {/* Wizard Steps Stepper */}
        <div className="glass-panel p-4 sm:p-6 rounded-3xl mb-8">
          <div className="flex items-center justify-between relative">
            {/* Step Line */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 -z-10" />
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-300 -z-10"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />

            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;
              return (
                <div key={step.num} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isActive
                        ? 'bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-lg shadow-brand-600/30 scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[11px] font-semibold hidden sm:block ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Card Content */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative border border-slate-200/80 dark:border-slate-800">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1: Business Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-500" />
                    Step 1: Business Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Business Name</label>
                      <input
                        type="text"
                        name="businessName"
                        value={wizardData.businessName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Store Category</label>
                      <select
                        name="businessType"
                        value={wizardData.businessType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Supermarket / Hypermarket">Supermarket / Hypermarket</option>
                        <option value="Electronics & Tech Store">Electronics & Tech Store</option>
                        <option value="Apparel & Fashion Boutique">Apparel & Fashion Boutique</option>
                        <option value="Pharmacy & Health">Pharmacy & Health</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Warehouse Setup */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-cyan-500" />
                    Step 2: Primary Warehouse
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warehouse Name</label>
                      <input
                        type="text"
                        name="warehouseName"
                        value={wizardData.warehouseName}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Warehouse Location City</label>
                      <input
                        type="text"
                        name="warehouseCity"
                        value={wizardData.warehouseCity}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Inventory Settings */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-500" />
                    Step 3: Inventory Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert Level</label>
                      <input
                        type="number"
                        name="lowStockAlertLevel"
                        value={wizardData.lowStockAlertLevel}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400">Trigger low stock alert when inventory falls below this number</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                      <select
                        name="currency"
                        value={wizardData.currency}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      >
                        <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                        <option value="USD ($)">USD ($) - US Dollar</option>
                        <option value="EUR (€)">EUR (€) - Euro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Standard GST % Rate</label>
                      <input
                        type="number"
                        name="gstRate"
                        value={wizardData.gstRate}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dashboard Language</label>
                      <select
                        name="language"
                        value={wizardData.language}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Supplier Details */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-500" />
                    Step 4: Primary Supplier Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Supplier Name</label>
                      <input
                        type="text"
                        name="primarySupplier"
                        value={wizardData.primarySupplier}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Average Lead Time (Days)</label>
                      <input
                        type="number"
                        name="supplierLeadTime"
                        value={wizardData.supplierLeadTime}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Finish */}
              {currentStep === 5 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Setup Complete & Ready!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    Your retail profile for <span className="font-bold text-brand-600">{wizardData.businessName}</span> has been configured with AI demand prediction models.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="ghost"
              size="md"
              onClick={handlePrev}
              disabled={currentStep === 1}
              icon={ArrowLeft}
            >
              Back
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              icon={currentStep === 5 ? CheckCircle : ArrowRight}
            >
              {currentStep === 5 ? 'Launch Main Dashboard' : 'Next Step'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
