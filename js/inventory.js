/**
 * RETAILMIND AI - INVENTORY MANAGEMENT
 * Handles product listing, filtering, search, Add Product modal, OCR Invoice parser & Barcode scanner.
 */


let inventoryBusinessId = null;
let inventoryProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await initializeInventory();
  setupInventoryFilters();
  setupAddProductModal();
  setupOcrScanner();
  setupBarcodeScanner();
  setupEditProductModal();
  setupViewProductModal();
});

async function loadInventorySuppliers(businessId) {
  const supplierSelect = document.getElementById('newProdSupplier');
  if (!supplierSelect) return;

  supplierSelect.innerHTML = '<option value="">Loading suppliers...</option>';

  const { data: suppliers, error } = await supabaseClient
    .from('suppliers')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Supplier loading error:', error);
    supplierSelect.innerHTML =
      '<option value="">Unable to load suppliers</option>';
    return;
  }

  supplierSelect.innerHTML = '<option value="">Select a supplier</option>';

  (suppliers || []).forEach(supplier => {
    const option = document.createElement('option');
    option.value = supplier.id;
    option.textContent = supplier.name;
    supplierSelect.appendChild(option);
  });

  if (!suppliers || suppliers.length === 0) {
    supplierSelect.innerHTML =
      '<option value="">No active suppliers found</option>';
  }

  console.log('Inventory suppliers loaded:', suppliers?.length || 0);
}

