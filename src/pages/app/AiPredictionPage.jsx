import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  Brain,
  Sparkles,
  TrendingUp,
  PackageCheck,
  DollarSign,
  ShoppingCart,
  Calendar,
  Zap,
  ChevronRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AiPredictionPage() {
  const { addToast } = useData();
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('Next 14 Days');

  const topCards = [
    {
      title: 'Demand Forecast',
      metric: 'Breakthrough 18%',
      subtext: '+18% expected grocery surge',
      badge: 'High Surge',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Sales Prediction',
      metric: '₹ 9,18,000',
      subtext: 'Projected next 30 days revenue',
      badge: '+14.2% MoM',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Stock Recommendation',
      metric: '15 Products',
      subtext: 'Reorder suggested before Friday',
      badge: 'Action Needed',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    },
    {
      title: 'Profit Forecast',
      metric: '₹ 3,85,000',
      subtext: 'Estimated net profit margin 28%',
      badge: '+18.5% Growth',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    }
  ];

  const forecastChartData = [
    { day: 'Day 1', actual: 24560, predicted: 24500 },
    { day: 'Day 3', actual: 26800, predicted: 27000 },
    { day: 'Day 5', actual: 28400, predicted: 28900 },
    { day: 'Day 7 (Weekend)', actual: null, predicted: 36500 },
    { day: 'Day 9', actual: null, predicted: 29800 },
    { day: 'Day 11', actual: null, predicted: 31200 },
    { day: 'Day 14 (Festival)', actual: null, predicted: 44000 }
  ];

  const productPredictions = [
    {
      id: 1,
      product: 'Amul Milk 1L',
      category: 'Dairy',
      currentStock: 130,
      predictedDemand: '130 units',
      confidence: '92%',
      recommendedReorder: '150 units',
      factors: ['Morning customer traffic up 22%', 'Weekend dairy breakfast demand', 'Zero lead time risk']
    },
    {
      id: 2,
      product: 'Aashirvaad Atta 5kg',
      category: 'Grocery',
      currentStock: 95,
      predictedDemand: '120 units',
      confidence: '88%',
      recommendedReorder: '100 units',
      factors: ['Monthly grocery restocking cycle', 'Festive season baking surge', 'Bulk purchase trend']
    },
    {
      id: 3,
      product: 'Fortune Sunflower Oil 1L',
      category: 'Oils',
      currentStock: 45,
      predictedDemand: '80 units',
      confidence: '91%',
      recommendedReorder: '60 units',
      factors: ['Cooking oil festival prep', 'Low competitor stock in area', 'Supplier price rise alert in 7 days']
    },
    {
      id: 4,
      product: 'Tata Tea Premium 250g',
      category: 'Beverages',
      currentStock: 60,
      predictedDemand: '95 units',
      confidence: '95%',
      recommendedReorder: '75 units',
      factors: ['Monsoon tea consumption spike', 'Repeat customer loyalty rate 94%', 'High margin item']
    },
    {
      id: 5,
      product: 'Parle-G Biscuits 200g',
      category: 'Snacks',
      currentStock: 15,
      predictedDemand: '140 units',
      confidence: '89%',
      recommendedReorder: '200 units',
      factors: ['Daily essential impulse purchase', 'Current stock under safety buffer', 'High inventory turnover']
    }
  ];

  const handleOpenPrediction = (item) => {
    setSelectedPrediction(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Simulated AI Forecast Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> AI Predictions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-powered insights and predictions for your business.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={() => addToast('AI predictive models refreshed!', 'info')}
          >
            Refresh Models
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Sparkles}
            onClick={() => addToast('All AI automated replenishment recommendations submitted to Purchase queue!', 'success')}
          >
            Apply Recommendations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              {card.metric}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {card.subtext}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              14-Day Demand & Sales Forecast Curve
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Confidence intervals calculated using seasonal ARIMA & local retail footfall patterns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {['Next 7 Days', 'Next 14 Days', 'Next 30 Days'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastChartData}>
              <defs>
                <linearGradient id="aiForecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  border: '1px solid #334155'
                }}
                formatter={(val) => (val ? `₹${Number(val).toLocaleString()}` : 'N/A')}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="predicted"
                name="AI Predicted Sales"
                stroke="#7C3AED"
                strokeWidth={3}
                fill="url(#aiForecastGrad)"
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Historical Actual Sales"
                stroke="#0EA5E9"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Demand Forecast by Top SKU</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Product-level predictive velocity, statistical confidence score, and recommended replenishment actions.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full">
            5 Key SKUs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Product</th>
                <th className="py-3.5 px-4">Predicted Demand</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {productPredictions.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {row.product}
                    </div>
                    <span className="text-[11px] text-slate-400">Stock: {row.currentStock} units • Reorder Rec: {row.recommendedReorder}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {row.predictedDemand}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: row.confidence }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{row.confidence}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleOpenPrediction(row)}
                      className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors text-xs inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPrediction ? `AI Forecast Analysis: ${selectedPrediction.product}` : 'Prediction Details'}
        size="md"
      >
        {selectedPrediction && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Model Confidence: {selectedPrediction.confidence} (High Accuracy)
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Calculated using 90-day moving average, local retail demand, and weekend purchasing cycles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Stock</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedPrediction.currentStock} units
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Reorder</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedPrediction.recommendedReorder}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Key AI Reasoning Factors
              </h5>
              <div className="space-y-1.5">
                {selectedPrediction.factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={ShoppingCart}
                onClick={() => {
                  addToast(`Purchase Order created for ${selectedPrediction.recommendedReorder} of ${selectedPrediction.product}!`, 'success');
                  setIsModalOpen(false);
                }}
              >
                Create Purchase Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
