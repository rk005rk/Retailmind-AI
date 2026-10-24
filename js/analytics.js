
/* =========================================================
   RETAILMIND AI — BUSINESS INTELLIGENCE & ANALYTICS
   Supabase + Chart.js
   ========================================================= */

const ANALYTICS_CONFIG = {
    currency: 'INR',
    locale: 'en-IN'
};

let analyticsBusinessId = null;
let analyticsSales = [];
let analyticsProducts = [];
let analyticsCharts = {};
let analyticsInitialized = false;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    initializeAnalytics().catch(error => {
        console.error('Analytics initialization failed:', error);
        showAnalyticsError(error.message);
    });
});

async function initializeAnalytics() {
    if (analyticsInitialized) return;

    analyticsInitialized = true;

    if (typeof supabaseClient === 'undefined') {
        throw new Error('Supabase client is unavailable. Check js/supabase.js.');
    }

    if (typeof Chart === 'undefined') {
        throw new Error('Chart.js is unavailable. Check analytics.html.');
    }

    setAnalyticsLoading(true);

    try {
        await verifyAnalyticsAccess();
        await loadAnalyticsData();
        initializeAnalyticsFilters();
        renderAnalytics();

        console.log('RetailMind Analytics initialized successfully.');
    } finally {
        setAnalyticsLoading(false);
    }
}

/* =========================================================
   AUTHENTICATION AND BUSINESS ACCESS
   ========================================================= */

async function verifyAnalyticsAccess() {
    const {
        data: { user },
        error: authError
    } = await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!user) {
        throw new Error('Please log in to view business analytics.');
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

    analyticsBusinessId = membership.business_id;
}

/* =========================================================
   LOAD SALES AND PRODUCT DATA
   ========================================================= */

async function loadAnalyticsData() {
    const { data: sales, error: salesError } =
        await supabaseClient
            .from('sales')
            .select(`
                id,
                business_id,
                customer_id,
                customer_name,
                total_amount,
                subtotal,
                discount_amount,
                gst_amount,
                status,
                sale_date,
                sale_items (
                    quantity,
                    unit_price,
                    total_price,
                    products (
                        id,
                        name,
                        category,
                        selling_price,
                        purchase_price
                    )
                )
            `)
            .eq('business_id', analyticsBusinessId)
            .order('sale_date', { ascending: true });

    if (salesError) throw salesError;

    analyticsSales = (sales || []).map(sale => ({
        ...sale,
        total_amount: Number(sale.total_amount || 0),
        subtotal: sale.subtotal == null ? null : Number(sale.subtotal),
        discount_amount: sale.discount_amount == null
            ? null
            : Number(sale.discount_amount),
        gst_amount: sale.gst_amount == null ? null : Number(sale.gst_amount),

        sale_items: (sale.sale_items || []).map(item => ({
            ...item,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            total_price: item.total_price == null
                ? null
                : Number(item.total_price),
            products: item.products || null
        }))
    }));

    const { data: products, error: productsError } =
        await supabaseClient
            .from('products')
            .select(`
                id,
                name,
                category,
                selling_price,
                purchase_price,
                stock,
                is_archived
            `)
            .eq('business_id', analyticsBusinessId)
            .eq('is_archived', false);

    if (productsError) throw productsError;

    analyticsProducts = (products || []).map(product => ({
        ...product,
        selling_price: Number(product.selling_price || 0),
        purchase_price: Number(product.purchase_price || 0),
        stock: Number(product.stock || 0)
    }));
}

/* =========================================================
   DATE RANGE FILTERS
   Expected selector values: 30D, 90D, 1Y
   ========================================================= */

function initializeAnalyticsFilters() {
    const selector = document.getElementById('analyticsDateRange');

    if (!selector) return;

    selector.addEventListener('change', renderAnalytics);
}

function getAnalyticsRange() {
    const selector = document.getElementById('analyticsDateRange');
    const selectedRange = selector?.value || '30D';

    const now = new Date();
    let start;
    let previousStart;
    let previousEnd;

    if (selectedRange === '90D') {
        start = new Date(now);
        start.setDate(start.getDate() - 89);

        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);

        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 89);
    } else if (selectedRange === '1Y') {
        // Current calendar year.
        start = new Date(now.getFullYear(), 0, 1);

        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
    } else {
        start = new Date(now);
        start.setDate(start.getDate() - 29);

        previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);

        previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - 29);
    }

    start.setHours(0, 0, 0, 0);
    previousStart.setHours(0, 0, 0, 0);
    previousEnd.setHours(23, 59, 59, 999);

    return {
        selectedRange,
        start,
        end: now,
        previousStart,
        previousEnd
    };
}

