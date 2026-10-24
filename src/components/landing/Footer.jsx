import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Brain className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl text-white tracking-tight">RetailMind</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-brand-950 text-brand-300">AI</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Smarter Inventory. Better Decisions. RetailMind AI empowers retail businesses with machine learning demand forecasting, cloud POS, and automated inventory optimization.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span>© {new Date().getFullYear()} RetailMind AI Technologies Inc. All rights reserved.</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">AI Sales Prediction</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">POS Terminal</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Inventory Manager</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Dead Stock Clearance</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#solutions" className="hover:text-white transition-colors">Single Boutiques</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Multi-Store Chains</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Supermarkets & Grocery</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Electronics & Appliances</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Enterprise API</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Stay Updated</h4>
            <p className="text-xs">Get weekly retail AI insights and inventory optimization guides.</p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter work email"
                className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button variant="primary" size="sm" icon={ArrowRight}>
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
