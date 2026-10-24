/**
 * RETAILMIND AI - POS / SALES MODULE
 * Product catalog, cart, discount, GST, payment, checkout and receipt.
 */

let currentCart = [];
let currentDiscountRate = 0;
let selectedPaymentMethod = 'UPI';

let posBusinessId = null;
let posProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupPosCategoryPills();
  setupPosSearch();
  setupPaymentMethods();
  setupInvoiceActions();
  setupDiscountControls();
  await initializePos();
});

// ========================================
// INITIALIZE POS
// ========================================

async function initializePos() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error('Please sign in to use the POS.');

    const { data: membership, error: membershipError } =
      await supabaseClient
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership) throw new Error('No business membership found.');

    posBusinessId = membership.business_id;
    const { data: products, error: productsError } =
      await supabaseClient
        .from('products')
        .select(
          'id, business_id, name, sku, category, selling_price, stock, reorder_level, is_archived'
        )
        .eq('business_id', posBusinessId)
        .eq('is_archived', false)
        .gt('stock', 0)
        .order('name', { ascending: true });

    if (productsError) throw productsError;

    posProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || product.id,
      category: product.category || 'Other',
      price: Number(product.selling_price),
      stock: Number(product.stock),
      reorder: Number(product.reorder_level || 0)
    }));
    renderPosCatalog();
    updateCartUI();

    await loadPosCustomers();
    console.log('POS products loaded:', posProducts.length);
  } catch (error) {
    console.error('POS initialization error:', error);

    const grid = document.getElementById('posProductGrid');
    if (grid) {
      grid.textContent = error.message || 'Unable to load products.';
    }
  }
}

function getCatalogProducts() {
  return posProducts;
}

async function loadPosCustomers() {
  const customerSelect = document.getElementById('posCustomerSelect');

  if (!customerSelect) {
    console.error('Customer dropdown #posCustomerSelect not found.');
    return;
  }

  if (!posBusinessId) {
    console.error('Cannot load customers: posBusinessId is not initialized.');
    return;
  }

  const previouslySelectedId = customerSelect.value;

  customerSelect.innerHTML =
    '<option value="">New customer / Walk-in</option>';

  const { data: customers, error } = await supabaseClient
    .from('customers')
    .select('id, name, phone')
    .eq('business_id', posBusinessId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading POS customers:', error);
    showToast('Unable to load customer list: ' + error.message, 'error');
    return;
  }

  (customers || []).forEach(customer => {
    const option = document.createElement('option');

    option.value = customer.id;
    option.dataset.customerName = customer.name || '';
    option.textContent = customer.phone
      ? `${customer.name} (${customer.phone})`
      : customer.name || 'Unnamed customer';

    customerSelect.appendChild(option);
  });

  if (previouslySelectedId) {
    customerSelect.value = previouslySelectedId;
  }

  console.log('POS customer count:', customers?.length || 0);
  console.log('POS business ID:', posBusinessId);

  if (customerSelect.dataset.handlersAttached === 'true') return;

  customerSelect.addEventListener('change', () => {
    const nameInput = document.getElementById('posCustomerName');
    const selectedOption = customerSelect.selectedOptions[0];

    if (nameInput) {
      nameInput.value = customerSelect.value
        ? selectedOption?.dataset.customerName || ''
        : '';
    }
  });

  const nameInput = document.getElementById('posCustomerName');

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const selectedOption = customerSelect.selectedOptions[0];

      if (
        customerSelect.value &&
        nameInput.value.trim() !==
          (selectedOption?.dataset.customerName || '')
      ) {
        customerSelect.value = '';
      }
    });
  }

  customerSelect.dataset.handlersAttached = 'true';
}

// ========================================
// PRODUCT CATALOG
// ========================================