function isDateInRange(value, start, end) {
    if (!value) return false;

    const date = new Date(value);

    return Number.isFinite(date.getTime()) &&
        date >= start &&
        date <= end;
}

/* =========================================================
   SALES HELPERS
   ========================================================= */

function getSaleStatus(sale) {
    return String(sale.status || 'completed').trim().toLowerCase();
}

function isValidAnalyticsSale(sale) {
    return !['cancelled', 'canceled', 'void'].includes(
        getSaleStatus(sale)
    );
}

function getSaleItems(sale) {
    return Array.isArray(sale.sale_items) ? sale.sale_items : [];
}

function getItemRevenue(item) {
    if (item.total_price != null) {
        return Number(item.total_price || 0);
    }

    return Number(item.quantity || 0) * Number(item.unit_price || 0);
}

function getSaleRevenue(sale) {
    return Number(sale.total_amount || 0);
}

function getItemCost(item) {
    const purchasePrice = item.products?.purchase_price;

    if (purchasePrice == null || purchasePrice === '') return null;

    const cost = Number(purchasePrice);

    if (!Number.isFinite(cost)) return null;

    return Number(item.quantity || 0) * cost;
}

function getEstimatedCostOfGoods(sales) {
    let totalCost = 0;
    let itemsWithKnownCost = 0;
    let itemsWithoutCost = 0;

    sales.forEach(sale => {
        getSaleItems(sale).forEach(item => {
            const cost = getItemCost(item);

            if (cost === null) {
                itemsWithoutCost++;
            } else {
                totalCost += cost;
                itemsWithKnownCost++;
            }
        });
    });

    return {
        totalCost,
        itemsWithKnownCost,
        itemsWithoutCost,
        complete: itemsWithoutCost === 0 &&
            itemsWithKnownCost > 0
    };
}

function sumSalesRevenue(sales) {
    return sales.reduce(
        (sum, sale) => sum + getSaleRevenue(sale),
        0
    );
}

function calculatePercentageChange(current, previous) {
    if (previous === 0) {
        return current > 0 ? null : 0;
    }

    return ((current - previous) / previous) * 100;
}

/* =========================================================
   MAIN ANALYTICS CALCULATION
   ========================================================= */

function calculateAnalytics() {
    const range = getAnalyticsRange();

    const validSales = analyticsSales.filter(isValidAnalyticsSale);

    const currentSales = validSales.filter(sale =>
        isDateInRange(sale.sale_date, range.start, range.end)
    );

    const previousSales = validSales.filter(sale =>
        isDateInRange(
            sale.sale_date,
            range.previousStart,
            range.previousEnd
        )
    );

    const revenue = sumSalesRevenue(currentSales);
    const previousRevenue = sumSalesRevenue(previousSales);

    const currentCosts = getEstimatedCostOfGoods(currentSales);
    const previousCosts = getEstimatedCostOfGoods(previousSales);

    const estimatedGrossProfit = currentCosts.complete
        ? revenue - currentCosts.totalCost
        : null;

    const previousEstimatedGrossProfit = previousCosts.complete
        ? previousRevenue - previousCosts.totalCost
        : null;

    const grossMargin =
        estimatedGrossProfit !== null && revenue > 0
            ? (estimatedGrossProfit / revenue) * 100
            : null;

    const revenueChange = calculatePercentageChange(
        revenue,
        previousRevenue
    );

    const profitChange =
        estimatedGrossProfit !== null &&
        previousEstimatedGrossProfit !== null
            ? calculatePercentageChange(
                estimatedGrossProfit,
                previousEstimatedGrossProfit
            )
            : null;

    return {
        range,
        currentSales,
        previousSales,
        revenue,
        previousRevenue,
        revenueChange,
        estimatedGrossProfit,
        previousEstimatedGrossProfit,
        grossMargin,
        profitChange,
        currentCosts
    };
}

/* =========================================================
   RENDER ALL ANALYTICS
   ========================================================= */

