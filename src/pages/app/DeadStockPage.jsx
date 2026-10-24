import React from 'react';
import { useData } from '../../context/DataContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { AlertTriangle, Tag, PackageX, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DeadStockPage() {
  const { products, addToast } = useData();

  const deadStockItems = products.filter((p) => p.daysUnsold >= 30);
  const totalLockedCapital = deadStockItems.reduce((acc, item) => acc + item.stock * item.purchasePrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" /> Dead Stock & Slow Inventory Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Identify inventory unsold for 30+ days and execute AI automated markdown clearance campaigns.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">Total Locked Capital</span>
            <h3 className="text-lg font-extrabold text-amber-900 dark:text-amber-200">₹{totalLockedCapital.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-4">Product Details</th>
                <th className="py-4 px-4">Stock</th>
                <th className="py-4 px-4">Days Unsold</th>
                <th className="py-4 px-4">Locked Value</th>
                <th className="py-4 px-4">AI Recommended Action</th>
                <th className="py-4 px-4 text-right">Execute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {deadStockItems.length > 0 ? (
                deadStockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <span className="text-[10px] text-slate-400">{item.sku}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.stock} units</td>
                    <td className="py-3 px-4 font-extrabold text-rose-600 dark:text-rose-400">{item.daysUnsold} Days</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">₹{item.stock * item.purchasePrice}</td>
                    <td className="py-3 px-4">
                      <Badge variant="warning">
                        <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                        Apply 25% Discount Bundle
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Tag}
                        onClick={() => addToast(`Executed 25% AI Markdown on "${item.name}"`, 'success')}
                      >
                        Apply Markdown
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No dead stock detected! Inventory turnover is optimal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
