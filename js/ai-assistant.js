
/* ============================================================
   RETAILMIND AI — FINAL CHAT ASSISTANT
   Frontend: HTML, CSS, JavaScript
   AI: Groq through Supabase Edge Function
   Function: retailmind-ai

   Requires:
   - window.supabaseClient from js/supabase.js
   - #chatMessages, #chatInput, #btnSendChat
   - Optional #chatForm, .prompt-chip, #btnResetChat
   ============================================================ */

'use strict';

let currentRequestId = 0;
let activeRequests = 0;
let chatInitialized = false;

const DEFAULT_GREETING = `Hello! I'm your **RetailMind AI Assistant**.

I can help you analyze your retail business using the data available to your account.

Try asking:
- Which products should I reorder today?
- Summarize my recent sales.
- Which products are below their reorder level?
- Which suppliers have the longest lead times?
- Show my pending purchase orders.
- Identify possible dead stock.

What would you like to analyze today?`;

// ------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', initializeRetailMindChat);

function initializeRetailMindChat() {
  if (chatInitialized) return;
  chatInitialized = true;

  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const form = document.getElementById('chatForm');
  const sendButton = document.getElementById('btnSendChat');
  const resetButton =
    document.getElementById('btnResetChat') ||
    document.querySelector('.chat-header button.btn-outline');

  if (!messages) {
    console.error('RetailMind AI: #chatMessages was not found.');
    return;
  }

  messages.replaceChildren();
  appendMessage('ai', DEFAULT_GREETING, messages);

  // Use ONE form handler for button clicks and Enter submissions.
  // Do not also attach a click handler to the submit button.
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendUserMessage(input?.value || '');
    });
  } else {
    // Fallback for pages that do not use a form.
    sendButton?.addEventListener('click', () => {
      sendUserMessage(input?.value || '');
    });

    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        sendUserMessage(input.value);
      }
    });
  }

  // Suggested prompts.
  document.querySelectorAll('.prompt-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const question = chip.textContent.trim();
      if (question) sendUserMessage(question);
    });
  });

  // Reset conversation.
  if (resetButton) {
    resetButton.addEventListener('click', (event) => {
      // Avoid submitting the chat form if the reset button is inside it.
      event.preventDefault();
      resetChat();
    });
  }

  handleUrlQueryParam();
}

// ------------------------------------------------------------
// URL QUERY SUPPORT
// Example: ai-assistant.html?q=show%20my%20inventory
// ------------------------------------------------------------

function handleUrlQueryParam() {
  const question = new URLSearchParams(window.location.search).get('q');

  if (question?.trim()) {
    const input = document.getElementById('chatInput');
    if (input) input.value = question.trim();

    sendUserMessage(question);
  }
}

// ------------------------------------------------------------
// SEND A MESSAGE
// ------------------------------------------------------------

async function sendUserMessage(text) {
  const question = String(text || '').trim();
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendButton = document.getElementById('btnSendChat');

  if (!question || !messages) return;

  if (question.length > 2000) {
    appendMessage(
      'ai',
      'Please keep your question under 2,000 characters.',
      messages
    );
    return;
  }

  if (input) input.value = '';

  appendMessage('user', question, messages);

  const thinkingRow = createThinkingRow();
  messages.appendChild(thinkingRow);
  scrollChatToBottom(messages);

  const bubble = thinkingRow.querySelector('.message-bubble');
  const requestId = ++currentRequestId;

  activeRequests++;
  if (sendButton) sendButton.disabled = true;

  try {
    const reply = await getAssistantReply(question);

    // Ignore responses from an older or reset conversation.
    if (requestId !== currentRequestId) return;

    if (bubble) {
      bubble.classList.remove('is-thinking');
      bubble.replaceChildren(renderMarkdown(reply));
    }
  } catch (error) {
    console.error('RetailMind AI request failed:', error);

    if (bubble && requestId === currentRequestId) {
      bubble.classList.remove('is-thinking');
      bubble.textContent = getFriendlyErrorMessage(error);
    }
  } finally {
    activeRequests = Math.max(0, activeRequests - 1);

    if (activeRequests === 0 && sendButton) {
      sendButton.disabled = false;
    }

    if (requestId === currentRequestId) {
      scrollChatToBottom(messages);
    }
  }
}

