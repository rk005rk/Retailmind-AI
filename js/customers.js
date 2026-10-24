
/* ============================================================
   RETAILMIND AI — CUSTOMER INTELLIGENCE
   File: js/customers.js

   Reads:
   - customers table
   - sales table

   Requires:
   - js/supabase.js
   - Chart.js and the existing customer growth chart
   ============================================================ */

let customersBusinessId = null;
let customersData = [];
let customerSales = [];
let activeCustomerSegment = 'all';
let customersLoading = false;

/* ==================== INITIALIZATION ==================== */

document.addEventListener('DOMContentLoaded', () => {
    setupCustomerFilters();
    setupCustomerExport();
    loadCustomers();
});

/* ==================== LOAD DATA ==================== */

async function loadCustomers() {
    if (customersLoading) return;

    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    customersLoading = true;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center;padding:2rem;">
                Loading customer data...
            </td>
        </tr>`;

    try {
        if (typeof supabaseClient === 'undefined' || !supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        // Get authenticated user.
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error('Please log in first.');

        // Use the currently selected business when available.
        const selectedBusinessId =
            window.currentBusiness?.id ||
            window.currentBusiness?.business_id ||
            null;

        // Get business membership.
        let membershipQuery = supabaseClient
            .from('business_members')
            .select('business_id')
            .eq('user_id', user.id);

        if (selectedBusinessId) {
            membershipQuery = membershipQuery.eq(
                'business_id',
                selectedBusinessId
            );
        }

        const {
            data: memberships,
            error: membershipError
        } = await membershipQuery;

        if (membershipError) throw membershipError;

        if (!memberships?.length) {
            throw new Error(
                'No business membership found for the logged-in user.'
            );
        }

        customersBusinessId = memberships[0].business_id;

        console.log(
            '[Customers] Business ID:',
            customersBusinessId
        );

        // Fetch customer records and completed sales in parallel.
        const [customersResult, salesResult] = await Promise.all([
            supabaseClient
                .from('customers')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    status,
                    tier,
                    avatar_url,
                    created_at
                `)
                .eq('business_id', customersBusinessId)
                .order('created_at', { ascending: false }),

            supabaseClient
                .from('sales')
                .select(`
                    id,
                    customer_id,
                    customer_name,
                    total_amount,
                    sale_date,
                    status
                `)
                .eq('business_id', customersBusinessId)
                .eq('status', 'completed')
                .order('sale_date', { ascending: false })
        ]);

        if (customersResult.error) throw customersResult.error;
        if (salesResult.error) throw salesResult.error;

        customersData = customersResult.data || [];
        customerSales = salesResult.data || [];

        console.log(
            `[Customers] Loaded ${customersData.length} customer records`
        );

        console.log(
            `[Customers] Loaded ${customerSales.length} completed sales`
        );

        renderCustomersTable();
        updateCustomerStats();
        updateCustomerGrowth();

    } catch (error) {
        console.error('[Customers] Loading failed:', error);

        customersData = [];
        customerSales = [];

        tbody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center;padding:2rem;color:#dc2626;">
                    ${escapeCustomerHTML(error.message || 'Unable to load customers.')}
                </td>
            </tr>`;

        updateCustomerStats();
        updateCustomerGrowth();

    } finally {
        customersLoading = false;
    }
}

/* ==================== MATCH SALES TO CUSTOMERS ==================== */

function getCustomerSales(customer) {
    return customerSales.filter(sale => {
        // Prefer the stable customer ID.
        if (sale.customer_id && customer.id) {
            return String(sale.customer_id) === String(customer.id);
        }

        // Fallback for older sales without a customer ID.
        return Boolean(
            customer.name &&
            sale.customer_name &&
            customer.name.trim().toLowerCase() ===
            sale.customer_name.trim().toLowerCase()
        );
    });
}

/* ==================== CUSTOMER METRICS ==================== */

function getCustomerMetrics(customer) {
    const sales = getCustomerSales(customer);

    const totalOrders = sales.length;

    const totalSpent = sales.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
    );

    const averageBasket = totalOrders
        ? totalSpent / totalOrders
        : 0;

    const validDates = sales
        .map(sale => new Date(sale.sale_date).getTime())
        .filter(Number.isFinite);

    const lastPurchaseTimestamp = validDates.length
        ? Math.max(...validDates)
        : null;

    const lastPurchase = lastPurchaseTimestamp !== null
        ? new Date(lastPurchaseTimestamp)
        : null;

    const daysSincePurchase = lastPurchaseTimestamp !== null
        ? Math.floor(
            (Date.now() - lastPurchaseTimestamp) /
            (24 * 60 * 60 * 1000)
        )
        : null;

    let segment;
    let action;

    if (daysSincePurchase !== null && daysSincePurchase > 90) {
        segment = 'At Risk';
        action = 'Send a re-engagement offer';
    } else if (totalSpent >= 10000) {
        segment = 'VIP';
        action = 'Reward this high-value customer';
    } else if (totalOrders >= 2) {
        segment = 'Repeat';
        action = 'Reward customer loyalty';
    } else if (totalOrders === 1) {
        segment = 'New';
        action = 'Encourage a second purchase';
    } else {
        segment = 'Regular';
        action = 'Encourage the first purchase';
    }

    return {
        sales,
        totalOrders,
        totalSpent,
        averageBasket,
        lastPurchase,
        segment,
        action
    };
}

/* ==================== RENDER CUSTOMER TABLE ==================== */

function renderCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (!customersData.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:2rem;">
                    No customer records found for this business.
                </td>
            </tr>`;
        return;
    }

    const filteredCustomers = customersData.filter(customer => {
        const { segment } = getCustomerMetrics(customer);

        if (activeCustomerSegment === 'vip') {
            return segment === 'VIP';
        }

        if (activeCustomerSegment === 'regular') {
            return ['Regular', 'Repeat', 'New'].includes(segment);
        }

        if (activeCustomerSegment === 'at-risk') {
            return segment === 'At Risk';
        }

        return true;
    });

    if (!filteredCustomers.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:2rem;">
                    No customers found in this segment.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredCustomers.map(customer => {
        const name = customer.name || 'Unnamed Customer';

        const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join('');

        const metrics = getCustomerMetrics(customer);

        return `
            <tr>
                <td>
                    <div class="avatar-cell">
                        <div class="avatar-icon">
                            ${escapeCustomerHTML(initials || '?')}
                        </div>

                        <div>
                            <div class="font-bold text-dark">
                                ${escapeCustomerHTML(name)}
                            </div>

                            <div class="text-muted" style="font-size:.75rem;">
                                ${escapeCustomerHTML(customer.email || 'No email')}
                                ${
                                    customer.phone
                                        ? ' • ' + escapeCustomerHTML(customer.phone)
                                        : ''
                                }
                            </div>
                        </div>
                    </div>
                </td>

                <td>${metrics.totalOrders}</td>

                <td>₹${formatCustomerNumber(metrics.totalSpent)}</td>

                <td>₹${formatCustomerNumber(metrics.averageBasket)}</td>

                <td>
                    ${
                        metrics.lastPurchase
                            ? metrics.lastPurchase.toLocaleDateString('en-IN')
                            : '—'
                    }
                </td>

                <td>
                    <span class="badge ${getSegmentBadgeClass(metrics.segment)}">
                        ${escapeCustomerHTML(metrics.segment)}
                    </span>
                </td>

                <td>${escapeCustomerHTML(metrics.action)}</td>
            </tr>`;
    }).join('');
}

