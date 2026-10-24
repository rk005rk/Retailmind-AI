/**
 * RETAILMIND AI - ORDERS MODULE
 * Order filtering, search, and detail drawer with live fulfillment timeline.
 */


document.addEventListener('DOMContentLoaded', async () => {
  setupOrderFilters();

  const tbody = document.getElementById('ordersTableBody');

  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted" style="padding: 2.5rem;">
          Loading orders...
        </td>
      </tr>
    `;
  }

  try {
    await fetchOrdersFromSupabase();
    updateOrderStatistics();
    loadOrdersTable();
  } catch (error) {
    console.error('Failed to load orders:', error);

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted" style="padding: 2.5rem;">
            Unable to load orders. Check your connection and permissions.
          </td>
        </tr>
      `;
    }
  }
});



let ordersCache = [];

function getOrders() {
  return ordersCache;
}

async function fetchOrdersFromSupabase() {
  const { data: { user }, error: userError } =
    await supabaseClient.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Please sign in to view orders.');

  const { data: membership, error: membershipError } =
    await supabaseClient
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) throw new Error('No business membership found.');

  const { data: sales, error: salesError } =
    await supabaseClient
      .from('sales')
      .select(`
        id,business_id,customer_id,customer_name,total_amount,payment_method,status,sale_date,
        subtotal,
        discount_rate,
        discount_amount,
        gst_amount,
        sale_items (
          quantity,
          unit_price,
          total_price,
          products (name)
        )
      `)
      .eq('business_id', membership.business_id)
      .order('sale_date', { ascending: false });

  if (salesError) throw salesError;

  ordersCache = (sales || []).map(sale => ({
    id: sale.id,
    customer: sale.customer_name?.trim() || 'Walk-in Customer',
    date: new Date(sale.sale_date).toLocaleDateString('en-IN'),

    time: new Date(sale.sale_date).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),

    items: (sale.sale_items || [])
      .map(item => `${item.products?.name || 'Product'} × ${item.quantity}`)
      .join(', '),
    total: Number(sale.total_amount || 0),
    payment: sale.payment_method || 'N/A',
    status: sale.status
      ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1)
      : 'Completed',
    subtotal: sale.subtotal == null ? null : Number(sale.subtotal),
    discountRate: sale.discount_rate == null ? null : Number(sale.discount_rate),
    discountAmount: sale.discount_amount == null ? null : Number(sale.discount_amount),
    gst: sale.gst_amount == null ? null : Number(sale.gst_amount)
  }));

  return ordersCache;
}

function updateOrderStatistics() {
  const orders = getOrders();

  const total = orders.length;
  const countStatus = status =>
    orders.filter(order =>
      String(order.status || '').toLowerCase() === status
    ).length;

  const completed = countStatus('completed');
  const processing = countStatus('processing');
  const pending = countStatus('pending');
  const cancelled = countStatus('cancelled');

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const percentage = count =>
    total ? `${((count / total) * 100).toFixed(1)}%` : '0%';

  setText('ordersTotalCount', total.toLocaleString('en-IN'));
  setText('ordersCompletedCount', completed.toLocaleString('en-IN'));
  setText('ordersProcessingCount', processing.toLocaleString('en-IN'));
  setText('ordersPendingCount', pending.toLocaleString('en-IN'));
  setText('ordersCancelledCount', cancelled.toLocaleString('en-IN'));

  setText('ordersCompletedRate', `${percentage(completed)} completed`);
  setText('ordersCancelledRate', `${percentage(cancelled)} cancelled`);
}


