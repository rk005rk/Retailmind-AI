/* =========================================================
   RETAILMIND AI — SUPPLIERS MODULE
   Supabase: Suppliers, Purchase Orders, KPIs, View, Edit, Archive
   ========================================================= */

let SUPPLIERS_BUSINESS_ID = null;

const SUPPLIER_CATEGORIES = [
    'Groceries',
    'Beverages',
    'Personal Care',
    'Clothing',
    'Footwear',
    'Accessories',
    'Medicines',
    'Dairy',
    'Bakery',
    'Snacks',
    'Home & Kitchen',
    'Other'
];

let suppliersCache = [];
let purchaseOrdersCache = [];
let supplierSalesMetrics = new Map();
let pendingArchiveSupplierId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initializeSupplierForm();
    initializeSupplierModals();
    initializeArchiveModal();

    try {
        await initializeSupplierBusiness();
        await loadSuppliers();
    } catch (error) {
        console.error('Supplier initialization failed:', error);

        showSupplierMessage(
            error.message || 'Could not initialize suppliers.',
            'error'
        );
    }
});

/* =========================================================
   AUTHENTICATION AND BUSINESS ACCESS
   ========================================================= */

async function initializeSupplierBusiness() {
    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const { data: memberships, error } = await supabaseClient
        .from('business_members')
        .select('business_id')
        .eq('user_id', user.id);

    if (error) throw error;

    if (!memberships || memberships.length === 0) {
        throw new Error('No business is linked to your account.');
    }

    if (memberships.length > 1) {
        throw new Error(
            'Your account belongs to multiple businesses. Please select a business first.'
        );
    }

    SUPPLIERS_BUSINESS_ID = memberships[0].business_id;
}

async function verifySupplierAccess() {
    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
        throw new Error('Please log in first.');
    }

    const { data: membership, error: membershipError } =
        await supabaseClient
            .from('business_members')
            .select('business_id')
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('user_id', user.id)
            .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) {
        throw new Error('You do not have access to this business.');
    }

    return user;
}

/* =========================================================
   LOAD SUPPLIERS AND PURCHASE ORDERS
   ========================================================= */

async function loadSuppliers() {
    const tbody = document.getElementById('suppliersTableBody');

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:2rem;">
                    Loading suppliers...
                </td>
            </tr>`;
    }

    try {
        await verifySupplierAccess();

        const {
            data: suppliers,
            error: supplierError
        } = await supabaseClient
            .from('suppliers')
            .select('*')
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (supplierError) throw supplierError;

        const {
            data: orders,
            error: ordersError
        } = await supabaseClient
            .from('purchase_orders')
            .select(`
                id,
                supplier_id,
                order_date,
                total_amount,
                status,
                expected_delivery_date,
                actual_delivery_date
            `)
            .eq('business_id', SUPPLIERS_BUSINESS_ID);

        if (ordersError) throw ordersError;

        await loadSupplierSalesMetrics();

        suppliersCache = suppliers || [];
        purchaseOrdersCache = orders || [];

        renderSuppliersWithPurchases(
            suppliersCache,
            purchaseOrdersCache
        );

        updateSupplierStats(suppliersCache);
        updateDelayedShipmentsPlaceholder();

    } catch (error) {
        console.error('Failed to load suppliers:', error);

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7"
                        style="text-align:center;padding:2rem;color:#dc2626;">
                        Unable to load suppliers:
                        ${escapeSupplierHTML(error.message)}
                    </td>
                </tr>`;
        }

        showSupplierMessage(
            error.message || 'Could not load suppliers.',
            'error'
        );
    }
}

/* =========================================================
   SUPPLIER SALES METRICS
   Uses completed sales for products assigned to each supplier.
   Sales revenue = sum of sale_items.total_price.
   ========================================================= */