async function initializeInventory() {
  const tbody = document.getElementById('inventoryTableBody');

  try {
    if (typeof supabaseClient === 'undefined') {
      throw new Error('Supabase client is not loaded.');
    }

    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      throw new Error('Please log in to view your inventory.');
    }

    const { data: membership, error: membershipError } =
      await supabaseClient
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) {
      throw new Error('No business membership was found.');
    }

    inventoryBusinessId = membership.business_id;
    await loadInventorySuppliers(inventoryBusinessId);

    const { data: products, error: productsError } =
      await supabaseClient
        .from('products')

        .select(`
  id, business_id, supplier_id, name, sku, category,
  selling_price, purchase_price, stock, reorder_level,
  image_url, expiry_date, created_at, updated_at,
  suppliers ( name )
`)

        .eq('business_id', inventoryBusinessId)
        .eq('is_archived', false)
        .order('name', { ascending: true });

    if (productsError) throw productsError;

    inventoryProducts = (products || []).map(product => {
      const stock = Number(product.stock || 0);
      const reorder = Number(product.reorder_level || 0);

      let status = 'In Stock';

      if (stock === 0) {
        status = 'Out of Stock';
      } else if (stock <= reorder) {
        status = 'Low Stock';
      }

      return {
        id: product.id,
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || 'Uncategorized',
        price: Number(product.selling_price || 0),
        cost: Number(product.purchase_price || 0),
        stock,
        reorder,
        supplier: product.suppliers?.name || '—',
        supplierId: product.supplier_id,
        expiry: product.expiry_date || '',
        status,
        supplierId: product.supplier_id
      };
    });

    loadInventoryTable();
    updateInventoryStats();

    console.log(
      'RetailMind inventory loaded:',
      inventoryProducts.length,
      'products'
    );
  } catch (error) {
    console.error('Inventory loading error:', error);

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-danger"
              style="padding:2rem;">
            Unable to load inventory: ${escapeInventoryHTML(error.message)}
          </td>
        </tr>
      `;
    }
  }
}

function escapeInventoryHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function updateInventoryStats() {
  const products = inventoryProducts;

  const total = products.length;

  const inStock = products.filter(
    p => p.stock > p.reorder
  ).length;

  const lowStock = products.filter(
    p => p.stock > 0 && p.stock <= p.reorder
  ).length;

  const outOfStock = products.filter(
    p => p.stock === 0
  ).length;

  const value = products.reduce(
    (sum, p) => sum + p.stock * p.cost,
    0
  );

  const lowStockBadge = document.getElementById(
    'inventoryLowStockBadge'
  );

  if (lowStockBadge) {
    lowStockBadge.textContent = `${lowStock} low`;
    lowStockBadge.style.display =
      lowStock > 0 ? 'inline-flex' : 'none';
  }

  const cards = document.querySelectorAll(
    '.kpi-card .kpi-value'
  );

  if (cards.length >= 5) {
    cards[0].textContent = total.toLocaleString('en-IN');
    cards[1].textContent = inStock.toLocaleString('en-IN');
    cards[2].textContent = lowStock.toLocaleString('en-IN');
    cards[3].textContent = outOfStock.toLocaleString('en-IN');

    cards[4].textContent = value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}


function getProducts() {
  return inventoryProducts;
}


function saveProducts(products) {
  localStorage.setItem('retailmind_products', JSON.stringify(products));
}

function loadInventoryTable(filterList = null) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  const products = filterList ?? getProducts();
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 2.5rem;">No matching products found.</td></tr>`;
    return;
  }

  products.forEach(p => {
    let badgeClass = 'badge-success';
    if (p.status === 'Critical') badgeClass = 'badge-danger';
    else if (p.status === 'Low Stock') badgeClass = 'badge-warning';
    else if (p.status === 'Out of Stock') badgeClass = 'badge-danger';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="avatar-cell">
          <div class="avatar-icon">
            <i class="fa-solid fa-box"></i>
          </div>
          <div>
            <div class="font-bold text-dark">${p.name}</div>
            <div class="text-muted" style="font-size: 0.75rem;">ID: ${p.id}</div>
          </div>
        </div>
      </td>
      <td><code>${p.id}</code></td>
      <td><span class="badge badge-primary">${p.category}</span></td>
      <td>
        <strong class="${p.stock < p.reorder ? 'text-danger' : 'text-dark'}">${p.stock} units</strong>
        <div class="text-muted" style="font-size: 0.6875rem;">Min: ${p.reorder}</div>
      </td>
      <td>
        <strong>₹${p.price}</strong>
        <div class="text-muted" style="font-size: 0.6875rem;">Cost: ₹${p.cost}</div>
      </td>
      <td>${p.supplier}</td>
      <td>${p.expiry || 'N/A'}</td>
      <td>
        <span class="badge ${badgeClass}">
          <span class="badge-dot"></span> ${p.status}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.375rem;">
          <button class="btn btn-ghost btn-sm" title="View details" onclick="viewProductDetail('${p.id}')">
            <i class="fa-solid fa-eye"></i>
          </button>
          
<button
  class="btn btn-ghost btn-sm"
  title="Edit product"
  onclick="editProduct('${p.id}')">
  <i class="fa-solid fa-pen-to-square"></i>
</button>

          <button class="btn btn-ghost btn-sm text-danger" title="Delete product" onclick="deleteProduct('${p.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupInventoryFiltersRefresh() {
  const searchInput = document.getElementById('inventorySearch');
  const catSelect = document.getElementById('categoryFilter');
  const statusSelect = document.getElementById('statusFilter');

  const q = (searchInput?.value || '').toLowerCase().trim();
  const cat = catSelect?.value || 'all';
  const status = statusSelect?.value || 'all';

  const filtered = getProducts().filter(p => {
    const matchQuery =
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || p.id || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.supplier || '').toLowerCase().includes(q);

    const matchCat =
      cat === 'all' ||
      (p.category || '').toLowerCase() === cat.toLowerCase();

    const matchStatus =
      status === 'all' ||
      (p.status || '').toLowerCase() === status.toLowerCase();

    return matchQuery && matchCat && matchStatus;
  });

  loadInventoryTable(filtered);
}

function setupInventoryFilters() {
  const searchInput = document.getElementById('inventorySearch');
  const catSelect = document.getElementById('categoryFilter');
  const statusSelect = document.getElementById('statusFilter');

  function applyFilters() {
    const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const cat = catSelect ? catSelect.value : 'all';
    const status = statusSelect ? statusSelect.value : 'all';

    const filtered = getProducts().filter(p => {
      const matchQuery =
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || p.id || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.supplier || '').toLowerCase().includes(q);
      const matchCat = cat === 'all' || p.category.toLowerCase() === cat.toLowerCase();
      const matchStatus = status === 'all' || p.status.toLowerCase() === status.toLowerCase();
      return matchQuery && matchCat && matchStatus;
    });

    loadInventoryTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (catSelect) catSelect.addEventListener('change', applyFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);
}