function loadOrdersTable(filterList = null) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const orders = filterList || getOrders();
  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 2.5rem;">No matching orders found.</td></tr>`;
    return;
  }

  orders.forEach(o => {
    let badgeClass = 'badge-success';
    if (o.status === 'Processing') badgeClass = 'badge-info';
    else if (o.status === 'Pending') badgeClass = 'badge-warning';
    else if (o.status === 'Cancelled') badgeClass = 'badge-danger';

    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => openOrderDetailDrawer(o.id);

    tr.innerHTML = `
      <td>
  <code title="${o.id}">${String(o.id).slice(0, 8).toUpperCase()}</code>
</td>
      <td>
        <div class="font-bold text-dark">${o.customer}</div>
      </td>
<td class="text-muted">${o.date}</td>
<td class="text-muted" style="white-space: nowrap;">
  ${o.time}
</td>

      <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${o.items}
      </td>
      <td>
  <strong>₹${Number(o.total).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}</strong>
</td>
      <td><span class="badge badge-primary">${o.payment}</span></td>
      <td>
        <span class="badge ${badgeClass}">
          <span class="badge-dot"></span> ${o.status}
        </span>
      </td>
      <td class="text-right">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openOrderDetailDrawer('${o.id}')">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupOrderFilters() {
  const search = document.getElementById('orderSearchInput');
  const pills = document.querySelectorAll('.order-status-pill');

  let currentStatus = 'All';

  function applyFilters() {
    const q = (search ? search.value : '').toLowerCase().trim();
    const filtered = getOrders().filter(o => {
      const matchQuery = o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.items.toLowerCase().includes(q);
      const matchStatus = currentStatus === 'All' || o.status.toLowerCase() === currentStatus.toLowerCase();
      return matchQuery && matchStatus;
    });
    loadOrdersTable(filtered);
  }

  if (search) search.addEventListener('input', applyFilters);

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentStatus = pill.getAttribute('data-status') || 'All';
      applyFilters();
    });
  });
}

function openOrderDetailDrawer(orderId) {
  const order = getOrders().find(o => o.id === orderId);
  if (!order) return;

  const drawer = document.getElementById('orderDetailDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const content = document.getElementById('drawerOrderContent');

  if (!drawer || !content) return;

  const subtotal = order.subtotal;
  const discountAmount = order.discountAmount;
  const discountRate = order.discountRate;
  const gst = order.gst;

  const normalizedStatus = String(order.status || 'Completed').toLowerCase();

  const isCompleted = normalizedStatus === 'completed';
  const isCancelled = normalizedStatus === 'cancelled';
  const isPending = normalizedStatus === 'pending';

  const paymentLabel = isPending
    ? 'Awaiting payment'
    : isCancelled
      ? 'Payment status requires verification'
      : `Payment method: ${order.payment}`;

  const fulfillmentLabel = isCompleted
    ? 'Customer handover complete'
    : isCancelled
      ? 'Order cancelled'
      : isPending
        ? 'Waiting for payment'
        : 'Order is being processed';


  content.innerHTML = `
    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
        <div>
          
<span class="badge badge-primary" title="${order.id}">
  ${String(order.id).slice(0, 8).toUpperCase()}
</span>

          <h3 style="margin-top: 0.5rem;">${order.customer}</h3>
          <div class="text-muted" style="font-size: 0.8125rem;">${order.date} • Paid via ${order.payment}</div>
        </div>
        <span class="badge badge-${order.status === 'Completed' ? 'success' : (order.status === 'Cancelled' ? 'danger' : 'warning')}">
          ${order.status}
        </span>
      </div>
    </div>

    <!-- Fulfillment Timeline -->
    <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); background: var(--surface-subtle);">
      <h5 style="font-size: 0.8125rem; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem; letter-spacing: 0.05em;">
        Fulfillment Progress
      </h5>
      <div style="display: flex; flex-direction: column; gap: 1rem; position: relative;">
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
            <i class="fa-solid fa-check"></i>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600;">Order Created & Invoiced</div>
            <div style="font-size: 0.6875rem; color: var(--muted);">${order.date}</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
            <i class="fa-solid fa-check"></i>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600;">Payment Confirmed via ${order.payment}</div>
           <div style="font-size: 0.6875rem; color: var(--muted);">
  Payment method: ${order.payment}
</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background: ${order.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
            <i class="fa-solid ${order.status === 'Completed' ? 'fa-check' : 'fa-box'}"></i>
          </div>
          <div>
            <div style="font-size: 0.8125rem; font-weight: 600;">
  ${isCancelled ? 'Order Cancelled' : isCompleted ? 'Dispensed & Delivered' : isPending ? 'Awaiting Payment' : 'Processing Order'}
</div>
            <div style="font-size: 0.6875rem; color: var(--muted);">
  ${fulfillmentLabel}
</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Items -->
    <div style="padding: 1.5rem; flex: 1; overflow-y: auto;">
      <h5 style="font-size: 0.8125rem; text-transform: uppercase; color: var(--muted); margin-bottom: 0.75rem; letter-spacing: 0.05em;">
        Purchased Line Items
      </h5>
      <div style="background: var(--surface-subtle); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border); margin-bottom: 1.25rem;">
        <div style="font-size: 0.875rem; color: var(--dark);">${order.items}</div>
      </div>

     
<!-- Totals Breakdown -->
<div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; border-top: 1px solid var(--border); padding-top: 1rem;">
  <div style="display: flex; justify-content: space-between; color: var(--muted);">
    <span>Subtotal:</span>
    <span>₹${subtotal == null ? '—' : subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </div>

  <div style="display: flex; justify-content: space-between; color: var(--muted);">
    <span>Discount${discountRate == null ? '' : ` (${discountRate}%)`}:</span>
    <span>−₹${discountAmount == null ? '—' : discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </div>

  <div style="display: flex; justify-content: space-between; color: var(--muted);">
    <span>GST (18%):</span>
    <span>₹${gst == null ? '—' : gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </div>

  <div style="display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 800; color: var(--dark); border-top: 1px dashed var(--border); padding-top: 0.5rem;">
    <span>Total Paid:</span>
    <span class="text-primary">₹${order.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
  </div>
</div>


    <div style="padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); background: var(--surface); display: flex; gap: 0.75rem;">
      
<button class="btn btn-outline" style="flex: 1;" onclick="printOrderReceipt('${order.id}')">
  <i class="fa-solid fa-print"></i> Print Receipt
</button>

      <button class="btn btn-primary" style="flex: 1;" onclick="closeOrderDetailDrawer()">
        Close
      </button>
    </div>
  `;

  drawer.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeOrderDetailDrawer() {
  const drawer = document.getElementById('orderDetailDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function printOrderReceipt(orderId) {
  const order = getOrders().find(item => item.id === orderId);
  if (!order) {
    alert('Order not found.');
    return;
  }

  const receiptWindow = window.open('', '_blank', 'width=420,height=700');

  if (!receiptWindow) {
    alert('Please allow pop-ups to print the receipt.');
    return;
  }

  const escapeHtml = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const money = value =>
    Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const subtotal = order.subtotal;
  const discount = order.discountAmount;
  const discountRate = order.discountRate;
  const gst = order.gst;

  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Receipt - ${escapeHtml(order.id)}</title>
      

<style>
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: Arial, sans-serif;
    color: #111;
    font-size: 16px;
    line-height: 1.6;
  }

  .receipt {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
    border: 1px solid #ddd;
  }

  h2 {
    text-align: center;
    font-size: 28px;
    margin: 0 0 4px;
  }

  p {
    margin: 6px 0;
  }

  .muted {
    color: #555;
    text-align: center;
  }

  .line {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin: 12px 0;
  }

  .line span:last-child {
    text-align: right;
    overflow-wrap: anywhere;
  }

  .divider {
    border-top: 1px dashed #888;
    margin: 16px 0;
  }

  .items {
    text-align: left;
    overflow-wrap: anywhere;
  }

  .total {
    font-size: 20px;
    font-weight: bold;
  }

  @media print {
    .receipt {
      border: none;
      padding: 0;
    }
  }
</style>


    </head>
    <body>
    <div class="receipt">
      <h2>RetailMind</h2>
      <p class="muted">Sales Receipt</p>
      <div class="divider"></div>

      <div class="line">
        <span>Order ID</span>
        <strong>${escapeHtml(order.id)}</strong>
      </div>
      <div class="line">
        <span>Customer</span>
        <span>${escapeHtml(order.customer)}</span>
      </div>
      <div class="line">
        <span>Date</span>
        <span>${escapeHtml(order.date)}</span>
      </div>
      <div class="line">
        <span>Payment</span>
        <span>${escapeHtml(order.payment)}</span>
      </div>
      <div class="line">
        <span>Status</span>
        <span>${escapeHtml(order.status)}</span>
      </div>

      <div class="divider"></div>
      <strong>Purchased Items</strong>
      <p class="items" style="text-align:left;">
        ${escapeHtml(order.items)}
      </p>

      <div class="divider"></div>

      <div class="line">
        <span>Subtotal</span>
        <span>${subtotal == null ? 'Not available' : '₹' + money(subtotal)}</span>
      </div>
      <div class="line">
        <span>Discount${discountRate == null ? '' : ' (' + escapeHtml(discountRate) + '%)'}</span>
        <span>${discount == null ? 'Not available' : '−₹' + money(discount)}</span>
      </div>
      <div class="line">
        <span>GST</span>
        <span>${gst == null ? 'Not available' : '₹' + money(gst)}</span>
      </div>

      <div class="divider"></div>
      <div class="line total">
        <span>Total Paid</span>
        <span>₹${money(order.total)}</span>
      </div>

      <div class="divider"></div>
      <p>Thank you for shopping with us!</p>
      <p class="muted">Please keep this receipt for your records.</p>
</div>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  receiptWindow.document.close();
}
