/**
 * RETAILMIND AI - DASHBOARD LOGIC
 * Connects charts, KPI counters, timeframe switchers,
 * low stock quick-reorders, and Supabase user data.
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardCharts();
  setupTimeframeToggles();
  setupReorderButtons();
  renderHealthProgress();

  // Supabase current user
  loadCurrentUser();
});


// ============================================================
// SUPABASE - CURRENT USER
// ============================================================

async function loadCurrentUser() {
  try {

    // ========================================================
    // GET CURRENT SESSION
    // ========================================================

    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return;
    }

    if (!session || !session.user) {
      console.warn('No authenticated user found.');
      return;
    }

    const user = session.user;

    console.log(
      'Logged-in Supabase user:',
      user.email
    );

    console.log(
      'User ID:',
      user.id
    );


    // ========================================================
    // LOAD USER'S BUSINESS
    // ========================================================

    const {
      data: membership,
      error: membershipError
    } = await supabaseClient
      .from('business_members')
      .select(`
        role,
        business_id,
        businesses (
          id,
          name,
          business_type,
          warehouse_name,
          warehouse_city,
          currency,
          gst_rate
        )
      `)
      .eq('user_id', user.id)
      .single();


    if (membershipError) {
      console.error(
        'Business loading error:',
        membershipError
      );
      return;
    }


    console.log(
      'RetailMind business:',
      membership.businesses
    );

    console.log(
      'User business role:',
      membership.role
    );


    // ========================================================
    // STORE BUSINESS GLOBALLY
    // So other dashboard functions/pages can use it later.
    // ========================================================

    window.currentBusiness =
      membership.businesses;

    window.currentBusinessRole =
      membership.role;


    // ========================================================
    // LOAD USER PROFILE
    // ========================================================

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();


    if (profileError) {
      console.error(
        'Profile loading error:',
        profileError
      );
      return;
    }


    console.log(
      'RetailMind profile:',
      profile
    );


    // ========================================================
    // STORE PROFILE GLOBALLY
    // ========================================================

    window.currentUser =
      user;

    window.currentProfile =
      profile;


    // ========================================================
    // FINAL SUCCESS MESSAGE
    // ========================================================

    console.log(
      'RetailMind user data loaded successfully.'
    );
    // ========================================================
    // TEST LOAD PRODUCTS
    // ========================================================

    const {
      data: products,
      error: productsError
    } = await supabaseClient
      .from('products')
      .select(`
    id,
    name,
    sku,
    category,
    selling_price,
    purchase_price,
    stock,
    reorder_level,
    supplier_id,
    suppliers (
      id,
      name,
      phone,
      email,
      lead_time_days,
      rating
    )
  `)
      .eq('business_id', membership.business_id)
      .eq('is_archived', false);

    if (productsError) {
      console.error(
        'Products loading error:',
        productsError
      );
      return;
    }

    console.log(
      'RetailMind products:',
      products
    );

    console.log(
      'Total products:',
      products.length
    );

    updateInventoryOverview(products);

    const inventoryValue =
      products.reduce(
        (total, product) =>
          total +
          (Number(product.stock) || 0) *
          (Number(product.purchase_price) || 0),
        0
      );

    console.log(
      'RetailMind inventory value:',
      inventoryValue
    );

    const inventoryValueElement =
      document.getElementById('inventoryValue');

    if (inventoryValueElement) {
      inventoryValueElement.textContent =
        `₹${inventoryValue.toLocaleString('en-IN')}`;
    }
    updateLowStockAlerts(products);
    const lowStockProducts =
      products.filter(
        product =>
          Number(product.stock) > 0 &&
          Number(product.stock) <= Number(product.reorder_level)
      );

    const lowStockCountElement =
      document.getElementById('lowStockCount');

    if (lowStockCountElement) {
      lowStockCountElement.textContent =
        `${lowStockProducts.length} Products`;
    }

    console.log(
      'RetailMind low stock count:',
      lowStockProducts.length
    );
    // ========================================================
    // LOAD SALE ITEMS FOR TOP SELLING PRODUCTS
    // ========================================================

    const {
      data: saleItems,
      error: saleItemsError
    } = await supabaseClient
      .from('sale_items')
      .select(`
    quantity,
    total_price,
    products (
      id,
      name,
      category,
      sku,
      purchase_price
    ),
    sales!inner (
      business_id,
      status
    )
  `)
      .eq(
        'sales.business_id',
        membership.business_id
      )
      .eq(
        'sales.status',
        'completed'
      );

    if (saleItemsError) {
      console.error(
        'Sale items loading error:',
        saleItemsError
      );
      return;
    }

    console.log(
      'RetailMind sale items:',
      saleItems
    );

    console.log(
      'Total sale items:',
      saleItems.length
    );

    updateTopSellingProducts(saleItems);
    const {
      data: salesData,
      error: salesError
    } = await supabaseClient
      .from('sales')
      .select('total_amount, sale_date, customer_id')
      .eq('business_id', membership.business_id)
      .eq('status', 'completed');

    if (salesError) {
      console.error(
        'Sales data loading error:',
        salesError
      );
    }
    const customerSalesMap = {};

    salesData.forEach(sale => {
      if (!sale.customer_id) {
        return;
      }

      if (!customerSalesMap[sale.customer_id]) {
        customerSalesMap[sale.customer_id] = 0;
      }

      customerSalesMap[sale.customer_id]++;
    });

    const totalCustomersWithSales =
      Object.keys(customerSalesMap).length;

    const repeatCustomers =
      Object.values(customerSalesMap)
        .filter(count => count > 1)
        .length;
    const healthCustomer =
      document.getElementById('healthCustomer');

    if (healthCustomer) {
      if (totalCustomersWithSales === 0) {
        healthCustomer.textContent = 'N/A';
      } else {
        const customerRetentionScore =
          Math.round(
            (repeatCustomers / totalCustomersWithSales) * 100
          );

        healthCustomer.textContent =
          `${customerRetentionScore}%`;
      }
    }
    console.log(
      'RetailMind customer sales:',
      customerSalesMap
    );

    console.log(
      'RetailMind customers with sales:',
      totalCustomersWithSales
    );

    console.log(
      'RetailMind repeat customers:',
      repeatCustomers
    );
    const {
      data: customers,
      error: customersError
    } = await supabaseClient
      .from('customers')
      .select('id, name')
      .eq('business_id', membership.business_id);

    if (customersError) {
      console.error(
        'Customers loading error:',
        customersError
      );
    }

    console.log(
      'RetailMind customers:',
      customers
    );

    console.log(
      'RetailMind customer count:',
      customers?.length || 0
    );
    const totalSales =
      salesData.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0
      );
    // ========================================================
    // BUILD CHRONOLOGICAL SALES CHART DATA
    // ========================================================

    function buildSalesChartData(sales, timeframe = "30D") {
      const daysByRange = {
        "7D": 7,
        "30D": 30,
        "90D": 90,
        "1Y": 365
      };

      const days = daysByRange[timeframe] || 30;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - days + 1);

      const buckets = new Map();

      // Create a bucket for every day in chronological order.
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const key = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0")
        ].join("-");

        buckets.set(key, {
          date: date,
          revenue: 0,
          salesCount: 0
        });
      }

      // Add sales to their corresponding dates.
      (Array.isArray(sales) ? sales : []).forEach(sale => {
        if (!sale.sale_date) return;

        const dateKey = String(sale.sale_date).slice(0, 10);
        const bucket = buckets.get(dateKey);

        if (!bucket) return;

        const status = String(sale.status || "").toLowerCase();

        if (["cancelled", "canceled", "void"].includes(status)) {
          return;
        }

        bucket.revenue += Number(sale.total_amount) || 0;
        bucket.salesCount += 1;
      });

      const dailyData = Array.from(buckets.values());

      return {
        labels: dailyData.map(day =>
          day.date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
          })
        ),
        revenue: dailyData.map(day => day.revenue),
        salesCount: dailyData.map(day => day.salesCount)
      };
    }

    // Keep sales data available when the timeframe changes.
    window.dashboardSalesData = salesData || [];

    // Render the chart for the selected timeframe.
    window.renderDashboardSalesRange = function (timeframe = "30D") {
      const chartData = buildSalesChartData(
        window.dashboardSalesData,
        timeframe
      );

      window.dashboardChartData = chartData;

      console.log("RetailMind chart data:", chartData);

      if (typeof renderSalesOverviewChart === "function") {
        renderSalesOverviewChart(
          "salesOverviewChart",
          timeframe,
          chartData
        );
      } else {
        console.error(
          "renderSalesOverviewChart function was not found."
        );
      }
    };

    // Load the default 30-day chart.
    window.renderDashboardSalesRange("30D");


    window.dashboardSalesData = salesData;
    console.log(
      'RetailMind total sales:',
      totalSales
    );

    const totalRevenueElement =
      document.getElementById('totalRevenue');

    if (totalRevenueElement) {
      totalRevenueElement.textContent =
        `₹${totalSales.toLocaleString('en-IN')}`;
    }
    const totalOrdersElement =
      document.getElementById('totalOrders');

    if (totalOrdersElement) {
      totalOrdersElement.textContent =
        salesData.length.toLocaleString('en-IN');
    }
    const totalProfit =
      saleItems.reduce(
        (profit, item) => {
          const quantity =
            Number(item.quantity) || 0;

          const sellingTotal =
            Number(item.total_price) || 0;

          const purchasePrice =
            Number(item.products?.purchase_price) || 0;

          const purchaseTotal =
            quantity * purchasePrice;

          return profit + (sellingTotal - purchaseTotal);
        },
        0
      );

    console.log(
      'RetailMind net profit:',
      totalProfit
    );

    const netProfitElement =
      document.getElementById('netProfit');

    if (netProfitElement) {
      netProfitElement.textContent =
        `₹${totalProfit.toLocaleString('en-IN')}`;
    }
    const lowStockRatio =
      products.length > 0
        ? lowStockProducts.length / products.length
        : 0;

    const inventoryHealth =
      Math.max(
        0,
        100 - (lowStockRatio * 100)
      );
    const inventoryHealthScore =
      Math.round(inventoryHealth);

    const healthInventory =
      document.getElementById('healthInventory');

    if (healthInventory) {
      healthInventory.textContent =
        `${inventoryHealthScore}%`;
    }

    const healthInventoryBar =
      document.getElementById('healthInventoryBar');

    if (healthInventoryBar) {
      healthInventoryBar.style.width =
        `${inventoryHealthScore}%`;
    }
    const healthyStockProducts =
      products.filter(product =>
        Number(product.stock) >
        Number(product.reorder_level)
      );

    const stockAccuracyScore =
      products.length > 0
        ? Math.round(
          (healthyStockProducts.length /
            products.length) * 100
        )
        : 0;

    console.log(
      'RetailMind stock accuracy score:',
      stockAccuracyScore
    );

    const healthStock =
      document.getElementById('healthStock');

    if (healthStock) {
      healthStock.textContent =
        `${stockAccuracyScore}%`;
    }

    const healthStockBar =
      document.getElementById('healthStockBar');

    if (healthStockBar) {
      healthStockBar.style.width =
        `${stockAccuracyScore}%`;
    }
    const supplierRatings = products
      .map(product => Number(product.suppliers?.rating))
      .filter(rating => rating > 0);

    const supplierPerformanceScore =
      supplierRatings.length > 0
        ? Math.round(
          (supplierRatings.reduce(
            (sum, rating) => sum + rating,
            0
          ) / supplierRatings.length) * 20
        )
        : 0;

    console.log(
      'RetailMind supplier performance score:',
      supplierPerformanceScore
    );

    const healthSupplier =
      document.getElementById('healthSupplier');

    if (healthSupplier) {
      healthSupplier.textContent =
        `${supplierPerformanceScore}%`;
    }

    const healthSupplierBar =
      document.getElementById('healthSupplierBar');

    if (healthSupplierBar) {
      healthSupplierBar.style.width =
        `${supplierPerformanceScore}%`;
    }
    const profitMargin =
      totalSales > 0
        ? (totalProfit / totalSales) * 100
        : 0;
    const profitabilityScore =
      Math.round(profitMargin);

    const healthProfitability =
      document.getElementById('healthProfitability');

    if (healthProfitability) {
      healthProfitability.textContent =
        `${profitabilityScore}%`;
    }

    const healthProfitabilityBar =
      document.getElementById('healthProfitabilityBar');

    if (healthProfitabilityBar) {
      healthProfitabilityBar.style.width =
        `${profitabilityScore}%`;
    }
    const profitHealth =
      Math.min(
        100,
        profitMargin * 2
      );

    const orderHealth =
      Math.min(
        100,
        salesData.length * 20
      );

    const businessHealth = Math.round(
      (
        profitabilityScore +
        inventoryHealthScore +
        stockAccuracyScore +
        supplierPerformanceScore
      ) / 4
    );

    console.log(
      'RetailMind business health:',
      businessHealth
    );
    // Sync the calculated score to every Business Health sidebar badge
    document.querySelectorAll(
      "[data-business-health-score], .sidebar-business-health-score"
    ).forEach((badge) => {
      badge.textContent = `${businessHealth}%`;
    });

    // Keep the score available to other page scripts
    window.currentBusinessHealth = businessHealth;
    const businessHealthElement =
      document.getElementById('businessHealth');

    if (businessHealthElement) {
      businessHealthElement.textContent =
        `${businessHealth} / 100`;
    }
    const businessHealthStatus =
      document.getElementById('businessHealthStatus');

    if (businessHealthStatus) {

      if (businessHealth >= 80) {
        businessHealthStatus.textContent =
          'Excellent Condition';

        businessHealthStatus.className =
          'badge badge-success';

      } else if (businessHealth >= 60) {
        businessHealthStatus.textContent =
          'Good Condition';

        businessHealthStatus.className =
          'badge badge-success';

      } else if (businessHealth >= 40) {
        businessHealthStatus.textContent =
          'Needs Attention';

        businessHealthStatus.className =
          'badge badge-warning';

      } else {
        businessHealthStatus.textContent =
          'Critical Condition';

        businessHealthStatus.className =
          'badge badge-danger';
      }
    }
    const healthDiagnosticText =
      document.getElementById('healthDiagnosticText');
    console.log(
      'Diagnostic element:',
      healthDiagnosticText
    );

    if (healthDiagnosticText) {
      if (businessHealth >= 80) {
        healthDiagnosticText.textContent =
          'Your business is performing strongly across inventory, profitability, and supplier operations.';
      } else if (businessHealth >= 60) {
        healthDiagnosticText.textContent =
          'Your business is in good condition, with some operational areas that can be improved for stronger growth.';
      } else if (businessHealth >= 40) {
        healthDiagnosticText.textContent =
          'Your business needs attention in several operational areas, particularly inventory and profitability.';
      } else {
        healthDiagnosticText.textContent =
          'Your business requires immediate attention across key operational and financial areas.';
      }
    }
    const healthDetailedScore =
      document.getElementById('healthDetailedScore');

    if (healthDetailedScore) {
      healthDetailedScore.textContent =
        businessHealth;
    }

    const healthDetailedStatus =
      document.getElementById('healthDetailedStatus');

    if (healthDetailedStatus) {



      if (businessHealth >= 80) {

        healthDetailedStatus.className =
          'badge badge-success';

        healthDetailedStatus.innerHTML =
          '<i class="fa-solid fa-circle-check"></i> Excellent Health';

      } else if (businessHealth >= 60) {

        healthDetailedStatus.className =
          'badge badge-success';

        healthDetailedStatus.innerHTML =
          '<i class="fa-solid fa-circle-check"></i> Good Health';

      } else if (businessHealth >= 40) {

        healthDetailedStatus.className =
          'badge badge-warning';

        healthDetailedStatus.innerHTML =
          '<i class="fa-solid fa-triangle-exclamation"></i> Needs Attention';

      } else {

        healthDetailedStatus.className =
          'badge badge-danger';

        healthDetailedStatus.innerHTML =
          '<i class="fa-solid fa-circle-exclamation"></i> Critical Health';

      }
    }
    // ========================================================
    // LOAD RECENT ORDERS
    // ========================================================
    const {
      data: recentOrders,
      error: recentOrdersError
    } = await supabaseClient
      .from('sales')
      .select(`
  id,
  customer_name,
  customer_id,
  total_amount,
  payment_method,
  status,
  sale_date,
  customers (
    id,
    name
  )
`)

      .eq('business_id', membership.business_id)
      .order('sale_date', { ascending: false })
      .limit(5);

    if (recentOrdersError) {
      console.error(
        'Recent orders loading error:',
        recentOrdersError
      );
      return;
    }

    console.log(
      'RetailMind recent orders:',
      recentOrders
    );

    console.log(
      'Total recent orders:',
      recentOrders.length
    );
    updateRecentOrders(recentOrders);
    await loadDashboardNotifications(
      membership.business_id,
      user.id
    );
  } catch (error) {

    console.error(
      'Failed to load current user:',
      error
    );

  }
}


// ============================================================
// DASHBOARD CHARTS
// ============================================================

function initDashboardCharts() {

  if (
    typeof renderSalesOverviewChart === 'function'
  ) {

    renderSalesOverviewChart(
      'salesOverviewChart',
      '30D'
    );

  }


  if (
    typeof renderDemandForecastChart === 'function'
  ) {

    renderDemandForecastChart(
      'demandForecastChart'
    );

  }

}


// ============================================================
// TIMEFRAME TOGGLES — SALES OVERVIEW
// ============================================================

function setupTimeframeToggles() {
  const pills = document.querySelectorAll('.time-pill');

  pills.forEach(pill => {
    // Prevent duplicate click handlers.
    if (pill.dataset.timeframeListenerAttached === 'true') {
      return;
    }

    pill.dataset.timeframeListenerAttached = 'true';

    pill.addEventListener('click', () => {
      // Update active button.
      pills.forEach(button => {
        button.classList.remove('active');
      });

      pill.classList.add('active');

      // Get selected timeframe.
      const timeframe =
        pill.getAttribute('data-timeframe') || '30D';

      // Use the chronological chart function.
      if (
        typeof window.renderDashboardSalesRange === 'function'
      ) {
        window.renderDashboardSalesRange(timeframe);
      } else {
        console.error(
          'Sales chart function is not ready yet.'
        );
      }

      // Show notification if available.
      if (typeof showToast === 'function') {
        showToast(
          `Updated Sales Overview to ${timeframe}`,
          'info',
          'fa-calendar'
        );
      }
    });
  });
}


// ============================================================
// QUICK REORDER BUTTONS
// ============================================================

function setupReorderButtons() {

  const reorderBtns =
    document.querySelectorAll('.btn-reorder');

  reorderBtns.forEach(btn => {

    // Prevent duplicate event listeners
    if (btn.dataset.listenerAttached === 'true') {
      return;
    }

    btn.dataset.listenerAttached = 'true';

    btn.addEventListener('click', async () => {

      const product =
        btn.getAttribute('data-product') ||
        'Selected Item';

      const productId =
        btn.getAttribute('data-product-id');

      const supplier =
        btn.getAttribute('data-supplier') ||
        'Verified Supplier';

      const supplierId =
        btn.getAttribute('data-supplier-id');

      const businessId =
        window.currentBusiness?.id;


      // --------------------------------------------------------
      // Get product information
      // --------------------------------------------------------

      if (!productId || !businessId || !supplierId) {

        console.error(
          'Missing reorder information:',
          {
            productId,
            businessId,
            supplierId
          }
        );

        showToast(
          'Product, business, or supplier information is missing.',
          'error',
          'fa-triangle-exclamation'
        );

        return;
      }


      // --------------------------------------------------------
      // Get current product stock information
      // --------------------------------------------------------

      const {
        data: productData,
        error: productError
      } = await supabaseClient
        .from('products')
        .select(`
          id,
          name,
          stock,
          reorder_level,
          purchase_price
        `)
        .eq('id', productId)
        .eq('business_id', businessId)
        .single();


      if (productError) {

        console.error(
          'Product loading error:',
          productError
        );

        showToast(
          'Unable to load product information.',
          'error',
          'fa-triangle-exclamation'
        );

        return;
      }


      // --------------------------------------------------------
      // Calculate reorder quantity
      // --------------------------------------------------------

      const currentStock =
        Number(productData.stock) || 0;

      const reorderLevel =
        Number(productData.reorder_level) || 0;

      const purchasePrice =
        Number(productData.purchase_price) || 0;


      const quantity =
        Math.max(
          reorderLevel - currentStock,
          1
        );


      const totalPrice =
        quantity * purchasePrice;


      // --------------------------------------------------------
      // Disable button while processing
      // --------------------------------------------------------

      btn.disabled = true;

      btn.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Ordering...`;


      // --------------------------------------------------------
      // CREATE PURCHASE ORDER
      // --------------------------------------------------------


      const expectedDeliveryDate =
        document.getElementById('expectedDeliveryDate')?.value || null;

      const {
        data: purchaseOrder,
        error: purchaseOrderError
      } = await supabaseClient
        .from('purchase_orders')
        .insert({
          business_id: businessId,
          supplier_id: supplierId,
          total_amount: totalPrice,
          status: 'pending',
          expected_delivery_date: expectedDeliveryDate,
          actual_delivery_date: null
        })
        .select()
        .single();

      if (purchaseOrderError) {
        throw purchaseOrderError;
      }



      if (purchaseOrderError) {

        console.error(
          'Purchase order creation error:',
          purchaseOrderError
        );

        btn.disabled = false;

        btn.innerHTML = 'Reorder';

        showToast(
          'Failed to create purchase order.',
          'error',
          'fa-triangle-exclamation'
        );

        return;
      }


      console.log(
        'Purchase Order created:',
        purchaseOrder
      );


      // --------------------------------------------------------
      // CREATE PURCHASE ORDER ITEM
      // --------------------------------------------------------

      const {
        data: purchaseOrderItem,
        error: purchaseOrderItemError
      } = await supabaseClient
        .from('purchase_order_items')
        .insert({
          purchase_order_id: purchaseOrder.id,
          product_id: productId,
          quantity: quantity,
          unit_price: purchasePrice,
          total_price: totalPrice
        })
        .select()
        .single();


      if (purchaseOrderItemError) {

        console.error(
          'Purchase order item creation error:',
          purchaseOrderItemError
        );


        // Remove incomplete purchase order
        await supabaseClient
          .from('purchase_orders')
          .delete()
          .eq('id', purchaseOrder.id);


        btn.disabled = false;

        btn.innerHTML = 'Reorder';

        showToast(
          'Failed to add product to purchase order.',
          'error',
          'fa-triangle-exclamation'
        );

        return;
      }


      console.log(
        'Purchase Order Item created:',
        purchaseOrderItem
      );


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      btn.innerHTML =
        `<i class="fa-solid fa-check"></i> Ordered`;

      btn.classList.remove(
        'btn-primary'
      );

      btn.classList.add(
        'btn-secondary'
      );


      showToast(
        `PO created for ${quantity} × ${product} from ${supplier}`,
        'success',
        'fa-truck'
      );


      console.log(
        'Reorder completed:',
        {
          product,
          supplier,
          quantity,
          purchasePrice,
          totalPrice,
          purchaseOrderId: purchaseOrder.id
        }
      );

    });

  });

}

// ============================================================
// HEALTH SCORE ANIMATION
// ============================================================

function renderHealthProgress() {

  const circle =
    document.getElementById(
      'healthCircleProgress'
    );


  if (circle) {

    const score = 87;

    const radius = 56;


    const circumference =
      2 *
      Math.PI *
      radius;


    const offset =
      circumference -
      (score / 100) *
      circumference;


    circle.style.strokeDasharray =
      `${circumference} ${circumference}`;


    circle.style.strokeDashoffset =
      circumference;


    setTimeout(() => {

      circle.style.transition =
        'stroke-dashoffset 1.2s ease-in-out';


      circle.style.strokeDashoffset =
        offset;

    }, 200);

  }

}
// ============================================================
// INVENTORY OVERVIEW
// ============================================================

function updateInventoryOverview(products) {

  if (!Array.isArray(products)) {
    console.warn('No product data available.');
    return;
  }

  let totalProducts = products.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;


  products.forEach(product => {

    const stock = Number(product.stock) || 0;
    const reorderLevel =
      Number(product.reorder_level) || 0;


    if (stock === 0) {

      outOfStock++;

    } else if (stock <= reorderLevel) {

      lowStock++;

    } else {

      inStock++;

    }

  });


  // Update dashboard HTML

  const totalProductsElement =
    document.getElementById('totalProductsCount');

  const inStockElement =
    document.getElementById('inStockCount');

  const lowStockElement =
    document.getElementById('overviewLowStockCount');

  if (lowStockElement) {
    lowStockElement.textContent = lowStock;
  }

  const outOfStockElement =
    document.getElementById('outOfStockCount');


  if (totalProductsElement) {
    totalProductsElement.textContent =
      `${totalProducts} SKUs`;
  }

  if (inStockElement) {
    inStockElement.textContent =
      inStock;
  }

  if (lowStockElement) {
    lowStockElement.textContent =
      lowStock;
  }

  if (outOfStockElement) {
    outOfStockElement.textContent =
      outOfStock;
  }


  console.log(
    'Inventory Overview:',
    {
      totalProducts,
      inStock,
      lowStock,
      outOfStock
    }
  );
}
// ============================================================
// TOP SELLING PRODUCTS
// ============================================================

function updateTopSellingProducts(saleItems) {

  const tableBody =
    document.getElementById('topSellingProductsBody');

  if (!tableBody) {
    console.warn(
      'Top selling products table not found.'
    );
    return;
  }

  if (!Array.isArray(saleItems) || saleItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem;">
          No sales data available
        </td>
      </tr>
    `;
    return;
  }


  // ----------------------------------------------------------
  // Group sales by product
  // ----------------------------------------------------------

  const productSales = {};

  saleItems.forEach(item => {

    const product = item.products;

    if (!product) {
      return;
    }

    const productId = product.id;

    if (!productSales[productId]) {

      productSales[productId] = {
        name: product.name,
        category: product.category || 'Uncategorized',
        sku: product.sku || 'No SKU',
        unitsSold: 0,
        revenue: 0
      };

    }

    productSales[productId].unitsSold +=
      Number(item.quantity) || 0;

    productSales[productId].revenue +=
      Number(item.total_price) || 0;

  });


  // ----------------------------------------------------------
  // Sort by revenue
  // ----------------------------------------------------------

  const topProducts =
    Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);


  // ----------------------------------------------------------
  // Generate table rows
  // ----------------------------------------------------------

  tableBody.innerHTML =
    topProducts.map((product, index) => {

      return `
        <tr>

          <td>
            <span class="badge badge-primary">
              #${index + 1}
            </span>
          </td>

          <td>
            <div class="font-bold text-dark">
              ${product.name}
            </div>

            <div class="text-muted"
                 style="font-size: 0.75rem;">
              ${product.sku}
            </div>
          </td>

          <td>
            <span class="badge badge-primary">
              ${product.category}
            </span>
          </td>

          <td>
            ${product.unitsSold} units
          </td>

          <td>
            <strong>
              ₹${product.revenue.toLocaleString('en-IN')}
            </strong>
          </td>

          <td>
            <span class="trend-up">
              <i class="fa-solid fa-arrow-up"></i>
              —
            </span>
          </td>

        </tr>
      `;

    }).join('');

}
// ============================================================
// LOW STOCK ALERTS
// ============================================================

function updateLowStockAlerts(products) {

  const tableBody =
    document.getElementById('lowStockAlertsBody');

  if (!tableBody) {
    console.warn(
      'Low stock alerts table not found.'
    );
    return;
  }

  if (!Array.isArray(products)) {
    console.warn(
      'No product data available for low stock alerts.'
    );
    return;
  }


  // ----------------------------------------------------------
  // Find products that are at or below reorder level
  // ----------------------------------------------------------

  const lowStockProducts = products.filter(product => {

    const stock =
      Number(product.stock) || 0;

    const reorderLevel =
      Number(product.reorder_level) || 0;

    return stock > 0 && stock <= reorderLevel;

  });


  // ----------------------------------------------------------
  // No low stock products
  // ----------------------------------------------------------

  if (lowStockProducts.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="5"
            style="text-align: center; padding: 2rem;">
          <i class="fa-solid fa-circle-check text-success"></i>
          All products have healthy stock levels.
        </td>
      </tr>
    `;

    return;
  }


  // ----------------------------------------------------------
  // Generate table rows
  // ----------------------------------------------------------

  tableBody.innerHTML =
    lowStockProducts.map(product => {

      const stock =
        Number(product.stock) || 0;

      const reorderLevel =
        Number(product.reorder_level) || 0;


      // Critical = zero stock
      // Low = stock is above zero but at/below reorder level

      const isCritical =
        stock === 0;

      const statusText =
        isCritical ? 'Critical' : 'Low';

      const statusClass =
        isCritical
          ? 'badge-danger'
          : 'badge-warning';

      const stockClass =
        isCritical
          ? 'text-danger'
          : 'text-warning';


      return `
        <tr>

          <td>
            <div class="font-bold text-dark">
              ${product.name}
            </div>

            <div class="text-muted"
                 style="font-size: 0.75rem;">
              SKU: ${product.sku || 'N/A'}
            </div>
          </td>

          <td>
            <span class="${stockClass} font-bold">
              ${stock} units
            </span>
          </td>

          <td>
            ${reorderLevel} units
          </td>

          <td>
            <span class="badge ${statusClass}">
              ${statusText}
            </span>
          </td>

          <td>
            <button
  class="btn btn-sm btn-primary btn-reorder"
  data-product="${product.name}"
  data-product-id="${product.id}"
  data-supplier="${product.suppliers?.name || 'Verified Supplier'}"
  data-supplier-id="${product.suppliers?.id || ''}">

  Reorder

</button>
          </td>

        </tr>
      `;

    }).join('');


  // ----------------------------------------------------------
  // Reconnect reorder button functionality
  // ----------------------------------------------------------

  setupReorderButtons();


  console.log(
    'Low Stock Alerts:',
    lowStockProducts
  );

}
// ============================================================
// RECENT ORDERS
// ============================================================

function updateRecentOrders(recentOrders) {

  const tableBody =
    document.getElementById('recentOrdersBody');

  if (!tableBody) {
    console.warn('Recent orders table not found.');
    return;
  }

  if (!Array.isArray(recentOrders) || recentOrders.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="5"
            style="text-align: center; padding: 2rem;">
          No recent orders available.
        </td>
      </tr>
    `;

    return;
  }


  tableBody.innerHTML =
    recentOrders.map(order => {


      const customerName =
        order.customer_name?.trim() ||
        order.customers?.name ||
        'Walk-in Customer';


      const orderNumber =
        `ORD-${order.id.substring(0, 6).toUpperCase()}`;

      const amount =
        Number(order.total_amount) || 0;


      // Format date
      const orderDate =
        new Date(order.sale_date);

      const formattedDate =
        orderDate.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });


      // Status styling
      let statusClass = 'badge-warning';

      if (order.status === 'completed') {
        statusClass = 'badge-success';
      } else if (order.status === 'processing') {
        statusClass = 'badge-info';
      } else if (order.status === 'cancelled') {
        statusClass = 'badge-danger';
      }


      const statusText =
        order.status
          ? order.status.charAt(0).toUpperCase() +
          order.status.slice(1)
          : 'Pending';


      return `
        <tr>

          <td>
            <code>${orderNumber}</code>
          </td>

          <td>
            <strong>${customerName}</strong>
          </td>

          <td class="text-muted">
            ${formattedDate}
          </td>

          <td>
            <strong>
              ₹${amount.toLocaleString('en-IN')}
            </strong>
          </td>

          <td>
            <span class="badge ${statusClass}">
              <span class="badge-dot"></span>
              ${statusText}
            </span>
          </td>

        </tr>
      `;

    }).join('');


  console.log(
    'Recent Orders rendered:',
    recentOrders.length
  );

}

function getSalesForTimeframe(salesData, timeframe) {
  if (!Array.isArray(salesData)) {
    return [];
  }

  const now = new Date();

  const daysMap = {
    '7D': 7,
    '30D': 30,
    '90D': 90,
    '1Y': 365
  };

  const days = daysMap[timeframe] || 30;

  const startDate = new Date(now);

  startDate.setDate(
    startDate.getDate() - days
  );

  return salesData.filter(sale => {
    const saleDate =
      new Date(sale.sale_date);

    return saleDate >= startDate;
  });
}

/* ============================================================
   RETAILMIND AI — LIVE DASHBOARD NOTIFICATIONS
   Uses the existing Supabase client and notifications table.
============================================================ */