function setupAddProductModal() {
  const form = document.getElementById('addProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!inventoryBusinessId) {
      showToast('Business information is not available.', 'danger', 'fa-triangle-exclamation');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');

    const name = document.getElementById('newProdName').value.trim();
    const category = document.getElementById('newProdCategory').value;
    const supplierId = document.getElementById('newProdSupplier').value;
    const expiryInput = document.getElementById('newProdExpiry').value;
    const expiryDate = expiryInput || null;
    const sellingPrice = Number(document.getElementById('newProdPrice').value);
    const purchasePrice = Number(document.getElementById('newProdCost').value);
    const stock = Number(document.getElementById('newProdStock').value);
    const reorderLevel = Number(document.getElementById('newProdReorder').value);

    if (!supplierId) {
      showToast('Please select a supplier.', 'warning', 'fa-triangle-exclamation');
      return;
    }

    if (
      !name ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(purchasePrice) ||
      sellingPrice <= 0 ||
      purchasePrice <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 1
    ) {
      showToast('Please check the product details.', 'warning', 'fa-triangle-exclamation');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {
      const { data: supplier, error: supplierError } = await supabaseClient
        .from('suppliers')
        .select('id, name')
        .eq('id', supplierId)
        .eq('business_id', inventoryBusinessId)
        .maybeSingle();

      if (supplierError) throw supplierError;

      if (!supplier) {
        throw new Error('The selected supplier does not belong to this business.');
      }

      const { data: insertedProduct, error: insertError } = await supabaseClient
        .from('products')
        .insert({
          business_id: inventoryBusinessId,
          supplier_id: supplierId,
          name,
          category,
          selling_price: sellingPrice,
          purchase_price: purchasePrice,
          stock,
          reorder_level: reorderLevel,
          expiry_date: expiryDate
        })
        .select(`
  id, business_id, supplier_id, name, sku, category,
  selling_price, purchase_price, stock, reorder_level,
  image_url, expiry_date, created_at, updated_at,
  suppliers ( name )
`)
        .single();

      if (insertError) throw insertError;


      const newProduct = {
        id: insertedProduct.id,
        name: insertedProduct.name,
        sku: insertedProduct.sku || insertedProduct.id,
        category: insertedProduct.category,
        price: Number(insertedProduct.selling_price),
        cost: Number(insertedProduct.purchase_price),
        stock: Number(insertedProduct.stock),
        reorder: Number(insertedProduct.reorder_level),
        supplier: insertedProduct.suppliers?.name || supplier.name || '—',
        supplierId: insertedProduct.supplier_id,
        expiry: insertedProduct.expiry_date || '',
        status:
          Number(insertedProduct.stock) === 0 ? 'Out of Stock' :
            Number(insertedProduct.stock) <= Number(insertedProduct.reorder_level)
              ? 'Low Stock'
              : 'In Stock'
      };


      inventoryProducts.unshift(newProduct);

      loadInventoryTable();
      updateInventoryStats();
      setupInventoryFiltersRefresh();

      form.reset();

      const modal = document.getElementById('addProductModal');
      if (modal) modal.classList.remove('active');

      showToast(`Added "${name}" to inventory successfully!`, 'success', 'fa-box-open');

    } catch (error) {
      console.error('Product save error:', error);
      showToast(
        error.message || 'Unable to save product.',
        'danger',
        'fa-triangle-exclamation'
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML =
          '<i class="fa-solid fa-plus"></i> Add to Catalog';
      }
    }
  });
}
function setupEditProductModal() {
  const modal = document.getElementById('editProductModal');
  const form = document.getElementById('editProductForm');
  const closeBtn = document.getElementById('closeEditProductModal');
  const cancelBtn = document.getElementById('cancelEditProduct');

  if (!modal || !form) return;

  // Prevent duplicate event listeners
  if (form.dataset.initialized === 'true') return;
  form.dataset.initialized = 'true';

  function closeModal() {
    modal.classList.remove('active');
  }

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('editProdId').value;
    const name = document.getElementById('editProdName').value.trim();
    const category = document.getElementById('editProdCategory').value;
    const supplierId = document.getElementById('editProdSupplier').value;

    const price = Number(document.getElementById('editProdPrice').value);
    const cost = Number(document.getElementById('editProdCost').value);
    const stock = Number(document.getElementById('editProdStock').value);
    const reorder = Number(document.getElementById('editProdReorder').value);
    const expiryInput = document.getElementById('editProdExpiry').value;
    const expiryDate = expiryInput || null;
    const saveBtn = document.getElementById('saveEditProduct');

    if (!id || !name || !category || !supplierId) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    if (
      !Number.isFinite(price) || price < 0 ||
      !Number.isFinite(cost) || cost < 0 ||
      !Number.isInteger(stock) || stock < 0 ||
      !Number.isInteger(reorder) || reorder < 0
    ) {
      showToast('Enter valid prices and whole-number stock values.', 'error');
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const { data, error } = await supabaseClient
        .from('products')
        .update({
          name,
          category,
          supplier_id: supplierId,
          selling_price: price,
          purchase_price: cost,
          stock,
          reorder_level: reorder,
          expiry_date: expiryDate
        })
        .eq('id', id)
        .eq('business_id', inventoryBusinessId)
        .eq('is_archived', false)
        .select(`
          id, business_id, supplier_id, name, sku, category,
          selling_price, purchase_price, stock, reorder_level,
          image_url, expiry_date, created_at, updated_at,
suppliers ( name )
        `)
        .single();

      if (error) throw error;

      const updatedProduct = {
        id: data.id,
        name: data.name,
        sku: data.sku || data.id,
        category: data.category,
        price: Number(data.selling_price),
        cost: Number(data.purchase_price),
        stock: data.stock,
        reorder: data.reorder_level,
        supplier: data.suppliers?.name || '—',
        supplierId: data.supplier_id,
        expiry: data.expiry_date || '',
        status:
          data.stock === 0 ? 'Out of Stock' :
            data.stock <= data.reorder_level ? 'Low Stock' :
              'In Stock'
      };

      inventoryProducts = inventoryProducts.map(product =>
        product.id === id ? updatedProduct : product
      );

      loadInventoryTable();
      updateInventoryStats();
      setupInventoryFiltersRefresh();
      closeModal();

      showToast('Product updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast(error.message || 'Could not update product.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });
}