function renderPosCatalog(filterCategory = 'All', searchQuery = '') {
  const grid = document.getElementById('posProductGrid');
  if (!grid) return;

  const products = getCatalogProducts().filter(product => {
    const matchCategory =
      filterCategory === 'All' ||
      product.category.toLowerCase() === filterCategory.toLowerCase();

    const query = searchQuery.toLowerCase();

    const matchSearch =
      product.name.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query);

    return matchCategory && matchSearch;
  });

  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--muted);">
        No matching products in catalog.
      </div>
    `;
    return;
  }


  const categoryIcons = {
    Groceries: 'fa-basket-shopping',
    Beverages: 'fa-mug-hot',
    'Personal Care': 'fa-pump-soap',
    Clothing: 'fa-shirt',
    Footwear: 'fa-shoe-prints',
    Accessories: 'fa-bag-shopping',
    Medicines: 'fa-pills',
    Dairy: 'fa-cow',
    Bakery: 'fa-bread-slice',
    Snacks: 'fa-cookie',
    'Home & Kitchen': 'fa-house',
    Other: 'fa-box'
  };


  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'pos-item-card';
    card.onclick = () => addToCart(product);

    const icon = categoryIcons[product.category] || 'fa-box';

    card.innerHTML = `
      <div>
        <div class="pos-item-icon">
          <i class="fa-solid ${icon} text-primary"></i>
        </div>
        <div class="pos-item-name"></div>
        <div class="text-muted" style="font-size:0.75rem;"></div>
      </div>
      <div class="pos-item-meta">
        <div class="pos-item-price"></div>
        <button class="btn btn-sm btn-primary btn-icon-sm" title="Add to cart">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    `;

    card.querySelector('.pos-item-name').textContent = product.name;
    card.querySelector('.text-muted').textContent =
      `${product.category} • In stock: ${product.stock}`;
    card.querySelector('.pos-item-price').textContent =
      `₹${product.price.toFixed(2)}`;

    grid.appendChild(card);
  });
}

function setupPosCategoryPills() {
  const pills = document.querySelectorAll('.category-pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(item => item.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.getAttribute('data-category') || 'All';
      const search = document.getElementById('posSearchInput')?.value || '';

      renderPosCatalog(category, search);
    });
  });
}

function setupPosSearch() {
  const input = document.getElementById('posSearchInput');
  if (!input) return;

  input.addEventListener('input', () => {
    const activePill = document.querySelector('.category-pill.active');
    const category = activePill
      ? activePill.getAttribute('data-category')
      : 'All';

    renderPosCatalog(category, input.value);
  });
}

// ========================================
// CART MANAGEMENT
// ========================================

function addToCart(product) {
  const availableProduct = posProducts.find(
    item => item.id === product.id
  );

  if (!availableProduct) {
    showToast('Product is no longer available.', 'error');
    return;
  }

  const existing = currentCart.find(
    item => item.id === availableProduct.id
  );

  const currentQty = existing ? existing.qty : 0;

  if (currentQty >= availableProduct.stock) {
    showToast(
      `Only ${availableProduct.stock} units available.`,
      'warning'
    );
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    currentCart.push({
      id: availableProduct.id,
      name: availableProduct.name,
      price: availableProduct.price,
      qty: 1,
      stock: availableProduct.stock
    });
  }

  updateCartUI();

  showToast(
    `Added ${availableProduct.name} to cart`,
    'success',
    'fa-cart-plus'
  );
}

function changeQty(productId, delta) {
  const item = currentCart.find(product => product.id === productId);
  if (!item) return;

  const nextQty = item.qty + delta;

  if (nextQty <= 0) {
    currentCart = currentCart.filter(
      product => product.id !== productId
    );
  } else if (nextQty > item.stock) {
    showToast(`Only ${item.stock} units available.`, 'warning');
    return;
  } else {
    item.qty = nextQty;
  }

  updateCartUI();
}

function removeCartItem(productId) {
  currentCart = currentCart.filter(
    item => item.id !== productId
  );

  updateCartUI();
}

function clearCart() {
  if (currentCart.length === 0) return;

  if (confirm('Clear current cart items?')) {
    currentCart = [];
    updateCartUI();

    showToast('Cart cleared', 'warning', 'fa-trash');
  }
}

function holdOrder() {
  if (currentCart.length === 0) {
    alert('Cart is empty. Add items first.');
    return;
  }

  localStorage.setItem(
    'retailmind_held_cart',
    JSON.stringify(currentCart)
  );

  currentCart = [];
  updateCartUI();

  showToast('Order held as draft in memory.', 'info', 'fa-pause');
}

// ========================================
// DISCOUNT CONTROLS
// ========================================

function setupDiscountControls() {
  const input = document.getElementById('discountRateInput');
  const applyBtn = document.getElementById('btnApplyDiscount');
  const removeBtn = document.getElementById('btnRemoveDiscount');

  if (!input || !applyBtn || !removeBtn) {
    console.warn('Discount controls were not found in sales.html.');
    return;
  }

  applyBtn.addEventListener('click', () => {
    if (input.value.trim() === '') {
      showToast('Enter a discount between 0% and 100%.', 'warning');
      return;
    }

    const rate = Number(input.value);

    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      showToast('Enter a discount between 0% and 100%.', 'warning');
      return;
    }

    currentDiscountRate = rate;
    updateCartUI();

    showToast(`Discount of ${rate}% applied.`, 'success');
  });

  removeBtn.addEventListener('click', () => {
    currentDiscountRate = 0;
    input.value = '0';

    updateCartUI();

    showToast('Discount removed.', 'success');
  });
}

// ========================================
// CART TOTALS AND DISPLAY
// ========================================

function updateCartUI() {
  const list = document.getElementById('cartItemsList');
  const countBadge = document.getElementById('cartCountBadge');
  const subtotalEl = document.getElementById('cartSubtotal');
  const gstEl = document.getElementById('cartGst');
  const discountEl = document.getElementById('cartDiscount');
  const totalEl = document.getElementById('cartTotal');

  if (!list) return;

  list.innerHTML = '';

  let subtotal = 0;
  let totalCount = 0;

  if (currentCart.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--light-muted);">
        <i class="fa-solid fa-cart-shopping"
           style="font-size:2.5rem;margin-bottom:0.75rem;"></i>
        <p>Your cart is empty.</p>
        <span style="font-size:0.75rem;">
          Click catalog products to start billing
        </span>
      </div>
    `;
  } else {
    currentCart.forEach(item => {
      const price = Number(item.price);
      const quantity = Number(item.qty);
      const itemTotal = price * quantity;

      subtotal += itemTotal;
      totalCount += quantity;

      const row = document.createElement('div');
      row.className = 'cart-row';

      row.innerHTML = `
        <div style="flex:1;padding-right:0.5rem;">
          <div class="font-bold text-dark"
               style="font-size:0.8125rem;"></div>
          <div class="text-muted"
               style="font-size:0.75rem;"></div>
        </div>

        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn decrease-qty">-</button>
          <span style="font-weight:700;font-size:0.8125rem;min-width:16px;text-align:center;">
            ${quantity}
          </span>
          <button class="cart-qty-btn increase-qty">+</button>
        </div>

        <div style="text-align:right;min-width:60px;margin-left:0.75rem;">
          <div class="font-bold text-primary">
            ₹${itemTotal.toFixed(2)}
          </div>
        </div>

        <button class="btn btn-ghost btn-icon-sm text-danger remove-item"
                style="margin-left:0.25rem;"
                aria-label="Remove item">
          <i class="fa-solid fa-xmark"></i>
        </button>
      `;

      row.querySelector('.font-bold.text-dark').textContent = item.name;
      row.querySelector('.text-muted').textContent =
        `₹${price.toFixed(2)} each`;

      row.querySelector('.decrease-qty').addEventListener('click', () => {
        changeQty(item.id, -1);
      });

      row.querySelector('.increase-qty').addEventListener('click', () => {
        changeQty(item.id, 1);
      });

      row.querySelector('.remove-item').addEventListener('click', () => {
        removeCartItem(item.id);
      });

      list.appendChild(row);
    });
  }

  // Calculate discount and GST.
  // Discount is rounded to whole rupees to match the current SQL function.
  const discountRate = Number(currentDiscountRate) || 0;
  const discountAmount = Math.round(
    subtotal * discountRate / 100
  );

  const taxableAmount = subtotal - discountAmount;
  const gst = Math.round(taxableAmount * 0.18);
  const total = taxableAmount + gst;

  const money = amount =>
    `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  if (countBadge) countBadge.textContent = totalCount;
  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (discountEl) discountEl.textContent = `-${money(discountAmount)}`;
  if (gstEl) gstEl.textContent = money(gst);
  if (totalEl) totalEl.textContent = money(total);
}

// ========================================
// PAYMENT METHODS
// ========================================

function setupPaymentMethods() {
  const methodBtns = document.querySelectorAll('.payment-btn');

  methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      methodBtns.forEach(item => {
        item.classList.remove('btn-primary');
        item.classList.add('btn-secondary');
      });

      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      selectedPaymentMethod =
        btn.getAttribute('data-method') || 'UPI';
    });
  });
}

// ========================================
// CHECKOUT AND SAVE SALE
// ========================================

function setupInvoiceActions() {
  const checkoutBtn = document.getElementById('btnCompleteSale');
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener('click', async () => {
    if (currentCart.length === 0) {
      showToast('Cart is empty. Add products first.', 'warning');
      return;
    }

    if (!posBusinessId) {
      showToast('Business not loaded. Refresh and try again.', 'error');
      return;
    }

    checkoutBtn.disabled = true;
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.textContent = 'Processing sale...';

    // Snapshot the cart and discount before checkout.
    const itemsForInvoice = currentCart.map(item => ({ ...item }));
    const appliedDiscountRate = Number(currentDiscountRate) || 0;

    try {
      const items = itemsForInvoice.map(item => ({
        product_id: item.id,
        quantity: item.qty
      }));

      const { data: saleId, error } = await supabaseClient.rpc(
        'complete_pos_sale',
        {
          p_business_id: posBusinessId,
          p_payment_method: selectedPaymentMethod,
          p_items: items,
          p_discount_rate: appliedDiscountRate,
          p_customer_name:
            document.getElementById('posCustomerName')?.value.trim() || null
        }
      );

      if (error) throw error;

      if (!saleId) {
        throw new Error('Sale was not confirmed by the database.');
      }

      const subtotal = itemsForInvoice.reduce(
        (sum, item) =>
          sum + Number(item.price) * Number(item.qty),
        0
      );

      const discountAmount = Math.round(
        subtotal * appliedDiscountRate / 100
      );

      const taxable = subtotal - discountAmount;
      const gst = Math.round(taxable * 0.18);
      const total = taxable + gst;

      renderInvoiceModal(
        saleId,
        total,
        subtotal,
        gst,
        itemsForInvoice,
        discountAmount,
        appliedDiscountRate
      );

      currentCart = [];
      currentDiscountRate = 0;

      const discountInput = document.getElementById('discountRateInput');
      if (discountInput) discountInput.value = '0';

      updateCartUI();
      await initializePos();

      showToast(
        'Sale completed successfully!',
        'success',
        'fa-receipt'
      );
    } catch (error) {
      console.error('POS checkout error:', error);

      showToast(
        error.message || 'Checkout failed. Please try again.',
        'error'
      );
    } finally {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalText;
    }
  });
}

// ========================================
// INVOICE / RECEIPT
// ========================================




function renderInvoiceModal(
  orderId,
  total,
  subtotal,
  gst,
  items = currentCart,
  discountAmount = 0,
  discountRate = currentDiscountRate
) {
  const modal = document.getElementById('invoiceModal');
  const body = document.getElementById('invoiceModalBody');

  if (!modal || !body) return;

  const money = value =>
    Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const customerName =
    document.getElementById('posCustomerName')?.value.trim() ||
    'Walk-in Customer';

  const taxableAmount =
    Number(subtotal || 0) - Number(discountAmount || 0);

  const receiptDate = new Date();
  const paymentMethod = selectedPaymentMethod || 'N/A';

  const itemRows = items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align:center">${Number(item.qty || 0)}</td>
      <td style="text-align:right">₹${money(item.price)}</td>
      <td style="text-align:right">
        ₹${money(Number(item.price || 0) * Number(item.qty || 0))}
      </td>
    </tr>
  `).join('');

  body.innerHTML = `
    <div id="posReceiptContent" class="pos-receipt">
      <header class="pos-receipt-header">
        <h3>RetailMind</h3>
        <p>Sales Receipt</p>
        <div class="pos-receipt-divider"></div>
      </header>

      <div class="pos-receipt-line">
        <span>Order ID</span>
        <strong>${escapeHtml(orderId)}</strong>
      </div>

      <div class="pos-receipt-line">
        <span>Customer</span>
        <span>${escapeHtml(customerName)}</span>
      </div>

      <div class="pos-receipt-line">
        <span>Date</span>
        <span>${escapeHtml(receiptDate.toLocaleDateString('en-IN'))}</span>
      </div>

      <div class="pos-receipt-line">
        <span>Time</span>
        <span>${escapeHtml(receiptDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }))}</span>
      </div>

      <div class="pos-receipt-line">
        <span>Payment</span>
        <span>${escapeHtml(paymentMethod)}</span>
      </div>

      <div class="pos-receipt-line">
        <span>Status</span>
        <span>Completed</span>
      </div>

      <div class="pos-receipt-divider"></div>

      <strong>Purchased Items</strong>

      <table class="pos-receipt-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amt</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="pos-receipt-divider"></div>

      <div class="pos-receipt-line">
        <span>Subtotal</span>
        <strong>₹${money(subtotal)}</strong>
      </div>

      <div class="pos-receipt-line">
        <span>Discount (${Number(discountRate)}%)</span>
        <strong>−₹${money(discountAmount)}</strong>
      </div>

      <div class="pos-receipt-line">
        <span>Taxable Amount</span>
        <strong>₹${money(taxableAmount)}</strong>
      </div>

      <div class="pos-receipt-line">
        <span>GST (18%)</span>
        <strong>₹${money(gst)}</strong>
      </div>

      <div class="pos-receipt-divider"></div>

      <div class="pos-receipt-line pos-receipt-total">
        <span>Total Paid</span>
        <strong>₹${money(total)}</strong>
      </div>

      <div class="pos-receipt-divider"></div>

      <p>Thank you for shopping with us!</p>
      <p class="pos-receipt-muted">
        Please keep this receipt for your records.
      </p>
    </div>
  `;

  modal.classList.add('active');
}