// ------------------------------------------------------------
// SUPABASE EDGE FUNCTION
// Groq API keys must remain on the server.
// ------------------------------------------------------------

async function getAssistantReply(question) {
  const db = window.supabaseClient;

  if (!db) {
    throw new Error(
      'Supabase client is not initialized. Check js/supabase.js.'
    );
  }

  const {
    data: sessionData,
    error: sessionError
  } = await db.auth.getSession();

  if (sessionError) {
    console.error('Supabase session error:', sessionError);
    throw new Error('Unable to verify your login session.');
  }

  if (!sessionData?.session) {
    throw new Error('Please sign in before using RetailMind AI.');
  }

  const { data, error } = await db.functions.invoke('retailmind-ai', {
    body: { question }
  });

  if (error) {
    const details = await readFunctionError(error);

    console.error('RetailMind AI Edge Function failure:', {
      message: error.message,
      details
    });

    throw new Error(
      details || error.message || 'The AI service returned an error.'
    );
  }

  if (data?.error) {
    console.error('RetailMind AI server error:', data.error);
    throw new Error(data.error);
  }

  if (typeof data?.reply !== 'string' || !data.reply.trim()) {
    console.error('Invalid Edge Function response:', {
      receivedData: data
    });

    throw new Error(
      'The AI service returned an empty response. Check the Supabase function logs.'
    );
  }

  return data.reply.trim();
}

// ------------------------------------------------------------
// READ EDGE FUNCTION ERROR DETAILS
// ------------------------------------------------------------


async function readFunctionError(error) {
  try {
    const context = error?.context;

    if (context && typeof context.json === "function") {
      const body = await context.json();

      console.error("Edge Function response body:", body);

      return body?.debug || body?.error || error.message;
    }
  } catch (parseError) {
    console.error("Could not read Edge Function error body:", parseError);
  }

  return error?.message || "Unknown Edge Function error";
}


// ------------------------------------------------------------
// FRIENDLY ERROR MESSAGES
// ------------------------------------------------------------

function getFriendlyErrorMessage(error) {
  const message = String(error?.message || '');

  if (/sign in|session|unauthorized|401/i.test(message)) {
    return 'Your login session may have expired. Please sign in again and retry.';
  }

  if (/empty response/i.test(message)) {
    return 'The AI service returned an empty response. Check the Groq response and model settings in your Supabase Edge Function logs.';
  }

  if (/functionsfetcherror|failed to fetch|networkerror/i.test(message)) {
    return 'Could not connect to RetailMind AI. Check your connection and confirm that the retailmind-ai Edge Function is deployed.';
  }

  if (/rate.?limit|429|too many requests/i.test(message)) {
    return 'The AI service is receiving too many requests. Please wait a moment and try again.';
  }

  if (/timeout|timed out/i.test(message)) {
    return 'The AI request took too long. Please try again with a shorter question.';
  }

  // The server may intentionally hide internal error details.
  console.error('RetailMind AI error details:', message);

  return message
    ? `RetailMind AI request failed: ${message}`
    : 'RetailMind AI could not complete your request. Check the Supabase Edge Function logs.';
}

// ------------------------------------------------------------
// CREATE CHAT MESSAGE
// ------------------------------------------------------------

function appendMessage(role, text, container) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `message-avatar ${role}`;

  const icon = document.createElement('i');
  icon.className = role === 'user'
    ? 'fa-solid fa-user'
    : 'fa-solid fa-robot';
  icon.setAttribute('aria-hidden', 'true');

  avatar.appendChild(icon);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (role === 'user') {
    bubble.textContent = text;
  } else {
    bubble.appendChild(renderMarkdown(text));
  }

  row.append(avatar, bubble);
  container.appendChild(row);

  scrollChatToBottom(container);
  return row;
}

// ------------------------------------------------------------
// THINKING INDICATOR
// ------------------------------------------------------------

function createThinkingRow() {
  const row = document.createElement('div');
  row.className = 'message-row ai';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar ai';

  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-robot';
  icon.setAttribute('aria-hidden', 'true');
  avatar.appendChild(icon);

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble is-thinking';

  const spinner = document.createElement('i');
  spinner.className = 'fa-solid fa-circle-notch fa-spin text-primary';
  spinner.setAttribute('aria-hidden', 'true');

  bubble.append(
    spinner,
    document.createTextNode(' RetailMind AI is thinking...')
  );

  row.append(avatar, bubble);
  return row;
}

