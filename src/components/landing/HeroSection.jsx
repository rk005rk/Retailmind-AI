import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Zap, Bot } from 'lucide-react';
import Button from '../common/Button';
import { motion } from 'framer-motion';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-600/20 to-cyan-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50/80 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
          <span>Next-Gen AI Sales & Demand Forecasting Platform</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-5xl mx-auto leading-[1.15]"
        >
          Smarter Inventory.{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Better Decisions.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
        >
          RetailMind AI predicts sales trends, optimizes reorder points, eliminates dead stock, and runs your POS terminal—all powered by real-time predictive machine learning.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            variant="primary"
            size="lg"
            icon={ArrowRight}
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto"
          >
            Start 14-Day Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/app/dashboard')}
            className="w-full sm:w-auto"
          >
            Explore Live Platform Demo
          </Button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> GST Ready & Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Setup in Under 5 Mins
          </span>
          <span className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-cyan-500" /> 94.8% AI Forecast Accuracy
          </span>
        </motion.div>

        {/* Interactive Dashboard Graphic Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 relative max-w-6xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-slate-200/80 to-slate-300/40 dark:from-slate-800/80 dark:to-slate-900/40 border border-slate-300/60 dark:border-slate-700/60 shadow-2xl shadow-brand-500/10 backdrop-blur-xl"
        >
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-left">
            {/* Window bar */}
            <div className="h-10 px-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[11px] font-mono text-slate-400">https://app.retailmind.ai/dashboard</div>
              <div className="w-12" />
            </div>

            {/* Content Mockup */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Monthly Revenue</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-white">₹8,20,000</div>
                <div className="text-xs text-emerald-400 font-semibold">+24.5% vs last month</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>AI Demand Forecast</span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white">₹9,40,000</div>
                <div className="text-xs text-cyan-400 font-semibold">94.8% Confidence Score</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Dead Stock Recovered</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-bold text-white">₹1,45,000</div>
                <div className="text-xs text-amber-400 font-semibold">Automated AI Markdowns</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