/* ==================== SEGMENT BADGES ==================== */

function getSegmentBadgeClass(segment) {
    if (segment === 'VIP') return 'badge-success';
    if (segment === 'At Risk') return 'badge-warning';
    return 'badge-info';
}

/* ==================== KPI STATISTICS ==================== */

function updateCustomerStats() {
    const totalCustomers = customersData.length;

    const repeatCustomers = customersData.filter(
        customer => getCustomerMetrics(customer).totalOrders >= 2
    ).length;

    const now = new Date();

    const newThisMonth = customersData.filter(customer => {
        if (!customer.created_at) return false;

        const date = new Date(customer.created_at);

        return (
            !Number.isNaN(date.getTime()) &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    }).length;

    const totalSalesAmount = customerSales.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
    );

    const averageOrderValue = customerSales.length
        ? totalSalesAmount / customerSales.length
        : 0;

    const customersWithSales = customersData.filter(
        customer => getCustomerMetrics(customer).totalOrders > 0
    );

    const lifetimeValue = customersWithSales.length
        ? customersWithSales.reduce(
            (sum, customer) =>
                sum + getCustomerMetrics(customer).totalSpent,
            0
        ) / customersWithSales.length
        : 0;

    document.querySelectorAll('.kpi-card').forEach(card => {
        const title = card.querySelector('.kpi-title')
            ?.textContent.trim().toLowerCase();

        const value = card.querySelector('.kpi-value');

        if (!title || !value) return;

        if (title.includes('total customers')) {
            value.textContent = formatCustomerNumber(totalCustomers);
        } else if (title.includes('repeat customers')) {
            value.textContent =
                `${totalCustomers
                    ? (repeatCustomers / totalCustomers * 100).toFixed(1)
                    : '0.0'}%`;
        } else if (title.includes('new this month')) {
            value.textContent = formatCustomerNumber(newThisMonth);
        } else if (title.includes('avg order value')) {
            value.textContent = `₹${formatCustomerNumber(averageOrderValue)}`;
        } else if (title.includes('customer lifetime')) {
            value.textContent = `₹${formatCustomerNumber(lifetimeValue)}`;
        }
    });

    const loyaltyBadge = document.getElementById('customerLoyaltyBadge');

    if (loyaltyBadge) {
        loyaltyBadge.textContent = repeatCustomers
            ? `${repeatCustomers} repeat customers`
            : 'No repeat customers recorded';
    }

    setText('totalCustomersFooter', 'Based on customer records');

    setText(
        'repeatCustomersFooter',
        `${repeatCustomers} customers with 2 or more completed orders`
    );

    setText('newCustomersFooter', 'Customers added this month');
    setText('aovFooter', 'Average of completed sales');

    setText(
        'lifetimeValueFooter',
        'Average spend per purchasing customer'
    );
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

/* ==================== CUSTOMER GROWTH CHART ==================== */

function updateCustomerGrowth() {
    if (typeof window.updateCustomerGrowthChart !== 'function') {
        return;
    }

    const now = new Date();
    const months = [];

    // Current month and previous four months.
    for (let offset = 4; offset >= 0; offset--) {
        months.push(
            new Date(now.getFullYear(), now.getMonth() - offset, 1)
        );
    }

    const labels = months.map(date =>
        date.toLocaleDateString('en-IN', { month: 'short' })
    );

    const newCustomers = months.map(month =>
        customersData.filter(customer => {
            if (!customer.created_at) return false;

            const date = new Date(customer.created_at);

            return (
                !Number.isNaN(date.getTime()) &&
                date.getMonth() === month.getMonth() &&
                date.getFullYear() === month.getFullYear()
            );
        }).length
    );

    const returningCustomers = months.map(month => {
        const monthStart = new Date(
            month.getFullYear(),
            month.getMonth(),
            1
        );

        const nextMonth = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            1
        );

        const monthSales = customerSales.filter(sale => {
            if (!sale.sale_date) return false;

            const date = new Date(sale.sale_date);

            return date >= monthStart && date < nextMonth;
        });

        const returningIds = new Set();

        monthSales.forEach(sale => {
            if (!sale.customer_id) return;

            const hasEarlierSale = customerSales.some(previousSale => {
                if (
                    String(previousSale.customer_id) !==
                    String(sale.customer_id)
                ) {
                    return false;
                }

                const previousDate = new Date(previousSale.sale_date);

                return (
                    !Number.isNaN(previousDate.getTime()) &&
                    previousDate < monthStart
                );
            });

            if (hasEarlierSale) {
                returningIds.add(String(sale.customer_id));
            }
        });

        return returningIds.size;
    });

    window.updateCustomerGrowthChart(
        labels,
        returningCustomers,
        newCustomers
    );
}