function renderAnalytics() {
    const data = calculateAnalytics();

    updateAnalyticsKpis(data);
    renderRevenueChart(data);
    renderProfitChart(data);
    renderCategoryChart(data);
}

/* =========================================================
   KPI CARDS
   ========================================================= */

function updateAnalyticsKpis(data) {
    const cards = document.querySelectorAll(
        'main.page-container > .kpi-grid .kpi-card'
    );

    if (cards.length < 4) return;

    // KPI 1: Revenue
    const revenueValue = cards[0].querySelector('.kpi-value');
    const revenueFooter = cards[0].querySelector('.kpi-footer');

    if (revenueValue) {
        revenueValue.textContent = formatAnalyticsCurrency(data.revenue);
    }

    if (revenueFooter) {
        revenueFooter.className = 'kpi-footer';

        if (data.revenueChange === null) {
            revenueFooter.textContent =
                'No previous-period revenue to compare';
        } else {
            const increase = data.revenueChange >= 0;

            revenueFooter.classList.add(
                increase ? 'trend-up' : 'trend-down'
            );

            revenueFooter.innerHTML = `
                <i class="fa-solid ${increase
                    ? 'fa-arrow-up'
                    : 'fa-arrow-down'}"></i>
                ${Math.abs(data.revenueChange).toFixed(1)}%
                vs previous period`;
        }
    }

    // KPI 2: Estimated gross profit
    const profitTitle = cards[1].querySelector('.kpi-title');
    const profitValue = cards[1].querySelector('.kpi-value');
    const profitFooter = cards[1].querySelector('.kpi-footer');

    if (profitTitle) {
        profitTitle.textContent = 'Estimated Gross Profit';
    }

    if (profitValue) {
        profitValue.textContent =
            data.estimatedGrossProfit === null
                ? '—'
                : formatAnalyticsCurrency(data.estimatedGrossProfit);
    }

    if (profitFooter) {
        profitFooter.textContent =
            data.estimatedGrossProfit === null
                ? 'Requires purchase costs for all sold items'
                : 'Revenue minus estimated product costs';
    }

    // KPI 3: Estimated gross margin
    const marginTitle = cards[2].querySelector('.kpi-title');
    const marginValue = cards[2].querySelector('.kpi-value');
    const marginFooter = cards[2].querySelector('.kpi-footer');

    if (marginTitle) {
        marginTitle.textContent = 'Estimated Gross Margin';
    }

    if (marginValue) {
        marginValue.textContent = data.grossMargin === null
            ? '—'
            : `${data.grossMargin.toFixed(1)}%`;
    }

    if (marginFooter) {
        marginFooter.textContent = data.grossMargin === null
            ? 'Insufficient product cost data'
            : 'Estimated gross profit / revenue';
    }

    // KPI 4: Inventory ROI cannot be accurately calculated without
    // historical inventory valuation data.
    const inventoryValue = cards[3].querySelector('.kpi-value');
    const inventoryFooter = cards[3].querySelector('.kpi-footer');

    if (inventoryValue) inventoryValue.textContent = '—';

    if (inventoryFooter) {
        inventoryFooter.textContent =
            'Requires inventory history and valuation';
    }
}

/* =========================================================
   REVENUE AND ORDER VOLUME CHART
   Cleaner labels and date range-aware daily/monthly grouping.
   ========================================================= */

function renderRevenueChart(data) {
    const canvas = document.getElementById('analyticsRevenueChart');

    if (!canvas) return;

    const grouped = groupSalesByPeriod(data.currentSales, data.range);

    const subtitle = canvas.closest('.card')
        ?.querySelector('.card-subtitle');

    if (subtitle) {
        subtitle.textContent = data.currentSales.length
            ? 'Daily revenue and order count for the selected date range'
            : 'No sales recorded in the selected date range';
    }

    const config = {
        type: 'line',
        data: {
            labels: grouped.labels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: grouped.revenue,
                    borderColor: '#5A1188',
                    backgroundColor: 'rgba(90, 17, 136, 0.10)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y',
                    pointRadius: grouped.labels.length > 60 ? 0 : 3
                },
                {
                    label: 'Orders',
                    data: grouped.orders,
                    borderColor: '#42BFA6',
                    backgroundColor: '#42BFA6',
                    tension: 0.3,
                    yAxisID: 'y1',
                    pointRadius: grouped.labels.length > 60 ? 0 : 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            if (context.dataset.yAxisID === 'y') {
                                return `${context.dataset.label}: ${
                                    formatAnalyticsCurrency(context.parsed.y)
                                }`;
                            }

                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit:
                            data.range.selectedRange === '1Y' ? 12 : 10,
                        maxRotation: 35,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    },
                    ticks: {
                        callback(value) {
                            return formatCompactCurrency(value);
                        }
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Orders'
                    },
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    };

    replaceAnalyticsChart('revenue', canvas, config);
}