const dashboardNotifications = (() => {
  let businessId = null;
  let userId = null;
  let items = [];
  let channel = null;
  let refreshTimer = null;

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function getClient() {
    return window.supabaseClient || window.db || null;
  }

  function normalizeType(type) {
    const value = String(type || "system").toLowerCase();

    if (["inventory", "stock", "product"].includes(value)) {
      return "inventory";
    }

    if (["sale", "sales", "order", "revenue"].includes(value)) {
      return "sales";
    }

    if (["ai", "insight", "analytics"].includes(value)) {
      return "ai";
    }

    return "system";
  }

  function getPresentation(type) {
    const styles = {
      inventory: {
        icon: "fa-solid fa-triangle-exclamation",
        background: "#FEE2E2",
        color: "#DC2626",
        link: "inventory.html"
      },
      sales: {
        icon: "fa-solid fa-arrow-trend-up",
        background: "#E6FBF5",
        color: "#009E77",
        link: "sales.html"
      },
      ai: {
        icon: "fa-solid fa-wand-magic-sparkles",
        background: "#EDE9FE",
        color: "#7C3AED",
        link: "analytics.html"
      },
      system: {
        icon: "fa-solid fa-bell",
        background: "#FEF3C7",
        color: "#D97706",
        link: "notifications.html"
      }
    };

    return styles[normalizeType(type)];
  }

  function formatTime(value) {
    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Recently";

    const elapsed = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(elapsed / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short"
    });
  }

  function render() {
    const list = $("dashboardNotifList");
    const badge = $("dashboardNotifBadge");

    if (!list) return;

    const unreadCount = items.filter((item) => !item.is_read).length;

    if (badge) {
      badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      badge.style.display = unreadCount ? "flex" : "none";
      badge.setAttribute("aria-label", `${unreadCount} unread notifications`);
    }

    const visibleItems = items.slice(0, 5);

    if (!visibleItems.length) {
      list.innerHTML = `
        <div class="notif-empty">
          <i class="fa-regular fa-bell-slash"></i>
          <p>No notifications yet</p>
          <span>New business alerts will appear here.</span>
        </div>
      `;
      return;
    }

    list.innerHTML = visibleItems.map((item) => {
      const style = getPresentation(item.type);
      const type = normalizeType(item.type);

      return `
        <a
          href="${style.link}"
          class="notif-item ${item.is_read ? "" : "unread"}"
          data-dashboard-notification-id="${escapeHTML(item.id)}"
          data-dashboard-notification-type="${type}"
          aria-label="${escapeHTML(item.title)}"
        >
          <div
            class="notif-icon"
            style="background:${style.background};color:${style.color};"
          >
            <i class="${style.icon}"></i>
          </div>

          <div class="notif-item-content">
            <div class="notif-text">
              ${escapeHTML(item.title || "Notification")}
            </div>

            <div class="notif-description">
              ${escapeHTML(item.description || "")}
            </div>

            <div class="notif-time">
              ${escapeHTML(formatTime(item.created_at))}
            </div>
          </div>

          ${!item.is_read
          ? '<span class="notif-unread-dot" aria-label="Unread"></span>'
          : ""}
        </a>
      `;
    }).join("");
  }

  async function load() {
    const client = getClient();

    if (!client || !businessId || !userId) return;

    const list = $("dashboardNotifList");

    try {
      const { data, error } = await client
        .from("notifications")
        .select(
          "id,business_id,user_id,type,title,description,is_read,read_at,created_at"
        )
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      items = (data || []).filter((item) =>
        !item.user_id || item.user_id === userId
      );

      render();
    } catch (error) {
      console.error("Dashboard notifications failed to load:", error);

      if (list) {
        list.innerHTML = `
          <div class="notif-empty">
            <i class="fa-solid fa-circle-exclamation"></i>
            <p>Unable to load notifications</p>
            <span>Check your connection and notification access policies.</span>
          </div>
        `;
      }
    }
  }

  async function markRead(id) {
    const client = getClient();
    const item = items.find((notification) => notification.id === id);

    if (!client || !item || item.is_read) return true;

    const { error } = await client
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) {
      console.error("Could not mark notification as read:", error);
      return false;
    }

    item.is_read = true;
    item.read_at = new Date().toISOString();

    render();
    return true;
  }

  async function markAllRead() {
    const client = getClient();

    if (!client || !businessId) return;

    const button = $("dashboardMarkAllRead");

    if (button) button.disabled = true;

    try {
      const { error } = await client
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq("business_id", businessId)
        .eq("is_read", false);

      if (error) throw error;

      items.forEach((item) => {
        item.is_read = true;
        item.read_at = item.read_at || new Date().toISOString();
      });

      render();
    } catch (error) {
      console.error("Could not mark all notifications as read:", error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function setupDropdown() {
    const toggle = document.getElementById("notifToggle");
    const dropdown = document.getElementById("notifDropdown");

    if (!toggle || !dropdown) {
      console.error("Notification button or dropdown not found.");
      return;
    }

    // Prevent duplicate handlers.
    if (toggle.dataset.dropdownFixed === "true") return;
    toggle.dataset.dropdownFixed = "true";

    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isOpen = dropdown.classList.contains("show");

      if (isOpen) {
        dropdown.classList.remove("show");
      } else {
        dropdown.classList.add("show");
        load();
      }

      toggle.setAttribute("aria-expanded", String(!isOpen));

      console.log(
        "Notification dropdown:",
        !isOpen ? "opened" : "closed"
      );
    });

    // Close when clicking outside the notification wrapper.
    document.addEventListener("click", function (event) {
      const wrapper = toggle.closest(".dropdown-wrapper");

      if (wrapper && !wrapper.contains(event.target)) {
        dropdown.classList.remove("show");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }


  function subscribe() {
    const client = getClient();

    if (!client || !businessId) return;

    if (channel) {
      client.removeChannel(channel);
      channel = null;
    }

    channel = client
      .channel(`dashboard-notifications-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `business_id=eq.${businessId}`
        },
        () => load()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "Notification realtime unavailable; periodic refresh remains enabled."
          );
        }
      });
  }

  async function initialize(nextBusinessId, nextUserId) {
    businessId = nextBusinessId;
    userId = nextUserId;

    setupDropdown();
    await load();
    subscribe();

    if (refreshTimer) clearInterval(refreshTimer);

    // Fallback refresh in case Realtime is not enabled for the table.
    refreshTimer = setInterval(load, 60000);
  }

  return {
    initialize,
    refresh: load,
    markAllRead
  };
})();

async function loadDashboardNotifications(businessId, userId) {
  await dashboardNotifications.initialize(businessId, userId);
}

window.refreshDashboardNotifications =
  () => dashboardNotifications.refresh();



/* ==========================================
   GLOBAL SIDEBAR NOTIFICATION COUNT
========================================== */

async function updateSidebarNotificationCounts() {
  const badges = document.querySelectorAll(
    ".sidebar-notification-count"
  );

  if (!badges.length) return;

  const client =
    window.supabaseClient || window.db;

  if (!client) {
    console.error("Supabase client is unavailable.");
    return;
  }

  try {
    const {
      data: { user },
      error: authError
    } = await client.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      badges.forEach(badge => {
        badge.hidden = true;
      });
      return;
    }

    // Reuse the active business if the page has already loaded it.
    let businessId =
      window.currentBusinessId ||
      window.businessId ||
      window.currentBusiness?.id;

    // Otherwise, load the user's business membership.
    if (!businessId) {
      const { data: membership, error } = await client
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!membership) {
        badges.forEach(badge => {
          badge.hidden = true;
        });
        return;
      }

      businessId = membership.business_id;
    }

    window.currentBusinessId = businessId;
    window.businessId = businessId;

    const { count, error } = await client
      .from("notifications")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    const unreadCount = count ?? 0;

    badges.forEach(badge => {
      badge.textContent =
        unreadCount > 99 ? "99+" : String(unreadCount);

      badge.hidden = unreadCount === 0;
    });

  } catch (error) {
    console.error(
      "Could not update sidebar notification count:",
      error
    );
  }
}

// Run on every page that loads app.js.
document.addEventListener("DOMContentLoaded", () => {
  updateSidebarNotificationCounts();
});

window.addEventListener("focus", () => {
  updateSidebarNotificationCounts();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateSidebarNotificationCounts();
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const signOutBtn = document.getElementById('signOutBtn');

  if (!signOutBtn) return;

  signOutBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    signOutBtn.style.pointerEvents = 'none';

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) throw error;

      // Redirect to the landing page
      window.location.href = 'index.html';

    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Sign out failed. Please try again.');
      signOutBtn.style.pointerEvents = '';
    }
  });
});