function printPosReceipt() {
  const receipt = document.getElementById('posReceiptContent');

  if (!receipt) {
    alert('Receipt content is not available.');
    return;
  }

  // Create a temporary print-only document in the current page.
  const printArea = document.createElement('iframe');

  printArea.style.position = 'fixed';
  printArea.style.right = '0';
  printArea.style.bottom = '0';
  printArea.style.width = '0';
  printArea.style.height = '0';
  printArea.style.border = '0';
  printArea.setAttribute('aria-hidden', 'true');

  document.body.appendChild(printArea);

  const printDocument = printArea.contentDocument;

  if (!printDocument) {
    printArea.remove();
    alert('Unable to prepare the receipt for printing.');
    return;
  }

  printDocument.open();
  printDocument.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>RetailMind Receipt</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          color: #111;
          font-size: 14px;
          line-height: 1.6;
        }

        .pos-receipt {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
        }

        .pos-receipt-header {
          text-align: center;
        }

        .pos-receipt-header h3 {
          font-size: 28px;
          margin: 0 0 4px;
        }

        .pos-receipt-line {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin: 10px 0;
        }

        .pos-receipt-line > :last-child {
          text-align: right;
          overflow-wrap: anywhere;
        }

        .pos-receipt-divider {
          border-top: 1px dashed #888;
          margin: 16px 0;
        }

        .pos-receipt-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          font-size: 12px;
        }

        .pos-receipt-table th,
        .pos-receipt-table td {
          padding: 8px 4px;
          border-bottom: 1px solid #ddd;
          overflow-wrap: anywhere;
        }

        .pos-receipt-table th:first-child,
        .pos-receipt-table td:first-child {
          width: 40%;
          text-align: left;
        }

        .pos-receipt-table th:nth-child(2),
        .pos-receipt-table td:nth-child(2) {
          width: 12%;
          text-align: center;
        }

        .pos-receipt-table th:nth-child(3),
        .pos-receipt-table td:nth-child(3) {
          width: 22%;
          text-align: right;
        }

        .pos-receipt-table th:nth-child(4),
        .pos-receipt-table td:nth-child(4) {
          width: 26%;
          text-align: right;
        }

        .pos-receipt-total {
          font-size: 20px;
          font-weight: bold;
        }

        .pos-receipt-muted {
          color: #555;
          text-align: center;
        }
      </style>
    </head>
    <body>${receipt.outerHTML}</body>
    </html>
  `);
  printDocument.close();

  // Print after the iframe has finished rendering.
  printArea.onload = function () {
    try {
      printArea.contentWindow.focus();
      printArea.contentWindow.print();
    } catch (error) {
      console.error('Receipt printing failed:', error);
      printArea.remove();
      alert('Unable to print the receipt.');
    }
  };

  // Remove the temporary frame after printing or cancelling.
  const cleanup = () => {
    if (printArea.isConnected) {
      printArea.remove();
    }
  };

  printArea.contentWindow.addEventListener('afterprint', cleanup, {
    once: true
  });

  // Fallback cleanup if the browser does not fire afterprint.
  window.addEventListener('focus', () => {
    window.setTimeout(cleanup, 1000);
  }, { once: true });
}



// Escape dynamic text before inserting it into HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}