async function loadSupplierSalesMetrics() {
    supplierSalesMetrics = new Map();

    const {
        data: products,
        error: productsError
    } = await supabaseClient
        .from('products')
        .select('id, supplier_id')
        .eq('business_id', SUPPLIERS_BUSINESS_ID);

    if (productsError) throw productsError;

    if (!products || products.length === 0) return;

    const productSupplier = new Map(
        products.map(product => [
            product.id,
            product.supplier_id
        ])
    );

    const productIds = products.map(product => product.id);

    const {
        data: saleItems,
        error: saleItemsError
    } = await supabaseClient
        .from('sale_items')
        .select('id, sale_id, product_id, quantity, total_price')
        .in('product_id', productIds);

    if (saleItemsError) throw saleItemsError;

    if (!saleItems || saleItems.length === 0) return;

    const saleIds = [
        ...new Set(
            saleItems
                .map(item => item.sale_id)
                .filter(Boolean)
        )
    ];

    if (saleIds.length === 0) return;

    const {
        data: sales,
        error: salesError
    } = await supabaseClient
        .from('sales')
        .select('id, status')
        .eq('business_id', SUPPLIERS_BUSINESS_ID)
        .eq('status', 'completed')
        .in('id', saleIds);

    if (salesError) throw salesError;

    const completedSaleIds = new Set(
        (sales || []).map(sale => sale.id)
    );

    for (const item of saleItems) {
        if (!completedSaleIds.has(item.sale_id)) continue;

        const supplierId = productSupplier.get(item.product_id);

        if (!supplierId) continue;

        const current = supplierSalesMetrics.get(supplierId) || {
            productsSold: 0,
            salesRevenue: 0
        };

        current.productsSold += Number(item.quantity) || 0;
        current.salesRevenue += Number(item.total_price) || 0;

        supplierSalesMetrics.set(supplierId, current);
    }
}

function getSupplierSalesMetric(supplierId) {
    return supplierSalesMetrics.get(supplierId) || {
        productsSold: 0,
        salesRevenue: 0
    };
}

/* =========================================================
   DATE AND ORDER HELPERS
   ========================================================= */

function getLocalDateString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getOrderStatus(order) {
    return String(order.status || '').trim().toLowerCase();
}

function isDeliveredOrder(order) {
    return ['completed', 'delivered', 'received'].includes(
        getOrderStatus(order)
    );
}

function getSupplierDeliveryMetrics(orders) {
    const today = getLocalDateString();

    const delayedCount = orders.filter(order => {
        const expected = order.expected_delivery_date;
        const actual = order.actual_delivery_date;
        const delivered = isDeliveredOrder(order);

        if (!expected) return false;

        // Delivered orders are delayed when the actual date
        // is later than the expected date.
        if (delivered && actual) {
            return actual > expected;
        }

        // Undelivered orders are delayed when their expected
        // delivery date has already passed.
        return !delivered && expected < today;
    }).length;

    return {
        delayedCount
    };
}
function getTotalPurchase(orders) {
    return (orders || []).reduce((sum, order) => {
        const amount = Number(order.total_amount ?? 0);
        return sum + (
            Number.isFinite(amount) ? amount : 0
        );
    }, 0);
}
/* =========================================================
   RENDER SUPPLIER TABLE
   Columns:
   Supplier Organization
   Primary Line
   Products Sold
   Sales Revenue
   Total Purchase
   Status
   Action
   ========================================================= */

