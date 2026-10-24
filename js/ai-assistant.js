/**
 * RETAILMIND AI - CONVERSATIONAL COPILOT
 * Simulated AI retail intelligence assistant with realistic typing responses & markdown rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupChatInterface();
  handleUrlQueryParam();
});

const AI_KNOWLEDGE_BASE = {
  'reorder': `Based on current stock, recent demand trends, and 7-day predictive forecasting, here are my high-priority reorder recommendations:

1. **Fresh Milk 1L** — Current: 12 | Recommended Order: **120 units** (Supplier: Heritage Dairy)
2. **Whole Wheat Bread 400g** — Current: 18 | Recommended Order: **85 units** (Supplier: Golden Crust)
3. **Sunflower Cooking Oil 1L** — Current: 18 | Recommended Order: **60 units** (Supplier: AgroPure Refineries)

*Estimated PO Investment:* **₹18,450**. Expected stockout prevention: **99.4%**.`,

  'deadstock': `Here is the Dead Stock & Slow-Moving item assessment:

• **Organic Honey 500g** — 42 days without sale. Current stock: 38 units (Capital tied up: ₹8,360). *Recommendation: 15% promotional bundle with Assam Tea.*
• **Herbal Conditioner 200ml** — 35 days without sale. Current stock: 19 units. *Recommendation: Clearance discount.*

Total trapped working capital: **₹14,280**.`,

  'profitable': `Your most profitable category is **Beverages & Packaged Dairy**, yielding an average gross margin of **31.4%**.

Top individual margin contributors:
1. Arabica Roast Coffee 200g (Margin: 38.7%)
2. Premium Assam Tea 500g (Margin: 38.1%)
3. Basmati Rice 5kg (Volume driver: ₹480 ticket size, 26.3% margin)`,

  'forecast': `Next Month's AI Revenue Forecast:
• **Projected Revenue:** **₹9,45,000** (Growth: **+12.1%** MoM)
• **Confidence Rating:** **91.8%**
• **Key Drivers:** Upcoming festival weekend (+18%), seasonal surge in warm beverages (+14%), and improved supplier replenishment cycle.`,

  'supplier': `Supplier Performance Analysis:
• **Best Overall:** **Heritage Dairy Farms** (98.4% On-time delivery rate, 4.9★ rating, 0 defective batches)
• **Watchlist Alert:** **AgroPure Refineries** has had 2 delayed shipments this month with an average lag of 1.8 days.`,

  'sales_decrease': `Sales decreased 4.2% in the Dry Goods category primarily due to:
1. Basmati Rice stockout on Saturday evening (Estimated lost revenue: ₹14,200)
2. A temporary price hike on cooking oils
3. Overall footfall was consistent, but basket size dropped from ₹680 to ₹615.`
};

function setupChatInterface() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('btnSendChat');
  const chips = document.querySelectorAll('.prompt-chip');

  if (input && sendBtn) {
    sendBtn.addEventListener('click', () => sendUserMessage(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendUserMessage(input.value);
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.textContent.trim();
      if (input) input.value = q;
      sendUserMessage(q);
    });
  });
}

function handleUrlQueryParam() {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q) {
    const input = document.getElementById('chatInput');
    if (input) input.value = q;
    setTimeout(() => sendUserMessage(q), 400);
  }
}

function sendUserMessage(text) {
  if (!text || !text.trim()) return;

  const messagesContainer = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  if (!messagesContainer) return;

  const cleanText = text.trim();
  if (input) input.value = '';

  // Append User message
  const userRow = document.createElement('div');
  userRow.className = 'message-row user';
  userRow.innerHTML = `
    <div class="message-avatar user">
      <i class="fa-solid fa-user"></i>
    </div>
    <div class="message-bubble">${escapeHtml(cleanText)}</div>
  `;
  messagesContainer.appendChild(userRow);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Append AI Thinking bubble
  const aiRow = document.createElement('div');
  aiRow.className = 'message-row ai';
  aiRow.innerHTML = `
    <div class="message-avatar ai">
      <i class="fa-solid fa-robot"></i>
    </div>
    <div class="message-bubble" id="tempAiBubble">
      <i class="fa-solid fa-circle-notch fa-spin text-primary"></i> RetailMind AI analyzing retail patterns...
    </div>
  `;
  messagesContainer.appendChild(aiRow);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Simulate AI Response lookup
  setTimeout(() => {
    let reply = "";
    const lower = cleanText.toLowerCase();

    if (lower.includes('reorder')) reply = AI_KNOWLEDGE_BASE['reorder'];
    else if (lower.includes('dead') || lower.includes('slow')) reply = AI_KNOWLEDGE_BASE['deadstock'];
    else if (lower.includes('profit') || lower.includes('margin')) reply = AI_KNOWLEDGE_BASE['profitable'];
    else if (lower.includes('forecast') || lower.includes('month') || lower.includes('next')) reply = AI_KNOWLEDGE_BASE['forecast'];
    else if (lower.includes('supplier')) reply = AI_KNOWLEDGE_BASE['supplier'];
    else if (lower.includes('decrease') || lower.includes('why')) reply = AI_KNOWLEDGE_BASE['sales_decrease'];
    else {
      reply = `I analyzed your retail database for: "${cleanText}".
      
Current operational metrics:
• Total Store Revenue: **₹8,42,650** (+12.8% vs last month)
• Inventory turnover rate: **4.2x** (Target: 4.5x)
• Stock health: 24 SKUs below minimum reorder thresholds.

Would you like me to generate a purchase order draft or simulate sales impact?`;
    }

    const bubble = aiRow.querySelector('#tempAiBubble');
    if (bubble) {
      bubble.removeAttribute('id');
      bubble.innerHTML = formatAiMarkdown(reply);
    }
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 900);
}

function formatAiMarkdown(text) {
  // Convert newlines, bold, bullets
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• (.*?)(<br>|$)/g, '<div style="margin-left: 1rem;">• $1</div>');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
