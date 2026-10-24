import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Search,
  Download,
  Calendar,
  Eye,
  Plus,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function SalesPage() {
  const { addToast } = useData();
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('This Week');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  const metrics = [
    {
      title: 'Total Sales',
      value: '₹ 1,25,430',
      change: '+14.2%',
      icon: DollarSign,
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      title: 'Total Orders',
      value: '320',
      change: '+8.5%',
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Average Order Value',
      value: '₹ 392',
      change: '+5.2%',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Total Customers',
      value: '210',
      change: '+12.1%',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const salesTrend = [
    { date: '16 Jul', sales: 14500, orders: 38 },
    { date: '17 Jul', sales: 18200, orders: 46 },
    { date: '18 Jul', sales: 16800, orders: 42 },
    { date: '19 Jul', sales: 24500, orders: 62 },
    { date: '20 Jul', sales: 28900, orders: 74 },
    { date: '21 Jul', sales: 21500, orders: 54 },
    { date: '22 Jul', sales: 24560, orders: 68 }
  ];

  const initialSales = [
    {
      id: 'ORD-1256',
      customer: 'Rahul Sharma',
      date: '22 Jul 2025',
      amount: 12450,
      items: 'Amul Taaza Milk 1L (10x), Aashirvaad Atta 5kg (2x)',
      paymentMode: 'UPI',
      status: 'Completed'
    },
    {
      id: 'ORD-1255',
      customer: 'Priya Singh',
      date: '22 Jul 2025',
      amount: 18700,
      items: 'Fortune Sunflower Oil 1L (5x), Tata Tea 250g (4x)',
      paymentMode: 'Card',
      status: 'Completed'
    },
    {
      id: 'ORD-1254',
      customer: 'Amit Kumar',
      date: '21 Jul 2025',
      amount: 16700,
      items: 'Dawat Basmati Rice 5kg (3x), Haldiram Bhujia (5x)',
      paymentMode: 'UPI',
      status: 'Completed'
    },
    {
      id: 'ORD-1253',
      customer: 'Neha Patel',
      date: '20 Jul 2025',
      amount: 9850,
      items: 'Parle-G Biscuits (20x), Surf Excel 1kg (2x)',
      paymentMode: 'Cash',
      status: 'Completed'
    }
  ];

  const [salesList, setSalesList] = useState(initialSales);

  const filtered = salesList.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.customer.toLowerCase().includes(search.toLowerCase()) ||
      s.items.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    exportToCsv('retailmind_sales_report', filtered);
    addToast('Sales transactions exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Sales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track and manage all your sales and transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>15 Jul 2025 - 22 Jul 2025</span>
          </div>

          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export
          </Button>

          <Button variant="primary" size="md" icon={Plus} onClick={() => setIsPosModalOpen(true)}>
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{m.title}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {m.change}
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
              {m.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sales Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily revenue and order volume comparison</p>
            </div>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                  formatter={(val, name) =>
                    name === 'Sales (₹)' ? [`₹${Number(val).toLocaleString()}`, name] : [val, name]
                  }
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales (₹)"
                  stroke="#7C3AED"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#7C3AED' }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0EA5E9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Sales</h3>
            <button
              onClick={() => {
                const el = document.getElementById('sales-full-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {salesList.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {order.id}
                    </span>
                    <span className="text-[11px] text-slate-400">{order.customer}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-white text-xs block">
                    ₹{order.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">{order.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsPosModalOpen(true)}
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs transition-colors"
            >
              + Quick Counter Sale
            </button>
          </div>
        </div>
      </div>

      <div id="sales-full-table" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Transaction Logs</h3>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {row.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {row.customer}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {row.items}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {row.date}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    ₹{row.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                      {row.paymentMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setSelectedOrder(row)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Sales Invoice: ${selectedOrder.id}` : 'Order Details'}
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Retail Customer Receipt</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedOrder.id}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{selectedOrder.customer} • {selectedOrder.date}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Total Paid</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  ₹{selectedOrder.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Purchased Items</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.items}</p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Payment Mode: {selectedOrder.paymentMode}</span>
                <span className="font-bold text-emerald-600">Status: Completed</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => {
                  exportToCsv(`receipt_${selectedOrder.id}`, [selectedOrder]);
                  addToast(`Receipt for ${selectedOrder.id} downloaded!`, 'success');
                  setSelectedOrder(null);
                }}
              >
                Print / Download Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
        title="Quick POS Counter Sale"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newOrd = {
              id: `ORD-${Math.floor(1257 + Math.random() * 50)}`,
              customer: 'Walk-in Customer',
              date: '22 Jul 2025',
              amount: 1450,
              items: 'Amul Milk 1L (2x), Tata Tea 250g (1x), Parle-G (4x)',
              paymentMode: 'UPI Instant',
              status: 'Completed'
            };
            setSalesList([newOrd, ...salesList]);
            setIsPosModalOpen(false);
            addToast(`Sale of ₹1,450 completed! Receipt generated.`, 'success');
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Customer Name
            </label>
            <input
              type="text"
              defaultValue="Walk-in Customer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Items Purchased
            </label>
            <input
              type="text"
              defaultValue="Amul Milk 1L (2x), Tata Tea 250g (1x), Parle-G (4x)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Total Amount (₹)
              </label>
              <input
                type="number"
                defaultValue={1450}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method
              </label>
              <select className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white">
                <option>UPI Instant (PayTM / PhonePe)</option>
                <option>Cash</option>
                <option>Card (POS Swipe)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsPosModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Complete Sale & Print
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
