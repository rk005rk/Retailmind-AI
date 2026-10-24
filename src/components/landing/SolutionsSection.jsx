import React from 'react';
import { Store, Building2, Globe2, ArrowRight } from 'lucide-react';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';

export default function SolutionsSection() {
  const navigate = useNavigate();

  const solutions = [
    {
      icon: Store,
      title: 'Single-Store Retailers',
      subtitle: 'Boutiques, Electronics & Supermarkets',
      description: 'Streamline daily sales, avoid stockouts, and manage suppliers with an intuitive all-in-one POS and inventory dashboard.',
      badge: 'Starter Ready',
    },
    {
      icon: Building2,
      title: 'Multi-Location Retail Chains',
      subtitle: '5 to 50 Outlets',
      description: 'Centralize inventory visibility across all stores, balance stock transfers, and standardize POS terminals seamlessly.',
      badge: 'Growth Scaled',
    },
    {
      icon: Globe2,
      title: 'Omnichannel Enterprise',
      subtitle: 'E-commerce + Physical Stores',
      description: 'Synchronize online store inventory with physical warehouses using custom API integrations and real-time demand forecasting.',
      badge: 'Enterprise Grade',
    },
  ];

  return (
    <section id="solutions" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tailored Solutions for Every Retail Scale
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            From single neighborhood stores to multi-warehouse regional retail chains.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {solutions.map((sol) => (
            <div
              key={sol.title}
              className="glass-card p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <sol.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {sol.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{sol.title}</h3>
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">{sol.subtitle}</p>

                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {sol.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={ArrowRight}
                  onClick={() => navigate('/register')}
                >
                  Explore Solution
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
