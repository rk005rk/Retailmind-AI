import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { useData } from '../../context/DataContext';

export default function BusinessAssistantPage() {
  const { products, addToast } = useData();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello Sanaullah! I am your **RetailMind AI Assistant**. Ask me anything about your store's inventory, demand forecasts, top-selling SKUs, or dead stock clearance.",
      time: 'Just now',
    },
  ]);

  const exampleQuestions = [
    'Which products should I reorder right now?',
    'Why are sales decreasing in Apparel?',
    'Predict next month revenue and profit.',
    'Show dead stock unsold for 90+ days.',
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Simulate AI thinking and smart response
    setTimeout(() => {
      let botResponse = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('reorder')) {
        botResponse = `Based on current stock levels and sales velocity, you should reorder:\n\n1. **Organic Cotton Oxford Shirt** (Only 8 units left • Reorder 50)\n2. **Ultra-thin Bluetooth Keyboard** (Only 3 units left • Reorder 25)\n3. **Ergonomic Trail Running Shoes** (14 units left • Reorder 30)\n\n*Would you like me to auto-generate purchase orders for Apex Logistics & Tech?*`;
      } else if (qLower.includes('decreasing') || qLower.includes('why')) {
        botResponse = `Apparel sales dipped 8% this week due to:\n- Rainy weather reducing physical store footfall (-14% in BLR branch).\n- Competitor discount campaign on shirts.\n\n**Recommendation:** Run a weekend 10% bundle promotion on POS terminals.`;
      } else if (qLower.includes('predict') || qLower.includes('revenue')) {
        botResponse = `**August Revenue Forecast:** ₹9,40,000 (+18.2% growth)\n**Projected Profit:** ₹3,80,000\n**Confidence Score:** 94.8%\n\n*Key driver:* Festive stocking for upcoming Diwali & Rakhi shopping season.`;
      } else if (qLower.includes('dead stock')) {
        botResponse = `Found **1 Dead Stock Item** unsold for 90+ days:\n- **Ultra-thin Bluetooth Keyboard** (3 units in stock • Locked Capital: ₹3,300)\n\n**AI Recommendation:** Apply a 25% clearance discount on POS terminal to liquidate within 7 days.`;
      } else {
        botResponse = `I analyzed your retail database for "${query}". Your store health is **92/100 (Optimal)** with 8 active SKUs and ₹8.2L monthly revenue trajectory. Is there a specific product or supplier report you'd like to inspect?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">RetailMind AI Business Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500">Autonomous Retail Copilot • 94.8% Accuracy</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMessages([
              {
                id: 1,
                sender: 'bot',
                text: "Chat cleared! How can I assist your retail operations today?",
                time: 'Just now',
              },
            ]);
            addToast('Chat history cleared', 'info');
          }}
          icon={RefreshCw}
        >
          Reset Chat
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-brand-600 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-xl p-4 rounded-3xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-tr-none shadow-md'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
              <div className={`text-[10px] text-right ${msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 font-semibold ml-2">Analyzing database...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0" />
        {exampleQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI about sales trends, inventory reorders, or dead stock..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <Button type="submit" variant="primary" size="md" icon={Send} disabled={!input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
