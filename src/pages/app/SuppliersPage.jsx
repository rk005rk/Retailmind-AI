import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Phone,
  Download
} from 'lucide-react';

export default function SuppliersPage() {
  const { addToast } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const initialSuppliers = [
    {
      id: 'SUP-01',
      name: 'Grover Distributors',
      contactPerson: 'Raj Grover',
      phone: '9876543201',
      email: 'raj@groverdist.com',
      category: 'Dairy',
      productsCount: 18,
      status: 'Active',
      rating: 4.9,
      leadTime: '1 day'
    },
    {
      id: 'SUP-02',
      name: 'Sharma Traders',
      contactPerson: 'Mohit Sharma',
      phone: '9876543202',
      email: 'mohit@sharmatraders.in',
      category: 'Grocery',
      productsCount: 45,
      status: 'Active',
      rating: 4.8,
      leadTime: '2 days'
    },
    {
      id: 'SUP-03',
      name: 'Gupta Suppliers',
      contactPerson: 'Amit Gupta',
      phone: '9876543203',
      email: 'amit@guptasuppliers.com',
      category: 'Oils',
      productsCount: 12,
      status: 'Active',
      rating: 4.7,
      leadTime: '3 days'
    },
    {
      id: 'SUP-04',
      name: 'Verma Enterprises',
      contactPerson: 'Amit Verma',
      phone: '9876543204',
      email: 'sales@vermaent.com',
      category: 'Beverages',
      productsCount: 24,
      status: 'Active',
      rating: 4.9,
      leadTime: '1 day'
    },
    {
      id: 'SUP-05',
      name: 'Patel & Sons',
      contactPerson: 'Rajesh Patel',
      phone: '9876543205',
      email: 'rajesh@patelsons.in',
      category: 'Snacks',
      productsCount: 30,
      status: 'Active',
      rating: 4.6,
      leadTime: '2 days'
    }
  ];

  const [supplierList, setSupplierList] = useState(initialSuppliers);

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Grocery',
    status: 'Active'
  });

  const filtered = supplierList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.contactPerson || !supplierForm.phone) {
      addToast('Please fill out all required supplier fields', 'warning');
      return;
    }
    const newSup = {
      id: `SUP-0${supplierList.length + 1}`,
      name: supplierForm.name,
      contactPerson: supplierForm.contactPerson,
      phone: supplierForm.phone,
      email: supplierForm.email || `${supplierForm.name.toLowerCase().replace(/\s+/g, '')}@supplier.com`,
      category: supplierForm.category,
      productsCount: 10,
      status: 'Active',
      rating: 5.0,
      leadTime: '2 days'
    };
    setSupplierList([...supplierList, newSup]);
    setIsAddModalOpen(false);
    addToast(`Supplier ${newSup.name} added successfully!`, 'success');
  };

  const handleExport = () => {
    exportToCsv('retailmind_suppliers', filtered);
    addToast('Supplier list exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Suppliers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your suppliers and their information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Dairy">Dairy</option>
            <option value="Grocery">Grocery</option>
            <option value="Oils">Oils</option>
            <option value="Beverages">Beverages</option>
            <option value="Snacks">Snacks</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => {
              setSearch('');
              setCategoryFilter('All');
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
                <th className="py-3.5 px-5">Supplier</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {row.name}
                    </div>
                    <span className="text-[11px] text-slate-400">{row.email} • {row.productsCount} SKUs</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {row.contactPerson}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {row.phone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px]">
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSupplier(row)}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors text-xs"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => addToast(`Call initiated to ${row.contactPerson} (${row.phone})`, 'info')}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Call Supplier"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filtered.length} of {supplierList.length} entries</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">2</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">3</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">4</button>
            <button className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center justify-center">5</button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Supplier"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Supplier Business Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Balaji Agro Foods"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Person *
              </label>
              <input
                type="text"
                placeholder="e.g. Suresh Kumar"
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title={selectedSupplier ? `Supplier Profile: ${selectedSupplier.name}` : 'Supplier Details'}
        size="md"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedSupplier.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Contact: {selectedSupplier.contactPerson} • {selectedSupplier.phone}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                  {selectedSupplier.category}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  ★ {selectedSupplier.rating} Supplier Rating
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedSupplier(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  addToast(`Purchase Order opened for ${selectedSupplier.name}`, 'success');
                  setSelectedSupplier(null);
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
