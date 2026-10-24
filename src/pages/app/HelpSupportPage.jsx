import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
  HelpCircle,
  Search,
  BookOpen,
  Package,
  TrendingUp,
  FileSpreadsheet,
  Brain,
  UserCheck,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Bot
} from 'lucide-react';

export default function HelpSupportPage() {
  const { addToast } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello Amit! 👋 How can I help you with RetailMind AI today?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const popularTopics = [
    { id: 'start', title: 'Getting Started', desc: 'Setup your store and invite staff', icon: BookOpen },
    { id: 'inventory', title: 'Managing Inventory', desc: 'SKU barcodes, reorder rules & alerts', icon: Package },
    { id: 'sales', title: 'Sales & Orders', desc: 'POS billing, GST tax receipts & UPI', icon: TrendingUp },
    { id: 'reports', title: 'Reports & Analytics', desc: 'P&L statements, stock valuation & CSV', icon: FileSpreadsheet },
    { id: 'ai', title: 'AI Predictions', desc: 'Demand modeling, seasonal forecast & surge', icon: Brain },
    { id: 'account', title: 'Account Settings', desc: 'Business GSTIN, profile & 2FA security', icon: UserCheck }
  ];

  const faqs = [
    {
      q: 'How does RetailMind AI predict product demand?',
      a: 'RetailMind AI analyzes your past 90 days POS transactions, day-of-week patterns, local weather, and Indian festival calendars to calculate statistical demand velocity for each SKU.'
    },
    {
      q: 'How do I set up custom low stock reorder thresholds?',
      a: 'Go to the Inventory page, click on any product to edit, and enter your desired "Reorder Level". When stock falls to or below this level, you will receive an alert in the Notifications center and dashboard.'
    },
    {
      q: 'Can I export my sales and inventory reports to Excel or Tally?',
      a: 'Yes! On every table (Inventory, Sales, Purchase, Reports), click the "Export CSV" or "Download" button to save an audit-ready CSV file formatted for Tally Prime and Excel.'
    },
    {
      q: 'How do I generate a GST tax filing report?',
      a: 'Navigate to Reports > Generate Report > Select "GST Tax Filing Sheet" and specify the period. You can preview all taxable totals and download the CSV ready for GSTR-1/3B reconciliation.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    const newMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    setTimeout(() => {
      let botResponse = `I received your question regarding: "${userText}". In RetailMind AI, you can track this directly from your Dashboard or AI Predictions page!`;
      if (userText.toLowerCase().includes('stock') || userText.toLowerCase().includes('inventory')) {
        botResponse = 'You currently have 14 products marked as Low Stock. Would you like me to auto-generate a Purchase Order for Grover Distributors?';
      } else if (userText.toLowerCase().includes('report') || userText.toLowerCase().includes('gst')) {
        botResponse = 'You can download the July 2025 GST Summary Report directly from the Reports page as CSV or PDF!';
      }
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Help & Support
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Get help and support for your business.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">How can we help you?</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for articles, guides, tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Topics</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {popularTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => setSearchQuery(topic.title)}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/40 cursor-pointer transition-all duration-150 space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <topic.icon className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{topic.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{topic.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFaqs.map((faq, idx) => (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    {activeFaq === idx ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {activeFaq === idx && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-1">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Contact Support</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Need help with your business?</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Support</span>
                <a href="mailto:support@retailmind.ai" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  support@retailmind.ai
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Support</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  +91 98765 43210
                </span>
                <span className="text-[10px] text-slate-400 block">Mon - Sat (9am - 8pm IST)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live RetailMind Chat</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Available 24/7 with simulated AI assistance</p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setIsChatOpen(true)}
              >
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="RetailMind AI Live Support"
        size="md"
      >
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <Button variant="primary" size="md" icon={Send} type="submit">
              Send
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
