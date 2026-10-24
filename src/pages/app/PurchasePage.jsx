import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';

export default function PurchasePage() {
  const { addToast } = useData();
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const initialPurchases = [
    {
      id: 'PUR-1256',
      supplier: 'Grover Distributors',
      date: '22 Jul 2025',
      amount: 25000,
      status: 'Completed',
      items: 'Amul Milk 1L (500 units), Taaza Butter (100 units)',
      paymentMode: 'Bank NEFT'
    },
    {
      id: 'PUR-1255',
      supplier: 'Sharma Traders',
      date: '22 Jul 2025',
      amount: 18500,
      status: 'Processing',
      items: 'Aashirvaad Atta 5kg (70 units), Dawat Basmati Rice (40 units)',
      paymentMode: 'Net Banking'
    },
    {
      id: 'PUR-1254',
      supplier: 'Gupta Suppliers',
      date: '21 Jul 2025',
      amount: 32750,
      status: 'Processing',
      items: 'Fortune Sunflower Oil 1L (200 units), Mustard Oil 1L (50 units)',
      paymentMode: 'Credit (15 Days)'
    },
    {
      id: 'PUR-1253',
      supplier: 'Verma Enterprises',
      date: '21 Jul 2025',
      amount: 15200,
      status: 'Cancelled',
      items: 'Tata Tea Gold 250g (120 units)',
      paymentMode: 'UPI'
    },
    {
      id: 'PUR-1252',
      supplier: 'Patel & Sons',
      date: '20 Jul 2025',
      amount: 23400,
      status: 'Completed',
      items: 'Parle-G Biscuits (400 units), Hide & Seek (150 units)',
      paymentMode: 'Bank Transfer'
    }
  ];

  const [purchaseList, setPurchaseList] = useState(initialPurchases);

  const [poForm, setPoForm] = useState({
    supplier: 'Grover Distributors',
    amount: '',
    items: '',
    paymentMode: 'Bank Transfer',
    status: 'Processing'
  });

  const filtered = purchaseList.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase()) ||
      p.items.toLowerCase().includes(search.toLowerCase());
    const matchesSupplier = supplierFilter === 'All' || p.supplier === supplierFilter;
    return matchesSearch && matchesSupplier;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!poForm.amount || !poForm.items) {
      addToast('Please enter purchase amount and line items', 'warning');
      return;
    }
    const newPO = {
      id: `PUR-${Math.floor(1257 + Math.random() * 50)}`,
      supplier: poForm.supplier,
      date: '22 Jul 2025',
      amount: Number(poForm.amount),
      status: poForm.status,
      items: poForm.items,
      paymentMode: poForm.paymentMode
    };
    setPurchaseList([newPO, ...purchaseList]);
    setIsAddModalOpen(false);
    addToast(`Purchase Order ${newPO.id} created successfully!`, 'success');
  };

  const handleExport = () => {
    exportToCsv('retailmind_purchase_orders', filtered);
    addToast('Purchase order history exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Purchase
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your purchase orders and suppliers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            New Purchase
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search purchase orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Suppliers</option>
            <option value="Grover Distributors">Grover Distributors</option>
            <option value="Sharma Traders">Sharma Traders</option>
            <option value="Gupta Suppliers">Gupta Suppliers</option>
            <option value="Verma Enterprises">Verma Enterprises</option>
            <option value="Patel & Sons">Patel & Sons</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => {
              setSearch('');
              setSupplierFilter('All');
              addToast('Filters reset', 'info');
            }}
          >
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Purchase ID</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {row.id}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {row.supplier}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                    {row.date}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    ₹{row.amount.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        row.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : row.status === 'Processing'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setSelectedPO(row)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filtered.length} of {purchaseList.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">2</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">3</button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Purchase Order"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Select Supplier *
            </label>
            <select
              value={poForm.supplier}
              onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="Grover Distributors">Grover Distributors (Dairy)</option>
              <option value="Sharma Traders">Sharma Traders (Grocery)</option>
              <option value="Gupta Suppliers">Gupta Suppliers (Oils)</option>
              <option value="Verma Enterprises">Verma Enterprises (Beverages)</option>
              <option value="Patel & Sons">Patel & Sons (Snacks)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Order Items & Quantities *
            </label>
            <input
              type="text"
              placeholder="e.g. Amul Milk 1L (200 units), Cheese Slices (50 units)"
              value={poForm.items}
              onChange={(e) => setPoForm({ ...poForm, items: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Total PO Amount (₹) *
              </label>
              <input
                type="number"
                placeholder="25000"
                value={poForm.amount}
                onChange={(e) => setPoForm({ ...poForm, amount: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Terms
              </label>
              <select
                value={poForm.paymentMode}
                onChange={(e) => setPoForm({ ...poForm, paymentMode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="Bank Transfer">Bank NEFT/RTGS</option>
                <option value="Net Banking">Net Banking</option>
                <option value="UPI">UPI Instant</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Submit Purchase Order
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={selectedPO ? `Purchase Order Invoice: ${selectedPO.id}` : 'PO Details'}
        size="md"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Purchase Order</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedPO.id}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{selectedPO.supplier} • {selectedPO.date}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Total Cost</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  ₹{selectedPO.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Line Items</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedPO.items}</p>
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Payment Mode: {selectedPO.paymentMode}</span>
                <span className="font-bold text-emerald-600">Status: {selectedPO.status}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedPO(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => {
                  exportToCsv(`invoice_${selectedPO.id}`, [selectedPO]);
                  addToast(`Invoice for ${selectedPO.id} downloaded!`, 'success');
                  setSelectedPO(null);
                }}
              >
                Download Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