// ------------------------------------------------------------
// SAFE MARKDOWN RENDERER
// Supports headings, bold, italic, inline code, lists, tables.
// Raw HTML from the AI response is never executed.
// ------------------------------------------------------------

function renderMarkdown(markdown) {
  const fragment = document.createDocumentFragment();
  const lines = String(markdown || '').split(/\r?\n/);
  let index = 0;

  function addInline(parent, text) {
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      const token = match[0];
      let element;
      let value;

      if (token.startsWith('**')) {
        element = document.createElement('strong');
        value = token.slice(2, -2);
      } else if (token.startsWith('*')) {
        element = document.createElement('em');
        value = token.slice(1, -1);
      } else {
        element = document.createElement('code');
        value = token.slice(1, -1);
      }

      element.textContent = value;
      parent.appendChild(element);
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.appendChild(
        document.createTextNode(text.slice(lastIndex))
      );
    }
  }

  function addParagraph(text) {
    const paragraph = document.createElement('p');
    paragraph.className = 'ai-paragraph';
    addInline(paragraph, text);
    fragment.appendChild(paragraph);
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  }

  function isTableSeparator(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 &&
      cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  function isTableStart(position) {
    return position + 1 < lines.length &&
      lines[position].includes('|') &&
      isTableSeparator(lines[position + 1]);
  }

  function addTable() {
    const headers = splitTableRow(lines[index]);
    index += 2;

    const rows = [];

    while (
      index < lines.length &&
      lines[index].trim() &&
      lines[index].includes('|')
    ) {
      rows.push(splitTableRow(lines[index]));
      index++;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'ai-table-wrapper';

    const table = document.createElement('table');
    table.className = 'ai-response-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    headers.forEach((header) => {
      const th = document.createElement('th');
      addInline(th, header);
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    rows.forEach((row) => {
      const tr = document.createElement('tr');

      headers.forEach((_, columnIndex) => {
        const td = document.createElement('td');
        addInline(td, row[columnIndex] || '');
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    fragment.appendChild(wrapper);
  }

  while (index < lines.length) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      index++;
      continue;
    }

    if (isTableStart(index)) {
      addTable();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {
      const level = Math.min(heading[1].length + 2, 5);
      const element = document.createElement(`h${level}`);
      element.className = 'ai-response-heading';
      addInline(element, heading[2]);
      fragment.appendChild(element);
      index++;
      continue;
    }

    const unordered = trimmed.match(/^[-*•]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const list = document.createElement(isOrdered ? 'ol' : 'ul');
      list.className = 'ai-response-list';

      while (index < lines.length) {
        const current = lines[index].trim();
        const item = current.match(
          isOrdered
            ? /^\d+[.)]\s+(.+)$/
            : /^[-*•]\s+(.+)$/
        );

        if (!item) break;

        const li = document.createElement('li');
        addInline(li, item[1]);
        list.appendChild(li);
        index++;
      }

      fragment.appendChild(list);
      continue;
    }

    addParagraph(trimmed);
    index++;
  }

  return fragment;
}

// ------------------------------------------------------------
// RESET CHAT
// ------------------------------------------------------------

function resetChat() {
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendButton = document.getElementById('btnSendChat');

  // Prevent older responses from updating the reset conversation.
  currentRequestId++;

  if (messages) {
    messages.replaceChildren();
    appendMessage('ai', DEFAULT_GREETING, messages);
  }

  if (input) {
    input.value = '';
    input.focus();
  }

  // Do not enable the button while another request is still running.
  if (sendButton && activeRequests === 0) {
    sendButton.disabled = false;
  }
}

// ------------------------------------------------------------
// SCROLL CONVERSATION
// ------------------------------------------------------------

function scrollChatToBottom(container) {
  const messages = container ||
    document.getElementById('chatMessages');

  if (!messages) return;

  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
}

// Expose functions for optional external integrations.
window.sendRetailMindMessage = sendUserMessage;
window.resetRetailMindChat = resetChat;
