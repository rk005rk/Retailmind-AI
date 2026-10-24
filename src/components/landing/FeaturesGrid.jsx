import React from 'react';
import {
  BrainCircuit,
  PackageCheck,
  ShoppingCart,
  Bot,
  AlertTriangle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesGrid() {
  const features = [
    {
      icon: BrainCircuit,
      color: 'from-brand-600 to-indigo-600',
      title: 'AI Sales Prediction',
      description: 'Predict daily, weekly, and seasonal sales trends with up to 95% accuracy using machine learning algorithms.',
      highlights: ['Festival demand surge detection', 'Seasonality curve analysis', 'Confidence score metrics'],
    },
    {
      icon: PackageCheck,
      color: 'from-cyan-500 to-teal-500',
      title: 'Inventory Optimization',
      description: 'Eliminate stockouts and overstocking with automated safety stock calculations and instant reorder triggers.',
      highlights: ['Auto-reorder points', 'Multi-warehouse sync', 'Low stock instant alerts'],
    },
    {
      icon: ShoppingCart,
      color: 'from-emerald-500 to-green-600',
      title: 'POS Terminal & Checkout',
      description: 'Ultra-fast cloud POS interface with barcode scanner support, automatic GST calculations, and tax invoices.',
      highlights: ['Barcode & SKU search', 'Custom discounts & GST', 'Digital receipt generator'],
    },
    {
      icon: Bot,
      color: 'from-amber-500 to-orange-500',
      title: 'AI Business Assistant',
      description: 'Chat naturally with your retail data. Ask questions like "Which products should I reorder?" or "Why are sales dipping?"',
      highlights: ['Natural language Q&A', 'Actionable recommendation pills', 'Instant inventory audits'],
    },
    {
      icon: AlertTriangle,
      color: 'from-rose-500 to-pink-600',
      title: 'Dead Stock Clearance',
      description: 'Identify slow-moving inventory unsold for 60+ days and execute AI-suggested bundle discounts to free up capital.',
      highlights: ['Capital lockup calculation', 'Dynamic markdown suggestions', 'Product bundling engine'],
    },
    {
      icon: FileText,
      color: 'from-purple-500 to-indigo-600',
      title: 'Business & GST Analytics',
      description: 'Comprehensive financial reporting including GSTR-3B tax summaries, profit margin breakdown, and 1-click exports.',
      highlights: ['Export to PDF & Excel', 'Customer LTV segmentation', 'Supplier SLA performance tracking'],
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for Modern High-Growth Retailers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Everything you need to automate inventory, boost profit margins, and serve customers faster.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-card p-8 group relative overflow-hidden"
            >
              {/* Top Accent Icon */}
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {feature.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
