import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'How does RetailMind AI predict sales demand accurately?',
      a: 'RetailMind AI analyzes historical sales data, local seasonality factors, weekend trends, and upcoming festival calendars using machine learning to forecast exact unit demand with high confidence scores.',
    },
    {
      q: 'Can I integrate my existing barcode scanners and thermal printers with POS?',
      a: 'Yes! RetailMind AI POS runs in any modern browser and supports standard USB/Bluetooth barcode scanners, thermal receipt printers, and cash drawers out of the box.',
    },
    {
      q: 'How does the AI Dead Stock Clearance engine work?',
      a: 'The system flags items with zero or low velocity over 60-90 days, calculates locked capital, and generates suggested discount percentages or slow-fast product bundle pairings to liquidate stock quickly.',
    },
    {
      q: 'Is GST billing supported for Indian businesses?',
      a: 'Absolutely. RetailMind AI automatically calculates HSN/SAC codes, CGST, SGST, and IGST rates, and generates GSTR-3B tax compliance summaries ready for export.',
    },
    {
      q: 'Can I manage multiple warehouses and retail store locations?',
      a: 'Yes, our Professional and Enterprise plans support multi-warehouse stock allocations, store-to-store stock transfers, and centralized inventory tracking.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-slate-100/60 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Have questions about RetailMind AI? Here are the answers.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="glass-card overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-base sm:text-lg"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
