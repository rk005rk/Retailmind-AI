import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Download
} from 'lucide-react';

export default function CustomersPage() {
  const { addCustomer, addToast } = useData();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    segment: 'Regular',
    totalOrders: 1,
    lifetimeValue: 1500,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80'
  });

  const tableCustomers = [
    {
      id: 'CUST-101',
      name: 'Rahul Sharma',
      email: 'rahul@email.com',
      phone: '9876543210',
      totalOrders: 12,
      totalSpent: 45600,
      lastOrder: '22 Jul 2025',
      status: 'Active',
      tier: 'VIP Gold',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80'
    },
    {
      id: 'CUST-102',
      name: 'Priya Singh',
      email: 'priya@email.com',
      phone: '9876543211',
      totalOrders: 8,
      totalSpent: 32700,
      lastOrder: '21 Jul 2025',
      status: 'Active',
      tier: 'Regular',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80'
    },
    {
      id: 'CUST-103',
      name: 'Amit Kumar',
      email: 'amit@email.com',
      phone: '9876543212',
      totalOrders: 15,
      totalSpent: 67890,
      lastOrder: '20 Jul 2025',
      status: 'Active',
      tier: 'VIP Platinum',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80'
    },
    {
      id: 'CUST-104',
      name: 'Neha Patel',
      email: 'neha@email.com',
      phone: '9876543213',
      totalOrders: 6,
      totalSpent: 24300,
      lastOrder: '19 Jul 2025',
      status: 'Active',
      tier: 'Regular',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80'
    },
    {
      id: 'CUST-105',
      name: 'Vikash Gupta',
      email: 'vikash@email.com',
      phone: '9876543214',
      totalOrders: 10,
      totalSpent: 38200,
      lastOrder: '18 Jul 2025',
      status: 'Active',
      tier: 'VIP Gold',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&q=80'
    }
  ];

  const [customerList, setCustomerList] = useState(tableCustomers);

  const filtered = customerList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchesTier = tierFilter === 'All' || c.tier.includes(tierFilter);
    return matchesSearch && matchesTier;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!customerForm.name || !customerForm.phone) {
      addToast('Please fill out customer name and phone', 'warning');
      return;
    }
    const newCust = {
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: customerForm.name,
      email: customerForm.email || `${customerForm.name.toLowerCase().replace(/\s+/g, '')}@email.com`,
      phone: customerForm.phone,
      totalOrders: Number(customerForm.totalOrders) || 1,
      totalSpent: Number(customerForm.lifetimeValue) || 1500,
      lastOrder: 'Today',
      status: 'Active',
      tier: customerForm.segment,
      avatar: customerForm.avatar
    };
    setCustomerList([newCust, ...customerList]);
    if (addCustomer) addCustomer(newCust);
    setIsAddModalOpen(false);
    addToast(`Customer ${newCust.name} added successfully!`, 'success');
  };

  const handleExport = () => {
    exportToCsv('retailmind_customers', filtered);
    addToast('Customer directory exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Customers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your customers and their information.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="primary" size="md" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
            Add Customer
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Customers</option>
            <option value="VIP">VIP Customers</option>
            <option value="Regular">Regular</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => {
              setSearch('');
              setTierFilter('All');
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
                <th className="py-3.5 px-5">Customer</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Total Orders</th>
                <th className="py-3.5 px-4">Total Spent</th>
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
                    <div className="flex items-center gap-3">
                      <img
                        src={row.avatar}
                        alt={row.name}
                        className="w-9 h-9 rounded-xl object-cover border border-indigo-100 dark:border-indigo-900/60"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{row.tier}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {row.email}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {row.phone}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                    {row.totalOrders}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                    ₹{row.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setSelectedCustomer(row)}
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

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filtered.length} of {customerList.length} entries</span>
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
        title="Add New Customer"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Customer Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Chandra"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                placeholder="9876543210"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={Plus}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer ? `Customer Profile: ${selectedCustomer.name}` : 'Customer Details'}
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <img
                src={selectedCustomer.avatar}
                alt={selectedCustomer.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.email} • {selectedCustomer.phone}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                    {selectedCustomer.tier}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-bold">● Active Store Customer</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Spent</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ₹{selectedCustomer.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</span>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedCustomer.totalOrders} Orders
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  addToast(`WhatsApp promotional coupon sent to ${selectedCustomer.phone}!`, 'success');
                  setSelectedCustomer(null);
                }}
              >
                Send WhatsApp Offer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