/* ==================== FILTERS ==================== */

function setupCustomerFilters() {
    const container = document.getElementById('customerSegmentFilters');
    if (!container) return;

    container.addEventListener('click', event => {
        const button = event.target.closest('button[data-segment]');
        if (!button) return;

        activeCustomerSegment = button.dataset.segment || 'all';

        container.querySelectorAll('button[data-segment]').forEach(item => {
            const active = item === button;

            item.classList.toggle('active', active);
            item.setAttribute('aria-pressed', String(active));
        });

        renderCustomersTable();
    });
}

/* ==================== CSV EXPORT ==================== */

function setupCustomerExport() {
    const button = document.getElementById('exportCustomerDataBtn');
    if (!button) return;

    button.addEventListener('click', () => {
        if (!customersData.length) {
            alert('No customer data available to export.');
            return;
        }

        const headers = [
            'Customer Name',
            'Email',
            'Phone',
            'Total Orders',
            'Total Spent (INR)',
            'Average Basket Size (INR)',
            'Last Purchase',
            'Segment',
            'Recommended Action'
        ];

        const rows = customersData.map(customer => {
            const metrics = getCustomerMetrics(customer);

            return [
                customer.name || '',
                customer.email || '',
                customer.phone || '',
                metrics.totalOrders,
                metrics.totalSpent.toFixed(2),
                metrics.averageBasket.toFixed(2),
                metrics.lastPurchase
                    ? metrics.lastPurchase.toLocaleDateString('en-IN')
                    : '',
                metrics.segment,
                metrics.action
            ];
        });

        const escapeCSV = value =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;

        const csv = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\r\n');

        const blob = new Blob(
            ['\uFEFF' + csv],
            { type: 'text/csv;charset=utf-8;' }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'retailmind-customers.csv';

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
}

/* ==================== HELPERS ==================== */

function formatCustomerNumber(value) {
    return Number(value || 0).toLocaleString('en-IN', {
        maximumFractionDigits: 2
    });
}

function escapeCustomerHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

/* ==================== RELOAD AFTER A SALE ==================== */

// Other scripts can call this after a successful sale.
window.reloadCustomers = loadCustomers;

// Optional real-time refresh when customer or sale records change.
let customerRealtimeChannel = null;

async function enableCustomerRealtime() {
    if (!customersBusinessId || customerRealtimeChannel) return;

    customerRealtimeChannel = supabaseClient
        .channel(`customers-page-${customersBusinessId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'customers',
                filter: `business_id=eq.${customersBusinessId}`
            },
            () => loadCustomers()
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'sales',
                filter: `business_id=eq.${customersBusinessId}`
            },
            () => loadCustomers()
        )
        .subscribe(status => {
            console.log('[Customers] Realtime status:', status);
        });
}

// Start realtime updates after the initial load.
const originalLoadCustomers = loadCustomers;

loadCustomers = async function () {
    await originalLoadCustomers();

    if (customersBusinessId) {
        await enableCustomerRealtime();
    }
};