async function editProduct(id) {
  const product = inventoryProducts.find(item => item.id === id);

  if (!product) {
    showToast('Product not found.', 'error');
    return;
  }

  const modal = document.getElementById('editProductModal');
  const supplierSelect = document.getElementById('editProdSupplier');

  if (!modal || !supplierSelect) {
    showToast('Edit Product modal not found.', 'error');
    return;
  }

  try {
    supplierSelect.innerHTML = '<option value="">Loading suppliers...</option>';

    const { data: suppliers, error } = await supabaseClient
      .from('suppliers')
      .select('id, name')
      .eq('business_id', inventoryBusinessId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) throw error;

    supplierSelect.innerHTML = '<option value="">Select a supplier</option>';

    (suppliers || []).forEach(supplier => {
      const option = document.createElement('option');
      option.value = supplier.id;
      option.textContent = supplier.name;
      supplierSelect.appendChild(option);
    });

    document.getElementById('editProdId').value = product.id;
    document.getElementById('editProdName').value = product.name || '';
    document.getElementById('editProdCategory').value =
      product.category || 'Groceries';
    document.getElementById('editProdSupplier').value =
      product.supplierId || '';
    document.getElementById('editProdPrice').value = product.price ?? 0;
    document.getElementById('editProdCost').value = product.cost ?? 0;
    document.getElementById('editProdStock').value = product.stock ?? 0;
    document.getElementById('editProdReorder').value =
      product.reorder ?? 10;
    document.getElementById('editProdExpiry').value =
      product.expiry || '';

    modal.classList.add('active');
  } catch (error) {
    console.error('Error opening product editor:', error);
    showToast('Could not load product details.', 'error');
  }
}
async function deleteProduct(id) {
  if (!confirm('Archive this product? It will disappear from active inventory, but its sales history will be preserved.')) {
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('products')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('business_id', inventoryBusinessId)
      .eq('is_archived', false)
      .select('id');

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        'Product was not archived. Check your permissions and whether it is already archived.'
      );
    }

    inventoryProducts = inventoryProducts.filter(
      product => product.id !== id
    );

    setupInventoryFiltersRefresh();
    updateInventoryStats();

    showToast(
      'Product archived. Sales history is preserved.',
      'success',
      'fa-box-archive'
    );
  } catch (error) {
    console.error('Product archive error:', error);

    showToast(
      error.message || 'Unable to archive product.',
      'danger',
      'fa-triangle-exclamation'
    );
  }
}


