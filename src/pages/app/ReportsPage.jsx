import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { exportToCsv } from '../../utils/exportCsv';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function ReportsPage() {
  const { addToast } = useData();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedReportView, setSelectedReportView] = useState(null);

  const [reportForm, setReportForm] = useState({
    name: 'Custom Sales & Tax Summary',
    type: 'Sales',
    period: 'July 2025',
    format: 'CSV'
  });

  const reportList = [
    {
      id: 'REP-01',
      name: 'Sales Report',
      type: 'Sales',
      period: 'July 2025',
      generatedOn: '22 Jul 2025',
      records: 1250,
      size: '2.4 MB'
    },
    {
      id: 'REP-02',
      name: 'Inventory Report',
      type: 'Inventory',
      period: 'July 2025',
      generatedOn: '22 Jul 2025',
      records: 840,
      size: '1.8 MB'
    },
    {
      id: 'REP-03',
      name: 'Purchase Report',
      type: 'Purchase',
      period: 'July 2025',
      generatedOn: '21 Jul 2025',
      records: 430,
      size: '980 KB'
    },
    {
      id: 'REP-04',
      name: 'Profit & Loss Report',
      type: 'Finance',
      period: 'Q2 2025',
      generatedOn: '20 Jul 2025',
      records: 620,
      size: '3.1 MB'
    },
    {
      id: 'REP-05',
      name: 'Customer Report',
      type: 'Customers',
      period: 'July 2025',
      generatedOn: '19 Jul 2025',
      records: 2100,
      size: '4.2 MB'
    }
  ];

  const filteredReports = reportList.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDownload = (report) => {
    const sampleRows = [
      { 'Report Name': report.name, 'Report Type': report.type, Period: report.period, 'Generated Date': report.generatedOn, 'Total Records': report.records, 'Status': 'Verified' },
      { 'Transaction/SKU ID': 'TRX-101', 'Description': report.name + ' Line Item 1', 'Amount (INR)': 24500, 'Tax (GST 18%)': 4410, 'Net Total': 28910 },
      { 'Transaction/SKU ID': 'TRX-102', 'Description': report.name + ' Line Item 2', 'Amount (INR)': 18200, 'Tax (GST 18%)': 3276, 'Net Total': 21476 },
      { 'Transaction/SKU ID': 'TRX-103', 'Description': report.name + ' Line Item 3', 'Amount (INR)': 35400, 'Tax (GST 18%)': 6372, 'Net Total': 41772 }
    ];
    exportToCsv(report.name.toLowerCase().replace(/\s+/g, '_') + '_' + report.period, sampleRows);
    addToast(report.name + ' (' + report.period + ') downloaded as CSV!', 'success');
  };

  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    addToast('Generated ' + reportForm.name + ' for ' + reportForm.period + '! Ready to download.', 'success');
    setIsGenerateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate and view business reports.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setIsGenerateModalOpen(true)}
        >
          Generate Report
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Sales">Sales</option>
            <option value="Inventory">Inventory</option>
            <option value="Purchase">Purchase</option>
            <option value="Finance">Finance</option>
            <option value="Customers">Customers</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => {
              setSearch('');
              setTypeFilter('All');
              addToast('Filters reset', 'info');
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-850/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Report Name</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Period</th>
                <th className="py-3.5 px-4">Generated On</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredReports.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {row.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">{row.records} records • {row.size}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {row.period}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                    {row.generatedOn}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReportView(row)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="View Summary"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(row)}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition-colors text-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Custom Business Report"
        size="md"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={reportForm.name}
              onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Report Type
              </label>
              <select
                value={reportForm.type}
                onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="Sales">Sales Report</option>
                <option value="Inventory">Inventory Valuation</option>
                <option value="Purchase">Purchase & Supplier</option>
                <option value="Finance">Profit & Loss (P&L)</option>
                <option value="Customers">Customer Retention</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Period
              </label>
              <select
                value={reportForm.period}
                onChange={(e) => setReportForm({ ...reportForm, period: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="July 2025">July 2025 (Current Month)</option>
                <option value="Q2 2025">Q2 2025</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Sparkles} type="submit">
              Generate Now
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedReportView}
        onClose={() => setSelectedReportView(null)}
        title={selectedReportView ? `Report Preview: ${selectedReportView.name}` : 'Report Preview'}
        size="md"
      >
        {selectedReportView && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedReportView.type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Period</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedReportView.period}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Records</span>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedReportView.records}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>Report verified and audit-ready under Indian Accounting & GST Standard Format.</span>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedReportView(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => {
                  handleDownload(selectedReportView);
                  setSelectedReportView(null);
                }}
              >
                Download CSV
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
