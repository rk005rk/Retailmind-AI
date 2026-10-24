import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2
} from 'lucide-react';

export default function InventoryPage() {
  const { addProduct, addToast } = useData();

  const initialInventory = [
    {
      id: 'PRD-1001',
      name: 'Amul Milk 1L',
      sku: 'RMAI-DRY-001',
      category: 'Dairy',
      stock: 130,
      reorderLevel: 20,
      price: 66,
      supplier: 'Grover Distributors',
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80'
    },
    {
      id: 'PRD-1002',
      name: 'Aashirvaad Atta 5kg',
      sku: 'RMAI-GRO-002',
      category: 'Grocery',
      stock: 95,
      reorderLevel: 30,
      price: 265,
      supplier: 'Sharma Traders',
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80'
    },
    {
      id: 'PRD-1003',
      name: 'Fortune Sunflower Oil 1L',
      sku: 'RMAI-OIL-003',
      category: 'Oils',
      stock: 45,
      reorderLevel: 20,
      price: 160,
      supplier: 'Gupta Suppliers',
      status: 'Low Stock',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80'
    },
    {
      id: 'PRD-1004',
      name: 'Tata Tea Premium 250g',
      sku: 'RMAI-BEV-004',
      category: 'Beverages',
      stock: 60,
      reorderLevel: 25,
      price: 130,
      supplier: 'Verma Enterprises',
      status: 'In Stock',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80'
    },
    {
      id: 'PRD-1005',
      name: 'Parle-G Biscuits 200g',
      sku: 'RMAI-SNK-005',
      category: 'Snacks',
      stock: 15,
      reorderLevel: 50,
      price: 30,
      supplier: 'Patel & Sons',
      status: 'Low Stock',
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80'
    }
  ];

  const [inventoryList, setInventoryList] = useState(initialInventory);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: `RMAI-NEW-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Grocery',
    price: '',
    stock: '',
    reorderLevel: '20',
    supplier: 'Sharma Traders',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'
  });

  const filtered = inventoryList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stock) {
      addToast('Please fill out all required fields', 'warning');
      return;
    }

    const stockNum = Number(formData.stock);
    const reorderNum = Number(formData.reorderLevel) || 20;
    const status = stockNum === 0 ? 'Out of Stock' : stockNum <= reorderNum ? 'Low Stock' : 'In Stock';

    if (editingProduct) {
      const updated = inventoryList.map((item) =>
        item.id === editingProduct.id
          ? {
              ...item,
              name: formData.name,
              sku: formData.sku,
              category: formData.category,
              price: Number(formData.price),
              stock: stockNum,
              reorderLevel: reorderNum,
              supplier: formData.supplier,
              status
            }
          : item
      );
      setInventoryList(updated);
      addToast(`Product ${formData.name} updated!`, 'success');
      setEditingProduct(null);
    } else {
      const newProduct = {
        id: `PRD-${Math.floor(1008 + Math.random() * 50)}`,
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: Number(formData.price),
        stock: stockNum,
        reorderLevel: reorderNum,
        supplier: formData.supplier,
        status,
        image: formData.image
      };
      setInventoryList([newProduct, ...inventoryList]);
      if (addProduct) addProduct(newProduct);
      addToast(`Product ${newProduct.name} added to inventory!`, 'success');
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setInventoryList(inventoryList.filter((item) => item.id !== id));
      addToast(`Product ${name} removed from inventory`, 'info');
    }
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      supplier: p.supplier,
      image: p.image
    });
    setIsAddModalOpen(true);
  };

  const handleExport = () => {
    exportToCsv('retailmind_inventory_stock', filtered);
    addToast('Inventory exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your all inventory items and stock levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                sku: `RMAI-NEW-${Math.floor(100 + Math.random() * 900)}`,
                category: 'Grocery',
                price: '',
                stock: '',
                reorderLevel: '20',
                supplier: 'Sharma Traders',
                image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80'
              });
              setIsAddModalOpen(true);
            }}
          >
            Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
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
              setStatusFilter('All');
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
                <th className="py-3.5 px-5">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Reorder Level</th>
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
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {row.name}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{row.sku} • ₹{row.price}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {row.stock} units
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {row.reorderLevel} units
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        row.status === 'In Stock'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : row.status === 'Low Stock'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id, row.name)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1 to {filtered.length} of 25 entries</span>
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
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="md"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Amul Milk 1L"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="Dairy">Dairy</option>
                <option value="Grocery">Grocery</option>
                <option value="Oils">Oils</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                placeholder="66"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                placeholder="100"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                placeholder="20"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Supplier
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="Grover Distributors">Grover Distributors</option>
              <option value="Sharma Traders">Sharma Traders</option>
              <option value="Gupta Suppliers">Gupta Suppliers</option>
              <option value="Verma Enterprises">Verma Enterprises</option>
              <option value="Patel & Sons">Patel & Sons</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