function viewProductDetail(id) {
  const product = inventoryProducts.find(item => item.id === id);

  if (!product) {
    showToast('Product not found.', 'error');
    return;
  }

  const setText = (elementId, value) => {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value ?? '—';
  };

  setText('viewProdName', product.name);
  setText('viewProdSku', `SKU: ${product.sku || product.id}`);
  setText('viewProdCategory', product.category);
  setText('viewProdStock', `${product.stock} units`);
  setText('viewProdReorder', `${product.reorder} units`);
  setText('viewProdStatus', product.status);
  setText('viewProdPrice', `₹${Number(product.price || 0).toLocaleString('en-IN')}`);
  setText('viewProdCost', `₹${Number(product.cost || 0).toLocaleString('en-IN')}`);
  setText('viewProdSupplier', product.supplier || '—');
  setText('viewProdExpiry', product.expiry || 'N/A');

  const modal = document.getElementById('viewProductModal');
  if (modal) modal.classList.add('active');

  const editButton = document.getElementById('viewProdEditBtn');
  if (editButton) {
    editButton.onclick = () => {
      modal?.classList.remove('active');
      editProduct(id);
    };
  }
}
function setupViewProductModal() {
  const modal = document.getElementById('viewProductModal');
  if (!modal || modal.dataset.initialized === 'true') return;

  modal.dataset.initialized = 'true';

  const closeModal = () => modal.classList.remove('active');

  document.getElementById('closeViewProductModal')
    ?.addEventListener('click', closeModal);

  document.getElementById('closeViewProductFooter')
    ?.addEventListener('click', closeModal);

  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
}

// Simulated OCR Bill Scanner
function setupOcrScanner() {
  const dropzone = document.getElementById('ocrDropzone');
  const fileInput = document.getElementById('ocrFileInput');
  const resultArea = document.getElementById('ocrResults');
  const applyBtn = document.getElementById('btnApplyOcr');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      simulateOcrProcessing(fileInput.files[0].name);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length > 0) {
      simulateOcrProcessing(e.dataTransfer.files[0].name);
    }
  });

  function simulateOcrProcessing(filename) {
    dropzone.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-spinner fa-spin text-primary" style="font-size: 2rem; margin-bottom: 0.75rem;"></i>
        <div class="font-bold">RetailMind AI OCR Engine analyzing "${filename}"...</div>
        <div class="text-muted" style="font-size: 0.8125rem;">Parsing vendor GSTIN, line items, batch codes and pricing...</div>
      </div>
    `;

    setTimeout(() => {
      dropzone.style.display = 'none';
      if (resultArea) resultArea.style.display = 'block';
      if (applyBtn) applyBtn.style.display = 'inline-flex';
      showToast('OCR extraction complete! 3 items detected.', 'info', 'fa-wand-magic-sparkles');
    }, 1800);
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      showToast('Inventory updated with supplier invoice items!', 'success', 'fa-check');
      const modal = document.getElementById('ocrModal');
      if (modal) modal.classList.remove('active');
    });
  }
}

// Simulated Barcode / QR Scanner
function setupBarcodeScanner() {
  const startBtn = document.getElementById('btnStartScanner');
  const statusElem = document.getElementById('scannerStatus');
  const resultCard = document.getElementById('scannedProductCard');

  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    startBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing Camera...`;

    if (statusElem) statusElem.textContent = 'Aim camera at Barcode / QR code...';

    setTimeout(() => {
      startBtn.disabled = false;
      startBtn.innerHTML = `<i class="fa-solid fa-camera"></i> Scan Again`;
      if (statusElem) statusElem.textContent = 'Barcode Detected: 8901234567890';
      if (resultCard) resultCard.style.display = 'block';
      showToast('Product barcode recognized: Fresh Milk 1L', 'success', 'fa-barcode');
    }, 2000);
  });
}
