import React from 'react';
import { Star, Quote } from 'lucide-react';

export default function ReviewsSection() {
  const reviews = [
    {
      name: 'Rohan Deshmukh',
      role: 'Founder & CEO',
      company: 'Deshmukh HyperMarket (3 Locations)',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      rating: 5,
      metric: '+38% Margin Growth',
      quote: 'RetailMind AI completely transformed how we stock our stores. The festival demand forecasting helped us prepare for Diwali weeks in advance without over-purchasing.',
    },
    {
      name: 'Meera Nambiar',
      role: 'Operations Lead',
      company: 'Aura Lifestyle Boutiques',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      rating: 5,
      metric: '-52% Dead Stock',
      quote: 'The AI Dead Stock Clearance recommendations helped us recover over ₹2.4 Lakhs in locked working capital in just 30 days. It pays for itself 10x over.',
    },
    {
      name: 'Arjun Kapoor',
      role: 'General Manager',
      company: 'Apex Electronics Chain',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      rating: 5,
      metric: '99.1% Stock Availability',
      quote: 'The cloud POS combined with instant low-stock alerts mean our cashier staff never has to report a missing barcode or inventory mismatch again.',
    },
  ];

  return (
    <section className="py-24 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Loved by 1,200+ Forward-Thinking Retailers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Here is what retail leaders say about switching to RetailMind AI.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.name}
              className="glass-card p-8 flex flex-col justify-between relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-brand-500/10 dark:text-brand-400/10 pointer-events-none" />

              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{rev.quote}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={rev.image} alt={rev.name} className="w-10 h-10 rounded-full object-cover border border-brand-500/30" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rev.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{rev.company}</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {rev.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
