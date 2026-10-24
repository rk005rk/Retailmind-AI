import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Starter Store',
      priceMonthly: 1899,
      priceAnnual: 1499,
      description: 'Ideal for independent boutiques and single-outlet retail shops.',
      features: [
        'Up to 1,000 Active Products',
        '1 Cloud POS Terminal',
        'Basic Sales Prediction AI',
        'Low Stock Instant Alerts',
        'GST Invoice Generation',
        'Email Support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: false,
    },
    {
      name: 'Professional',
      priceMonthly: 4999,
      priceAnnual: 3999,
      description: 'Designed for growing stores requiring deep demand forecasting and AI insights.',
      features: [
        'Up to 10,000 Active Products',
        '5 Cloud POS Terminals',
        'Advanced Machine Learning Forecast',
        'AI Business Assistant Chat',
        'Dead Stock Clearance Engine',
        'GSTR-3B & Excel Export Reports',
        '24/7 Priority Support',
      ],
      cta: 'Get Started Now',
      popular: true,
    },
    {
      name: 'Enterprise Chain',
      priceMonthly: 10999,
      priceAnnual: 8999,
      description: 'For multi-warehouse chains needing custom API sync and dedicated account SLA.',
      features: [
        'Unlimited Products & Warehouses',
        'Unlimited POS Terminals',
        'Custom AI Model Fine-Tuning',
        'Multi-Store Stock Transfer Sync',
        'Dedicated Account Manager',
        'Custom ERP / Tally API Integration',
        '99.9% Uptime Guarantee SLA',
      ],
      cta: 'Contact Enterprise Team',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent Pricing for High-ROI Growth
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            No hidden setup fees. Scale your plan as your retail footprint expands.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                !isAnnual
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                isAnnual
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-400 text-slate-950 rounded-full">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`glass-card p-8 flex flex-col justify-between relative ${
                  plan.popular
                    ? 'ring-2 ring-brand-500 shadow-glow bg-gradient-to-b from-brand-50/20 to-transparent dark:from-brand-950/20'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-600/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MOST POPULAR</span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{price.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                      Billed annually (₹{(price * 12).toLocaleString()}/yr)
                    </p>
                  )}

                  <div className="mt-8 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="md"
                    className="w-full"
                    onClick={() => navigate('/register')}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