/* =========================================================
   MONTHLY REVENUE VS ESTIMATED GROSS PROFIT
   Includes zero-sale months in the selected period.
   ========================================================= */

function renderProfitChart(data) {
    const canvas = document.getElementById('analyticsProfitChart');

    if (!canvas) return;

    const grouped = groupSalesByMonth(data.currentSales, data.range);

    const revenueValues = grouped.map(item => item.revenue);

    const profitValues = grouped.map(item => {
        if (!item.costsComplete) return null;

        return item.revenue - item.cost;
    });

    const title = canvas.closest('.card')
        ?.querySelector('.card-title');

    const subtitle = canvas.closest('.card')
        ?.querySelector('.card-subtitle');

    if (title) {
        title.textContent = 'Revenue vs. Estimated Gross Profit (₹)';
    }

    if (subtitle) {
        subtitle.textContent = data.currentSales.length
            ? 'Monthly totals within the selected date range; profit requires product cost data'
            : 'No sales recorded in the selected date range';
    }

    const config = {
        type: 'bar',
        data: {
            labels: grouped.map(item => item.label),
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueValues,
                    backgroundColor: '#5A1188',
                    borderRadius: 4
                },
                {
                    label: 'Estimated Gross Profit',
                    data: profitValues,
                    backgroundColor: '#42BFA6',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            if (context.parsed.y === null) {
                                return 'Estimated Gross Profit: cost data unavailable';
                            }

                            return `${context.dataset.label}: ${
                                formatAnalyticsCurrency(context.parsed.y)
                            }`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 12,
                        maxRotation: 0,
                        minRotation: 0
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback(value) {
                            return formatCompactCurrency(value);
                        }
                    }
                }
            }
        }
    };

    replaceAnalyticsChart('profit', canvas, config);
}

/* =========================================================
   CATEGORY REVENUE CONTRIBUTION
   ========================================================= */