function renderSuppliersWithPurchases(suppliers, orders) {
    const tbody = document.getElementById('suppliersTableBody');

    if (!tbody) return;

    if (!suppliers.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:2rem;">
                    No suppliers found. Add your first supplier.
                </td>
            </tr>`;

        return;
    }

    tbody.innerHTML = suppliers.map(supplier => {
        const supplierOrders = orders.filter(
            order => order.supplier_id === supplier.id
        );

        const totalPurchase = getTotalPurchase(supplierOrders);
        const salesMetrics = getSupplierSalesMetric(supplier.id);

        const status = String(
            supplier.status || 'active'
        ).toLowerCase();

        const statusClass = status === 'active'
            ? 'status-active'
            : 'status-inactive';

        return `
            <tr>
                <td>
                    <strong>
                        ${escapeSupplierHTML(supplier.name)}
                    </strong>

                    <div class="text-muted" style="font-size:0.8rem;">
                        ${escapeSupplierHTML(
                            supplier.contact_person || 'No contact person'
                        )}
                    </div>
                </td>

                <td>
                    ${escapeSupplierHTML(
                        supplier.category || 'Uncategorized'
                    )}
                </td>

                <td>
                    ${salesMetrics.productsSold}
                </td>

                <td>
                    ${formatSupplierCurrency(
                        salesMetrics.salesRevenue
                    )}
                </td>

                <td>
                    ${formatSupplierCurrency(totalPurchase)}
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeSupplierHTML(
                            status.charAt(0).toUpperCase() +
                            status.slice(1)
                        )}
                    </span>
                </td>

                <td>
                    <div class="supplier-actions">
                        <button
                            type="button"
                            class="supplier-action-btn supplier-action-view"
                            onclick="viewSupplierDetails('${supplier.id}')"
                            title="View supplier details">
                            <i class="fa-regular fa-eye"></i>
                            <span>View</span>
                        </button>

                        <button
                            type="button"
                            class="supplier-action-btn supplier-action-edit"
                            onclick="editSupplier('${supplier.id}')"
                            title="Edit supplier">
                            <i class="fa-regular fa-pen-to-square"></i>
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            class="supplier-action-btn supplier-action-archive"
                            onclick="archiveSupplier('${supplier.id}')"
                            title="Archive supplier">
                            <i class="fa-solid fa-box-archive"></i>
                            <span>Archive</span>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

/* =========================================================
   SUPPLIER KPI CARDS
   ========================================================= */

function updateSupplierStats(suppliers) {
    const total = suppliers.length;

    const active = suppliers.filter(
        supplier =>
            String(supplier.status || 'active').toLowerCase() === 'active'
    ).length;

    const topTier = suppliers.filter(supplier => {
        if (supplier.rating == null || supplier.rating === '') {
            return false;
        }

        const rating = Number(supplier.rating);

        return Number.isFinite(rating) && rating > 4.5;
    }).length;

    const values = document.querySelectorAll(
        '.kpi-card .kpi-value'
    );

    if (values[0]) values[0].textContent = total;
    if (values[1]) values[1].textContent = active;
    if (values[2]) values[2].textContent = topTier;
}

function updateDelayedShipmentsPlaceholder() {
    const values = document.querySelectorAll(
        '.kpi-card .kpi-value'
    );

    const cards = document.querySelectorAll('.kpi-card');

    const metrics = getSupplierDeliveryMetrics(
        purchaseOrdersCache
    );

    if (values[3]) {
        values[3].textContent = metrics.delayedCount;
    }

    const footer = cards[3]?.querySelector('.kpi-footer');

    if (footer) {
        footer.innerHTML =
            '<i class="fa-solid fa-clock"></i> Overdue or delivered late';
    }
}

/* =========================================================
   ADD SUPPLIER
   ========================================================= */

function initializeSupplierForm() {
    const form = document.getElementById('addSupplierForm');

    if (!form) return;

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const submitButton =
            form.querySelector('button[type="submit"]');

        const originalText =
            submitButton?.textContent || 'Save Supplier';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
        }

        try {
            await verifySupplierAccess();

            const formData = new FormData(form);

            const supplier = {
                business_id: SUPPLIERS_BUSINESS_ID,

                name: String(
                    formData.get('name') || ''
                ).trim(),

                contact_person: String(
                    formData.get('contact_person') || ''
                ).trim(),

                phone: String(
                    formData.get('phone') || ''
                ).trim(),

                category: String(
                    formData.get('category') || ''
                ).trim(),

                lead_time_days: Number(
                    formData.get('lead_time_days')
                ),

                status: 'active',
                is_archived: false
            };

            if (
                !supplier.name ||
                !supplier.contact_person ||
                !supplier.phone ||
                !SUPPLIER_CATEGORIES.includes(supplier.category) ||
                !Number.isInteger(supplier.lead_time_days) ||
                supplier.lead_time_days < 1
            ) {
                throw new Error(
                    'Please enter valid supplier details.'
                );
            }

            const { error } = await supabaseClient
                .from('suppliers')
                .insert(supplier);

            if (error) throw error;

            form.reset();

            document.getElementById('addSupplierModal')
                ?.classList.remove('active');

            await loadSuppliers();

            showSupplierMessage(
                'Supplier saved successfully!',
                'success'
            );

        } catch (error) {
            console.error('Error saving supplier:', error);

            showSupplierMessage(
                error.message || 'Could not save supplier.',
                'error'
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
}

/* =========================================================
   EDIT SUPPLIER MODAL
   ========================================================= */

function initializeSupplierModals() {
    if (document.getElementById('editSupplierModal')) return;

    const modal = document.createElement('div');

    modal.id = 'editSupplierModal';
    modal.className = 'modal-overlay';

    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Edit Supplier</h3>

                <button type="button"
                    class="btn btn-ghost btn-sm"
                    aria-label="Close edit supplier modal"
                    onclick="closeEditSupplierModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <form id="editSupplierForm">
                <div class="modal-body">
                    <input type="hidden"
                        name="id"
                        id="editSupplierId">

                    <div class="form-group">
                        <label class="form-label"
                            for="editSupplierName">
                            Company / Vendor Name *
                        </label>

                        <input class="form-control"
                            id="editSupplierName"
                            name="name"
                            type="text"
                            required>
                    </div>

                    <div class="grid grid-cols-2" style="gap:1rem;">
                        <div class="form-group">
                            <label class="form-label"
                                for="editSupplierContact">
                                Contact Representative *
                            </label>

                            <input class="form-control"
                                id="editSupplierContact"
                                name="contact_person"
                                type="text"
                                required>
                        </div>

                        <div class="form-group">
                            <label class="form-label"
                                for="editSupplierPhone">
                                Phone Number *
                            </label>

                            <input class="form-control"
                                id="editSupplierPhone"
                                name="phone"
                                type="tel"
                                required>
                        </div>
                    </div>

                    <div class="grid grid-cols-2" style="gap:1rem;">
                        <div class="form-group">
                            <label class="form-label"
                                for="editSupplierCategory">
                                Category *
                            </label>

                            <select class="form-control"
                                id="editSupplierCategory"
                                name="category"
                                required>
                                <option value="" disabled>
                                    Select a category
                                </option>

                                ${SUPPLIER_CATEGORIES.map(category => `
                                    <option value="${escapeSupplierHTML(category)}">
                                        ${escapeSupplierHTML(category)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label"
                                for="editSupplierLeadTime">
                                Standard Lead Time (Days) *
                            </label>

                            <input class="form-control"
                                id="editSupplierLeadTime"
                                name="lead_time_days"
                                type="number"
                                min="1"
                                required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label"
                            for="editSupplierStatus">
                            Status *
                        </label>

                        <select class="form-control"
                            id="editSupplierStatus"
                            name="status"
                            required>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button"
                        class="btn btn-outline"
                        onclick="closeEditSupplierModal()">
                        Cancel
                    </button>

                    <button type="submit"
                        class="btn btn-primary">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>`;

    document.body.appendChild(modal);

    document.getElementById('editSupplierForm')
        .addEventListener('submit', saveSupplierEdits);
}

function editSupplier(supplierId) {
    const supplier = suppliersCache.find(
        item => item.id === supplierId
    );

    if (!supplier) {
        showSupplierMessage(
            'Supplier not found. Refresh and try again.',
            'error'
        );
        return;
    }

    document.getElementById('editSupplierId').value =
        supplier.id;

    document.getElementById('editSupplierName').value =
        supplier.name || '';

    document.getElementById('editSupplierContact').value =
        supplier.contact_person || '';

    document.getElementById('editSupplierPhone').value =
        supplier.phone || '';

    document.getElementById('editSupplierCategory').value =
        supplier.category || '';

    document.getElementById('editSupplierLeadTime').value =
        supplier.lead_time_days ?? 1;

    document.getElementById('editSupplierStatus').value =
        String(supplier.status || 'active').toLowerCase() === 'inactive'
            ? 'inactive'
            : 'active';

    document.getElementById('editSupplierModal')
        .classList.add('active');
}

function closeEditSupplierModal() {
    document.getElementById('editSupplierModal')
        ?.classList.remove('active');
}

async function saveSupplierEdits(event) {
    event.preventDefault();

    const form = event.currentTarget;

    const submitButton =
        form.querySelector('button[type="submit"]');

    const originalText =
        submitButton?.textContent || 'Save Changes';

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
    }

    try {
        await verifySupplierAccess();

        const formData = new FormData(form);
        const supplierId = String(
            formData.get('id') || ''
        );

        const updates = {
            name: String(
                formData.get('name') || ''
            ).trim(),

            contact_person: String(
                formData.get('contact_person') || ''
            ).trim(),

            phone: String(
                formData.get('phone') || ''
            ).trim(),

            category: String(
                formData.get('category') || ''
            ).trim(),

            lead_time_days: Number(
                formData.get('lead_time_days')
            ),

            status: String(
                formData.get('status') || 'active'
            ).toLowerCase(),

            updated_at: new Date().toISOString()
        };

        if (
            !supplierId ||
            !updates.name ||
            !updates.contact_person ||
            !updates.phone ||
            !SUPPLIER_CATEGORIES.includes(updates.category) ||
            !Number.isInteger(updates.lead_time_days) ||
            updates.lead_time_days < 1 ||
            !['active', 'inactive'].includes(updates.status)
        ) {
            throw new Error(
                'Please check all supplier fields.'
            );
        }

        const {
            data,
            error
        } = await supabaseClient
            .from('suppliers')
            .update(updates)
            .eq('id', supplierId)
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('is_archived', false)
            .select('id');

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error(
                'Supplier was not updated. Check your Supabase permissions.'
            );
        }

        closeEditSupplierModal();

        await loadSuppliers();

        showSupplierMessage(
            'Supplier updated successfully!',
            'success'
        );

    } catch (error) {
        console.error('Error updating supplier:', error);

        showSupplierMessage(
            error.message || 'Could not update supplier.',
            'error'
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
}

/* =========================================================
   ARCHIVE SUPPLIER
   Keeps purchase orders and history.
   ========================================================= */

function initializeArchiveModal() {
    document.getElementById('cancelArchiveBtn')
        ?.addEventListener('click', closeArchiveConfirmation);

    document.getElementById('archiveConfirmModal')
        ?.addEventListener('click', event => {
            if (event.target.id === 'archiveConfirmModal') {
                closeArchiveConfirmation();
            }
        });

    document.addEventListener('keydown', event => {
        if (
            event.key === 'Escape' &&
            document.getElementById('archiveConfirmModal')
                ?.classList.contains('active')
        ) {
            closeArchiveConfirmation();
        }
    });

    document.getElementById('confirmArchiveBtn')
        ?.addEventListener('click', confirmArchiveSupplier);
}

function openArchiveConfirmation(supplier) {
    const modal = document.getElementById('archiveConfirmModal');

    const message = document.getElementById('archiveModalMessage');

    if (!modal || !message) {
        showSupplierMessage(
            'Archive confirmation modal is missing from suppliers.html.',
            'error'
        );
        return;
    }

    pendingArchiveSupplierId = supplier.id;

    message.textContent =
        `Are you sure you want to archive "${supplier.name}"?`;

    modal.classList.add('active');

    document.getElementById('cancelArchiveBtn')?.focus();
}

function closeArchiveConfirmation() {
    document.getElementById('archiveConfirmModal')
        ?.classList.remove('active');

    pendingArchiveSupplierId = null;
}

function archiveSupplier(supplierId) {
    const supplier = suppliersCache.find(
        item => item.id === supplierId
    );

    if (!supplier) {
        showSupplierMessage(
            'Supplier not found. Refresh and try again.',
            'error'
        );
        return;
    }

    openArchiveConfirmation(supplier);
}

async function confirmArchiveSupplier() {
    const supplierId = pendingArchiveSupplierId;

    if (!supplierId) return;

    const button = document.getElementById('confirmArchiveBtn');

    const supplier = suppliersCache.find(
        item => item.id === supplierId
    );

    if (!supplier) {
        closeArchiveConfirmation();

        showSupplierMessage(
            'Supplier not found. Refresh and try again.',
            'error'
        );
        return;
    }

    if (button) {
        button.disabled = true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Archiving...';
    }

    try {
        await verifySupplierAccess();

        const {
            data,
            error
        } = await supabaseClient
            .from('suppliers')
            .update({
                is_archived: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', supplierId)
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('is_archived', false)
            .select('id');

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error(
                'Supplier was not archived. Check your Supabase permissions.'
            );
        }

        closeArchiveConfirmation();

        await loadSuppliers();

        showSupplierMessage(
            'Supplier archived. Purchase history was preserved.',
            'success'
        );

    } catch (error) {
        console.error('Error archiving supplier:', error);

        showSupplierMessage(
            error.message || 'Could not archive supplier.',
            'error'
        );

    } finally {
        if (button) {
            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-box-archive"></i><span>Archive Supplier</span>';
        }
    }
}

/* =========================================================
   VIEW SUPPLIER DETAILS AND PURCHASE HISTORY
   ========================================================= */

async function viewSupplierDetails(supplierId) {
    const modal = document.getElementById('supplierDetailsModal');

    const content = document.getElementById('supplierDetailsContent');

    if (!modal || !content) {
        console.error(
            'Supplier details modal is missing from suppliers.html.'
        );
        return;
    }

    modal.classList.add('active');
    content.textContent = 'Loading supplier details...';

    try {
        await verifySupplierAccess();

        const {
            data: supplier,
            error: supplierError
        } = await supabaseClient
            .from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('is_archived', false)
            .single();

        if (supplierError) throw supplierError;

        const {
            data: orders,
            error: ordersError
        } = await supabaseClient
            .from('purchase_orders')
            .select(`
                id,
                order_date,
                total_amount,
                status,
                expected_delivery_date,
                actual_delivery_date
            `)
            .eq('business_id', SUPPLIERS_BUSINESS_ID)
            .eq('supplier_id', supplierId)
            .order('order_date', { ascending: false });

        if (ordersError) throw ordersError;

        const supplierOrders = orders || [];

        const deliveryMetrics =
            getSupplierDeliveryMetrics(supplierOrders);

        const totalPurchase = getTotalPurchase(supplierOrders);

        const salesMetrics =
            getSupplierSalesMetric(supplier.id);

        const row = (label, value) => `
            <div style="
                display:flex;
                justify-content:space-between;
                gap:1rem;
                padding:0.75rem 0;
                border-bottom:1px solid var(--border-color, #e5e7eb);
            ">
                <span class="text-muted">${label}</span>

                <strong style="
                    text-align:right;
                    overflow-wrap:anywhere;
                ">
                    ${value}
                </strong>
            </div>`;

        const recentOrdersHTML = supplierOrders.length
            ? `
                <div style="overflow-x:auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Order Date</th>
                                <th>Status</th>
                                <th>Expected Delivery</th>
                                <th>Actual Delivery</th>
                                <th>Amount</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${supplierOrders.slice(0, 5).map(order => `
                                <tr>
                                    <td>
                                        ${escapeSupplierHTML(
                                            formatSupplierDate(order.order_date)
                                        )}
                                    </td>

                                    <td>
                                        ${escapeSupplierHTML(
                                            order.status || 'Unknown'
                                        )}
                                    </td>

                                    <td>
                                        ${escapeSupplierHTML(
                                            formatSupplierDate(
                                                order.expected_delivery_date
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeSupplierHTML(
                                            formatSupplierDate(
                                                order.actual_delivery_date
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${formatSupplierCurrency(
                                            Number(order.total_amount || 0)
                                        )}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            : '<p class="text-muted">No purchase orders found for this supplier.</p>';

        content.innerHTML = `
            <h2 style="margin-bottom:0.5rem;">
                ${escapeSupplierHTML(supplier.name)}
            </h2>

            <p class="text-muted" style="margin-bottom:1rem;">
                ${escapeSupplierHTML(
                    supplier.category || 'Uncategorized'
                )}
            </p>

            ${row(
                'Contact Person',
                escapeSupplierHTML(supplier.contact_person || '—')
            )}

            ${row(
                'Phone',
                escapeSupplierHTML(supplier.phone || '—')
            )}

            ${row(
                'Email',
                escapeSupplierHTML(supplier.email || '—')
            )}

            ${row(
                'Status',
                escapeSupplierHTML(supplier.status || 'Active')
            )}

            ${row(
                'Lead Time',
                supplier.lead_time_days == null
                    ? '—'
                    : `${Number(supplier.lead_time_days)} days`
            )}

            ${row(
                'Total Purchase Orders',
                supplierOrders.length
            )}

            ${row(
                'Products Sold',
                salesMetrics.productsSold
            )}

            ${row(
                'Sales Revenue (Product Line Total)',
                formatSupplierCurrency(salesMetrics.salesRevenue)
            )}

            ${row(
                'Delayed Shipments',
                deliveryMetrics.delayedCount
            )}

            ${row(
                'Total Purchase',
                formatSupplierCurrency(totalPurchase)
            )}

            <h4 style="margin:1.25rem 0 0.5rem;">
                Recent Purchase Orders
            </h4>

            ${recentOrdersHTML}

            <div style="
                display:flex;
                gap:0.5rem;
                margin-top:1rem;
                flex-wrap:wrap;
            ">
                <button type="button"
                    class="btn btn-primary"
                    onclick="
                        document.getElementById('supplierDetailsModal')
                            .classList.remove('active');
                        editSupplier('${supplier.id}')
                    ">
                    Edit Supplier
                </button>

                <button type="button"
                    class="btn btn-outline"
                    onclick="
                        document.getElementById('supplierDetailsModal')
                            .classList.remove('active');
                        archiveSupplier('${supplier.id}')
                    ">
                    Archive Supplier
                </button>
            </div>`;

    } catch (error) {
        console.error('Failed to load supplier details:', error);

        content.textContent =
            error.message || 'Unable to load supplier details.';
    }
}

/* =========================================================
   FORMATTING AND MESSAGES
   ========================================================= */

function formatSupplierDate(value) {
    if (!value) return '—';

    // Date-only database values should not shift to the previous day.
    const text = String(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [year, month, day] = text.split('-');

        return `${day}/${month}/${year}`;
    }

    const date = new Date(value);

    if (!Number.isFinite(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN');
}

function formatSupplierCurrency(amount) {
    return Number(amount || 0).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    });
}

function escapeSupplierHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function showSupplierMessage(message, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(
            message,
            type,
            type === 'error'
                ? 'fa-circle-exclamation'
                : 'fa-truck'
        );
    } else {
        alert(message);
    }
}