function renderCategoryChart(data) {
    const canvas = document.getElementById('analyticsCategoryChart');

    if (!canvas) return;

    const categoryTotals = new Map();

    data.currentSales.forEach(sale => {
        getSaleItems(sale).forEach(item => {
            const category = item.products?.category || 'Uncategorized';
            const revenue = getItemRevenue(item);

            categoryTotals.set(
                category,
                (categoryTotals.get(category) || 0) + revenue
            );
        });
    });

    const sortedCategories = [...categoryTotals.entries()]
        .sort((a, b) => b[1] - a[1]);

    const topCategories = sortedCategories.slice(0, 6);

    const otherRevenue = sortedCategories
        .slice(6)
        .reduce((sum, [, amount]) => sum + amount, 0);

    if (otherRevenue > 0) {
        topCategories.push(['Other categories', otherRevenue]);
    }

    const labels = topCategories.map(([category]) => category);
    const values = topCategories.map(([, amount]) => amount);

    const title = canvas.closest('.card')
        ?.querySelector('.card-title');

    const subtitle = canvas.closest('.card')
        ?.querySelector('.card-subtitle');

    if (title) {
        title.textContent = 'Category Revenue Contribution (%)';
    }

    if (subtitle) {
        subtitle.textContent = values.length
            ? 'Share of recorded item revenue by product category'
            : 'No item-level sales found in the selected date range';
    }

    const config = {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: [
                        '#5A1188',
                        '#42BFA6',
                        '#E9B949',
                        '#4986E7',
                        '#E879A9',
                        '#8B95A5',
                        '#F28C52'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const total = values.reduce(
                                (sum, value) => sum + value,
                                0
                            );

                            const amount = Number(context.raw || 0);
                            const percentage = total > 0
                                ? (amount / total) * 100
                                : 0;

                            return `${context.label}: ${
                                formatAnalyticsCurrency(amount)
                            } (${percentage.toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    };

    replaceAnalyticsChart('category', canvas, config);
}

/* =========================================================
   GROUP SALES BY DAY OR MONTH
   ========================================================= */

function groupSalesByPeriod(sales, range) {
    // A year uses monthly points; shorter periods use daily points.
    const daily = range.selectedRange !== '1Y';

    const labels = [];
    const revenue = [];
    const orders = [];
    const indexByKey = new Map();

    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
        const key = daily
            ? getDateKey(cursor)
            : getMonthKey(cursor);

        const label = daily
            ? cursor.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            })
            : cursor.toLocaleDateString('en-IN', {
                month: 'short',
                year: '2-digit'
            });

        indexByKey.set(key, labels.length);
        labels.push(label);
        revenue.push(0);
        orders.push(0);

        if (daily) {
            cursor.setDate(cursor.getDate() + 1);
        } else {
            cursor.setMonth(cursor.getMonth() + 1);
        }
    }

    sales.forEach(sale => {
        const date = new Date(sale.sale_date);

        if (!Number.isFinite(date.getTime())) return;

        const key = daily ? getDateKey(date) : getMonthKey(date);
        const index = indexByKey.get(key);

        if (index === undefined) return;

        revenue[index] += getSaleRevenue(sale);
        orders[index] += 1;
    });

    return { labels, revenue, orders };
}

function groupSalesByMonth(sales, range) {
    const groups = new Map();

    // Build all months covered by the selected date range, including
    // months without sales, so the chart always matches the filter.
    const cursor = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        1
    );

    const end = new Date(
        range.end.getFullYear(),
        range.end.getMonth(),
        1
    );

    while (cursor <= end) {
        const key = getMonthKey(cursor);

        groups.set(key, {
            label: cursor.toLocaleDateString('en-IN', {
                month: 'short',
                year: '2-digit'
            }),
            revenue: 0,
            cost: 0,
            costsComplete: true,
            itemCount: 0
        });

        cursor.setMonth(cursor.getMonth() + 1);
    }

    sales.forEach(sale => {
        if (!sale.sale_date) return;

        const date = new Date(sale.sale_date);
        if (!Number.isFinite(date.getTime())) return;

        const group = groups.get(getMonthKey(date));
        if (!group) return;

        group.revenue += getSaleRevenue(sale);

        getSaleItems(sale).forEach(item => {
            const cost = getItemCost(item);

            if (cost === null) {
                group.costsComplete = false;
            } else {
                group.cost += cost;
            }

            group.itemCount++;
        });
    });

    return [...groups.values()].map(group => ({
        ...group,
        costsComplete: group.costsComplete && group.itemCount > 0
    }));
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, '0')}`;
}

/* =========================================================
   CHART MANAGEMENT
   ========================================================= */

function replaceAnalyticsChart(key, canvas, config) {
    if (analyticsCharts[key]) {
        analyticsCharts[key].destroy();
    }

    analyticsCharts[key] = new Chart(canvas, config);
}

/* =========================================================
   FORMATTING
   ========================================================= */

function formatAnalyticsCurrency(amount) {
    return Number(amount || 0).toLocaleString(
        ANALYTICS_CONFIG.locale,
        {
            style: 'currency',
            currency: ANALYTICS_CONFIG.currency,
            maximumFractionDigits: 2
        }
    );
}

function formatCompactCurrency(amount) {
    const value = Number(amount || 0);

    if (Math.abs(value) >= 10000000) {
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    }

    if (Math.abs(value) >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }

    if (Math.abs(value) >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`;
    }

    return `₹${value.toFixed(0)}`;
}

/* =========================================================
   LOADING AND ERROR STATES
   ========================================================= */

function setAnalyticsLoading(isLoading) {
    const selector = document.getElementById('analyticsDateRange');

    if (selector) {
        selector.disabled = isLoading;
    }
}

function showAnalyticsError(message) {
    console.error('Analytics error:', message);

    const container = document.querySelector('main.page-container');

    if (!container) {
        alert(`Analytics could not load: ${message}`);
        return;
    }

    let errorBox = document.getElementById('analyticsErrorMessage');

    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.id = 'analyticsErrorMessage';
        errorBox.className = 'card';
        errorBox.style.cssText =
            'padding:1rem;margin-bottom:1rem;border-left:4px solid #dc2626;color:#b91c1c;';

        container.prepend(errorBox);
    }

    errorBox.textContent = `Analytics could not load: ${message}`;
}
